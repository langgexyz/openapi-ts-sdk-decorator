/**
 * Runtime API规范检查工具
 * 用于在开发和测试阶段验证API客户端是否符合OpenAPI规范
 */
import { OpenAPINamingRule } from './rules';
import { getAPIMethodsMetadata, getRootUri } from './decorators';
/**
 * 检查单个API客户端是否符合OpenAPI规范
 *
 * @param client - APIClient实例
 * @param options - 检查选项
 * @returns ValidationResult - 验证结果
 *
 * @example
 * ```typescript
 * import { checkRule } from 'openapi-ts-sdk-decorator';
 *
 * const result = checkRule(client, {
 *   enableNamingValidation: true,
 *   enableParameterValidation: true
 * });
 *
 * if (!result.isValid) {
 *   console.log('规范检查失败:', result.errors);
 *   console.log('建议修改:', result.suggestions);
 * }
 * ```
 */
export function checkRule(client, options) {
    const { enableNamingValidation = true, enableTypeValidation = true, enableParameterValidation = true, enableRootUriCheck = true, requireDocumentation = false, moduleContext } = options || {};
    const errors = [];
    const suggestions = [];
    try {
        const methodsMetadata = getAPIMethodsMetadata(client);
        // 检查是否有装饰方法
        if (methodsMetadata.length === 0) {
            suggestions.push('No decorated methods found. Ensure methods use @GET, @POST, etc. decorators');
            return {
                isValid: true,
                errors,
                suggestions
            };
        }
        // 1. 检查Root URI配置
        if (enableRootUriCheck) {
            const rootUri = getRootUri(client);
            if (!rootUri) {
                errors.push('Missing @RootUri decorator on client class');
                suggestions.push('Add @RootUri decorator to the client class');
            }
        }
        methodsMetadata.forEach(methodMetadata => {
            const operation = {
                name: methodMetadata.name,
                method: methodMetadata.method,
                path: methodMetadata.path,
                summary: methodMetadata.options?.summary,
                parameters: extractParametersFromMetadata(methodMetadata)
            };
            // 2. 验证方法名规范
            if (enableNamingValidation) {
                const namingResult = OpenAPINamingRule.validateMethodName(methodMetadata.name, operation);
                if (!namingResult.isValid) {
                    errors.push(...namingResult.errors.map(e => `[${methodMetadata.name}] ${e}`));
                    suggestions.push(...namingResult.suggestions.map(s => `[${methodMetadata.name}] ${s}`));
                }
            }
            // 3. 类型名验证（基于moduleContext中的实际类型）
            if (enableTypeValidation && moduleContext) {
                try {
                    const expectedRequestName = OpenAPINamingRule.generateRequestTypeName(methodMetadata.name);
                    const expectedResponseName = OpenAPINamingRule.generateResponseTypeName(methodMetadata.name);
                    // 检查期望的类型是否存在
                    const hasExpectedRequest = moduleContext[expectedRequestName];
                    const hasExpectedResponse = moduleContext[expectedResponseName];
                    // 检查方法是否真的需要Request类型
                    const methodHasRequest = methodHasRequestParameter(client, methodMetadata.name);
                    // 只有当方法真的需要Request类型时，才检查Request类型
                    if (methodHasRequest && !hasExpectedRequest) {
                        // 查找相似的Request类型
                        const requestTypes = Object.keys(moduleContext).filter(name => name.endsWith('Request') && typeof moduleContext[name] === 'function');
                        if (requestTypes.length > 0) {
                            // 使用通用匹配算法找到最相关的类型
                            const methodOperation = extractMethodOperation(methodMetadata.name);
                            const relatedRequest = requestTypes.find(typeName => isTypeRelatedToMethod(typeName, methodOperation));
                            if (relatedRequest) {
                                errors.push(`[${methodMetadata.name}] Request type mismatch: expected "${expectedRequestName}", got "${relatedRequest}"`);
                            }
                            else {
                                suggestions.push(`[${methodMetadata.name}] Expected request type: ${expectedRequestName}`);
                            }
                        }
                        else {
                            suggestions.push(`[${methodMetadata.name}] Expected request type: ${expectedRequestName}`);
                        }
                    }
                    if (!hasExpectedResponse) {
                        // 查找相似的Response类型
                        const responseTypes = Object.keys(moduleContext).filter(name => name.endsWith('Response') && typeof moduleContext[name] === 'function');
                        if (responseTypes.length > 0) {
                            // 使用通用匹配算法找到最相关的类型
                            const methodOperation = extractMethodOperation(methodMetadata.name);
                            const relatedResponse = responseTypes.find(typeName => isTypeRelatedToMethod(typeName, methodOperation));
                            if (relatedResponse) {
                                errors.push(`[${methodMetadata.name}] Response type mismatch: expected "${expectedResponseName}", got "${relatedResponse}"`);
                            }
                            else {
                                suggestions.push(`[${methodMetadata.name}] Expected response type: ${expectedResponseName}`);
                            }
                        }
                        else {
                            suggestions.push(`[${methodMetadata.name}] Expected response type: ${expectedResponseName}`);
                        }
                    }
                }
                catch (error) {
                    // 类型检查失败，提供建议
                    const expectedRequestType = OpenAPINamingRule.generateRequestTypeName(methodMetadata.name);
                    const expectedResponseType = OpenAPINamingRule.generateResponseTypeName(methodMetadata.name);
                    suggestions.push(`[${methodMetadata.name}] Expected request type: ${expectedRequestType}`);
                    suggestions.push(`[${methodMetadata.name}] Expected response type: ${expectedResponseType}`);
                }
            }
            // 4. 参数签名验证
            if (enableParameterValidation) {
                const expectedSignature = OpenAPINamingRule.generateParameterSignature(operation);
                suggestions.push(`[${methodMetadata.name}] Expected signature: ${methodMetadata.name}${expectedSignature}`);
                const pathParams = OpenAPINamingRule.extractPathParameters(operation.path);
                if (pathParams.length > 0) {
                    suggestions.push(`[${methodMetadata.name}] Path parameters: ${pathParams.join(', ')}`);
                }
            }
            // 5. 检查文档注释
            if (requireDocumentation) {
                if (!methodMetadata.options?.summary && !methodMetadata.options?.description) {
                    errors.push(`[${methodMetadata.name}] Missing documentation`);
                    suggestions.push(`[${methodMetadata.name}] Add summary or description to @${methodMetadata.method.toUpperCase()} decorator`, `[${methodMetadata.name}] Example: @${methodMetadata.method.toUpperCase()}('${methodMetadata.path}', { summary: 'Description here' })`);
                }
            }
        });
        return {
            isValid: errors.length === 0,
            errors,
            suggestions
        };
    }
    catch (error) {
        return {
            isValid: false,
            errors: [`checkRule failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
            suggestions: ['Ensure the client extends APIClient and has decorated methods']
        };
    }
}
/**
 * 检查方法是否有@Request()装饰器参数
 */
function methodHasRequestParameter(client, methodName) {
    const PARAM_METADATA_KEY = '__openapi_ts_sdk_decorator_paramMetadata';
    try {
        const paramMetadata = Reflect.getMetadata(PARAM_METADATA_KEY, client, methodName) || {};
        // 检查是否有任何参数使用了@Request()装饰器
        return Object.values(paramMetadata).some((meta) => meta && meta.type === 'request');
    }
    catch (error) {
        return false;
    }
}
/**
 * 从方法元数据中提取参数信息
 * 这是一个辅助函数，用于将装饰器元数据转换为APIOperation格式
 */
function extractParametersFromMetadata(methodMetadata) {
    // 由于运行时类型擦除，这里只能提供基本的参数信息
    // 主要从路径中提取path参数
    const pathParams = OpenAPINamingRule.extractPathParameters(methodMetadata.path);
    return pathParams.map(param => ({
        name: param,
        in: 'path',
        type: 'string' // 运行时无法获取具体类型，默认为string
    }));
}
/**
 * 获取方法的真实Request和Response类型构造函数
 */
function getRealTypesFromClient(client, methodName, moduleContext) {
    const PARAM_METADATA_KEY = '__openapi_ts_sdk_decorator_paramMetadata';
    try {
        // 获取参数装饰器元数据和类型信息
        const paramMetadata = Reflect.getMetadata(PARAM_METADATA_KEY, client, methodName) || {};
        const paramTypes = Reflect.getMetadata("design:paramtypes", client, methodName) || [];
        let requestType = null;
        let responseType = null;
        // 遍历参数元数据，分别处理Request和ResponseType
        Object.keys(paramMetadata).forEach(indexStr => {
            const index = parseInt(indexStr);
            const meta = paramMetadata[index];
            const paramType = paramTypes[index];
            if (meta.type === 'request' && paramType) {
                requestType = paramType;
            }
            else if (meta.type === 'responseType' && paramType) {
                responseType = paramType;
            }
        });
        // 如果有Request类型，尝试从中推断Response类型（保持向后兼容）
        if (requestType && requestType.name && !responseType) {
            const requestTypeName = requestType.name;
            if (requestTypeName.endsWith('Request')) {
                const baseName = requestTypeName.slice(0, -'Request'.length);
                const responseTypeName = baseName + 'Response';
                // 从模块上下文获取Response类型构造函数
                if (moduleContext && moduleContext[responseTypeName]) {
                    responseType = moduleContext[responseTypeName];
                }
            }
        }
        // 如果没有找到responseType但有moduleContext，尝试根据方法名推断
        if (!responseType && moduleContext) {
            const expectedResponseTypeName = OpenAPINamingRule.generateResponseTypeName(methodName);
            if (moduleContext[expectedResponseTypeName]) {
                responseType = moduleContext[expectedResponseTypeName];
            }
        }
        return { requestType, responseType };
    }
    catch (error) {
        return { requestType: null, responseType: null };
    }
}
/**
 * 从方法名中提取核心操作信息
 */
function extractMethodOperation(methodName) {
    // 使用简单的启发式方法提取动作和资源
    let action = '';
    let resource = '';
    // 提取动作
    if (methodName.startsWith('create')) {
        action = 'create';
        resource = methodName.substring(6); // 去掉'create'
    }
    else if (methodName.startsWith('get')) {
        action = 'get';
        resource = methodName.substring(3); // 去掉'get'
    }
    else if (methodName.startsWith('update')) {
        action = 'update';
        resource = methodName.substring(6); // 去掉'update'
    }
    else if (methodName.startsWith('delete')) {
        action = 'delete';
        resource = methodName.substring(6); // 去掉'delete'
    }
    return {
        action,
        resource,
        fullOperation: methodName
    };
}
/**
 * 判断类型名是否与方法操作相关（通用字符串匹配算法）
 */
function isTypeRelatedToMethod(typeName, methodOperation) {
    const typeNameLower = typeName.toLowerCase();
    const methodLower = methodOperation.fullOperation.toLowerCase();
    // 1. 计算字符串相似度
    const similarity = calculateStringSimilarity(typeNameLower, methodLower);
    if (similarity > 0.6) { // 60%以上相似度认为相关
        return true;
    }
    // 2. 检查是否包含相同的核心词汇（使用原始字符串进行单词提取）
    const typeWords = extractWords(typeName); // 使用原始字符串
    const methodWords = extractWords(methodOperation.fullOperation); // 使用原始字符串
    // 找到共同的关键词
    const commonWords = typeWords.filter(word => methodWords.includes(word) && word.length > 2 // 忽略长度小于3的词
    );
    // 如果有一个或以上的共同关键词，认为相关（调整阈值从2到1）
    if (commonWords.length >= 1) {
        return true;
    }
    // 3. 检查资源名匹配
    if (methodOperation.resource && typeNameLower.includes(methodOperation.resource.toLowerCase())) {
        return true;
    }
    return false;
}
/**
 * 计算两个字符串的相似度（使用Levenshtein距离）
 */
function calculateStringSimilarity(str1, str2) {
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0)
        return 1;
    const distance = levenshteinDistance(str1, str2);
    return (maxLength - distance) / maxLength;
}
/**
 * 计算Levenshtein距离
 */
function levenshteinDistance(str1, str2) {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    for (let i = 0; i <= str1.length; i++)
        matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++)
        matrix[j][0] = j;
    for (let j = 1; j <= str2.length; j++) {
        for (let i = 1; i <= str1.length; i++) {
            const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(matrix[j][i - 1] + 1, // deletion
            matrix[j - 1][i] + 1, // insertion
            matrix[j - 1][i - 1] + substitutionCost // substitution
            );
        }
    }
    return matrix[str2.length][str1.length];
}
/**
 * 从字符串中提取单词（支持camelCase和kebab-case）
 */
function extractWords(str) {
    // 第一步：处理camelCase，在小写字母后跟大写字母的地方插入空格
    let processed = str.replace(/([a-z])([A-Z])/g, '$1 $2');
    // 第二步：处理连续的大写字母，如HTTPSClient -> HTTPS Client
    processed = processed.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
    // 第三步：转换为小写并分割
    const words = processed.toLowerCase().split(/[-_\s]+/);
    // 第四步：去重并过滤空字符串
    return [...new Set(words)].filter(word => word.length > 0);
}
