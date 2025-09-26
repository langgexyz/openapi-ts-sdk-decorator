/**
 * Base API Client for OpenAPI TypeScript SDK
 */
import { plainToClass, instanceToPlain } from 'class-transformer';
import { validate } from 'class-validator';
import { getRootUri } from './decorators';
import { APIConfigURIBuilder } from './uri-builder';
// === API Option 助手函数 ===
export const withPath = (path) => (config) => {
    config.path = path;
};
export const withHeaders = (headers) => (config) => {
    config.headers = { ...config.headers, ...headers };
};
export const withParams = (params) => (config) => {
    config.params = { ...config.params, ...params };
};
export const withQuery = (query) => (config) => {
    config.query = { ...config.query, ...query };
};
export const withRoot = (root) => (config) => {
    config.root = root;
};
export const combineOptions = (...options) => (config) => {
    options.forEach(option => option(config));
};
export class APIClient {
    constructor(httpBuilder, options = {}) {
        this.httpBuilder = httpBuilder;
        this.options = {
            // 运行时验证配置
            enableTypeValidation: process.env.NODE_ENV !== 'production',
            enableRequestValidation: true,
            enableResponseValidation: process.env.NODE_ENV !== 'production',
            // 开发时检查配置
            enableNamingValidation: process.env.NODE_ENV !== 'production',
            enableParameterValidation: process.env.NODE_ENV !== 'production',
            enableRootUriCheck: process.env.NODE_ENV !== 'production',
            requireDocumentation: false,
            ...options
        };
    }
    async validateRequest(request) {
        // 如果禁用请求验证，直接返回
        if (!this.options.enableRequestValidation) {
            return;
        }
        if (!request || typeof request !== 'object') {
            throw new Error('Request parameter must be an object');
        }
        try {
            const errors = await validate(request);
            if (errors.length > 0) {
                const errorDetails = errors.map(error => {
                    const property = error.property || 'unknown';
                    const constraints = error.constraints || {};
                    const messages = Object.values(constraints).join(', ');
                    return `${property}: ${messages}`;
                }).join('; ');
                throw new Error(`Request validation failed: ${errorDetails}`);
            }
        }
        catch (error) {
            // 如果对象没有验证装饰器，class-validator 会抛出错误
            // 对于普通对象，我们只进行基本类型检查，不进行详细验证
            if (error instanceof Error && error.message.includes('unknown value was passed to the validate function')) {
                // 对于普通对象，通过基本类型检查即可
                return;
            }
            // 重新抛出其他验证错误
            throw error;
        }
    }
    checkRequestResponseName(request, responseType) {
        // 如果禁用类型验证，直接返回
        if (!this.options.enableTypeValidation) {
            return;
        }
        const REQUEST = 'Request';
        const RESPONSE = 'Response';
        if (!request || (typeof request === 'object' && Object.keys(request).length === 0 && request.constructor === Object)) {
            return;
        }
        // 边界检查：确保responseType不为null/undefined
        if (!responseType || typeof responseType !== 'function') {
            return;
        }
        const requestTypeName = request.constructor?.name || '';
        const responseTypeName = responseType.name;
        const errors = [];
        if (requestTypeName && requestTypeName !== 'Object' && !requestTypeName.endsWith(REQUEST)) {
            errors.push(`Request type "${requestTypeName}" must end with "Request"`);
        }
        if (!responseTypeName.endsWith(RESPONSE)) {
            errors.push(`Response type "${responseTypeName}" must end with "Response"`);
        }
        if (requestTypeName.endsWith(REQUEST) && responseTypeName.endsWith(RESPONSE)) {
            const requestPrefix = requestTypeName.slice(0, -REQUEST.length);
            const responsePrefix = responseTypeName.slice(0, -RESPONSE.length);
            if (requestPrefix !== responsePrefix) {
                errors.push(`Request/Response prefix mismatch: "${requestPrefix}" vs "${responsePrefix}"`);
            }
        }
        if (errors.length > 0) {
            throw new Error(`Type naming validation failed: ${errors.join('; ')}`);
        }
    }
    async executeRequest(method, path, request, responseType, options = []) {
        this.checkRequestResponseName(request, responseType);
        const config = {
            path,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        options.forEach(option => option(config));
        const root = getRootUri(this);
        const finalUri = APIConfigURIBuilder
            .from(config)
            .withRoot(root)
            .build();
        const httpBuilder = this.httpBuilder
            .setUri(finalUri)
            .setMethod(method);
        Object.entries(config.headers).forEach(([key, value]) => {
            httpBuilder.addHeader(key, value);
        });
        httpBuilder.setContent(JSON.stringify(instanceToPlain(request)));
        const http = httpBuilder.build();
        const [response, error] = await http.send();
        if (error) {
            throw error;
        }
        if (response === "") {
            throw new Error("Response is empty");
        }
        const responseData = JSON.parse(response);
        const result = plainToClass(responseType, responseData);
        return result;
    }
}
