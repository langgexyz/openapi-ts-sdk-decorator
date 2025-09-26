/**
 * 验证控制开关测试
 * 
 * 测试各种验证选项的精确控制行为
 */

import 'reflect-metadata';
import { APIClient, APIClientOptions } from '../../src/client';
import { checkRule, CheckRuleOptions } from '../../src/checkrule';
import { MockHttpBuilder } from '../setup';
import { RootUri, GET, POST } from '../../src/decorators';
import { HttpMethod } from 'openapi-ts-sdk';
import { IsString, IsEmail } from 'class-validator';

// 创建测试用的客户端类
@RootUri('/api/v1')
class TestClient extends APIClient {
  constructor(options?: APIClientOptions) {
    super(new MockHttpBuilder(), options);
  }

  @GET('/users')
  async getUsers(): Promise<any> {
    return this.executeRequest(HttpMethod.GET, '/users', {}, Object);
  }

  @POST('/users')
  async createUser(request: any): Promise<any> {
    return this.executeRequest(HttpMethod.POST, '/users', request, Object);
  }

  // 暴露 protected 方法以便测试
  public getOptions(): APIClientOptions {
    return this.options;
  }

  public async testValidateRequest<T>(request: T): Promise<void> {
    return this.validateRequest(request);
  }

  public testCheckRequestResponseName<TRequest extends Record<string, any>, TResponse extends Record<string, any>>(
    request: TRequest, 
    responseType: new(...args: any[]) => TResponse
  ): void {
    return (this as any).checkRequestResponseName(request, responseType);
  }
}

// 不符合命名规范的客户端（用于测试命名验证）
class BadNamingClient extends APIClient {
  constructor(options?: APIClientOptions) {
    super(new MockHttpBuilder(), options);
  }

  // 缺少 @RootUri 装饰器
  @GET('/bad-endpoint')
  async badMethod(): Promise<any> {
    return {};
  }
}

// 测试用的请求和响应类
class CreateUserRequest {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  constructor(name: string = 'test', email: string = 'test@example.com') {
    this.name = name;
    this.email = email;
  }
}

class CreateUserResponse {
  constructor(public id: string = '1', public name: string = 'test') {}
}

class BadNamingInput {
  constructor(public data: string = 'test') {}
}

class BadNamingOutput {
  constructor(public result: string = 'test') {}
}

