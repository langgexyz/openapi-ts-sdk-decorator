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
  // Method name generation rules
  generateMethodName(operation: APIOperation): string;
  
  // Type name generation rules
  generateRequestTypeName(methodName: string): string;
  generateResponseTypeName(methodName: string): string;
  
  // Parameter rules
  extractPathParameters(path: string): string[];
  generateParameterSignature(operation: APIOperation): string;
  
  // Validation rules
  validateMethodName(actualName: string, operation: APIOperation): ValidationResult;
  validateTypeNames(methodName: string, requestType: string, responseType: string): ValidationResult;
  validateMethodSignature(methodName: string, operation: APIOperation, actualArgs: any[]): ValidationResult;
}

export class OpenAPINamingRuleImpl implements NamingRule {
  private static HTTP_METHOD_PREFIXES: Record<string, string> = {
    'get': 'get',
    'post': 'create', 
    'put': 'update',
    'delete': 'delete',
    'patch': 'patch'
  };
  
  private static FILTERED_SEGMENTS = ['api'];
  private static VERSION_PATTERN = /^v\d+$/i;
  
  generateMethodName(operation: APIOperation): string {
    const methodPrefix = this.getMethodPrefix(operation.method);
    const resourceName = this.extractResourceName(operation.path);
    
    let methodName = `${methodPrefix}${resourceName}`;
    
    const pathParams = (operation.parameters || []).filter(p => p && p.in === 'path');
    if (pathParams.length > 0) {
      const paramSuffix = pathParams.map(p => 
        this.toPascalCase(p.name)
      ).join('');
      methodName = `${methodPrefix}${resourceName}By${paramSuffix}`;
    }
    
    return this.toCamelCase(methodName);
  }
  
  generateRequestTypeName(methodName: string): string {
    return `${this.toPascalCase(methodName)}Request`;
  }
  
  generateResponseTypeName(methodName: string): string {
    return `${this.toPascalCase(methodName)}Response`;
  }
  
  extractPathParameters(path: string): string[] {
    const matches = path.match(/\{([^}]+)\}/g) || [];
    return matches.map(match => match.slice(1, -1));
  }
  
  generateParameterSignature(operation: APIOperation): string {
    const pathParams = this.extractPathParameters(operation.path);
    const needsRequestBody = ['post', 'put', 'patch'].includes(operation.method.toLowerCase());
    
    let params: string[] = [];
    
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
  
  validateMethodName(actualName: string, operation: APIOperation): ValidationResult {
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
  
  validateTypeNames(methodName: string, requestType: string, responseType: string): ValidationResult {
    const expectedRequestName = this.generateRequestTypeName(methodName);
    const expectedResponseName = this.generateResponseTypeName(methodName);
    
    const errors: string[] = [];
    const suggestions: string[] = [];
    
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
  
  validateMethodSignature(methodName: string, operation: APIOperation, actualArgs: any[]): ValidationResult {
    const pathParams = this.extractPathParameters(operation.path);
    const needsRequestBody = ['post', 'put', 'patch'].includes(operation.method.toLowerCase());
    
    let expectedMinArgs = pathParams.length;
    if (needsRequestBody) expectedMinArgs += 1;
    
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
  
  private getMethodPrefix(httpMethod: string): string {
    return OpenAPINamingRuleImpl.HTTP_METHOD_PREFIXES[httpMethod.toLowerCase()] || httpMethod.toLowerCase();
  }
  
  private extractResourceName(path: string): string {
    const cleanPath = path.replace(/\{[^}]+\}/g, '');
    
    const pathSegments = cleanPath.split('/').filter(seg => 
      seg && !OpenAPINamingRuleImpl.FILTERED_SEGMENTS.includes(seg.toLowerCase()) &&
      !OpenAPINamingRuleImpl.VERSION_PATTERN.test(seg)
    );
    
    if (pathSegments.length === 0) return '';
    
    const words: string[] = [];
    pathSegments.forEach(segment => {
      const camelWords = segment.replace(/([a-z])([A-Z])/g, '$1 $2');
      const splitWords = camelWords.split(/[-_]/);
      words.push(...splitWords.map(w => w.toLowerCase()).filter(w => w));
    });
    
    return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
  }
  
  private toCamelCase(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }
  
  private toPascalCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  private isAPIOption(arg: any): boolean {
    return typeof arg === 'function' && arg.length === 1;
  }
}

export const OpenAPINamingRule = new OpenAPINamingRuleImpl();
