/**
 * OpenAPI TypeScript SDK Decorators
 *
 * TypeScript 5.x 兼容版本 - 同时支持新旧装饰器语法
 * 1. TypeScript 5.x 新装饰器语法（Stage 3）
 * 2. TypeScript 4.x 旧装饰器语法（Legacy/Experimental）
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
 * API 方法元数据接口
 */
export interface APIMethodMetadata {
    name: string;
    method: HttpMethod;
    path: string;
    options?: DecoratorOptions;
}
export declare const GET: (path: string, options?: DecoratorOptions) => (target: any, context?: string | PropertyDescriptor | any) => any;
export declare const POST: (path: string, options?: DecoratorOptions) => (target: any, context?: string | PropertyDescriptor | any) => any;
export declare const PUT: (path: string, options?: DecoratorOptions) => (target: any, context?: string | PropertyDescriptor | any) => any;
export declare const DELETE: (path: string, options?: DecoratorOptions) => (target: any, context?: string | PropertyDescriptor | any) => any;
export declare const PATCH: (path: string, options?: DecoratorOptions) => (target: any, context?: string | PropertyDescriptor | any) => any;
export declare const HEAD: (path: string, options?: DecoratorOptions) => (target: any, context?: string | PropertyDescriptor | any) => any;
export declare const OPTIONS: (path: string, options?: DecoratorOptions) => (target: any, context?: string | PropertyDescriptor | any) => any;
/**
 * 兼容 TypeScript 5.x 的 @RootUri 装饰器
 */
export declare function RootUri(rootUri: string): <T extends {
    new (...args: any[]): {};
}>(target: T, context?: any) => T;
/**
 * 获取类的 API 方法元数据
 */
export declare function getAPIMethodsMetadata(target: any): APIMethodMetadata[];
/**
 * 获取Client类的根路径
 */
export declare function getRootUri(clientClass: any): string | null;
/**
 * 获取所有SDK到服务器的映射
 */
export declare function getAllRootUriMappings(): Map<string, string>;
/**
 * @Query 装饰器 - 标记参数为查询参数
 */
export declare function Query(name?: string): (target: any, propertyKey: string | symbol, parameterIndex: number) => void;
/**
 * @Body 装饰器 - 标记参数为请求体
 */
export declare function Body(): (target: any, propertyKey: string | symbol, parameterIndex: number) => void;
//# sourceMappingURL=decorators.d.ts.map