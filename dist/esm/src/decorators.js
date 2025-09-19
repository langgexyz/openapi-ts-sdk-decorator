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
//# sourceMappingURL=decorators.js.map