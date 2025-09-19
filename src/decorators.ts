/**
 * OpenAPI TypeScript SDK Decorators - 新设计
 * 
 * 基于参数装饰器的智能设计：
 * • 使用装饰器元数据而非复杂的字符串解析
 * • 在简单场景使用正则（如路径参数提取）提高效率
 * • 避免在复杂解析场景使用脆弱的正则
 * 
 * @GET('/users/{id}')
 * async getUser<Request = GetUserRequest, Response = GetUserResponse>(
 *   @Param('id') id: string,
 *   @Request() request: Request,
 *   @ResponseType() responseType: { new (...args: any[]): Response },
 *   @Options() ...options: APIOption[]
 * ): Promise<Response> {}
 */

import { HttpMethod } from 'openapi-ts-sdk';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { isValidationEnabled } from './config';
import { APIOption, withParams, withQuery } from './client';

/**
 * 装饰器命名空间常量
 */
const DECORATOR_NAMESPACE = '__openapi_ts_sdk_decorator_';
const API_METHODS_KEY = `${DECORATOR_NAMESPACE}apiMethods`;
const ROOT_URI_KEY = `${DECORATOR_NAMESPACE}rootUri`;
const PARAM_METADATA_KEY = `${DECORATOR_NAMESPACE}paramMetadata`;

/**
 * 参数元数据接口
 */
export interface ParameterMetadata {
  type: 'param' | 'request' | 'responseType' | 'options' | 'query';
  paramName?: string;
  index: number;
}

/**
 * 参数元数据映射
 */
export type ParameterMetadataMap = Record<number, ParameterMetadata>;

/**
 * API 方法元数据接口
 */
export interface APIMethodMetadata {
  name: string;
  method: HttpMethod;
  path: string;
  options?: any;
}

/**
 * 装饰器选项接口
 */
export interface DecoratorOptions {
  summary?: string;
  description?: string;
  [key: string]: any;
}

// =======================
// 参数装饰器
// =======================

/**
 * 路径参数装饰器
 * @param paramName 路径参数名
 */
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

/**
 * 请求体装饰器
 */
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

/**
 * 响应类型装饰器
 */
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

/**
 * 查询参数装饰器
 */
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

/**
 * 选项参数装饰器
 */
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

// =======================
// 工具函数 - 无正则匹配
// =======================


/**
 * 简单的路径验证 - 无正则匹配
 */
function validatePath(path: string, decoratorName: string): void {
  if (!isValidationEnabled()) {
    return;
  }
  
  if (!path || path.length === 0) {
    throw new Error(`@${decoratorName} 路径不能为空`);
  }
  
  if (path[0] !== '/') {
    throw new Error(`@${decoratorName} 路径必须以 '/' 开头，当前值: "${path}"`);
  }
}

/**
 * 验证参数装饰器配置 - 完全基于装饰器元数据
 */
function validateParameterDecorators(path: string, method: HttpMethod, target: any, propertyKey: string): void {
  if (!isValidationEnabled()) {
    return;
  }

  const paramMetadata: ParameterMetadataMap = Reflect.getMetadata(PARAM_METADATA_KEY, target, propertyKey) || {};
  
  // 统计各类型参数
  const paramCounts = {
    param: 0,
    request: 0,
    responseType: 0,
    query: 0,
    options: 0
  };
  
  // 分析参数装饰器元数据
  Object.values(paramMetadata).forEach(meta => {
    paramCounts[meta.type]++;
  });
  
  const errors: string[] = [];
  
  // 简单验证规则
  if (paramCounts.request > 1) {
    errors.push(`只能有一个 @Request() 参数`);
  }
  
  if (paramCounts.responseType > 1) {
    errors.push(`只能有一个 @ResponseType() 参数`);
  }
  
  if (paramCounts.query > 1) {
    errors.push(`只能有一个 @Query() 参数`);
  }
  
  if (paramCounts.options > 1) {
    errors.push(`只能有一个 @Options() 参数`);
  }
  
  // 注意：不再验证路径参数与路径的对应关系
  // 因为 @Param('paramName') 已经明确声明了参数名
  // 如果声明错误，会在运行时自然发现（404或路径错误）
  
  if (errors.length > 0) {
    throw new Error(`🚫 @${method.toUpperCase()} 配置错误: ${errors.join(', ')}`);
  }
}

