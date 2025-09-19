/**
 * Base API Client with Validation and Request Handling
 *
 * This file contains the base APIClient class with validation rules
 * and request execution logic for TypeScript SDKs.
 */
import { plainToClass, instanceToPlain } from 'class-transformer';
import { validate } from 'class-validator';
import { OpenAPINamingRule } from './rules';
// 选项构造函数
export const withUri = (uri) => (config) => {
    config.uri = uri;
};
export const withHeaders = (headers) => (config) => {
    config.headers = { ...config.headers, ...headers };
};
export const withHeader = (key, value) => (config) => {
    config.headers = { ...config.headers, [key]: value };
};
/**
 * 设置路径参数的 APIOption
 * 用于动态替换 URL 路径中的参数，如 /users/{id} -> /users/123
 *
 * @param params - 路径参数的键值对
 * @returns APIOption 函数
 *
 * @example
 * // 对于路径 /users/{id}/posts/{postId}
 * withParams({ id: '123', postId: '456' })
 * // 结果：/users/123/posts/456
 */
export const withParams = (params) => (config) => {
    config.params = { ...config.params, ...params };
};
/**
 * 设置查询参数的 APIOption
 * 用于在 URL 后添加查询字符串
 *
 * @param query - 查询参数的键值对或查询字符串
 * @returns APIOption 函数
 *
 * @example
 * withQuery({ page: '1', size: '10' })
 * // 结果：?page=1&size=10
 *
 * withQuery('page=1&size=10')
 * // 结果：?page=1&size=10
 */
export const withQuery = (query) => (config) => {
    if (typeof query === 'string') {
        config.query = query;
    }
    else {
        const queryString = Object.entries(query)
            .filter(([_, value]) => value !== undefined && value !== null)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');
        config.query = queryString;
    }
};
// 组合选项
export const combineOptions = (...options) => (config) => {
    options.forEach(option => option(config));
};
/**
 * 基础 API 客户端抽象类
 */
