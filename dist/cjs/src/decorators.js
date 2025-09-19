"use strict";
/**
 * OpenAPI TypeScript SDK Decorators
 *
 * TypeScript 5.x 兼容版本 - 同时支持新旧装饰器语法
 * 1. TypeScript 5.x 新装饰器语法（Stage 3）
 * 2. TypeScript 4.x 旧装饰器语法（Legacy/Experimental）
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OPTIONS = exports.HEAD = exports.PATCH = exports.DELETE = exports.PUT = exports.POST = exports.GET = void 0;
exports.RootUri = RootUri;
exports.getAPIMethodsMetadata = getAPIMethodsMetadata;
exports.getRootUri = getRootUri;
exports.getAllRootUriMappings = getAllRootUriMappings;
const openapi_ts_sdk_1 = require("openapi-ts-sdk");
const config_1 = require("./config");
/**
 * 装饰器命名空间常量
 */
const DECORATOR_NAMESPACE = '__openapi_ts_sdk_decorator_';
const API_METHODS_KEY = `${DECORATOR_NAMESPACE}apiMethods`;
const ROOT_URI_KEY = `${DECORATOR_NAMESPACE}rootUri`;
const GLOBAL_ROOT_URIS_KEY = `${DECORATOR_NAMESPACE}rootUris`;
/**
 * 提取路径中的参数
 * @param path 路径字符串
 * @returns 路径参数数组
 */
function extractPathParameters(path) {
    const matches = path.match(/\{([^}]+)\}/g) || [];
    return matches.map(match => match.slice(1, -1));
}
/**
 * 验证标准API方法签名格式
 *
 * 标准格式要求：
 * @GET('/kol/{kolId}/social')
 * async getKOLSocialData(request: GetKOLSocialDataRequest, ...options: APIOption[]): Promise<GetKOLSocialDataResponse>
 *
 * 规则：
 * 1. 路径参数通过 withParams() 在调用时提供，不在方法签名中
 * 2. 方法只能有两个参数：request对象 + ...options
 * 3. request 参数必须以 "Request" 结尾
 * 4. 返回类型必须是 Promise<SomeResponse>，Response类型以 "Response" 结尾
 *
 * @param path 路径字符串
 * @param method HTTP方法
 * @param target 目标对象
 * @param propertyKey 方法名
 * @param descriptor 属性描述符（可能包含方法函数）
 */
