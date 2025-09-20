/**
 * Base API Client for OpenAPI TypeScript SDK
 */
import { HttpBuilder, HttpMethod } from 'openapi-ts-sdk';
export interface APIConfig {
    uri: string;
    headers: Record<string, string>;
    params?: Record<string, string>;
    query?: Record<string, string>;
}
export type APIOption = (config: APIConfig) => void;
export declare const withUri: (uri: string) => APIOption;
export declare const withHeaders: (headers: Record<string, string>) => APIOption;
export declare const withParams: (params: Record<string, string>) => APIOption;
export declare const withQuery: (query: Record<string, string>) => APIOption;
export declare const withHeader: (key: string, value: string) => APIOption;
export declare const combineOptions: (...options: APIOption[]) => APIOption;
export declare abstract class APIClient {
    protected httpBuilder: HttpBuilder;
    constructor(httpBuilder: HttpBuilder);
    protected validateRequest<T = unknown>(request: T): Promise<void>;
    private checkRequestResponseName;
    protected executeRequest<TRequest extends Record<string, any> = Record<string, never>, TResponse extends Record<string, any> = Record<string, never>>(method: HttpMethod, path: string, request: TRequest, responseType: {
        new (...args: any[]): TResponse;
    }, options?: APIOption[]): Promise<TResponse>;
    private validateUri;
}
//# sourceMappingURL=client.d.ts.map