// =======================
// HTTP 方法装饰器
// =======================

/**
 * 创建 HTTP 方法装饰器
 */
function createHttpMethodDecorator(method: HttpMethod) {
  return function(path: string, options?: DecoratorOptions) {
    // 简单路径验证
    validatePath(path, method.toUpperCase());
    
    return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      // 验证参数装饰器
      validateParameterDecorators(path, method, target, propertyKey);
      
      // 替换方法实现
      descriptor.value = async function<Request, Response>(...args: any[]): Promise<Response> {
        const paramMetadata: ParameterMetadataMap = Reflect.getMetadata(PARAM_METADATA_KEY, target, propertyKey) || {};
        
        // 解析参数
        let pathParamValues: Record<string, string> = {};
        let queryParamValues: Record<string, string> = {};
        let request: Request | undefined = undefined;
        let responseType: (new (...args: any[]) => Response) | undefined = undefined;
        let options: APIOption[] = [];
        
        // 根据装饰器元数据分配参数
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
              // @Query() 参数是查询参数对象
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
              // @Options() ...options 是 rest参数，需要收集所有剩余参数
              options = args.slice(index) || [];
              break;
          }
        });
        
        // 🎯 自动生成 options，放到用户 options 最后
        const generatedOptions: APIOption[] = [...options];
        
        // 如果有路径参数，自动生成 withParams option
        if (Object.keys(pathParamValues).length > 0) {
          generatedOptions.push(withParams(pathParamValues));
        }
        
        // 如果有查询参数，自动生成 withQuery option
        if (Object.keys(queryParamValues).length > 0) {
          generatedOptions.push(withQuery(queryParamValues));
        }
        
        // 转换请求数据
        let processedRequest = request;
        if (request && typeof request === 'object') {
          processedRequest = request;
        }
        
        // 调用现有的 executeRequest，传入原始路径和生成的 options
        const rawResponse = await (this as any).executeRequest(
          method.toUpperCase(),
          path,                    // 原始路径，由 executeRequest 处理替换
          processedRequest,
          responseType!,
          generatedOptions         // 包含自动生成的 withParams
        );
        
        // 转换响应数据
        if (responseType && typeof responseType === 'function') {
          const transformedResponse = plainToClass(responseType, rawResponse);
          
          // 可选验证
          if (isValidationEnabled() && transformedResponse && typeof transformedResponse === 'object') {
            const errors = await validate(transformedResponse as object);
            if (errors.length > 0) {
              console.warn('Response validation warnings:', errors);
            }
          }
          
          return transformedResponse as Response;
        }
        
        return rawResponse as Response;
      };
      
      // 存储方法元数据
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

// =======================
// 导出装饰器
// =======================

export const GET = createHttpMethodDecorator(HttpMethod.GET);
export const POST = createHttpMethodDecorator(HttpMethod.POST);
export const PUT = createHttpMethodDecorator(HttpMethod.PUT);
export const DELETE = createHttpMethodDecorator(HttpMethod.DELETE);
export const PATCH = createHttpMethodDecorator(HttpMethod.PATCH);
export const HEAD = createHttpMethodDecorator(HttpMethod.HEAD);
export const OPTIONS = createHttpMethodDecorator(HttpMethod.OPTIONS);

/**
 * RootUri 装饰器
 */
export function RootUri(rootUri: string) {
  return function<T extends { new(...args: any[]): {} }>(target: T): T {
    validatePath(rootUri, 'RootUri');
    target.prototype[ROOT_URI_KEY] = rootUri;
    return target;
  };
}

// =======================
// 工具函数
// =======================

/**
 * 获取 API 方法元数据
 */
export function getAPIMethodsMetadata(target: any): APIMethodMetadata[] {
  const constructor = target.constructor || target;
  return constructor[API_METHODS_KEY] || [];
}

/**
 * 获取 Root URI
 */
export function getRootUri(target: any): string | undefined {
  return target[ROOT_URI_KEY];
}