function validateStandardMethodSignature(path, method, target, propertyKey, descriptor) {
    // 🚀 检查开关：如果禁用验证，直接返回
    if (!(0, config_1.isValidationEnabled)()) {
        return;
    }
    // 获取方法的参数信息
    let methodFunction;
    if (descriptor && descriptor.value && typeof descriptor.value === 'function') {
        methodFunction = descriptor.value;
    }
    else {
        methodFunction = target[propertyKey] ||
            (target.constructor && target.constructor.prototype && target.constructor.prototype[propertyKey]);
    }
    if (!methodFunction || typeof methodFunction !== 'function') {
        // 装饰器应用时方法可能还没有定义，跳过验证
        return;
    }
    // 获取函数参数信息
    const funcStr = methodFunction.toString();
    const paramMatch = funcStr.match(/\(([^)]*)\)/);
    if (!paramMatch)
        return;
    const paramStr = paramMatch[1].trim();
    if (!paramStr) {
        // 方法没有参数，这在某些情况下是允许的（如简单的GET请求）
        return;
    }
    // 解析参数列表
    const params = [];
    let currentParam = '';
    let bracketCount = 0;
    let inString = false;
    let stringChar = '';
    for (let i = 0; i < paramStr.length; i++) {
        const char = paramStr[i];
        if (!inString && (char === '"' || char === "'")) {
            inString = true;
            stringChar = char;
            currentParam += char;
        }
        else if (inString && char === stringChar) {
            inString = false;
            currentParam += char;
        }
        else if (!inString && char === '{') {
            bracketCount++;
            currentParam += char;
        }
        else if (!inString && char === '}') {
            bracketCount--;
            currentParam += char;
        }
        else if (!inString && char === ',' && bracketCount === 0) {
            params.push(currentParam.trim());
            currentParam = '';
        }
        else {
            currentParam += char;
        }
    }
    if (currentParam.trim()) {
        params.push(currentParam.trim());
    }
    // 验证标准方法签名格式
    const pathParams = extractPathParameters(path);
    // 分析参数类型（基于运行时可获得的信息）
    const requestParams = [];
    const optionsParams = [];
    const pathParamsInSignature = [];
    params.forEach(param => {
        const cleanParam = param.trim();
        const paramName = cleanParam.split(':')[0].trim();
        if (cleanParam.startsWith('...')) {
            // 任何以 ... 开头的参数都被认为是 options 参数
            optionsParams.push(cleanParam);
        }
        else if (pathParams.includes(paramName)) {
            // 检查路径参数是否错误地出现在方法签名中
            pathParamsInSignature.push(cleanParam);
        }
        else {
            // 非路径参数、非options参数 = 可能的 request 参数
            requestParams.push(cleanParam);
        }
    });
    const errors = [];
    const suggestions = [];
    // 生成方法名对应的类型名（用于错误信息）
    const capitalizedMethodName = propertyKey.charAt(0).toUpperCase() + propertyKey.slice(1);
    // 1. 检查路径参数是否错误地出现在方法签名中
    if (pathParamsInSignature.length > 0) {
        errors.push(`路径参数 [${pathParamsInSignature.map(p => p.split(':')[0].trim()).join(', ')}] 不应该在方法签名中`);
        suggestions.push(`使用 withParams() 在调用时提供路径参数，而不是在方法签名中定义`);
    }
    // 2. 检查 request 参数数量
    if (requestParams.length > 1) {
        errors.push(`只能有一个 request 参数，发现 ${requestParams.length} 个`);
        suggestions.push(`合并为单个 request 对象: request: ${capitalizedMethodName}Request`);
    }
    // 3. 检查 options 参数格式  
    if (optionsParams.length > 1) {
        errors.push(`只能有一个 ...options 参数，发现 ${optionsParams.length} 个`);
        suggestions.push(`使用单个 rest 参数: ...options: APIOption[]`);
    }
    // 4. 验证整体参数结构（运行时可检查的部分）
    const totalNonOptionsParams = requestParams.length + pathParamsInSignature.length;
    // 检查参数总数是否合理
    if (totalNonOptionsParams > 1) {
        errors.push(`方法签名应该只有 request 参数和 ...options 参数`);
        suggestions.push(`标准格式: async ${propertyKey}(request: ${capitalizedMethodName}Request, ...options: APIOption[])`);
    }
    // 5. 对于有 request 参数的情况，建议使用标准命名
    if (requestParams.length === 1) {
        const requestParam = requestParams[0];
        const paramName = requestParam.split(':')[0].trim();
        // 建议使用 "request" 作为参数名（但不强制要求）
        if (paramName !== 'request') {
            suggestions.push(`建议使用标准参数名: request: ${capitalizedMethodName}Request（当前: ${paramName}）`);
        }
    }
    // 如果有错误，提供完整的错误信息
    if (errors.length > 0) {
        const pathInfo = pathParams.length > 0
            ? `路径参数: {${pathParams.join('}, {')}}`
            : `无路径参数`;
        const standardSignature = generateStandardSignature(propertyKey, pathParams, method, path);
        // 生成实际的Response类型名
        const responseTypeName = `${capitalizedMethodName}Response`;
        throw new Error(`🚫 @${method.toUpperCase()} 方法签名格式错误\n\n` +
            `${errors.map(error => `❌ ${error}`).join('\n')}\n\n` +
            `📋 当前路径: "${path}"\n` +
            `📋 ${pathInfo}\n\n` +
            `💡 标准格式:\n${standardSignature}\n\n` +
            `📚 说明:\n` +
            `   • 路径参数通过 withParams() 在调用时提供\n` +
            `   • 方法只接受 request 对象和 ...options 参数\n` +
            `   • 建议格式：request: ${capitalizedMethodName}Request\n` +
            `   • 返回类型：Promise<${responseTypeName}>\n` +
            `   • 注意：类型检查在 TypeScript 编译时进行\n\n` +
            (suggestions.length > 0 ? `🔧 建议:\n${suggestions.map(s => `   • ${s}`).join('\n')}` : ''));
    }
}
/**
 * 生成标准方法签名示例
 */
