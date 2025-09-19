/**
 * Base API Client with Validation and Request Handling
 *
 * This file contains the base APIClient class with validation rules
 * and request execution logic for TypeScript SDKs.
 */
import { HttpBuilder, HttpMethod } from 'openapi-ts-sdk';
export interface APIConfig {
    uri: string;
    headers: Record<string, string>;
}
export type APIOption = (config: APIConfig) => void;
export declare const withUri: (uri: string) => APIOption;
export declare const withHeaders: (headers: Record<string, string>) => APIOption;
export declare const withHeader: (key: string, value: string) => APIOption;
export declare const combineOptions: (...options: APIOption[]) => APIOption;
/**
 * 基础 API 客户端抽象类
 */
export declare abstract class APIClient {
    protected httpBuilder: HttpBuilder;
    constructor(httpBuilder: HttpBuilder);
    /**
     * 统一的请求数据验证方法
     * @protected
     */
    protected validateRequest<T = unknown>(request: T): Promise<void>;
    /**
     * 检查 Request/Response 类型命名规范
     * @private
     */
    private checkRequestResponseName;
    /**
     * 执行HTTP请求
     * @protected
     */
    protected executeRequest<TRequest extends Record<string, any> = Record<string, never>, TResponse extends Record<string, any> = Record<string, never>>(method: HttpMethod, path: string, request: TRequest, responseType: {
        new (...args: any[]): TResponse;
    }, options?: APIOption[]): Promise<TResponse>;
}
//# sourceMappingURL=client.d.ts.map