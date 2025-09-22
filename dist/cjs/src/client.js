"use strict";
/**
 * Base API Client for OpenAPI TypeScript SDK
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIClient = exports.combineOptions = exports.withRoot = exports.withQuery = exports.withParams = exports.withHeaders = exports.withPath = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const decorators_1 = require("./decorators");
const uri_builder_1 = require("./uri-builder");
// === API Option 助手函数 ===
const withPath = (path) => (config) => {
    config.path = path;
};
exports.withPath = withPath;
const withHeaders = (headers) => (config) => {
    config.headers = { ...config.headers, ...headers };
};
exports.withHeaders = withHeaders;
const withParams = (params) => (config) => {
    config.params = { ...config.params, ...params };
};
exports.withParams = withParams;
const withQuery = (query) => (config) => {
    config.query = { ...config.query, ...query };
};
exports.withQuery = withQuery;
const withRoot = (root) => (config) => {
    config.root = root;
};
exports.withRoot = withRoot;
const combineOptions = (...options) => (config) => {
    options.forEach(option => option(config));
};
exports.combineOptions = combineOptions;
class APIClient {
    constructor(httpBuilder) {
        this.httpBuilder = httpBuilder;
    }
    async validateRequest(request) {
        if (!request || typeof request !== 'object') {
            throw new Error('Request parameter must be an object');
        }
        const errors = await (0, class_validator_1.validate)(request);
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
    checkRequestResponseName(request, responseType) {
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
        const root = (0, decorators_1.getRootUri)(this);
        const finalUri = uri_builder_1.APIConfigURIBuilder
            .from(config)
            .withRoot(root)
            .build();
        const httpBuilder = this.httpBuilder
            .setUri(finalUri)
            .setMethod(method);
        Object.entries(config.headers).forEach(([key, value]) => {
            httpBuilder.addHeader(key, value);
        });
        httpBuilder.setContent(JSON.stringify((0, class_transformer_1.instanceToPlain)(request)));
        const http = httpBuilder.build();
        const [response, error] = await http.send();
        if (error) {
            throw error;
        }
        if (response === "") {
            throw new Error("Response is empty");
        }
        const responseData = JSON.parse(response);
        const result = (0, class_transformer_1.plainToClass)(responseType, responseData);
        return result;
    }
}
exports.APIClient = APIClient;
