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
    params?: Record<string, string>;
    query?: string;
}
export type APIOption = (config: APIConfig) => void;
export declare const withUri: (uri: string) => APIOption;
export declare const withHeaders: (headers: Record<string, string>) => APIOption;
export declare const withHeader: (key: string, value: string) => APIOption;
/**
 * 设置路径参数的 APIOption
 * 用于动态替换 URL 路径中的参数，如 /users/{id} -> /users/123
 *
 * @param params - 路径参数的键值对
 * @returns APIOption 函数
 *
 * @example
 * // 对于路径 /users/{id}/posts/{postId}
 * withParams({ id: '123', postId: '456' })
 * // 结果：/users/123/posts/456
 */
export declare const withParams: (params: Record<string, string>) => APIOption;
/**
 * 设置查询参数的 APIOption
 * 用于在 URL 后添加查询字符串
 *
 * @param query - 查询参数的键值对或查询字符串
 * @returns APIOption 函数
 *
 * @example
 * withQuery({ page: '1', size: '10' })
 * // 结果：?page=1&size=10
 *
 * withQuery('page=1&size=10')
 * // 结果：?page=1&size=10
 */
export declare const withQuery: (query: Record<string, string> | string) => APIOption;
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
     * 验证路径参数的辅助方法
     * @private
     */
    private validatePathParameters;
    /**
     * 替换路径参数的辅助方法
     * @private
     */
    private replacePathParameters;
    /**
     * 执行HTTP请求
     * @protected
     */
    protected executeRequest<TRequest extends Record<string, any> = Record<string, never>, TResponse extends Record<string, any> = Record<string, never>>(method: HttpMethod, path: string, request: TRequest, responseType: {
        new (...args: any[]): TResponse;
    }, options?: APIOption[]): Promise<TResponse>;
}
//# sourceMappingURL=client.d.ts.map