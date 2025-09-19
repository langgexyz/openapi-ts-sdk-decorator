/**
 * OpenAPI TypeScript SDK Decorators
 *
 * This file contains HTTP method decorators for API method definitions.
 * These decorators provide metadata for HTTP methods without knowledge of specific code generators.
 */
/**
 * API 装饰器选项接口
 */
export interface DecoratorOptions {
    summary?: string;
    description?: string;
    [key: string]: any;
}
export declare const GET: (path: string, options?: DecoratorOptions) => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare const POST: (path: string, options?: DecoratorOptions) => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare const PUT: (path: string, options?: DecoratorOptions) => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare const DELETE: (path: string, options?: DecoratorOptions) => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare const PATCH: (path: string, options?: DecoratorOptions) => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare const HEAD: (path: string, options?: DecoratorOptions) => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare const OPTIONS: (path: string, options?: DecoratorOptions) => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
//# sourceMappingURL=decorators.d.ts.map