/**
 * Shared types for OpenAPI TypeScript SDK
 */

export interface APIConfig {
  path: string;                       // API 路径
  headers: Record<string, string>;    // HTTP 头
  params?: Record<string, string>;    // 路径参数
  query?: Record<string, string>;     // 查询参数
  root?: string;                      // 根 URI
}

export type APIOption = (config: APIConfig) => void;
