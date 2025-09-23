/**
 * @RootUri 装饰器测试 - 确保原型链访问问题已修复
 */
import 'reflect-metadata';
import { HttpMethod } from 'openapi-ts-sdk';
import { 
  APIClient, 
  RootUri, 
  getRootUri,
  GET, 
  POST,
  Request, 
  ResponseType,
  APIOption 
} from '../../index';
import { MockHttpBuilder } from '../setup';

// 测试用的简单类型
class SimpleRequest {
  id?: string;
}

class SimpleResponse {
  success: boolean = true;
  message: string = 'OK';
}

describe('@RootUri 装饰器测试', () => {
  
  describe('🎯 核心功能：原型链访问修复', () => {
    
    it('✅ 应该能从原型链正确读取 @RootUri 设置的值', () => {
      @RootUri('/api/v1')
      class TestAPIClient extends APIClient {
        @GET('/users')
        async getUsers(
          @Request() request: SimpleRequest,
          @ResponseType() responseType: { new(): SimpleResponse },
          ...options: APIOption[]
        ): Promise<SimpleResponse> {
          throw new Error("Auto-generated method stub");
        }
      }
      
      const client = new TestAPIClient(new MockHttpBuilder());
      
      // 🎯 关键测试：getRootUri 应该能够从原型链读取值
      const rootUri = getRootUri(client);
      expect(rootUri).toBe('/api/v1');
    });
    
    it('✅ 应该支持不同的根路径值', () => {
      @RootUri('/api/v2')
      class V2APIClient extends APIClient {}
      
      @RootUri('/graphql')
      class GraphQLClient extends APIClient {}
      
      @RootUri('/')
      class RootOnlyClient extends APIClient {}
      
      expect(getRootUri(new V2APIClient(new MockHttpBuilder()))).toBe('/api/v2');
      expect(getRootUri(new GraphQLClient(new MockHttpBuilder()))).toBe('/graphql');
      expect(getRootUri(new RootOnlyClient(new MockHttpBuilder()))).toBe('/');
    });
  });
  
  describe('🔗 继承层级测试', () => {
    
    it('✅ 应该支持基类设置 @RootUri', () => {
      @RootUri('/api/base')
      class BaseAPIClient extends APIClient {}
      
      class DerivedAPIClient extends BaseAPIClient {
        @GET('/users')
        async getUsers(): Promise<any> { return {}; }
      }
      
      const client = new DerivedAPIClient(new MockHttpBuilder());
      const rootUri = getRootUri(client);
      
      expect(rootUri).toBe('/api/base');
    });
    
    it('✅ 应该支持派生类覆盖 @RootUri', () => {
      @RootUri('/api/base')
      class BaseAPIClient extends APIClient {}
      
      @RootUri('/api/derived')
      class DerivedAPIClient extends BaseAPIClient {}
      
      const client = new DerivedAPIClient(new MockHttpBuilder());
      const rootUri = getRootUri(client);
      
      // 应该返回派生类的值（最近的值）
      expect(rootUri).toBe('/api/derived');
    });
    
    it('✅ 应该支持多层继承', () => {
      @RootUri('/api/level1')
      class Level1Client extends APIClient {}
      
      class Level2Client extends Level1Client {}
      
      @RootUri('/api/level3')
      class Level3Client extends Level2Client {}
      
      expect(getRootUri(new Level1Client(new MockHttpBuilder()))).toBe('/api/level1');
      expect(getRootUri(new Level2Client(new MockHttpBuilder()))).toBe('/api/level1');
      expect(getRootUri(new Level3Client(new MockHttpBuilder()))).toBe('/api/level3');
    });
  });
  
  describe('🛡️ 边界情况测试', () => {
    
    it('✅ 没有 @RootUri 装饰器时应该返回 undefined', () => {
      class NoRootUriClient extends APIClient {}
      
      const client = new NoRootUriClient(new MockHttpBuilder());
      const rootUri = getRootUri(client);
      
      expect(rootUri).toBeUndefined();
    });
    
    it('✅ 最小有效路径 @RootUri 应该正确处理', () => {
      @RootUri('/')
      class MinimalRootUriClient extends APIClient {}
      
      const client = new MinimalRootUriClient(new MockHttpBuilder());
      const rootUri = getRootUri(client);
      
      expect(rootUri).toBe('/');
    });
    
    it('✅ 复杂路径 @RootUri 应该正确处理', () => {
      @RootUri('/api/v1/complex/path')
      class ComplexPathClient extends APIClient {}
      
      const client = new ComplexPathClient(new MockHttpBuilder());
      const rootUri = getRootUri(client);
      
      expect(rootUri).toBe('/api/v1/complex/path');
    });
    
    it('✅ 应该处理特殊字符和编码', () => {
      @RootUri('/api/测试/v1')
      class UnicodePathClient extends APIClient {}
      
      const client = new UnicodePathClient(new MockHttpBuilder());
      const rootUri = getRootUri(client);
      
      expect(rootUri).toBe('/api/测试/v1');
    });
  });
  
  describe('🧪 集成测试：与 URI 构建器配合', () => {
    
    it('✅ 应该与 APIClient.executeRequest 正确集成', async () => {
      @RootUri('/api/v1')
      class IntegrationTestClient extends APIClient {
        @POST('/test')
        async testMethod(
          @Request() request: SimpleRequest,
          @ResponseType() responseType: { new(): SimpleResponse },
          ...options: APIOption[]
        ): Promise<SimpleResponse> {
          throw new Error("Auto-generated method stub");
        }
        
        // 暴露 executeRequest 方法用于测试
        async testExecuteRequest() {
          const request = new SimpleRequest();
          return this.executeRequest(HttpMethod.POST, '/test', request, SimpleResponse, []);
        }
      }
      
      // 创建能够捕获 URI 的 Mock HttpBuilder
      class URICapturingHttpBuilder extends MockHttpBuilder {
        capturedUri: string = '';
        
        setUri(uri: string) {
          this.capturedUri = uri;
          return super.setUri(uri);
        }
      }
      
      const mockBuilder = new URICapturingHttpBuilder();
      const client = new IntegrationTestClient(mockBuilder);
      
      try {
        await client.testExecuteRequest();
      } catch (error) {
        // 忽略执行错误，我们只关心 URI 构建
      }
      
      // 验证 URI 正确拼接了根路径
      expect(mockBuilder.capturedUri).toBe('/api/v1/test');
    });
  });
  
  describe('🔄 回归测试：确保修复的问题不再出现', () => {
    
    it('🐛 回归测试：修复前 getRootUri 返回 undefined 的问题', () => {
      @RootUri('/api/regression-test')
      class RegressionTestClient extends APIClient {}
      
      const client = new RegressionTestClient(new MockHttpBuilder());
      
      // 这是修复前会失败的测试
      const rootUri = getRootUri(client);
      
      // 修复后应该能正确返回值，而不是 undefined
      expect(rootUri).not.toBeUndefined();
      expect(rootUri).toBe('/api/regression-test');
    });
    
    it('🔍 验证原型链访问路径', () => {
      @RootUri('/api/prototype-test')
      class PrototypeTestClient extends APIClient {}
      
      const client = new PrototypeTestClient(new MockHttpBuilder());
      const ROOT_URI_KEY = '__openapi_ts_sdk_decorator_rootUri';
      
      // 验证核心功能：getRootUri 能正确读取
      expect((client.constructor.prototype as any)[ROOT_URI_KEY]).toBe('/api/prototype-test'); // 原型上有值
      expect(getRootUri(client)).toBe('/api/prototype-test'); // getRootUri 能正确读取
    });
  });
  
  describe('📊 性能测试', () => {
    
    it('✅ getRootUri 应该有良好的性能', () => {
      @RootUri('/api/performance')
      class PerformanceTestClient extends APIClient {}
      
      const client = new PerformanceTestClient(new MockHttpBuilder());
      
      const startTime = performance.now();
      
      // 执行多次调用
      for (let i = 0; i < 1000; i++) {
        getRootUri(client);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 1000次调用应该在合理时间内完成（小于100ms）
      expect(duration).toBeLessThan(100);
    });
  });
});
