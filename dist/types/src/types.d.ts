/**
 * Shared types for OpenAPI TypeScript SDK
 */
export interface APIConfig {
    path: string;
    headers: Record<string, string>;
    params?: Record<string, string>;
    query?: Record<string, string>;
    root?: string;
}
export type APIOption = (config: APIConfig) => void;
//# sourceMappingURL=types.d.ts.map