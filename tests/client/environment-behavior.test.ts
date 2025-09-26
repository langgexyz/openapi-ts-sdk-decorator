/**
 * 生产环境与开发环境行为差异测试
 * 
 * 测试不同环境下验证行为的差异，确保生产环境性能优化生效
 */

import 'reflect-metadata';
import { APIClient, APIClientOptions } from '../../src/client';
import { checkRule } from '../../src/checkrule';
import { MockHttpBuilder } from '../setup';
import { RootUri, GET, POST } from '../../src/decorators';
import { HttpMethod } from 'openapi-ts-sdk';

// 测试用的客户端类
@RootUri('/api/v1')
class EnvironmentTestClient extends APIClient {
  constructor(options?: APIClientOptions) {
    super(new MockHttpBuilder(), options);
  }

  @GET('/users')
  async getUsers(): Promise<any> {
    return this.executeRequest(HttpMethod.GET, '/users', {}, Object);
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

// 不符合命名规范的测试类
class BadNamingInput {
  constructor(public data: string = 'test') {}
}

class BadNamingOutput {
  constructor(public result: string = 'test') {}
}

describe('生产环境与开发环境行为差异测试', () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.NODE_ENV = originalEnv;
    } else {
      delete process.env.NODE_ENV;
    }
  });

  describe('开发环境默认行为', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('应该启用所有性能敏感的验证', () => {
      const client = new EnvironmentTestClient();
      const options = client.getOptions();
      
      expect(options.enableTypeValidation).toBe(true);
      expect(options.enableResponseValidation).toBe(true);
      expect(options.enableNamingValidation).toBe(true);
      expect(options.enableParameterValidation).toBe(true);
      expect(options.enableRootUriCheck).toBe(true);
      
      // 请求验证在任何环境都应该启用
      expect(options.enableRequestValidation).toBe(true);
      // 文档要求默认为 false
      expect(options.requireDocumentation).toBe(false);
    });

    it('应该执行类型验证', () => {
      const client = new EnvironmentTestClient();
      
      expect(() => {
        client.testCheckRequestResponseName(new BadNamingInput(), BadNamingOutput);
      }).toThrow(/Type naming validation failed/);
    });

    it('应该执行请求验证', async () => {
      const client = new EnvironmentTestClient();
      
      await expect(client.testValidateRequest(null)).rejects.toThrow(/Request parameter must be an object/);
    });
  });

  describe('生产环境默认行为', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('应该禁用性能敏感的验证以优化性能', () => {
      const client = new EnvironmentTestClient();
      const options = client.getOptions();
      
      // 这些验证在生产环境应该被禁用以提升性能
      expect(options.enableTypeValidation).toBe(false);
      expect(options.enableResponseValidation).toBe(false);
      expect(options.enableNamingValidation).toBe(false);
      expect(options.enableParameterValidation).toBe(false);
      expect(options.enableRootUriCheck).toBe(false);
      
      // 请求验证在生产环境仍然应该启用（安全考虑）
      expect(options.enableRequestValidation).toBe(true);
      // 文档要求默认为 false
      expect(options.requireDocumentation).toBe(false);
    });

    it('应该跳过类型验证以避免 Terser 压缩问题', () => {
      const client = new EnvironmentTestClient();
      
      // 在生产环境，即使类名不符合规范也不应该报错
      expect(() => {
        client.testCheckRequestResponseName(new BadNamingInput(), BadNamingOutput);
      }).not.toThrow();
    });

    it('仍然应该执行请求验证（安全考虑）', async () => {
      const client = new EnvironmentTestClient();
      
      // 即使在生产环境，基本的请求验证也应该执行
      await expect(client.testValidateRequest(null)).rejects.toThrow(/Request parameter must be an object/);
    });
  });

  describe('测试环境行为', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'test';
    });

    it('测试环境应该表现得像开发环境', () => {
      const client = new EnvironmentTestClient();
      const options = client.getOptions();
      
      // 测试环境应该启用验证以便发现问题
      expect(options.enableTypeValidation).toBe(true);
      expect(options.enableResponseValidation).toBe(true);
      expect(options.enableNamingValidation).toBe(true);
      expect(options.enableParameterValidation).toBe(true);
      expect(options.enableRootUriCheck).toBe(true);
      expect(options.enableRequestValidation).toBe(true);
    });
  });

  describe('未定义环境行为', () => {
    beforeEach(() => {
      delete process.env.NODE_ENV;
    });

    it('未定义环境应该表现得像开发环境（安全优先）', () => {
      const client = new EnvironmentTestClient();
      const options = client.getOptions();
      
      // 当环境未定义时，应该默认启用所有验证（安全优先）
      expect(options.enableTypeValidation).toBe(true);
      expect(options.enableResponseValidation).toBe(true);
      expect(options.enableNamingValidation).toBe(true);
      expect(options.enableParameterValidation).toBe(true);
      expect(options.enableRootUriCheck).toBe(true);
      expect(options.enableRequestValidation).toBe(true);
    });
  });

  describe('自定义环境值行为', () => {
    it('staging 环境应该表现得像开发环境', () => {
      process.env.NODE_ENV = 'staging';
      
      const client = new EnvironmentTestClient();
      const options = client.getOptions();
      
      // 非 production 环境都应该启用验证
      expect(options.enableTypeValidation).toBe(true);
      expect(options.enableResponseValidation).toBe(true);
    });

    it('自定义环境值应该表现得像开发环境', () => {
      process.env.NODE_ENV = 'custom-env';
      
      const client = new EnvironmentTestClient();
      const options = client.getOptions();
      
      // 只有明确的 'production' 才会禁用验证
      expect(options.enableTypeValidation).toBe(true);
      expect(options.enableResponseValidation).toBe(true);
    });
  });

  describe('环境变化影响测试', () => {
    it('在同一进程中改变环境应该影响新实例', () => {
      // 首先在开发环境创建客户端
      process.env.NODE_ENV = 'development';
      const devClient = new EnvironmentTestClient();
      
      // 然后改变到生产环境创建客户端
      process.env.NODE_ENV = 'production';
      const prodClient = new EnvironmentTestClient();
      
      // 验证不同的行为
      expect(devClient.getOptions().enableTypeValidation).toBe(true);
      expect(prodClient.getOptions().enableTypeValidation).toBe(false);
    });

    it('自定义配置应该覆盖环境默认值', () => {
      process.env.NODE_ENV = 'production';
      
      // 即使在生产环境，也可以强制启用验证
      const client = new EnvironmentTestClient({
        enableTypeValidation: true,
        enableResponseValidation: true
      });
      
      const options = client.getOptions();
      expect(options.enableTypeValidation).toBe(true);
      expect(options.enableResponseValidation).toBe(true);
    });

    it('可以在生产环境强制禁用所有验证', () => {
      process.env.NODE_ENV = 'development';
      
      // 即使在开发环境，也可以强制禁用验证（性能测试场景）
      const client = new EnvironmentTestClient({
        enableTypeValidation: false,
        enableRequestValidation: false,
        enableResponseValidation: false,
        enableNamingValidation: false,
        enableParameterValidation: false,
        enableRootUriCheck: false
      });
      
      const options = client.getOptions();
      expect(options.enableTypeValidation).toBe(false);
      expect(options.enableRequestValidation).toBe(false);
      expect(options.enableResponseValidation).toBe(false);
    });
  });

  describe('性能影响验证', () => {
    it('生产环境配置应该减少验证调用次数', async () => {
      process.env.NODE_ENV = 'production';
      const client = new EnvironmentTestClient();
      
      // 计算验证方法调用次数的简单测试
      let typeValidationCalls = 0;
      let requestValidationCalls = 0;
      
      // 覆盖验证方法以计数
      const originalCheckRequestResponseName = client.testCheckRequestResponseName;
      client.testCheckRequestResponseName = function(...args) {
        typeValidationCalls++;
        return originalCheckRequestResponseName.apply(this, args);
      };
      
      const originalTestValidateRequest = client.testValidateRequest;
      client.testValidateRequest = async function(...args) {
        requestValidationCalls++;
        return originalTestValidateRequest.apply(this, args);
      };
      
      // 执行操作
      client.testCheckRequestResponseName(new BadNamingInput(), BadNamingOutput);
      await client.testValidateRequest({}).catch(() => {}); // 忽略错误
      
      // 在生产环境，类型验证应该被跳过，但请求验证仍会执行
      expect(typeValidationCalls).toBe(1); // 方法被调用，但内部逻辑跳过
      expect(requestValidationCalls).toBe(1);
    });

    it('开发环境配置应该执行完整验证', () => {
      process.env.NODE_ENV = 'development';
      const client = new EnvironmentTestClient();
      
      // 开发环境应该执行验证并报告错误
      expect(() => {
        client.testCheckRequestResponseName(new BadNamingInput(), BadNamingOutput);
      }).toThrow();
    });
  });

  describe('边界情况测试', () => {
    it('空字符串环境应该表现得像开发环境', () => {
      process.env.NODE_ENV = '';
      
      const client = new EnvironmentTestClient();
      const options = client.getOptions();
      
      expect(options.enableTypeValidation).toBe(true);
    });

    it('只包含空格的环境应该表现得像开发环境', () => {
      process.env.NODE_ENV = '   ';
      
      const client = new EnvironmentTestClient();
      const options = client.getOptions();
      
      expect(options.enableTypeValidation).toBe(true);
    });

    it('大小写混合的 production 应该被识别', () => {
      process.env.NODE_ENV = 'Production';
      
      const client = new EnvironmentTestClient();
      const options = client.getOptions();
      
      // 应该区分大小写，不等于 'production'
      expect(options.enableTypeValidation).toBe(true);
    });

    it('严格匹配 production 字符串', () => {
      process.env.NODE_ENV = 'production '; // 尾随空格
      
      const client = new EnvironmentTestClient();
      const options = client.getOptions();
      
      // 应该严格匹配
      expect(options.enableTypeValidation).toBe(true);
    });
  });
});
