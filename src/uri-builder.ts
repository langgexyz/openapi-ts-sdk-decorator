/**
 * URI Builder for OpenAPI TypeScript SDK
 */

import { APIConfig } from './types';

export class APIConfigURIBuilder {
  private config: APIConfig;
  private result: string = '';

  private constructor(config: APIConfig) {
    this.config = { ...config };
  }

  // === 静态工厂方法 ===
  static from(config: APIConfig): APIConfigURIBuilder {
    return new APIConfigURIBuilder(config);
  }

  static fromPath(path: string): APIConfigURIBuilder {
    return new APIConfigURIBuilder({
      path,
      headers: {}
    });
  }

  // === 链式配置方法 ===
  withRoot(root?: string): this {
    if (root) {
      this.config.root = root;
    }
    return this;
  }

  withParams(params: Record<string, string>): this {
    this.config.params = { ...this.config.params, ...params };
    return this;
  }

  withQuery(query: Record<string, string>): this {
    this.config.query = { ...this.config.query, ...query };
    return this;
  }

  withHeaders(headers: Record<string, string>): this {
    this.config.headers = { ...this.config.headers, ...headers };
    return this;
  }

  // === 构建方法 ===
  build(): string {
    return this.combineRootAndPath()
               .replacePathParams()
               .validate()
               .appendQueryParams()
               .getResult();
  }

  // 获取配置（用于调试）
  getConfig(): APIConfig {
    return { ...this.config };
  }

  // === 私有实现方法（内部细节不暴露） ===
  private combineRootAndPath(): this {
    const { root, path } = this.config;
    if (!root) {
      this.result = path;
      return this;
    }
    
    const cleanRoot = root.replace(/\/+$/, '');
    const cleanPath = path.startsWith('/') ? path : '/' + path;
    this.result = cleanRoot + cleanPath;
    return this;
  }

  private replacePathParams(): this {
    const { params } = this.config;
    if (!params || Object.keys(params).length === 0) {
      return this;
    }

    Object.entries(params).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      this.result = this.result.replace(placeholder, encodeURIComponent(value));
    });
    return this;
  }

  private validate(): this {
    const unresolved = this.result.match(/\{[^}]+\}/g);
    if (unresolved && unresolved.length > 0) {
      const missingParams = unresolved.map(p => p.slice(1, -1));
      throw new Error(`Missing path parameters: [${missingParams.join(', ')}] in URI: "${this.result}"`);
    }
    return this;
  }

  private appendQueryParams(): this {
    const { query } = this.config;
    if (!query || Object.keys(query).length === 0) {
      return this;
    }

    const queryString = Object.entries(query)
      .filter(([_, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    if (queryString) {
      this.result += (this.result.includes('?') ? '&' : '?') + queryString;
    }
    return this;
  }

  private getResult(): string {
    return this.result;
  }
}

// === 便捷函数 ===
export function buildURI(config: APIConfig): string {
  return APIConfigURIBuilder.from(config).build();
}

export function buildURIFromPath(path: string, root?: string): string {
  return APIConfigURIBuilder
    .fromPath(path)
    .withRoot(root)
    .build();
}
