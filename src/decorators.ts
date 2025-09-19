/**
 * OpenAPI TypeScript SDK Decorators
 * 
 * This file contains HTTP method decorators for API method definitions.
 * These decorators provide metadata for HTTP methods without knowledge of specific code generators.
 */

import { HttpMethod } from 'openapi-ts-sdk';

/**
 * API 装饰器选项接口
 */
export interface DecoratorOptions {
  summary?: string;
  description?: string;
  [key: string]: any;
}

/**
 * HTTP 方法装饰器工厂
 */
function createHttpMethodDecorator(method: HttpMethod) {
  return function(path: string, options?: DecoratorOptions) {
    return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      // 保存装饰器元数据
      if (!target.constructor.__apiMethods) {
        target.constructor.__apiMethods = [];
      }
      target.constructor.__apiMethods.push({
        name: propertyKey,
        method,
        path,
        options
      });
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
