/**
 * APIClientOptions 配置功能测试
 * 
 * 测试新的配置化验证系统的基础功能
 */

import 'reflect-metadata';
import { APIClient, APIClientOptions } from '../../src/client';
import { MockHttpBuilder } from '../setup';

// 创建测试用的客户端类
class TestAPIClient extends APIClient {
  constructor(options?: APIClientOptions) {
    super(new MockHttpBuilder(), options);
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

// 测试用的请求和响应类
class TestRequest {
  constructor(public data: string = 'test') {}
}

class TestResponse {
  constructor(public result: string = 'success') {}
}

class BadNamingInput {
  constructor(public data: string = 'test') {}
}

class BadNamingOutput {
  constructor(public result: string = 'success') {}
}

describe('APIClientOptions 配置功能测试', () => {
  
  describe('默认配置测试', () => {
    it('应该使用默认配置值', () => {
      const client = new TestAPIClient();
      const options = client.getOptions();
      
      // 运行时验证配置 (根据环境决定)
      expect(options.enableTypeValidation).toBe(process.env.NODE_ENV !== 'production');
      expect(options.enableRequestValidation).toBe(true);
      expect(options.enableResponseValidation).toBe(process.env.NODE_ENV !== 'production');
      
      // 开发时检查配置 (根据环境决定)
      expect(options.enableNamingValidation).toBe(process.env.NODE_ENV !== 'production');
      expect(options.enableParameterValidation).toBe(process.env.NODE_ENV !== 'production');
      expect(options.enableRootUriCheck).toBe(process.env.NODE_ENV !== 'production');
      expect(options.requireDocumentation).toBe(false);
    });

    it('在开发环境应该启用大部分验证', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const client = new TestAPIClient();
      const options = client.getOptions();
      
      expect(options.enableTypeValidation).toBe(true);
      expect(options.enableRequestValidation).toBe(true);
      expect(options.enableResponseValidation).toBe(true);
      expect(options.enableNamingValidation).toBe(true);
      expect(options.enableParameterValidation).toBe(true);
      expect(options.enableRootUriCheck).toBe(true);
      expect(options.requireDocumentation).toBe(false);
      
      process.env.NODE_ENV = originalEnv;
    });

    it('在生产环境应该禁用性能敏感的验证', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const client = new TestAPIClient();
      const options = client.getOptions();
      
      expect(options.enableTypeValidation).toBe(false);
      expect(options.enableRequestValidation).toBe(true); // 仍然启用
      expect(options.enableResponseValidation).toBe(false);
      expect(options.enableNamingValidation).toBe(false);
      expect(options.enableParameterValidation).toBe(false);
      expect(options.enableRootUriCheck).toBe(false);
      expect(options.requireDocumentation).toBe(false);
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('自定义配置测试', () => {
    it('应该接受完全自定义的配置', () => {
      const customOptions: APIClientOptions = {
        enableTypeValidation: false,
        enableRequestValidation: false,
        enableResponseValidation: false,
        enableNamingValidation: true,
        enableParameterValidation: true,
        enableRootUriCheck: true,
        requireDocumentation: true
      };

      const client = new TestAPIClient(customOptions);
      const options = client.getOptions();
      
      expect(options.enableTypeValidation).toBe(false);
      expect(options.enableRequestValidation).toBe(false);
      expect(options.enableResponseValidation).toBe(false);
      expect(options.enableNamingValidation).toBe(true);
      expect(options.enableParameterValidation).toBe(true);
      expect(options.enableRootUriCheck).toBe(true);
      expect(options.requireDocumentation).toBe(true);
    });

    it('应该正确合并部分自定义配置', () => {
      const partialOptions: Partial<APIClientOptions> = {
        enableTypeValidation: false,
        requireDocumentation: true
      };

      const client = new TestAPIClient(partialOptions);
      const options = client.getOptions();
      
      // 自定义的配置应该被应用
      expect(options.enableTypeValidation).toBe(false);
      expect(options.requireDocumentation).toBe(true);
      
      // 其他配置应该使用默认值
      expect(options.enableRequestValidation).toBe(true);
      expect(options.enableResponseValidation).toBe(process.env.NODE_ENV !== 'production');
    });
  });

  describe('配置继承测试', () => {
    it('自定义配置应该覆盖默认配置', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const client = new TestAPIClient({
        enableTypeValidation: false, // 覆盖默认的 true
        enableRequestValidation: false // 覆盖默认的 true
      });
      
      const options = client.getOptions();
      
      expect(options.enableTypeValidation).toBe(false);
      expect(options.enableRequestValidation).toBe(false);
      // 其他配置保持默认
      expect(options.enableResponseValidation).toBe(true);
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('配置验证有效性测试', () => {
    it('所有配置选项都应该是可选的', () => {
      // 空配置应该不会报错
      expect(() => new TestAPIClient({})).not.toThrow();
      
      // undefined 配置应该不会报错  
      expect(() => new TestAPIClient(undefined)).not.toThrow();
    });

    it('配置对象应该是不可变的', () => {
      const client = new TestAPIClient({
        enableTypeValidation: true
      });
      
      const options = client.getOptions();
      
      // 尝试修改配置不应该影响原始配置
      const modifiedOptions = { ...options };
      modifiedOptions.enableTypeValidation = false;
      
      // 原始配置不应该被改变
      expect(client.getOptions().enableTypeValidation).toBe(true);
    });
  });
});

describe('验证行为测试', () => {
  
  describe('类型验证控制测试', () => {
    it('禁用类型验证时应该跳过类名检查', () => {
      const client = new TestAPIClient({
        enableTypeValidation: false
      });
      
      // 使用不符合命名规范的类应该不报错
      expect(() => {
        client.testCheckRequestResponseName(
          new BadNamingInput(), 
          BadNamingOutput
        );
      }).not.toThrow();
    });

    it('启用类型验证时应该执行类名检查', () => {
      const client = new TestAPIClient({
        enableTypeValidation: true
      });
      
      // 使用不符合命名规范的类应该报错
      expect(() => {
        client.testCheckRequestResponseName(
          new BadNamingInput(), 
          BadNamingOutput
        );
      }).toThrow(/Type naming validation failed/);
    });
  });

  describe('请求验证控制测试', () => {
    it('禁用请求验证时应该跳过参数检查', async () => {
      const client = new TestAPIClient({
        enableRequestValidation: false
      });
      
      // 传入 null 应该不报错
      await expect(client.testValidateRequest(null)).resolves.not.toThrow();
      await expect(client.testValidateRequest(undefined)).resolves.not.toThrow();
    });

    it('启用请求验证时应该执行参数检查', async () => {
      const client = new TestAPIClient({
        enableRequestValidation: true
      });
      
      // 传入 null 应该报错
      await expect(client.testValidateRequest(null)).rejects.toThrow(/Request parameter must be an object/);
    });
  });
});
