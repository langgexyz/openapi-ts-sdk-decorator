/**
 * Shared Rules for Code Generation and Runtime Validation
 */
export interface APIOperation {
    name: string;
    method: string;
    path: string;
    summary?: string;
    parameters?: Array<{
        name: string;
        in: 'path' | 'query' | 'body';
        type: string;
    }>;
}
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    suggestions: string[];
}
export interface NamingRule {
    generateMethodName(operation: APIOperation): string;
    generateRequestTypeName(methodName: string): string;
    generateResponseTypeName(methodName: string): string;
    extractPathParameters(path: string): string[];
    generateParameterSignature(operation: APIOperation): string;
    validateMethodName(actualName: string, operation: APIOperation): ValidationResult;
    validateTypeNames(methodName: string, requestType: string, responseType: string): ValidationResult;
    validateMethodSignature(methodName: string, operation: APIOperation, actualArgs: any[]): ValidationResult;
}
export declare class OpenAPINamingRuleImpl implements NamingRule {
    private static HTTP_METHOD_PREFIXES;
    private static FILTERED_SEGMENTS;
    private static VERSION_PATTERN;
    generateMethodName(operation: APIOperation): string;
    generateRequestTypeName(methodName: string): string;
    generateResponseTypeName(methodName: string): string;
    extractPathParameters(path: string): string[];
    generateParameterSignature(operation: APIOperation): string;
    validateMethodName(actualName: string, operation: APIOperation): ValidationResult;
    validateTypeNames(methodName: string, requestType: string, responseType: string): ValidationResult;
    validateMethodSignature(methodName: string, operation: APIOperation, actualArgs: any[]): ValidationResult;
    private getMethodPrefix;
    private extractResourceName;
    private toCamelCase;
    private toPascalCase;
    private isAPIOption;
}
export declare const OpenAPINamingRule: OpenAPINamingRuleImpl;
//# sourceMappingURL=rules.d.ts.map