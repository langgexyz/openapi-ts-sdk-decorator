/**
 * Base API Client for OpenAPI TypeScript SDK
 */

import { HttpBuilder, HttpMethod } from 'openapi-ts-sdk';
import { plainToClass, instanceToPlain } from 'class-transformer';
import { validate } from 'class-validator';

export interface APIConfig {
  uri: string;
  headers: Record<string, string>;
  params?: Record<string, string>;
  query?: Record<string, string>;
}

export type APIOption = (config: APIConfig) => void;
export const withUri = (uri: string): APIOption => (config) => {
  config.uri = uri;
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

export const withHeader = (key: string, value: string): APIOption => (config) => {
  config.headers = { ...config.headers, [key]: value };
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
      uri: path,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    options.forEach(option => option(config));
    
    let finalUri = config.uri;
    if (config.params && Object.keys(config.params).length > 0) {
      Object.entries(config.params).forEach(([key, value]) => {
        const placeholder = `{${key}}`;
        finalUri = finalUri.replace(placeholder, encodeURIComponent(value));
      });
    }
    
    this.validateUri(finalUri);
    if (config.query && Object.keys(config.query).length > 0) {
      const queryString = Object.entries(config.query)
        .filter(([_, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
      
      if (queryString) {
        finalUri += (finalUri.includes('?') ? '&' : '?') + queryString;
      }
    }
    
    const httpBuilder = this.httpBuilder
      .setUri(finalUri)
      .setMethod(method);
    
    Object.entries(config.headers).forEach(([key, value]) => {
      httpBuilder.addHeader(key, value);
    });
    if (request) {
      const requestJson = JSON.stringify(instanceToPlain(request));
      httpBuilder.setContent(requestJson);
    }
    
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

  private validateUri(uri: string): void {
    const unresolved = uri.match(/\{[^}]+\}/g);
    
    if (unresolved && unresolved.length > 0) {
      const missingParams = unresolved.map(p => p.slice(1, -1));
      throw new Error(`Missing path parameters: [${missingParams.join(', ')}] in URI: "${uri}"`);
    }
  }
}
