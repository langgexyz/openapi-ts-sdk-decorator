/**
 * OpenAPI TypeScript SDK Decorators
 */

import 'reflect-metadata';
import { HttpMethod } from 'openapi-ts-sdk';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { APIOption } from './types';
import { withParams, withQuery } from './client';

const DECORATOR_NAMESPACE = '__openapi_ts_sdk_decorator_';
const API_METHODS_KEY = `${DECORATOR_NAMESPACE}apiMethods`;
const ROOT_URI_KEY = `${DECORATOR_NAMESPACE}rootUri`;
const PARAM_METADATA_KEY = `${DECORATOR_NAMESPACE}paramMetadata`;

export interface ParameterMetadata {
  type: 'param' | 'request' | 'responseType' | 'options' | 'query';
  paramName?: string;
  index: number;
}

export type ParameterMetadataMap = Record<number, ParameterMetadata>;

export interface APIMethodMetadata {
  name: string;
  method: HttpMethod;
  path: string;
  options?: any;
}

export interface DecoratorOptions {
  summary?: string;
  description?: string;
  [key: string]: any;
}

export function Param(paramName: string) {
  return function(target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
    if (!propertyKey) return;
    const existingMetadata: ParameterMetadataMap = Reflect.getMetadata(PARAM_METADATA_KEY, target, propertyKey) || {};
    
    existingMetadata[parameterIndex] = {
      type: 'param',
      paramName,
      index: parameterIndex
    };
    
    Reflect.defineMetadata(PARAM_METADATA_KEY, existingMetadata, target, propertyKey);
  };
}

export function Request() {
  return function(target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
    if (!propertyKey) return;
    const existingMetadata: ParameterMetadataMap = Reflect.getMetadata(PARAM_METADATA_KEY, target, propertyKey) || {};
    
    existingMetadata[parameterIndex] = {
      type: 'request',
      index: parameterIndex
    };
    
    Reflect.defineMetadata(PARAM_METADATA_KEY, existingMetadata, target, propertyKey);
  };
}

export function ResponseType() {
  return function(target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
    if (!propertyKey) return;
    const existingMetadata: ParameterMetadataMap = Reflect.getMetadata(PARAM_METADATA_KEY, target, propertyKey) || {};
    
    existingMetadata[parameterIndex] = {
      type: 'responseType',
      index: parameterIndex
    };
    
    Reflect.defineMetadata(PARAM_METADATA_KEY, existingMetadata, target, propertyKey);
  };
}

export function Query() {
  return function(target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
    if (!propertyKey) return;
    const existingMetadata: ParameterMetadataMap = Reflect.getMetadata(PARAM_METADATA_KEY, target, propertyKey) || {};
    
    existingMetadata[parameterIndex] = {
      type: 'query',
      index: parameterIndex
    };
    
    Reflect.defineMetadata(PARAM_METADATA_KEY, existingMetadata, target, propertyKey);
  };
}

export function Options() {
  return function(target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
    if (!propertyKey) return;
    const existingMetadata: ParameterMetadataMap = Reflect.getMetadata(PARAM_METADATA_KEY, target, propertyKey) || {};
    
    existingMetadata[parameterIndex] = {
      type: 'options',
      index: parameterIndex
    };
    
    Reflect.defineMetadata(PARAM_METADATA_KEY, existingMetadata, target, propertyKey);
  };
}

function validatePath(path: string, decoratorName: string): void {
  if (!path || path.length === 0) {
    throw new Error(`@${decoratorName} 路径不能为空`);
  }
  
  if (path[0] !== '/') {
    throw new Error(`@${decoratorName} 路径必须以 '/' 开头，当前值: "${path}"`);
  }
}

function validateParameterDecorators(path: string, method: HttpMethod, target: any, propertyKey: string): void {
  const paramMetadata: ParameterMetadataMap = Reflect.getMetadata(PARAM_METADATA_KEY, target, propertyKey) || {};
  
  const paramCounts = {
    param: 0,
    request: 0,
    responseType: 0,
    query: 0,
    options: 0
  };
  
  Object.values(paramMetadata).forEach(meta => {
    paramCounts[meta.type]++;
  });
  
  const errors: string[] = [];
  
  if (paramCounts.request > 1) {
    errors.push(`Only one @Request() parameter allowed`);
  }
  
  if (paramCounts.responseType > 1) {
    errors.push(`Only one @ResponseType() parameter allowed`);
  }
  
  if (paramCounts.query > 1) {
    errors.push(`Only one @Query() parameter allowed`);
  }
  
  if (paramCounts.options > 1) {
    errors.push(`Only one @Options() parameter allowed`);
  }
  
  if (errors.length > 0) {
    throw new Error(`@${method.toUpperCase()} configuration error: ${errors.join(', ')}`);
  }
}

