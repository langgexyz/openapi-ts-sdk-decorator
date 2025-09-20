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
    const { enableNamingValidation = true, enableTypeValidation = true, enableParameterValidation = true, checkRootUri = true, requireDocumentation = false, moduleContext } = options || {};
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
        if (checkRootUri) {
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
            // 3. 类型名验证（通过运行时检查）
            if (enableTypeValidation) {
                try {
                    // 尝试从方法的实际调用中获取类型信息
                    const method = client[methodMetadata.name];
                    if (method && typeof method === 'function') {
                        try {
                            // 获取方法的实际Request和Response类型
                            const actualTypes = getActualTypesFromMetadata(client, methodMetadata.name, moduleContext);
                            // 创建mock对象用于类型检查
                            const mockRequest = actualTypes.requestType ? new actualTypes.requestType() : {};
                            let mockResponseType = actualTypes.responseType;
                            if (!mockResponseType) {
                                // 创建一个构造函数
                                mockResponseType = class MockResponse {
                                };
                            }
                            // 构造方法参数（包括路径参数）
                            const methodArgs = constructMethodArguments(client, methodMetadata.name, mockRequest, mockResponseType);
                            // 调用方法触发基本类型检查
                            method.apply(client, methodArgs);
                            // 检查类型名称是否符合OpenAPI规范
                            if (actualTypes.requestType && actualTypes.responseType) {
                                const actualRequestName = actualTypes.requestType.name;
                                const actualResponseName = actualTypes.responseType.name;
                                const expectedRequestName = OpenAPINamingRule.generateRequestTypeName(methodMetadata.name);
                                const expectedResponseName = OpenAPINamingRule.generateResponseTypeName(methodMetadata.name);
                                if (actualRequestName !== expectedRequestName) {
                                    errors.push(`[${methodMetadata.name}] Request type mismatch: expected "${expectedRequestName}", got "${actualRequestName}"`);
                                }
                                if (actualResponseName !== expectedResponseName) {
                                    errors.push(`[${methodMetadata.name}] Response type mismatch: expected "${expectedResponseName}", got "${actualResponseName}"`);
                                }
                            }
                        }
                        catch (error) {
                            // 捕获类型验证错误
                            if (error?.message?.includes('Type naming validation failed')) {
                                const errorMessage = error.message.replace('Type naming validation failed: ', '');
                                // 解析错误消息，提取实际的类型信息
                                let actualRequestType = '';
                                let actualResponseType = '';
                                // 从错误信息中提取实际使用的类型名
                                const requestMatch = errorMessage.match(/Request type "([^"]+)"/);
                                const responseMatch = errorMessage.match(/Response type "([^"]+)"/);
                                if (requestMatch)
                                    actualRequestType = requestMatch[1];
                                if (responseMatch)
                                    actualResponseType = responseMatch[1];
                                // 生成期望的类型名
                                const expectedRequestType = OpenAPINamingRule.generateRequestTypeName(methodMetadata.name);
                                const expectedResponseType = OpenAPINamingRule.generateResponseTypeName(methodMetadata.name);
                                // 使用 OpenAPINamingRule.validateTypeNames 进行详细验证
                                if (actualRequestType && actualResponseType) {
                                    const typeValidationResult = OpenAPINamingRule.validateTypeNames(methodMetadata.name, actualRequestType, actualResponseType);
                                    if (!typeValidationResult.isValid) {
                                        typeValidationResult.errors.forEach(err => errors.push(`[${methodMetadata.name}] ${err}`));
                                        typeValidationResult.suggestions.forEach(sug => suggestions.push(`[${methodMetadata.name}] ${sug}`));
                                    }
                                }
                                else {
                                    // 如果无法解析类型名，添加通用错误
                                    errors.push(`[${methodMetadata.name}] ${errorMessage}`);
                                    suggestions.push(`[${methodMetadata.name}] Expected request type: ${expectedRequestType}`);
                                    suggestions.push(`[${methodMetadata.name}] Expected response type: ${expectedResponseType}`);
                                }
                            }
                            else {
                                // 其他运行时错误，忽略但提供建议
                                const expectedRequestType = OpenAPINamingRule.generateRequestTypeName(methodMetadata.name);
                                const expectedResponseType = OpenAPINamingRule.generateResponseTypeName(methodMetadata.name);
                                suggestions.push(`[${methodMetadata.name}] Expected request type: ${expectedRequestType}`);
                                suggestions.push(`[${methodMetadata.name}] Expected response type: ${expectedResponseType}`);
                            }
                        }
                    }
                    else {
                        // 方法不存在，提供基本建议
                        const expectedRequestType = OpenAPINamingRule.generateRequestTypeName(methodMetadata.name);
                        const expectedResponseType = OpenAPINamingRule.generateResponseTypeName(methodMetadata.name);
                        suggestions.push(`[${methodMetadata.name}] Expected request type: ${expectedRequestType}`);
                        suggestions.push(`[${methodMetadata.name}] Expected response type: ${expectedResponseType}`);
                    }
                }
                catch (outerError) {
                    // 整个检查失败，只提供建议
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
        // 找到@Request参数的实际类型
        Object.keys(paramMetadata).forEach(indexStr => {
            const index = parseInt(indexStr);
            const meta = paramMetadata[index];
            const paramType = paramTypes[index];
            if (meta.type === 'request' && paramType) {
                requestType = paramType;
            }
        });
        if (!requestType || !requestType.name) {
            return { requestType: null, responseType: null };
        }
        // 根据Request类型名推断Response类型名
        const requestTypeName = requestType.name; // 如"LoginRequest"
        let responseType = null;
        if (requestTypeName.endsWith('Request')) {
            const baseName = requestTypeName.slice(0, -'Request'.length); // "Login"
            const responseTypeName = baseName + 'Response'; // "LoginResponse"
            // 从模块上下文获取Response类型构造函数
            if (moduleContext && moduleContext[responseTypeName]) {
                responseType = moduleContext[responseTypeName];
            }
        }
        return { requestType, responseType };
    }
    catch (error) {
        return { requestType: null, responseType: null };
    }
}
/**
 * 构造方法调用参数（包括路径参数、请求体、响应类型等）
 */
