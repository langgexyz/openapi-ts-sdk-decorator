"use strict";
/**
 * Shared Rules for Code Generation and Runtime Validation
 *
 * This file contains the abstract rules and interfaces that ensure
 * code generation and runtime validation use the same logic.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAPINamingRule = exports.OpenAPINamingRuleImpl = void 0;
/**
 * OpenAPI Naming Rule Implementation
 *
 * This class implements the specific naming conventions for OpenAPI-based
 * TypeScript SDK generation and validation.
 */
class OpenAPINamingRuleImpl {
    generateMethodName(operation) {
        const methodPrefix = this.getMethodPrefix(operation.method);
        const resourceName = this.extractResourceName(operation.path);
        let methodName = `${methodPrefix}${resourceName}`;
        // Use operation.parameters order for consistent parameter naming
        const pathParams = (operation.parameters || []).filter(p => p && p.in === 'path');
        if (pathParams.length > 0) {
            const paramSuffix = pathParams.map(p => this.toPascalCase(p.name)).join('');
            methodName = `${methodPrefix}${resourceName}By${paramSuffix}`;
        }
        return this.toCamelCase(methodName);
    }
    generateRequestTypeName(methodName) {
        return `${this.toPascalCase(methodName)}Request`;
    }
    generateResponseTypeName(methodName) {
        return `${this.toPascalCase(methodName)}Response`;
    }
    extractPathParameters(path) {
        const matches = path.match(/\{([^}]+)\}/g) || [];
        return matches.map(match => match.slice(1, -1));
    }
    generateParameterSignature(operation) {
        const pathParams = this.extractPathParameters(operation.path);
        const needsRequestBody = ['post', 'put', 'patch'].includes(operation.method.toLowerCase());
        let params = [];
        // Path parameters
        pathParams.forEach(param => {
            params.push(`${param}: string`);
        });
        // Request body parameter
        if (needsRequestBody) {
            const requestTypeName = this.generateRequestTypeName(this.generateMethodName(operation));
            params.push(`request: ${requestTypeName}`);
        }
        // Options parameter
        params.push('...options: APIOption[]');
        const responseTypeName = this.generateResponseTypeName(this.generateMethodName(operation));
        return `(${params.join(', ')}): Promise<${responseTypeName}>`;
    }
    validateMethodName(actualName, operation) {
        const expectedName = this.generateMethodName(operation);
        if (actualName === expectedName) {
            return { isValid: true, errors: [], suggestions: [] };
        }
        return {
            isValid: false,
            errors: [
                `Method name mismatch: expected "${expectedName}", got "${actualName}"`
            ],
            suggestions: [
                `Rename method to: ${expectedName}`,
                `Check HTTP method and path: ${operation.method.toUpperCase()} ${operation.path}`
            ]
        };
    }
    validateTypeNames(methodName, requestType, responseType) {
        const expectedRequestName = this.generateRequestTypeName(methodName);
        const expectedResponseName = this.generateResponseTypeName(methodName);
        const errors = [];
        const suggestions = [];
        if (requestType !== expectedRequestName) {
            errors.push(`Request type mismatch: expected "${expectedRequestName}", got "${requestType}"`);
            suggestions.push(`Rename request type to: ${expectedRequestName}`);
        }
        if (responseType !== expectedResponseName) {
            errors.push(`Response type mismatch: expected "${expectedResponseName}", got "${responseType}"`);
            suggestions.push(`Rename response type to: ${expectedResponseName}`);
        }
        return {
            isValid: errors.length === 0,
            errors,
            suggestions
        };
    }
    validateMethodSignature(methodName, operation, actualArgs) {
        const pathParams = this.extractPathParameters(operation.path);
        const needsRequestBody = ['post', 'put', 'patch'].includes(operation.method.toLowerCase());
        let expectedMinArgs = pathParams.length;
        if (needsRequestBody)
            expectedMinArgs += 1;
        const nonOptionsArgs = actualArgs.filter(arg => !this.isAPIOption(arg));
        if (nonOptionsArgs.length < expectedMinArgs) {
            return {
                isValid: false,
                errors: [
                    `Parameter count mismatch: expected at least ${expectedMinArgs} arguments, got ${nonOptionsArgs.length}`
                ],
                suggestions: [
                    `Method signature should be: ${methodName}${this.generateParameterSignature(operation)}`,
                    `Path parameters: ${pathParams.join(', ')}`,
                    `Request body required: ${needsRequestBody ? 'yes' : 'no'}`
                ]
            };
        }
        return { isValid: true, errors: [], suggestions: [] };
    }
    // Private helper methods
    getMethodPrefix(httpMethod) {
        return OpenAPINamingRuleImpl.HTTP_METHOD_PREFIXES[httpMethod.toLowerCase()] || httpMethod.toLowerCase();
    }
    extractResourceName(path) {
        // 移除路径参数 {param}，保留路径结构
        const cleanPath = path.replace(/\{[^}]+\}/g, '');
        // 移除开头的 /api/ 等前缀，并分割成单词
        const pathSegments = cleanPath.split('/').filter(seg => seg && !OpenAPINamingRuleImpl.FILTERED_SEGMENTS.includes(seg.toLowerCase()) &&
            !OpenAPINamingRuleImpl.VERSION_PATTERN.test(seg));
        if (pathSegments.length === 0)
            return '';
        // 将每个路径段分割成单词（处理驼峰、下划线、连字符）
        const words = [];
        pathSegments.forEach(segment => {
            // 处理驼峰命名：systemId -> system, Id
            const camelWords = segment.replace(/([a-z])([A-Z])/g, '$1 $2');
            // 处理下划线和连字符
            const splitWords = camelWords.split(/[-_]/);
            // 转换为小写并过滤空字符串
            words.push(...splitWords.map(w => w.toLowerCase()).filter(w => w));
        });
        return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
    }
    toCamelCase(str) {
        return str.charAt(0).toLowerCase() + str.slice(1);
    }
    toPascalCase(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    isAPIOption(arg) {
        return typeof arg === 'function' && arg.length === 1;
    }
}
exports.OpenAPINamingRuleImpl = OpenAPINamingRuleImpl;
// HTTP method -> method prefix mapping
OpenAPINamingRuleImpl.HTTP_METHOD_PREFIXES = {
    'get': 'get',
    'post': 'create',
    'put': 'update',
    'delete': 'delete',
    'patch': 'patch'
};
// Path segments to filter out
OpenAPINamingRuleImpl.FILTERED_SEGMENTS = ['api'];
OpenAPINamingRuleImpl.VERSION_PATTERN = /^v\d+$/i;
// Export default instance for use in code generation and runtime validation
exports.OpenAPINamingRule = new OpenAPINamingRuleImpl();
//# sourceMappingURL=rules.js.map