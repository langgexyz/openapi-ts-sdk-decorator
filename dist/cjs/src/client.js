"use strict";
/**
 * Base API Client for OpenAPI TypeScript SDK
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIClient = exports.combineOptions = exports.withHeader = exports.withQuery = exports.withParams = exports.withHeaders = exports.withUri = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const withUri = (uri) => (config) => {
    config.uri = uri;
};
exports.withUri = withUri;
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
const withHeader = (key, value) => (config) => {
    config.headers = { ...config.headers, [key]: value };
};
exports.withHeader = withHeader;
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
            uri: path,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        options.forEach(option => option(config));
        let finalUri = config.uri;
        if (config.params && Object.keys(config.params).length > 0) {
            Object.entries(config.params).forEach(([key, value]) => {
                const placeholder = `{${key}}`;
                finalUri = finalUri.replace(placeholder, encodeURIComponent(value));
            });
        }
        this.validateUri(finalUri);
        if (config.query && Object.keys(config.query).length > 0) {
            const queryString = Object.entries(config.query)
                .filter(([_, value]) => value !== undefined && value !== null && value !== '')
                .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
                .join('&');
            if (queryString) {
                finalUri += (finalUri.includes('?') ? '&' : '?') + queryString;
            }
        }
        const httpBuilder = this.httpBuilder
            .setUri(finalUri)
            .setMethod(method);
        Object.entries(config.headers).forEach(([key, value]) => {
            httpBuilder.addHeader(key, value);
        });
        if (request) {
            const requestJson = JSON.stringify((0, class_transformer_1.instanceToPlain)(request));
            httpBuilder.setContent(requestJson);
        }
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
    validateUri(uri) {
        const unresolved = uri.match(/\{[^}]+\}/g);
        if (unresolved && unresolved.length > 0) {
            const missingParams = unresolved.map(p => p.slice(1, -1));
            throw new Error(`Missing path parameters: [${missingParams.join(', ')}] in URI: "${uri}"`);
        }
    }
}
exports.APIClient = APIClient;