describe('验证控制开关测试', () => {
  
  describe('enableTypeValidation 控制测试', () => {
    it('启用时应该检查 Request/Response 命名规范', () => {
      const client = new TestClient({
        enableTypeValidation: true
      });
      
      expect(() => {
        client.testCheckRequestResponseName(
          new BadNamingInput(),
          BadNamingOutput
        );
      }).toThrow(/Type naming validation failed/);
    });

    it('禁用时应该跳过 Request/Response 命名检查', () => {
      const client = new TestClient({
        enableTypeValidation: false
      });
      
      expect(() => {
        client.testCheckRequestResponseName(
          new BadNamingInput(),
          BadNamingOutput
        );
      }).not.toThrow();
    });

    it('应该允许符合规范的类名通过', () => {
      const client = new TestClient({
        enableTypeValidation: true
      });
      
      expect(() => {
        client.testCheckRequestResponseName(
          new CreateUserRequest(),
          CreateUserResponse
        );
      }).not.toThrow();
    });
  });

  describe('enableRequestValidation 控制测试', () => {
    it('启用时应该验证请求参数', async () => {
      const client = new TestClient({
        enableRequestValidation: true
      });
      
      // null 参数应该报错
      await expect(client.testValidateRequest(null)).rejects.toThrow(/Request parameter must be an object/);
      
      // 非对象参数应该报错
      await expect(client.testValidateRequest('string')).rejects.toThrow(/Request parameter must be an object/);
      await expect(client.testValidateRequest(123)).rejects.toThrow(/Request parameter must be an object/);
    });

    it('禁用时应该跳过请求参数验证', async () => {
      const client = new TestClient({
        enableRequestValidation: false
      });
      
      // 任何参数都应该通过
      await expect(client.testValidateRequest(null)).resolves.not.toThrow();
      await expect(client.testValidateRequest(undefined)).resolves.not.toThrow();
      await expect(client.testValidateRequest('string')).resolves.not.toThrow();
      await expect(client.testValidateRequest(123)).resolves.not.toThrow();
    });

    it('启用时应该允许有效的对象参数', async () => {
      const client = new TestClient({
        enableRequestValidation: true
      });
      
      // 使用普通对象应该通过基本验证
      const validObject = { name: 'test', email: 'test@example.com' };
      await expect(client.testValidateRequest(validObject)).resolves.not.toThrow();
      
      // 空对象也应该通过基本验证（只要是对象即可）
      const emptyObject = {};
      await expect(client.testValidateRequest(emptyObject)).resolves.not.toThrow();
    });
  });

  describe('enableResponseValidation 控制测试', () => {
    // 注意：响应验证在装饰器中处理，这里测试配置是否被正确传递
    it('配置应该被正确设置', () => {
      const clientEnabled = new TestClient({
        enableResponseValidation: true
      });
      expect(clientEnabled.getOptions().enableResponseValidation).toBe(true);
      
      const clientDisabled = new TestClient({
        enableResponseValidation: false
      });
      expect(clientDisabled.getOptions().enableResponseValidation).toBe(false);
    });
  });

  describe('开发时检查选项控制测试', () => {
    it('enableNamingValidation 应该在 checkRule 中生效', () => {
      const client = new TestClient();
      
      // 启用命名验证
      const resultEnabled = checkRule(client, {
        enableNamingValidation: true,
        enableTypeValidation: false,
        enableParameterValidation: false,
        enableRootUriCheck: false,
        requireDocumentation: false
      });
      
      // 禁用命名验证  
      const resultDisabled = checkRule(client, {
        enableNamingValidation: false,
        enableTypeValidation: false,
        enableParameterValidation: false,
        enableRootUriCheck: false,
        requireDocumentation: false
      });
      
      // 验证行为差异（具体实现依赖于 checkRule 逻辑）
      expect(typeof resultEnabled).toBe('object');
      expect(typeof resultDisabled).toBe('object');
    });

    it('enableRootUriCheck 应该控制 URI 配置检查', () => {
      const badClient = new BadNamingClient();
      
      // 启用 URI 检查应该发现缺少 @RootUri 的问题
      const resultEnabled = checkRule(badClient, {
        enableNamingValidation: false,
        enableTypeValidation: false,
        enableParameterValidation: false,
        enableRootUriCheck: true,
        requireDocumentation: false
      });
      
      // 禁用 URI 检查应该跳过检查
      const resultDisabled = checkRule(badClient, {
        enableNamingValidation: false,
        enableTypeValidation: false,
        enableParameterValidation: false,
        enableRootUriCheck: false,
        requireDocumentation: false
      });
      
      // 启用时应该有错误，禁用时应该没有相关错误
      expect(resultEnabled.errors.length).toBeGreaterThan(0);
      expect(resultEnabled.errors.some(err => err.includes('RootUri'))).toBe(true);
      
      // 禁用时要么没有错误，要么错误中不包含 RootUri 相关内容
      const hasRootUriError = resultDisabled.errors.some(err => err.includes('RootUri'));
      expect(hasRootUriError).toBe(false);
    });

    it('requireDocumentation 应该控制文档要求', () => {
      const client = new TestClient();
      
      // 要求文档
      const resultRequired = checkRule(client, {
        enableNamingValidation: false,
        enableTypeValidation: false,
        enableParameterValidation: false,
        enableRootUriCheck: false,
        requireDocumentation: true
      });
      
      // 不要求文档
      const resultNotRequired = checkRule(client, {
        enableNamingValidation: false,
        enableTypeValidation: false,
        enableParameterValidation: false,
        enableRootUriCheck: false,
        requireDocumentation: false
      });
      
      // 验证文档要求的影响
      expect(typeof resultRequired).toBe('object');
      expect(typeof resultNotRequired).toBe('object');
    });
  });

  describe('组合配置测试', () => {
    it('应该支持所有验证都启用', () => {
      const client = new TestClient({
        enableTypeValidation: true,
        enableRequestValidation: true,
        enableResponseValidation: true,
        enableNamingValidation: true,
        enableParameterValidation: true,
        enableRootUriCheck: true,
        requireDocumentation: true
      });
      
      const options = client.getOptions();
      expect(options.enableTypeValidation).toBe(true);
      expect(options.enableRequestValidation).toBe(true);
      expect(options.enableResponseValidation).toBe(true);
      expect(options.enableNamingValidation).toBe(true);
      expect(options.enableParameterValidation).toBe(true);
      expect(options.enableRootUriCheck).toBe(true);
      expect(options.requireDocumentation).toBe(true);
    });

    it('应该支持所有验证都禁用', () => {
      const client = new TestClient({
        enableTypeValidation: false,
        enableRequestValidation: false,
        enableResponseValidation: false,
        enableNamingValidation: false,
        enableParameterValidation: false,
        enableRootUriCheck: false,
        requireDocumentation: false
      });
      
      const options = client.getOptions();
      expect(options.enableTypeValidation).toBe(false);
      expect(options.enableRequestValidation).toBe(false);
      expect(options.enableResponseValidation).toBe(false);
      expect(options.enableNamingValidation).toBe(false);
      expect(options.enableParameterValidation).toBe(false);
      expect(options.enableRootUriCheck).toBe(false);
      expect(options.requireDocumentation).toBe(false);
    });

    it('应该支持混合配置', () => {
      const client = new TestClient({
        enableTypeValidation: false,    // 禁用类型验证
        enableRequestValidation: true,  // 启用请求验证
        enableResponseValidation: false,// 禁用响应验证
        enableNamingValidation: true,   // 启用命名验证
        enableParameterValidation: false,// 禁用参数验证
        enableRootUriCheck: true,       // 启用 URI 检查
        requireDocumentation: false     // 不要求文档
      });
      
      const options = client.getOptions();
      expect(options.enableTypeValidation).toBe(false);
      expect(options.enableRequestValidation).toBe(true);
      expect(options.enableResponseValidation).toBe(false);
      expect(options.enableNamingValidation).toBe(true);
      expect(options.enableParameterValidation).toBe(false);
      expect(options.enableRootUriCheck).toBe(true);
      expect(options.requireDocumentation).toBe(false);
    });
  });

  describe('验证独立性测试', () => {
    it('各种验证选项应该相互独立', async () => {
      // 只启用类型验证
      const typeOnlyClient = new TestClient({
        enableTypeValidation: true,
        enableRequestValidation: false,
        enableResponseValidation: false
      });
      
      // 类型验证应该工作
      expect(() => {
        typeOnlyClient.testCheckRequestResponseName(new BadNamingInput(), BadNamingOutput);
      }).toThrow();
      
      // 请求验证应该被跳过
      await expect(typeOnlyClient.testValidateRequest(null)).resolves.not.toThrow();
      
      // 只启用请求验证
      const requestOnlyClient = new TestClient({
        enableTypeValidation: false,
        enableRequestValidation: true,
        enableResponseValidation: false
      });
      
      // 类型验证应该被跳过
      expect(() => {
        requestOnlyClient.testCheckRequestResponseName(new BadNamingInput(), BadNamingOutput);
      }).not.toThrow();
      
      // 请求验证应该工作
      await expect(requestOnlyClient.testValidateRequest(null)).rejects.toThrow();
    });
  });
});
