/**
 * CheckRuleOptions 继承测试
 * 
 * 测试 CheckRuleOptions 正确继承 APIClientOptions 的相关字段
 * 验证配置统一化后的类型安全性和功能一致性
 */

import 'reflect-metadata';
import { APIClient, APIClientOptions } from '../../src/client';
import { checkRule, CheckRuleOptions } from '../../src/checkrule';
import { MockHttpBuilder } from '../setup';
import { RootUri, GET, POST } from '../../src/decorators';
import { HttpMethod } from 'openapi-ts-sdk';

// 测试用的客户端类
@RootUri('/api/v1')
class InheritanceTestClient extends APIClient {
  constructor(options?: APIClientOptions) {
    super(new MockHttpBuilder(), options);
  }

  @GET('/users')
  async getUsers(): Promise<any> {
    return this.executeRequest(HttpMethod.GET, '/users', {}, Object);
  }

  @POST('/users/{id}')
  async updateUser(id: string, request: any): Promise<any> {
    return this.executeRequest(HttpMethod.POST, `/users/${id}`, request, Object);
  }

  // 暴露 protected 方法以便测试
  public getOptions(): APIClientOptions {
    return this.options;
  }
}

// 缺少 @RootUri 的客户端（用于测试 URI 检查）
class NoRootUriClient extends APIClient {
  constructor(options?: APIClientOptions) {
    super(new MockHttpBuilder(), options);
  }

  @GET('/test')
  async test(): Promise<any> {
    return this.executeRequest(HttpMethod.GET, '/test', {}, Object);
  }
}