function createHttpMethodDecorator(method: HttpMethod) {
  return function(path: string, options?: DecoratorOptions) {
    validatePath(path, method.toUpperCase());
    
    return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      validateParameterDecorators(path, method, target, propertyKey);
      descriptor.value = async function<Request, Response>(...args: any[]): Promise<Response> {
        const paramMetadata: ParameterMetadataMap = Reflect.getMetadata(PARAM_METADATA_KEY, target, propertyKey) || {};
        
        let pathParamValues: Record<string, string> = {};
        let queryParamValues: Record<string, string> = {};
        let request: Request | undefined = undefined;
        let responseType: (new (...args: any[]) => Response) | undefined = undefined;
        let options: APIOption[] = [];
        Object.keys(paramMetadata).forEach(indexStr => {
          const index = parseInt(indexStr);
          const meta = paramMetadata[index];
          const arg = args[index];
          
          switch (meta.type) {
            case 'param':
              if (meta.paramName) {
                pathParamValues[meta.paramName] = String(arg);
              }
              break;
            case 'query':
              if (arg && typeof arg === 'object') {
                queryParamValues = { ...queryParamValues, ...arg };
              }
              break;
            case 'request':
              request = arg;
              break;
            case 'responseType':
              responseType = arg;
              break;
            case 'options':
              options = args.slice(index) || [];
              break;
          }
        });
        
        const generatedOptions: APIOption[] = [...options];
        
        if (Object.keys(pathParamValues).length > 0) {
          generatedOptions.push(withParams(pathParamValues));
        }
        
        if (Object.keys(queryParamValues).length > 0) {
          generatedOptions.push(withQuery(queryParamValues));
        }
        
        let processedRequest = request;
        if (request && typeof request === 'object') {
          processedRequest = request;
        }
        const rawResponse = await (this as any).executeRequest(
          method.toUpperCase(),
          path,
          processedRequest,
          responseType!,
          generatedOptions
        );
        
        if (responseType && typeof responseType === 'function') {
          const transformedResponse = plainToClass(responseType, rawResponse);
          
          // 检查是否启用响应验证
          const shouldValidateResponse = (this as any).options?.enableResponseValidation !== false;
          
          if (transformedResponse && typeof transformedResponse === 'object' && shouldValidateResponse) {
            const errors = await validate(transformedResponse as object);
            if (errors.length > 0) {
              console.warn('Response validation warnings:', errors);
            }
          }
          
          return transformedResponse as Response;
        }
        
        return rawResponse as Response;
      };
      
      const targetConstructor = target.constructor || target;
      if (!targetConstructor[API_METHODS_KEY]) {
        targetConstructor[API_METHODS_KEY] = [];
      }
      
      const metadata: APIMethodMetadata = {
        name: propertyKey,
        method,
        path,
        options
      };
      
      targetConstructor[API_METHODS_KEY].push(metadata);
    };
  };
}

export const GET = createHttpMethodDecorator(HttpMethod.GET);
export const POST = createHttpMethodDecorator(HttpMethod.POST);
export const PUT = createHttpMethodDecorator(HttpMethod.PUT);
export const DELETE = createHttpMethodDecorator(HttpMethod.DELETE);
export const PATCH = createHttpMethodDecorator(HttpMethod.PATCH);
export const HEAD = createHttpMethodDecorator(HttpMethod.HEAD);
export const OPTIONS = createHttpMethodDecorator(HttpMethod.OPTIONS);
export function RootUri(rootUri: string) {
  return function<T extends { new(...args: any[]): {} }>(target: T): T {
    validatePath(rootUri, 'RootUri');
    target.prototype[ROOT_URI_KEY] = rootUri;
    return target;
  };
}

export function getAPIMethodsMetadata(target: any): APIMethodMetadata[] {
  const constructor = target.constructor || target;
  return constructor[API_METHODS_KEY] || [];
}

export function getRootUri(target: any): string | undefined {
  // 🔧 修复原型链访问问题
  
  // 1. 先尝试从实例本身读取
  if (target[ROOT_URI_KEY]) {
    return target[ROOT_URI_KEY];
  }
  
  // 2. 再尝试从实例的原型读取 (解决直接实例化的情况)
  const proto = Object.getPrototypeOf(target);
  if (proto && proto[ROOT_URI_KEY]) {
    return proto[ROOT_URI_KEY];
  }
  
  // 3. 最后尝试从构造函数的原型读取 (解决继承的情况)
  if (target.constructor && target.constructor.prototype && target.constructor.prototype[ROOT_URI_KEY]) {
    return target.constructor.prototype[ROOT_URI_KEY];
  }
  
  // 4. 处理多层继承：遍历原型链
  let currentProto = proto;
  while (currentProto) {
    if (currentProto[ROOT_URI_KEY]) {
      return currentProto[ROOT_URI_KEY];
    }
    currentProto = Object.getPrototypeOf(currentProto);
    
    // 避免无限循环，到达 Object.prototype 时停止
    if (currentProto === Object.prototype || currentProto === null) {
      break;
    }
  }
  
  return undefined;
}
