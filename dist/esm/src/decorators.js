/**
 * OpenAPI TypeScript SDK Decorators
 *
 * TypeScript 5.x 兼容版本 - 同时支持新旧装饰器语法
 * 1. TypeScript 5.x 新装饰器语法（Stage 3）
 * 2. TypeScript 4.x 旧装饰器语法（Legacy/Experimental）
 */
import { HttpMethod } from 'openapi-ts-sdk';
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
 * 验证方法参数与路径参数的匹配关系
 * @param path 路径字符串
 * @param method HTTP方法
 * @param target 目标对象
 * @param propertyKey 方法名
 * @param descriptor 属性描述符（可能包含方法函数）
 */
function validateMethodParameters(path, method, target, propertyKey, descriptor) {
    const pathParams = extractPathParameters(path);
    // 获取方法的参数信息
    // 优先从 descriptor 获取，然后从 target 获取
    let methodFunction;
    if (descriptor && descriptor.value && typeof descriptor.value === 'function') {
        methodFunction = descriptor.value;
    }
    else {
        methodFunction = target[propertyKey] ||
            (target.constructor && target.constructor.prototype && target.constructor.prototype[propertyKey]);
    }
    if (!methodFunction || typeof methodFunction !== 'function') {
        // 如果是装饰器应用时，方法可能还没有定义，暂时跳过验证
        // 这种情况下，我们需要在实际使用时进行验证
        return;
    }
    // 获取函数参数名（通过字符串解析）
    const funcStr = methodFunction.toString();
    const paramMatch = funcStr.match(/\(([^)]*)\)/);
    if (!paramMatch)
        return;
    const paramStr = paramMatch[1].trim();
    if (!paramStr && pathParams.length > 0) {
        // 如果有路径参数但方法没有参数，这是错误的
        throw new Error(`@${method.toUpperCase()} 路径参数验证失败：路径中定义了参数 [${pathParams.join(', ')}] 但方法 ${propertyKey} 没有任何参数。` +
            `\n  路径: "${path}"` +
            `\n  建议: 在方法签名中添加对应的参数`);
    }
    if (!paramStr)
        return;
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
    // 过滤掉 options 参数（以 ... 开头的参数）
    const normalParams = params.filter(param => {
        const cleanParam = param.replace(/\s*:\s*[^,]+$/, ''); // 移除类型声明
        return !cleanParam.startsWith('...') && !cleanParam.includes('APIOption');
    });
    // 提取参数名（移除类型声明和可选标记）
    const paramNames = normalParams.map(param => {
        const name = param.split(':')[0].trim().replace(/[?]$/, '');
        return name;
    });
    // 检查路径参数是否都在方法参数中
    const missingPathParams = pathParams.filter(pathParam => !paramNames.includes(pathParam));
    if (missingPathParams.length > 0) {
        throw new Error(`@${method.toUpperCase()} 路径参数验证失败：路径中的参数 [${missingPathParams.join(', ')}] 在方法 ${propertyKey} 的参数列表中未找到。` +
            `\n  路径: "${path}"` +
            `\n  路径参数: [${pathParams.join(', ')}]` +
            `\n  方法参数: [${paramNames.join(', ')}]` +
            `\n  建议: 确保所有路径参数都在方法签名中定义`);
    }
    // 检查多余的参数（除了路径参数之外的参数）
    const extraParams = paramNames.filter(paramName => !pathParams.includes(paramName));
    // 简化验证：只支持路径参数和一个 Request 对象
    // 允许的参数模式：
    // 1. 路径参数 (从 URL 路径中提取，如 {id}, {userId})
    // 2. 一个 Request 对象 (包含所有查询参数或请求体数据)
    // 3. ...options (APIOption[]) - 总是允许
    // 过滤掉 options 参数（以 ...options 形式出现）
    const nonOptionsParams = extraParams.filter(param => param !== 'options');
    // 允许最多一个非路径参数（Request 对象）
    if (nonOptionsParams.length > 1) {
        console.warn(`⚠️  @${method.toUpperCase()} 参数提示：方法 ${propertyKey} 中有多个非路径参数 [${nonOptionsParams.join(', ')}]。` +
            `\n  建议的参数模式: async ${propertyKey}(${pathParams.map(p => `${p}: string`).join(', ')}${pathParams.length > 0 ? ', ' : ''}request: SomeRequest, ...options: APIOption[])`);
    }
}
/**
 * 验证装饰器路径格式
 * @param path 路径字符串
 * @param decoratorName 装饰器名称（用于错误信息）
 */
function validateDecoratorPath(path, decoratorName) {
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
            // 验证方法参数与路径参数的匹配关系
            // 暂时禁用参数验证，简化使用
            // try {
            //   // 传递 descriptor 以便获取真正的方法函数
            //   validateMethodParameters(path, method, target, propertyKey, descriptor);
            // } catch (error) {
            //   // 重新抛出错误，保持错误信息完整
            //   throw error;
            // }
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
export const GET = createHttpMethodDecorator(HttpMethod.GET);
export const POST = createHttpMethodDecorator(HttpMethod.POST);
export const PUT = createHttpMethodDecorator(HttpMethod.PUT);
export const DELETE = createHttpMethodDecorator(HttpMethod.DELETE);
export const PATCH = createHttpMethodDecorator(HttpMethod.PATCH);
export const HEAD = createHttpMethodDecorator(HttpMethod.HEAD);
export const OPTIONS = createHttpMethodDecorator(HttpMethod.OPTIONS);
/**
 * 兼容 TypeScript 5.x 的 @RootUri 装饰器
 */
export function RootUri(rootUri) {
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
export function getAPIMethodsMetadata(target) {
    const constructor = target.constructor || target;
    return constructor[API_METHODS_KEY] || [];
}
/**
 * 获取Client类的根路径
 */
export function getRootUri(clientClass) {
    return clientClass[ROOT_URI_KEY] || null;
}
/**
 * 获取所有SDK到服务器的映射
 */
export function getAllRootUriMappings() {
    return globalThis[GLOBAL_ROOT_URIS_KEY] || new Map();
}
/**
 * @Query 装饰器 - 标记参数为查询参数
 */
export function Query(name) {
    return function (target, propertyKey, parameterIndex) {
        // 这里可以存储查询参数的元数据
        // 暂时作为占位符实现
    };
}
/**
 * @Body 装饰器 - 标记参数为请求体
 */
export function Body() {
    return function (target, propertyKey, parameterIndex) {
        // 这里可以存储请求体参数的元数据
        // 暂时作为占位符实现
    };
}
//# sourceMappingURL=decorators.js.map