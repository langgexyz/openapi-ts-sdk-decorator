/**
 * OpenAPI TypeScript SDK Decorators
 */
import 'reflect-metadata';
import { HttpMethod } from 'openapi-ts-sdk';
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
export declare function Param(paramName: string): (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => void;
export declare function Request(): (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => void;
export declare function ResponseType(): (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => void;
export declare function Query(): (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => void;
export declare function Options(): (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => void;
export declare const GET: (path: string, options?: DecoratorOptions) => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare const POST: (path: string, options?: DecoratorOptions) => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare const PUT: (path: string, options?: DecoratorOptions) => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare const DELETE: (path: string, options?: DecoratorOptions) => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare const PATCH: (path: string, options?: DecoratorOptions) => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare const HEAD: (path: string, options?: DecoratorOptions) => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare const OPTIONS: (path: string, options?: DecoratorOptions) => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare function RootUri(rootUri: string): <T extends {
    new (...args: any[]): {};
}>(target: T) => T;
export declare function getAPIMethodsMetadata(target: any): APIMethodMetadata[];
export declare function getRootUri(target: any): string | undefined;
//# sourceMappingURL=decorators.d.ts.map