function generateStandardSignature(methodName, pathParams, httpMethod = openapi_ts_sdk_1.HttpMethod.GET, actualPath) {
    // 生成方法名对应的Request/Response类型名
    const capitalizedMethodName = methodName.charAt(0).toUpperCase() + methodName.slice(1);
    const requestTypeName = `${capitalizedMethodName}Request`;
    const responseTypeName = `${capitalizedMethodName}Response`;
    // 使用实际路径，如果没有提供则使用示例路径
    const displayPath = actualPath || `/example/path${pathParams.map(p => `/{${p}}`).join('')}`;
    // 标准签名格式
    return `    @${httpMethod.toUpperCase()}('${displayPath}')\n` +
        `    async ${methodName}(request: ${requestTypeName}, ...options: APIOption[]): Promise<${responseTypeName}>`;
}
/**
 * 验证装饰器路径格式
 * @param path 路径字符串
 * @param decoratorName 装饰器名称（用于错误信息）
 */
function validateDecoratorPath(path, decoratorName) {
    // 🚀 检查开关：如果禁用验证，直接返回
    if (!(0, config_1.isValidationEnabled)()) {
        return;
    }
    // 检查是否为空字符串
    if (path === '') {
        throw new Error(`@${decoratorName} 路径不能为空。` +
            `\n  建议使用: @${decoratorName}('/') 表示根路径`);
    }
    // 检查是否只包含空白字符
    if (path.trim() === '') {
        throw new Error(`@${decoratorName} 路径不能只包含空白字符。` +
            `\n  当前值: "${path}"` +
            `\n  建议使用: @${decoratorName}('/') 表示根路径`);
    }
    // 检查是否以 / 开头
    if (!path.startsWith('/')) {
        throw new Error(`@${decoratorName} 路径必须以 '/' 开头。` +
            `\n  当前值: "${path}"` +
            `\n  建议修改为: "/${path}"` +
            `\n  示例: @${decoratorName}('/api/users') 而非 @${decoratorName}('api/users')`);
    }
    // 检查是否包含连续的斜杠
    if (path !== '/' && path.includes('//')) {
        throw new Error(`@${decoratorName} 路径不能包含连续的斜杠。` +
            `\n  当前值: "${path}"` +
            `\n  建议修改为: "${path.replace(/\/+/g, '/')}"`);
    }
    // 检查是否以 / 结尾（除了根路径 / 这个特殊情况）
    if (path !== '/' && path.endsWith('/')) {
        throw new Error(`@${decoratorName} 路径不能以 '/' 结尾（根路径 '/' 除外）。` +
            `\n  当前值: "${path}"` +
            `\n  建议修改为: "${path.slice(0, -1)}"` +
            `\n  示例: @${decoratorName}('/api/users') 而非 @${decoratorName}('/api/users/')`);
    }
}
/**
 * 创建兼容 TypeScript 5.x 的 HTTP 方法装饰器
 *
 * 这个实现同时支持：
 * 1. TypeScript 5.x 新装饰器语法（Stage 3）
 * 2. TypeScript 4.x 旧装饰器语法（Legacy/Experimental）
 */