function constructMethodArguments(client, methodName, mockRequest, mockResponseType) {
    const PARAM_METADATA_KEY = '__openapi_ts_sdk_decorator_paramMetadata';
    try {
        const paramMetadata = Reflect.getMetadata(PARAM_METADATA_KEY, client, methodName) || {};
        const paramTypes = Reflect.getMetadata("design:paramtypes", client, methodName) || [];
        const args = [];
        // 根据参数元数据填充参数
        for (let i = 0; i < paramTypes.length; i++) {
            const meta = paramMetadata[i];
            if (meta) {
                if (meta.type === 'param') {
                    // 路径参数 - 提供mock值
                    args[i] = `mock_${meta.name}_value`;
                }
                else if (meta.type === 'query') {
                    // 查询参数 - 提供mock值
                    args[i] = `mock_${meta.name}_query`;
                }
                else if (meta.type === 'request') {
                    // 请求体
                    args[i] = mockRequest;
                }
                else if (meta.type === 'responseType') {
                    // 响应类型
                    args[i] = mockResponseType;
                }
                // options参数是spread参数，不需要单独处理
            }
            else {
                // 没有元数据的参数，根据位置推测
                if (i === paramTypes.length - 1) {
                    // 最后一个参数通常是options（spread参数），跳过
                    break;
                }
                else if (i === paramTypes.length - 2) {
                    // 倒数第二个参数通常是responseType
                    args[i] = mockResponseType;
                }
                else if (i === paramTypes.length - 3) {
                    // 倒数第三个参数通常是request
                    args[i] = mockRequest;
                }
                else {
                    // 其他参数可能是路径参数或查询参数
                    args[i] = `mock_param_${i}`;
                }
            }
        }
        // 移除末尾的undefined值
        while (args.length > 0 && args[args.length - 1] === undefined) {
            args.pop();
        }
        return args;
    }
    catch (error) {
        // 发生错误时返回默认参数
        return [mockRequest, mockResponseType];
    }
}
/**
 * 获取方法的Request和Response类型信息（带后备逻辑）
 */
function getActualTypesFromMetadata(client, methodName, moduleContext) {
    const PARAM_METADATA_KEY = '__openapi_ts_sdk_decorator_paramMetadata';
    try {
        // 优先使用完整的类型获取逻辑
        const realTypes = getRealTypesFromClient(client, methodName, moduleContext);
        if (realTypes.requestType && realTypes.responseType) {
            return realTypes;
        }
        // 后备方案：从参数元数据直接获取
        const paramMetadata = Reflect.getMetadata(PARAM_METADATA_KEY, client, methodName) || {};
        const paramTypes = Reflect.getMetadata("design:paramtypes", client, methodName) || [];
        let requestType = null;
        let responseType = null;
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
        return { requestType, responseType };
    }
    catch (error) {
        return { requestType: null, responseType: null };
    }
}
