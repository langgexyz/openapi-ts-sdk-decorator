"use strict";
/**
 * OpenAPI TypeScript SDK Decorators
 *
 * This file contains HTTP method decorators for API method definitions.
 * These decorators provide metadata for HTTP methods without knowledge of specific code generators.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OPTIONS = exports.HEAD = exports.PATCH = exports.DELETE = exports.PUT = exports.POST = exports.GET = void 0;
const openapi_ts_sdk_1 = require("openapi-ts-sdk");
/**
 * HTTP 方法装饰器工厂
 */
function createHttpMethodDecorator(method) {
    return function (path, options) {
        return function (target, propertyKey, descriptor) {
            // 保存装饰器元数据
            if (!target.constructor.__apiMethods) {
                target.constructor.__apiMethods = [];
            }
            target.constructor.__apiMethods.push({
                name: propertyKey,
                method,
                path,
                options
            });
        };
    };
}
exports.GET = createHttpMethodDecorator(openapi_ts_sdk_1.HttpMethod.GET);
exports.POST = createHttpMethodDecorator(openapi_ts_sdk_1.HttpMethod.POST);
exports.PUT = createHttpMethodDecorator(openapi_ts_sdk_1.HttpMethod.PUT);
exports.DELETE = createHttpMethodDecorator(openapi_ts_sdk_1.HttpMethod.DELETE);
exports.PATCH = createHttpMethodDecorator(openapi_ts_sdk_1.HttpMethod.PATCH);
exports.HEAD = createHttpMethodDecorator(openapi_ts_sdk_1.HttpMethod.HEAD);
exports.OPTIONS = createHttpMethodDecorator(openapi_ts_sdk_1.HttpMethod.OPTIONS);
//# sourceMappingURL=decorators.js.map