/**
 * Shared Rules for Code Generation and Runtime Validation
 */
export class OpenAPINamingRuleImpl {
    generateMethodName(operation) {
        const methodPrefix = this.getMethodPrefix(operation.method);
        const resourceName = this.extractResourceName(operation.path);
        let methodName = `${methodPrefix}${resourceName}`;
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
        pathParams.forEach(param => {
            params.push(`${param}: string`);
        });
        if (needsRequestBody) {
            const requestTypeName = this.generateRequestTypeName(this.generateMethodName(operation));
            params.push(`request: ${requestTypeName}`);
        }
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
    getMethodPrefix(httpMethod) {
        return OpenAPINamingRuleImpl.HTTP_METHOD_PREFIXES[httpMethod.toLowerCase()] || httpMethod.toLowerCase();
    }
    extractResourceName(path) {
        const cleanPath = path.replace(/\{[^}]+\}/g, '');
        const pathSegments = cleanPath.split('/').filter(seg => seg && !OpenAPINamingRuleImpl.FILTERED_SEGMENTS.includes(seg.toLowerCase()) &&
            !OpenAPINamingRuleImpl.VERSION_PATTERN.test(seg));
        if (pathSegments.length === 0)
            return '';
        const words = [];
        pathSegments.forEach(segment => {
            const camelWords = segment.replace(/([a-z])([A-Z])/g, '$1 $2');
            const splitWords = camelWords.split(/[-_]/);
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
OpenAPINamingRuleImpl.HTTP_METHOD_PREFIXES = {
    'get': 'get',
    'post': 'create',
    'put': 'update',
    'delete': 'delete',
    'patch': 'patch'
};
OpenAPINamingRuleImpl.FILTERED_SEGMENTS = ['api'];
OpenAPINamingRuleImpl.VERSION_PATTERN = /^v\d+$/i;
export const OpenAPINamingRule = new OpenAPINamingRuleImpl();
