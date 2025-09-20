/**
 * OpenAPI TypeScript SDK Decorators
 */
import 'reflect-metadata';
import { HttpMethod } from 'openapi-ts-sdk';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { withParams, withQuery } from './client';
const DECORATOR_NAMESPACE = '__openapi_ts_sdk_decorator_';
const API_METHODS_KEY = `${DECORATOR_NAMESPACE}apiMethods`;
const ROOT_URI_KEY = `${DECORATOR_NAMESPACE}rootUri`;
const PARAM_METADATA_KEY = `${DECORATOR_NAMESPACE}paramMetadata`;
export function Param(paramName) {
    return function (target, propertyKey, parameterIndex) {
        if (!propertyKey)
            return;
        const existingMetadata = Reflect.getMetadata(PARAM_METADATA_KEY, target, propertyKey) || {};
        existingMetadata[parameterIndex] = {
            type: 'param',
            paramName,
            index: parameterIndex
        };
        Reflect.defineMetadata(PARAM_METADATA_KEY, existingMetadata, target, propertyKey);
    };
}
export function Request() {
    return function (target, propertyKey, parameterIndex) {
        if (!propertyKey)
            return;
        const existingMetadata = Reflect.getMetadata(PARAM_METADATA_KEY, target, propertyKey) || {};
        existingMetadata[parameterIndex] = {
            type: 'request',
            index: parameterIndex
        };
        Reflect.defineMetadata(PARAM_METADATA_KEY, existingMetadata, target, propertyKey);
    };
}
export function ResponseType() {
    return function (target, propertyKey, parameterIndex) {
        if (!propertyKey)
            return;
        const existingMetadata = Reflect.getMetadata(PARAM_METADATA_KEY, target, propertyKey) || {};
        existingMetadata[parameterIndex] = {
            type: 'responseType',
            index: parameterIndex
        };
        Reflect.defineMetadata(PARAM_METADATA_KEY, existingMetadata, target, propertyKey);
    };
}
export function Query() {
    return function (target, propertyKey, parameterIndex) {
        if (!propertyKey)
            return;
        const existingMetadata = Reflect.getMetadata(PARAM_METADATA_KEY, target, propertyKey) || {};
        existingMetadata[parameterIndex] = {
            type: 'query',
            index: parameterIndex
        };
        Reflect.defineMetadata(PARAM_METADATA_KEY, existingMetadata, target, propertyKey);
    };
}
export function Options() {
    return function (target, propertyKey, parameterIndex) {
        if (!propertyKey)
            return;
        const existingMetadata = Reflect.getMetadata(PARAM_METADATA_KEY, target, propertyKey) || {};
        existingMetadata[parameterIndex] = {
            type: 'options',
            index: parameterIndex
        };
        Reflect.defineMetadata(PARAM_METADATA_KEY, existingMetadata, target, propertyKey);
    };
}
function validatePath(path, decoratorName) {
    if (!path || path.length === 0) {
        throw new Error(`@${decoratorName} 路径不能为空`);
    }
    if (path[0] !== '/') {
        throw new Error(`@${decoratorName} 路径必须以 '/' 开头，当前值: "${path}"`);
    }
}
function validateParameterDecorators(path, method, target, propertyKey) {
    const paramMetadata = Reflect.getMetadata(PARAM_METADATA_KEY, target, propertyKey) || {};
    const paramCounts = {
        param: 0,
        request: 0,
        responseType: 0,
        query: 0,
        options: 0
    };
    Object.values(paramMetadata).forEach(meta => {
        paramCounts[meta.type]++;
    });
    const errors = [];
    if (paramCounts.request > 1) {
        errors.push(`Only one @Request() parameter allowed`);
    }
    if (paramCounts.responseType > 1) {
        errors.push(`Only one @ResponseType() parameter allowed`);
    }
    if (paramCounts.query > 1) {
        errors.push(`Only one @Query() parameter allowed`);
    }
    if (paramCounts.options > 1) {
        errors.push(`Only one @Options() parameter allowed`);
    }
    if (errors.length > 0) {
        throw new Error(`@${method.toUpperCase()} configuration error: ${errors.join(', ')}`);
    }
}
function createHttpMethodDecorator(method) {
    return function (path, options) {
        validatePath(path, method.toUpperCase());
        return function (target, propertyKey, descriptor) {
            validateParameterDecorators(path, method, target, propertyKey);
            descriptor.value = async function (...args) {
                const paramMetadata = Reflect.getMetadata(PARAM_METADATA_KEY, target, propertyKey) || {};
                let pathParamValues = {};
                let queryParamValues = {};
                let request = undefined;
                let responseType = undefined;
                let options = [];
                Object.keys(paramMetadata).forEach(indexStr => {
                    const index = parseInt(indexStr);
                    const meta = paramMetadata[index];
                    const arg = args[index];
                    switch (meta.type) {
                        case 'param':
                            if (meta.paramName) {
                                pathParamValues[meta.paramName] = String(arg);
                            }
                            break;
                        case 'query':
                            if (arg && typeof arg === 'object') {
                                queryParamValues = { ...queryParamValues, ...arg };
                            }
                            break;
                        case 'request':
                            request = arg;
                            break;
                        case 'responseType':
                            responseType = arg;
                            break;
                        case 'options':
                            options = args.slice(index) || [];
                            break;
                    }
                });
                const generatedOptions = [...options];
                if (Object.keys(pathParamValues).length > 0) {
                    generatedOptions.push(withParams(pathParamValues));
                }
                if (Object.keys(queryParamValues).length > 0) {
                    generatedOptions.push(withQuery(queryParamValues));
                }
                let processedRequest = request;
                if (request && typeof request === 'object') {
                    processedRequest = request;
                }
                const rawResponse = await this.executeRequest(method.toUpperCase(), path, processedRequest, responseType, generatedOptions);
                if (responseType && typeof responseType === 'function') {
                    const transformedResponse = plainToClass(responseType, rawResponse);
                    if (transformedResponse && typeof transformedResponse === 'object') {
                        const errors = await validate(transformedResponse);
                        if (errors.length > 0) {
                            console.warn('Response validation warnings:', errors);
                        }
                    }
                    return transformedResponse;
                }
                return rawResponse;
            };
            const targetConstructor = target.constructor || target;
            if (!targetConstructor[API_METHODS_KEY]) {
                targetConstructor[API_METHODS_KEY] = [];
            }
            const metadata = {
                name: propertyKey,
                method,
                path,
                options
            };
            targetConstructor[API_METHODS_KEY].push(metadata);
        };
    };
}
export const GET = createHttpMethodDecorator(HttpMethod.GET);
export const POST = createHttpMethodDecorator(HttpMethod.POST);
export const PUT = createHttpMethodDecorator(HttpMethod.PUT);
export const DELETE = createHttpMethodDecorator(HttpMethod.DELETE);
export const PATCH = createHttpMethodDecorator(HttpMethod.PATCH);
export const HEAD = createHttpMethodDecorator(HttpMethod.HEAD);
export const OPTIONS = createHttpMethodDecorator(HttpMethod.OPTIONS);
export function RootUri(rootUri) {
    return function (target) {
        validatePath(rootUri, 'RootUri');
        target.prototype[ROOT_URI_KEY] = rootUri;
        return target;
    };
}
export function getAPIMethodsMetadata(target) {
    const constructor = target.constructor || target;
    return constructor[API_METHODS_KEY] || [];
}
export function getRootUri(target) {
    return target[ROOT_URI_KEY];
}