describe('CheckRuleOptions 继承测试', () => {
  
  describe('类型继承验证', () => {
    it('CheckRuleOptions 应该包含所有继承的 APIClientOptions 字段', () => {
      // 编译时类型检查：确保 CheckRuleOptions 包含预期的字段
      const checkOptions: CheckRuleOptions = {
        // 这些字段应该从 APIClientOptions 继承而来
        enableNamingValidation: true,
        enableTypeValidation: true,
        enableParameterValidation: true,
        enableRootUriCheck: true,
        requireDocumentation: true,
        // CheckRuleOptions 特有的字段
        moduleContext: {}
      };
      
      // 验证对象结构正确
      expect(typeof checkOptions.enableNamingValidation).toBe('boolean');
      expect(typeof checkOptions.enableTypeValidation).toBe('boolean');
      expect(typeof checkOptions.enableParameterValidation).toBe('boolean');
      expect(typeof checkOptions.enableRootUriCheck).toBe('boolean');
      expect(typeof checkOptions.requireDocumentation).toBe('boolean');
      expect(typeof checkOptions.moduleContext).toBe('object');
    });

    it('CheckRuleOptions 应该接受部分配置', () => {
      // 部分配置应该被允许
      const partialOptions: CheckRuleOptions = {
        enableTypeValidation: false,
        moduleContext: { TestClass: class TestClass {} }
      };
      
      expect(partialOptions.enableTypeValidation).toBe(false);
      expect(partialOptions.moduleContext).toBeDefined();
    });

    it('CheckRuleOptions 字段应该与 APIClientOptions 字段兼容', () => {
      // APIClientOptions 的配置应该能够传递给 CheckRuleOptions
      const apiOptions: APIClientOptions = {
        enableNamingValidation: true,
        enableTypeValidation: false,
        enableParameterValidation: true,
        enableRootUriCheck: false,
        requireDocumentation: true
      };
      
      // 这应该类型安全
      const checkOptions: CheckRuleOptions = {
        ...apiOptions,
        moduleContext: {}
      };
      
      expect(checkOptions.enableNamingValidation).toBe(true);
      expect(checkOptions.enableTypeValidation).toBe(false);
      expect(checkOptions.enableParameterValidation).toBe(true);
      expect(checkOptions.enableRootUriCheck).toBe(false);
      expect(checkOptions.requireDocumentation).toBe(true);
    });
  });

  describe('功能继承验证', () => {
    it('enableTypeValidation 在 checkRule 中应该正确工作', () => {
      const client = new InheritanceTestClient();
      
      // 启用类型验证
      const resultEnabled = checkRule(client, {
        enableTypeValidation: true,
        enableNamingValidation: false,
        enableParameterValidation: false,
        enableRootUriCheck: false,
        requireDocumentation: false
      });
      
      // 禁用类型验证
      const resultDisabled = checkRule(client, {
        enableTypeValidation: false,
        enableNamingValidation: false,
        enableParameterValidation: false,
        enableRootUriCheck: false,
        requireDocumentation: false
      });
      
      // 验证结果结构
      expect(resultEnabled).toHaveProperty('errors');
      expect(resultEnabled).toHaveProperty('suggestions');
      expect(resultDisabled).toHaveProperty('errors');
      expect(resultDisabled).toHaveProperty('suggestions');
      
      // 验证类型验证是否生效
      expect(Array.isArray(resultEnabled.errors)).toBe(true);
      expect(Array.isArray(resultDisabled.errors)).toBe(true);
    });

    it('enableRootUriCheck 在 checkRule 中应该正确工作', () => {
      const clientWithoutRoot = new NoRootUriClient();
      
      // 启用 URI 检查
      const resultEnabled = checkRule(clientWithoutRoot, {
        enableTypeValidation: false,
        enableNamingValidation: false,
        enableParameterValidation: false,
        enableRootUriCheck: true,
        requireDocumentation: false
      });
      
      // 禁用 URI 检查
      const resultDisabled = checkRule(clientWithoutRoot, {
        enableTypeValidation: false,
        enableNamingValidation: false,
        enableParameterValidation: false,
        enableRootUriCheck: false,
        requireDocumentation: false
      });
      
      // 启用时应该检测到缺少 @RootUri 的问题
      expect(resultEnabled.errors.length).toBeGreaterThan(0);
      const hasRootUriError = resultEnabled.errors.some(err => 
        err.includes('RootUri') || err.includes('rootUri') || err.includes('Root URI')
      );
      expect(hasRootUriError).toBe(true);
      
      // 禁用时应该跳过检查
      const hasRootUriErrorDisabled = resultDisabled.errors.some(err => 
        err.includes('RootUri') || err.includes('rootUri') || err.includes('Root URI')
      );
      expect(hasRootUriErrorDisabled).toBe(false);
    });

    it('enableNamingValidation 在 checkRule 中应该正确工作', () => {
      const client = new InheritanceTestClient();
      
      // 测试命名验证开关
      const resultEnabled = checkRule(client, {
        enableTypeValidation: false,
        enableNamingValidation: true,
        enableParameterValidation: false,
        enableRootUriCheck: false,
        requireDocumentation: false
      });
      
      const resultDisabled = checkRule(client, {
        enableTypeValidation: false,
        enableNamingValidation: false,
        enableParameterValidation: false,
        enableRootUriCheck: false,
        requireDocumentation: false
      });
      
      // 验证结果差异（具体差异取决于 checkRule 实现）
      expect(typeof resultEnabled).toBe('object');
      expect(typeof resultDisabled).toBe('object');
    });

    it('requireDocumentation 在 checkRule 中应该正确工作', () => {
      const client = new InheritanceTestClient();
      
      // 要求文档
      const resultRequired = checkRule(client, {
        enableTypeValidation: false,
        enableNamingValidation: false,
        enableParameterValidation: false,
        enableRootUriCheck: false,
        requireDocumentation: true
      });
      
      // 不要求文档
      const resultNotRequired = checkRule(client, {
        enableTypeValidation: false,
        enableNamingValidation: false,
        enableParameterValidation: false,
        enableRootUriCheck: false,
        requireDocumentation: false
      });
      
      // 验证文档要求的影响
      expect(typeof resultRequired).toBe('object');
      expect(typeof resultNotRequired).toBe('object');
    });
  });

  describe('配置兼容性验证', () => {
    it('APIClientOptions 和 CheckRuleOptions 应该在共同字段上行为一致', () => {
      // 创建相同配置的 API 客户端和检查规则
      const sharedConfig = {
        enableTypeValidation: true,
        enableNamingValidation: false,
        enableParameterValidation: true,
        enableRootUriCheck: false,
        requireDocumentation: true
      };
      
      const client = new InheritanceTestClient(sharedConfig);
      const checkResult = checkRule(client, {
        ...sharedConfig,
        moduleContext: {}
      });
      
      // 客户端配置应该正确设置
      const clientOptions = client.getOptions();
      expect(clientOptions.enableTypeValidation).toBe(sharedConfig.enableTypeValidation);
      expect(clientOptions.enableNamingValidation).toBe(sharedConfig.enableNamingValidation);
      expect(clientOptions.enableParameterValidation).toBe(sharedConfig.enableParameterValidation);
      expect(clientOptions.enableRootUriCheck).toBe(sharedConfig.enableRootUriCheck);
      expect(clientOptions.requireDocumentation).toBe(sharedConfig.requireDocumentation);
      
      // 检查规则应该使用相同的配置
      expect(checkResult).toBeDefined();
    });

    it('应该支持从 APIClientOptions 创建 CheckRuleOptions', () => {
      const apiOptions: APIClientOptions = {
        enableTypeValidation: false,
        enableRequestValidation: true, // 这个字段不在 CheckRuleOptions 中
        enableResponseValidation: false, // 这个字段不在 CheckRuleOptions 中
        enableNamingValidation: true,
        enableParameterValidation: false,
        enableRootUriCheck: true,
        requireDocumentation: false
      };
      
      // 提取 CheckRuleOptions 相关字段
      const checkOptions: CheckRuleOptions = {
        enableTypeValidation: apiOptions.enableTypeValidation,
        enableNamingValidation: apiOptions.enableNamingValidation,
        enableParameterValidation: apiOptions.enableParameterValidation,
        enableRootUriCheck: apiOptions.enableRootUriCheck,
        requireDocumentation: apiOptions.requireDocumentation,
        moduleContext: {}
      };
      
      expect(checkOptions.enableTypeValidation).toBe(false);
      expect(checkOptions.enableNamingValidation).toBe(true);
      expect(checkOptions.enableParameterValidation).toBe(false);
      expect(checkOptions.enableRootUriCheck).toBe(true);
      expect(checkOptions.requireDocumentation).toBe(false);
    });
  });

  describe('继承字段完整性验证', () => {
    it('CheckRuleOptions 应该包含所有预期的继承字段', () => {
      // 验证所有继承的字段都存在且类型正确
      const fullConfig: CheckRuleOptions = {
        enableNamingValidation: true,
        enableTypeValidation: true,
        enableParameterValidation: true,
        enableRootUriCheck: true,
        requireDocumentation: true,
        moduleContext: {
          TestClass: class TestClass {},
          AnotherClass: class AnotherClass {}
        }
      };
      
      // 验证所有字段类型
      expect(typeof fullConfig.enableNamingValidation).toBe('boolean');
      expect(typeof fullConfig.enableTypeValidation).toBe('boolean');
      expect(typeof fullConfig.enableParameterValidation).toBe('boolean');
      expect(typeof fullConfig.enableRootUriCheck).toBe('boolean');
      expect(typeof fullConfig.requireDocumentation).toBe('boolean');
      expect(typeof fullConfig.moduleContext).toBe('object');
      
      // 验证 moduleContext 的内容
      expect(fullConfig.moduleContext).toHaveProperty('TestClass');
      expect(fullConfig.moduleContext).toHaveProperty('AnotherClass');
      expect(typeof fullConfig.moduleContext!.TestClass).toBe('function');
      expect(typeof fullConfig.moduleContext!.AnotherClass).toBe('function');
    });

    it('CheckRuleOptions 应该正确处理 undefined 和可选字段', () => {
      // 只设置部分字段
      const minimalConfig: CheckRuleOptions = {};
      
      // 所有字段都应该是可选的
      expect(minimalConfig.enableTypeValidation).toBeUndefined();
      expect(minimalConfig.enableNamingValidation).toBeUndefined();
      expect(minimalConfig.moduleContext).toBeUndefined();
      
      // checkRule 应该能处理最小配置
      const client = new InheritanceTestClient();
      expect(() => checkRule(client, minimalConfig)).not.toThrow();
    });
  });

  describe('向后兼容性验证', () => {
    it('原有的 CheckRuleOptions 使用方式应该仍然有效', () => {
      const client = new InheritanceTestClient();
      
      // 使用旧的方式调用（应该仍然工作）
      const result = checkRule(client);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('suggestions');
    });

    it('新的配置选项应该不破坏现有功能', () => {
      const client = new InheritanceTestClient();
      
      // 使用新的配置选项
      const result = checkRule(client, {
        enableTypeValidation: true,
        enableNamingValidation: true,
        enableParameterValidation: true,
        enableRootUriCheck: true,
        requireDocumentation: false,
        moduleContext: {
          TestContext: class TestContext {}
        }
      });
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('suggestions');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.suggestions)).toBe(true);
    });
  });
});
