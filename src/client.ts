/**
 * Base API Client with Validation and Request Handling
 * 
 * This file contains the base APIClient class with validation rules
 * and request execution logic for TypeScript SDKs.
 */

import { HttpBuilder, HttpMethod } from 'openapi-ts-sdk';
import { plainToClass, instanceToPlain } from 'class-transformer';
import { validate } from 'class-validator';

// API 配置接口
export interface APIConfig {
  uri: string;           // 请求 URI（每个方法都有默认值，可通过 withUri 覆盖）
  headers: Record<string, string>;  // 请求 headers（默认包含 Content-Type）
}

// 函数式选项类型
export type APIOption = (config: APIConfig) => void;

// 选项构造函数
export const withUri = (uri: string): APIOption => (config) => {
  config.uri = uri;
};

export const withHeaders = (headers: Record<string, string>): APIOption => (config) => {
  config.headers = { ...config.headers, ...headers };
};

export const withHeader = (key: string, value: string): APIOption => (config) => {
  config.headers = { ...config.headers, [key]: value };
};

// 组合选项
export const combineOptions = (...options: APIOption[]): APIOption => (config) => {
  options.forEach(option => option(config));
};

/**
 * 基础 API 客户端抽象类
 */
export abstract class APIClient {
  protected httpBuilder: HttpBuilder;

  constructor(httpBuilder: HttpBuilder) {
    this.httpBuilder = httpBuilder;
  }

  /**
   * 统一的请求数据验证方法
   * @protected
   */
  protected async validateRequest<T = unknown>(request: T): Promise<void> {
    if (!request) {
      throw new Error('参数 request 是必需的');
    }
    
    if (typeof request !== 'object') {
      throw new Error('参数 request 必须是对象类型');
    }
    
    // 使用class-validator进行统一验证
    const errors = await validate(request as object);
    
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
  private checkRequestResponseName<
    TRequest extends Record<string, any>,
    TResponse extends Record<string, any>
  >(
    request: TRequest, 
    responseType: new(...args: any[]) => TResponse
  ): void {
    // 定义类型后缀常量
    const REQUEST = 'Request';
    const RESPONSE = 'Response';
    
    // 如果 request 是空对象，跳过检查
    if (!request || (typeof request === 'object' && 
        Object.keys(request).length === 0 && 
        request.constructor === Object)) {
      return; // 允许空对象，不强制检查
    }
    
    const requestTypeName = (request as any).constructor?.name || '';
    const responseTypeName = responseType.name;
    
    const errors: string[] = [];
    
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
      const requestPrefix = requestTypeName.slice(0, -REQUEST.length);   // 移除 "Request"
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
   * 执行HTTP请求
   * @protected
   */
  protected async executeRequest<
    TRequest extends Record<string, any> = Record<string, never>,
    TResponse extends Record<string, any> = Record<string, never>
  >(    method: HttpMethod,
    path: string,
    request: TRequest,
    responseType: {new(...args:any[]): TResponse},
    options: APIOption[] = []
  ): Promise<TResponse> {
    
    // 🔍 Request/Response 类型命名规范检查
    this.checkRequestResponseName<TRequest, TResponse>(request, responseType);
    
    // 创建默认配置
    const config: APIConfig = {
      uri: path,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    // 应用所有选项
    options.forEach(option => option(config));
    
    // 构建 HTTP 请求
    const httpBuilder = this.httpBuilder
      .setUri(config.uri)
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
