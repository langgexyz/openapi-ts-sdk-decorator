/**
 * URI Builder for OpenAPI TypeScript SDK
 */
import { APIConfig } from './types';
export declare class APIConfigURIBuilder {
    private config;
    private result;
    private constructor();
    static from(config: APIConfig): APIConfigURIBuilder;
    static fromPath(path: string): APIConfigURIBuilder;
    withRoot(root?: string): this;
    withParams(params: Record<string, string>): this;
    withQuery(query: Record<string, string>): this;
    withHeaders(headers: Record<string, string>): this;
    build(): string;
    getConfig(): APIConfig;
    private combineRootAndPath;
    private replacePathParams;
    private validate;
    private appendQueryParams;
    private getResult;
}
export declare function buildURI(config: APIConfig): string;
export declare function buildURIFromPath(path: string, root?: string): string;
//# sourceMappingURL=uri-builder.d.ts.map