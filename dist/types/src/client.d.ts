/**
 * Base API Client for OpenAPI TypeScript SDK
 */
import { HttpBuilder, HttpMethod } from 'openapi-ts-sdk';
import { APIOption } from './types';
export declare const withPath: (path: string) => APIOption;
export declare const withHeaders: (headers: Record<string, string>) => APIOption;
export declare const withParams: (params: Record<string, string>) => APIOption;
export declare const withQuery: (query: Record<string, string>) => APIOption;
export declare const withRoot: (root: string) => APIOption;
export declare const combineOptions: (...options: APIOption[]) => APIOption;
export interface APIClientOptions {
    /**
     * 启用类型名称验证 (Request/Response 命名规范)
     * @default false in production, true in development
     */
    enableTypeValidation?: boolean;
    /**
     * 启用请求参数验证 (使用 class-validator)
     * @default true
     */
    enableRequestValidation?: boolean;
    /**
     * 启用响应数据验证 (使用 class-validator)
     * @default true in development, false in production
     */
    enableResponseValidation?: boolean;
    /**
     * 启用方法命名验证 (开发时检查)
     * @default true in development, false in production
     */
    enableNamingValidation?: boolean;
    /**
     * 启用参数签名验证 (开发时检查)
     * @default true in development, false in production
     */
    enableParameterValidation?: boolean;
    /**
     * 检查根URI配置 (开发时检查)
     * @default true in development, false in production
     */
    enableRootUriCheck?: boolean;
    /**
     * 要求API方法有文档注释 (开发时检查)
     * @default false
     */
    requireDocumentation?: boolean;
}
export declare abstract class APIClient {
    protected httpBuilder: HttpBuilder;
    protected options: APIClientOptions;
    constructor(httpBuilder: HttpBuilder, options?: APIClientOptions);
    protected validateRequest<T = unknown>(request: T): Promise<void>;
    private checkRequestResponseName;
    protected executeRequest<TRequest extends Record<string, any> = Record<string, never>, TResponse extends Record<string, any> = Record<string, never>>(method: HttpMethod, path: string, request: TRequest, responseType: {
        new (...args: any[]): TResponse;
    }, options?: APIOption[]): Promise<TResponse>;
}
//# sourceMappingURL=client.d.ts.map