export class APIClient {
    constructor(httpBuilder) {
        this.httpBuilder = httpBuilder;
    }
    /**
     * 统一的请求数据验证方法
     * @protected
     */
    async validateRequest(request) {
        if (!request) {
            throw new Error('参数 request 是必需的');
        }
        if (typeof request !== 'object') {
            throw new Error('参数 request 必须是对象类型');
        }
        // 使用class-validator进行统一验证
        const errors = await validate(request);
        if (errors.length > 0) {
            const errorDetails = errors.map(error => {
                const property = error.property || 'unknown';
                const constraints = error.constraints || {};
                const constraintMessages = Object.values(constraints).join(', ');
                const value = error.value !== undefined ? JSON.stringify(error.value) : 'undefined';
                return `属性 '${property}' 验证失败: ${constraintMessages} (当前值: ${value})`;
            }).join('\n');
            throw new Error(`Request data validation failed:\n${errorDetails}\n\nPlease check the following:\n1. Ensure all required fields are provided\n2. Check if field types are correct (string/number/array etc.)\n3. Verify field formats meet requirements\n4. If the problem persists, please contact server-side developers to check API specification`);
        }
    }
    /**
     * 检查 Request/Response 类型命名规范
     * @private
     */
    checkRequestResponseName(request, responseType) {
        // 定义类型后缀常量
        const REQUEST = 'Request';
        const RESPONSE = 'Response';
        // 如果 request 是空对象，跳过检查
        if (!request || (typeof request === 'object' &&
            Object.keys(request).length === 0 &&
            request.constructor === Object)) {
            return; // 允许空对象，不强制检查
        }
        const requestTypeName = request.constructor?.name || '';
        const responseTypeName = responseType.name;
        const errors = [];
        // 检查 Request 类型命名：必须以 "Request" 结尾
        if (requestTypeName && requestTypeName !== 'Object' && !requestTypeName.endsWith(REQUEST)) {
            errors.push(`${REQUEST} 类型 "${requestTypeName}" 必须以 "${REQUEST}" 结尾`);
        }
        // 检查 Response 类型命名：必须以 "Response" 结尾
        if (!responseTypeName.endsWith(RESPONSE)) {
            errors.push(`${RESPONSE} 类型 "${responseTypeName}" 必须以 "${RESPONSE}" 结尾`);
        }
        // 检查前缀一致性（当两个类型都符合规范时）
        if (requestTypeName.endsWith(REQUEST) && responseTypeName.endsWith(RESPONSE)) {
            const requestPrefix = requestTypeName.slice(0, -REQUEST.length); // 移除 "Request"
            const responsePrefix = responseTypeName.slice(0, -RESPONSE.length); // 移除 "Response"
            if (requestPrefix !== responsePrefix) {
                errors.push(`${REQUEST}/${RESPONSE} 前缀不一致: "${requestPrefix}" vs "${responsePrefix}"`);
            }
        }
        if (errors.length > 0) {
            throw new Error(`
🚫 ${REQUEST}/${RESPONSE} 类型命名规范检查失败

${errors.map(error => `❌ ${error}`).join('\n')}

📋 标准命名规范:
  • ${REQUEST} 类型：[MethodName]${REQUEST}
    ✅ 正确：GetUser${REQUEST}, CreateOrder${REQUEST}, UpdateProfile${REQUEST}
    ❌ 错误：UserInfo, GetUserDTO, User${REQUEST}
    
  • ${RESPONSE} 类型：[MethodName]${RESPONSE}  
    ✅ 正确：GetUser${RESPONSE}, CreateOrder${RESPONSE}, UpdateProfile${RESPONSE}
    ❌ 错误：UserData, GetUserResult, User
    
  • 前缀一致性：${REQUEST} 和 ${RESPONSE} 的前缀必须相同
    ✅ 正确：GetUser${REQUEST} + GetUser${RESPONSE}
    ❌ 错误：GetUser${REQUEST} + CreateUser${RESPONSE}

💡 命名约定说明:
  • [MethodName] = HTTP方法 + 资源名 + 操作描述
  • 示例：getUserById → GetUserById + ${REQUEST}/${RESPONSE}
  • 示例：createOrder → CreateOrder + ${REQUEST}/${RESPONSE}
  • 示例：updateUserProfile → UpdateUserProfile + ${REQUEST}/${RESPONSE}

📚 了解更多: 查看 OpenAPI TypeScript SDK 命名规范文档
      `);
        }
    }
    /**
     * 验证路径参数的辅助方法
     * @private
     */
    validatePathParameters(uri, params) {
        // 提取路径中的参数占位符
        const pathParameters = OpenAPINamingRule.extractPathParameters(uri);
        if (!params)
            params = {};
        // 验证提供的参数是否与路径参数匹配
        const providedParams = Object.keys(params);
        const missingParams = pathParameters.filter(param => !providedParams.includes(param));
        const extraParams = providedParams.filter(param => !pathParameters.includes(param));
        const errors = [];
        if (missingParams.length > 0) {
            errors.push(`缺少必需的路径参数: ${missingParams.join(', ')}`);
        }
        if (extraParams.length > 0) {
            errors.push(`提供了不存在的路径参数: ${extraParams.join(', ')}`);
        }
        if (errors.length > 0) {
            const pathInfo = pathParameters.length > 0
                ? `路径 "${uri}" 需要参数: {${pathParameters.join('}, {')}}`
                : `路径 "${uri}" 不需要任何参数`;
            throw new Error(`🚫 路径参数验证失败\n\n` +
                `${errors.map(error => `❌ ${error}`).join('\n')}\n\n` +
                `📋 ${pathInfo}\n` +
                `💡 请确保提供的参数与路径中的占位符完全匹配`);
        }
    }
    /**
     * 替换路径参数的辅助方法
     * @private
     */
    replacePathParameters(uri, params) {
        if (!params || Object.keys(params).length === 0) {
            return uri;
        }
        let replacedUri = uri;
        Object.entries(params).forEach(([key, value]) => {
            const placeholder = `{${key}}`;
            replacedUri = replacedUri.replace(placeholder, encodeURIComponent(value));
        });
        return replacedUri;
    }
    /**
     * 执行HTTP请求
     * @protected
     */
    async executeRequest(method, path, request, responseType, options = []) {
        // 🔍 Request/Response 类型命名规范检查
        this.checkRequestResponseName(request, responseType);
        // 创建默认配置
        const config = {
            uri: path,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        // 应用所有选项
        options.forEach(option => option(config));
        // 🔍 验证路径参数（在所有选项应用完毕后）
        this.validatePathParameters(config.uri, config.params);
        // 🔄 替换路径参数
        const finalUri = this.replacePathParameters(config.uri, config.params);
        // 构建 HTTP 请求
        const httpBuilder = this.httpBuilder
            .setUri(finalUri)
            .setMethod(method);
        // 添加 headers
        Object.entries(config.headers).forEach(([key, value]) => {
            httpBuilder.addHeader(key, value);
        });
        // 序列化请求体（如果有）
        if (request) {
            const requestJson = JSON.stringify(instanceToPlain(request));
            httpBuilder.setContent(requestJson);
        }
        const http = httpBuilder.build();
        const [response, error] = await http.send();
        if (error) {
            throw error;
        }
        if (response === "") {
            throw new Error("response is empty");
        }
        // 使用class-transformer进行反序列化
        const responseData = JSON.parse(response);
        const result = plainToClass(responseType, responseData);
        return result;
    }
}
//# sourceMappingURL=client.js.map