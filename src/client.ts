/**
 * Base API Client for OpenAPI TypeScript SDK
 */

import { HttpBuilder, HttpMethod } from 'openapi-ts-sdk';
import { plainToClass, instanceToPlain } from 'class-transformer';
import { validate } from 'class-validator';
import { getRootUri } from './decorators';
import { APIConfig, APIOption } from './types';
import { APIConfigURIBuilder } from './uri-builder';

// === API Option 助手函数 ===
export const withPath = (path: string): APIOption => (config) => {
  config.path = path;
};

export const withHeaders = (headers: Record<string, string>): APIOption => (config) => {
  config.headers = { ...config.headers, ...headers };
};

export const withParams = (params: Record<string, string>): APIOption => (config) => {
  config.params = { ...config.params, ...params };
};

export const withQuery = (query: Record<string, string>): APIOption => (config) => {
  config.query = { ...config.query, ...query };
};

export const withRoot = (root: string): APIOption => (config) => {
  config.root = root;
};

export const combineOptions = (...options: APIOption[]): APIOption => (config) => {
  options.forEach(option => option(config));
};


export abstract class APIClient {
  protected httpBuilder: HttpBuilder;

  constructor(httpBuilder: HttpBuilder) {
    this.httpBuilder = httpBuilder;
  }

  protected async validateRequest<T = unknown>(request: T): Promise<void> {
    if (!request || typeof request !== 'object') {
      throw new Error('Request parameter must be an object');
    }
    
    const errors = await validate(request as object);
    if (errors.length > 0) {
      const errorDetails = errors.map(error => {
        const property = error.property || 'unknown';
        const constraints = error.constraints || {};
        const messages = Object.values(constraints).join(', ');
        return `${property}: ${messages}`;
      }).join('; ');
      
      throw new Error(`Request validation failed: ${errorDetails}`);
    }
  }

  private checkRequestResponseName<TRequest extends Record<string, any>, TResponse extends Record<string, any>>(
    request: TRequest, 
    responseType: new(...args: any[]) => TResponse
  ): void {
    const REQUEST = 'Request';
    const RESPONSE = 'Response';
    
    if (!request || (typeof request === 'object' && Object.keys(request).length === 0 && request.constructor === Object)) {
      return;
    }
    
    // 边界检查：确保responseType不为null/undefined
    if (!responseType || typeof responseType !== 'function') {
      return;
    }
    
    const requestTypeName = (request as any).constructor?.name || '';
    const responseTypeName = responseType.name;
    const errors: string[] = [];
    
    if (requestTypeName && requestTypeName !== 'Object' && !requestTypeName.endsWith(REQUEST)) {
      errors.push(`Request type "${requestTypeName}" must end with "Request"`);
    }
    
    if (!responseTypeName.endsWith(RESPONSE)) {
      errors.push(`Response type "${responseTypeName}" must end with "Response"`);
    }
    
    if (requestTypeName.endsWith(REQUEST) && responseTypeName.endsWith(RESPONSE)) {
      const requestPrefix = requestTypeName.slice(0, -REQUEST.length);
      const responsePrefix = responseTypeName.slice(0, -RESPONSE.length);
      
      if (requestPrefix !== responsePrefix) {
        errors.push(`Request/Response prefix mismatch: "${requestPrefix}" vs "${responsePrefix}"`);
      }
    }
    
    if (errors.length > 0) {
      throw new Error(`Type naming validation failed: ${errors.join('; ')}`);
    }
  }

  protected async executeRequest<
    TRequest extends Record<string, any> = Record<string, never>,
    TResponse extends Record<string, any> = Record<string, never>
  >(
    method: HttpMethod,
    path: string,
    request: TRequest,
    responseType: {new(...args:any[]): TResponse},
    options: APIOption[] = []
  ): Promise<TResponse> {
    this.checkRequestResponseName<TRequest, TResponse>(request, responseType);
    const config: APIConfig = {
      path,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    options.forEach(option => option(config));
    
    const root = getRootUri(this);
    const finalUri = APIConfigURIBuilder
      .from(config)
      .withRoot(root)
      .build();
    
    const httpBuilder = this.httpBuilder
      .setUri(finalUri)
      .setMethod(method);
    
    Object.entries(config.headers).forEach(([key, value]) => {
      httpBuilder.addHeader(key, value);
    });

    httpBuilder.setContent(JSON.stringify(instanceToPlain(request)));
    
    const http = httpBuilder.build();
    const [response, error] = await http.send();
    
    if (error) {
      throw error;
    }
    
    if (response === "") {
      throw new Error("Response is empty");
    }
    
    const responseData = JSON.parse(response);
    const result = plainToClass(responseType, responseData);
    return result;
  }

}