function createHttpMethodDecorator(method) {
    return function (path, options) {
        // 验证路径格式
        validateDecoratorPath(path, method.toUpperCase());
        // 返回一个装饰器函数，它能同时处理新旧装饰器语法
        return function (target, context) {
            let propertyKey;
            let descriptor;
            // 检测装饰器语法类型
            if (typeof context === 'string') {
                // 旧装饰器语法：(target, propertyKey, descriptor)
                propertyKey = context;
                descriptor = arguments[2];
            }
            else if (context && typeof context === 'object' && context !== null) {
                if ('kind' in context && context.kind === 'method') {
                    // TypeScript 5.x 新装饰器语法
                    propertyKey = String(context.name);
                }
                else {
                    // 旧装饰器语法：context 是 PropertyDescriptor
                    propertyKey = String(arguments[1]);
                    descriptor = context;
                }
            }
            else {
                // 回退处理 - 旧装饰器语法
                propertyKey = String(arguments[1]);
                descriptor = arguments[2];
            }
            // 验证标准API方法签名格式
            try {
                validateStandardMethodSignature(path, method, target, propertyKey, descriptor);
            }
            catch (error) {
                // 重新抛出错误，保持错误信息完整
                throw error;
            }
            // 确保 target.constructor 存在
            const targetConstructor = target.constructor || target;
            // 保存装饰器元数据
            if (!targetConstructor[API_METHODS_KEY]) {
                targetConstructor[API_METHODS_KEY] = [];
            }
            const metadata = {
                name: propertyKey,
                method,
                path, // Use original path after validation
                options
            };
            targetConstructor[API_METHODS_KEY].push(metadata);
            // 对于新装饰器语法，返回 void
            if (context && typeof context === 'object' && context !== null && 'kind' in context && context.kind === 'method') {
                return;
            }
            // 对于旧装饰器语法，返回 undefined
            return;
        };
    };
}
// 导出 HTTP 方法装饰器
exports.GET = createHttpMethodDecorator(openapi_ts_sdk_1.HttpMethod.GET);
exports.POST = createHttpMethodDecorator(openapi_ts_sdk_1.HttpMethod.POST);
exports.PUT = createHttpMethodDecorator(openapi_ts_sdk_1.HttpMethod.PUT);
exports.DELETE = createHttpMethodDecorator(openapi_ts_sdk_1.HttpMethod.DELETE);
exports.PATCH = createHttpMethodDecorator(openapi_ts_sdk_1.HttpMethod.PATCH);
exports.HEAD = createHttpMethodDecorator(openapi_ts_sdk_1.HttpMethod.HEAD);
exports.OPTIONS = createHttpMethodDecorator(openapi_ts_sdk_1.HttpMethod.OPTIONS);
/**
 * 兼容 TypeScript 5.x 的 @RootUri 装饰器
 */
function RootUri(rootUri) {
    return function (target, context) {
        // 验证路径格式
        validateDecoratorPath(rootUri, 'RootUri');
        // 检测装饰器语法类型
        if (context && typeof context === 'object' && context !== null && 'kind' in context) {
            // TypeScript 5.x 新装饰器语法
            if (context.kind === 'class') {
                // 使用新的元数据系统
                const originalTarget = target;
                // 保存根路径信息
                originalTarget[ROOT_URI_KEY] = rootUri;
                // 注册到全局映射表
                if (!globalThis[GLOBAL_ROOT_URIS_KEY]) {
                    globalThis[GLOBAL_ROOT_URIS_KEY] = new Map();
                }
                globalThis[GLOBAL_ROOT_URIS_KEY].set(originalTarget.name, rootUri);
                return originalTarget;
            }
        }
        else {
            // TypeScript 4.x 旧装饰器语法
            target[ROOT_URI_KEY] = rootUri;
            // 注册到全局映射表
            if (!globalThis[GLOBAL_ROOT_URIS_KEY]) {
                globalThis[GLOBAL_ROOT_URIS_KEY] = new Map();
            }
            globalThis[GLOBAL_ROOT_URIS_KEY].set(target.name, rootUri);
        }
        return target;
    };
}
/**
 * 获取类的 API 方法元数据
 */
function getAPIMethodsMetadata(target) {
    const constructor = target.constructor || target;
    return constructor[API_METHODS_KEY] || [];
}
/**
 * 获取Client类的根路径
 */
function getRootUri(clientClass) {
    return clientClass[ROOT_URI_KEY] || null;
}
/**
 * 获取所有SDK到服务器的映射
 */
function getAllRootUriMappings() {
    return globalThis[GLOBAL_ROOT_URIS_KEY] || new Map();
}
//# sourceMappingURL=decorators.js.map