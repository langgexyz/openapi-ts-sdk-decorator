"use strict";
/**
 * URI Builder for OpenAPI TypeScript SDK
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIConfigURIBuilder = void 0;
exports.buildURI = buildURI;
exports.buildURIFromPath = buildURIFromPath;
class APIConfigURIBuilder {
    constructor(config) {
        this.result = '';
        this.config = { ...config };
    }
    // === 静态工厂方法 ===
    static from(config) {
        return new APIConfigURIBuilder(config);
    }
    static fromPath(path) {
        return new APIConfigURIBuilder({
            path,
            headers: {}
        });
    }
    // === 链式配置方法 ===
    withRoot(root) {
        if (root) {
            this.config.root = root;
        }
        return this;
    }
    withParams(params) {
        this.config.params = { ...this.config.params, ...params };
        return this;
    }
    withQuery(query) {
        this.config.query = { ...this.config.query, ...query };
        return this;
    }
    withHeaders(headers) {
        this.config.headers = { ...this.config.headers, ...headers };
        return this;
    }
    // === 构建方法 ===
    build() {
        return this.combineRootAndPath()
            .replacePathParams()
            .validate()
            .appendQueryParams()
            .getResult();
    }
    // 获取配置（用于调试）
    getConfig() {
        return { ...this.config };
    }
    // === 私有实现方法（内部细节不暴露） ===
    combineRootAndPath() {
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
    replacePathParams() {
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
    validate() {
        const unresolved = this.result.match(/\{[^}]+\}/g);
        if (unresolved && unresolved.length > 0) {
            const missingParams = unresolved.map(p => p.slice(1, -1));
            throw new Error(`Missing path parameters: [${missingParams.join(', ')}] in URI: "${this.result}"`);
        }
        return this;
    }
    appendQueryParams() {
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
    getResult() {
        return this.result;
    }
}
exports.APIConfigURIBuilder = APIConfigURIBuilder;
// === 便捷函数 ===
function buildURI(config) {
    return APIConfigURIBuilder.from(config).build();
}
function buildURIFromPath(path, root) {
    return APIConfigURIBuilder
        .fromPath(path)
        .withRoot(root)
        .build();
}
