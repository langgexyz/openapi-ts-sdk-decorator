import 'reflect-metadata';
import { APIClient, GET, POST, Param, Query, Request, ResponseType, Options, APIOption } from '../../index';
import { MockHttpBuilder } from '../setup';

describe('@Query 装饰器测试', () => {
  
  // 测试类型定义
  interface GetUsersRequest {
    includeProfile?: boolean;
  }

  class GetUsersResponse {
    users!: any[];
    total!: number;
    
    constructor(data?: any) {
      if (data) Object.assign(this, data);
    }
  }

  interface SearchRequest {
    filters?: any;
  }

  class SearchResponse {
    results!: any[];
    
    constructor(data?: any) {
      if (data) Object.assign(this, data);
    }
  }

  class TestAPIClient extends APIClient {
    constructor() {
      super(new MockHttpBuilder());
    }

    // ✅ 路径参数 + 查询参数组合
    @GET('/users/{category}')
    async getUsers(
      @Param('category') category: string,
      @Query() query: Record<string, string>,
      @Request() request: GetUsersRequest,
      @ResponseType() responseType: { new (...args: any[]): GetUsersResponse },
      @Options() ...options: APIOption[]
    ): Promise<GetUsersResponse> {
      throw new Error("Auto-generated method stub");
    }

    // ✅ 只有查询参数
    @GET('/search')
    async search(
      @Query() query: Record<string, string>,
      @Request() request: SearchRequest,
      @ResponseType() responseType: { new (...args: any[]): SearchResponse },
      @Options() ...options: APIOption[]
    ): Promise<SearchResponse> {
      throw new Error("Auto-generated method stub");
    }

    // ✅ 多种参数组合
    @POST('/users/{userId}/analyze')
    async analyzeUser(
      @Param('userId') userId: string,
      @Query() query: Record<string, string>,
      @Request() request: any,
      @ResponseType() responseType: { new (...args: any[]): any },
      @Options() ...options: APIOption[]
    ): Promise<any> {
      throw new Error("Auto-generated method stub");
    }
  }

  it('应该成功创建带有 @Query 装饰器的客户端', () => {
    expect(() => {
      const client = new TestAPIClient();
    }).not.toThrow();
  });

  it('应该正确收集 @Query 装饰器的元数据', () => {
    const client = new TestAPIClient();
    
    // 检查 search 方法的参数元数据
    const searchParamMeta = Reflect.getMetadata('__openapi_ts_sdk_decorator_paramMetadata', client, 'search');
    expect(searchParamMeta).toBeDefined();
    
    // 验证查询参数装饰器
    const queryMeta = Object.values(searchParamMeta).find((m: any) => m.type === 'query');
    expect(queryMeta).toBeDefined();
    expect((queryMeta as any).type).toBe('query');
  });

  it('应该支持路径参数和查询参数的组合', () => {
    const client = new TestAPIClient();
    
    // 检查 getUsers 方法的参数元数据
    const getUsersParamMeta = Reflect.getMetadata('__openapi_ts_sdk_decorator_paramMetadata', client, 'getUsers');
    expect(getUsersParamMeta).toBeDefined();
    
    // 应该同时有 @Param 和 @Query 装饰器
    const paramMeta = Object.values(getUsersParamMeta).find((m: any) => m.type === 'param');
    const queryMeta = Object.values(getUsersParamMeta).find((m: any) => m.type === 'query');
    const requestMeta = Object.values(getUsersParamMeta).find((m: any) => m.type === 'request');
    const responseTypeMeta = Object.values(getUsersParamMeta).find((m: any) => m.type === 'responseType');
    
    expect(paramMeta).toBeDefined();
    expect(queryMeta).toBeDefined();
    expect(requestMeta).toBeDefined();
    expect(responseTypeMeta).toBeDefined();
    
    // 验证路径参数名
    expect((paramMeta as any).paramName).toBe('category');
  });

  it('应该收集所有方法的元数据', () => {
    const client = new TestAPIClient();
    const allMetadata = (client.constructor as any).__openapi_ts_sdk_decorator_apiMethods;
    
    expect(allMetadata).toBeDefined();
    expect(allMetadata.length).toBe(3);
    
    // 验证方法元数据
    const methods = allMetadata.map((m: any) => m.name);
    expect(methods).toContain('getUsers');
    expect(methods).toContain('search');
    expect(methods).toContain('analyzeUser');
  });

  describe('查询参数功能验证', () => {
    it('应该正确处理查询参数', async () => {
      const client = new TestAPIClient();
      
      // 这个测试主要验证装饰器不抛出错误，实际的查询参数处理在集成测试中验证
      expect(() => {
        // 模拟调用，主要测试装饰器配置
        const paramMeta = Reflect.getMetadata('__openapi_ts_sdk_decorator_paramMetadata', client, 'search');
        const queryMeta = Object.values(paramMeta).find((m: any) => m.type === 'query');
        expect(queryMeta).toBeDefined();
      }).not.toThrow();
    });

    it('应该支持复杂查询参数', () => {
      const client = new TestAPIClient();
      
      // 验证复杂查询参数的元数据收集
      const analyzeParamMeta = Reflect.getMetadata('__openapi_ts_sdk_decorator_paramMetadata', client, 'analyzeUser');
      expect(analyzeParamMeta).toBeDefined();
      
      // 应该有路径参数、查询参数、请求体、响应类型
      const metaTypes = Object.values(analyzeParamMeta).map((m: any) => m.type);
      expect(metaTypes).toContain('param');
      expect(metaTypes).toContain('query');
      expect(metaTypes).toContain('request');
      expect(metaTypes).toContain('responseType');
    });
  });

  describe('完整API设计验证', () => {
    it('验证完整的装饰器组合', () => {
      // 验证新设计支持的所有装饰器类型
      const supportedDecorators = [
        'param',      // @Param('name') - 路径参数
        'query',      // @Query() - 查询参数
        'request',    // @Request() - 请求体
        'responseType', // @ResponseType() - 响应类型
        'options'     // @Options() - 选项参数
      ];
      
      const client = new TestAPIClient();
      const analyzeParamMeta = Reflect.getMetadata('__openapi_ts_sdk_decorator_paramMetadata', client, 'analyzeUser');
      
      const collectedTypes = Object.values(analyzeParamMeta).map((m: any) => m.type);
      
      // 验证支持的装饰器类型都能正确收集
      supportedDecorators.forEach(decoratorType => {
        if (decoratorType === 'options') {
          // options 是可选的
          return;
        }
        expect(collectedTypes).toContain(decoratorType);
      });
    });

    it('验证新设计的类型安全性', () => {
      // 这个测试验证 TypeScript 编译时类型检查
      // 如果类型不匹配，这个测试在编译时就会失败
      
      expect(() => {
        class TypeSafeClient extends APIClient {
          constructor() { super(new MockHttpBuilder()); }

          @GET('/users/{id}')
          async getUser(
            @Param('id') id: string,                    // 路径参数必须是 string
            @Query() query: Record<string, string>,     // 查询参数必须是 Record<string, string>
            @Request() request: GetUsersRequest,        // 请求体类型明确
            @ResponseType() responseType: { new (...args: any[]): GetUsersResponse }, // 响应类型构造函数
            @Options() ...options: APIOption[]          // 选项参数
          ): Promise<GetUsersResponse> {                // 返回类型明确
            throw new Error("Auto-generated method stub");
          }
        }
      }).not.toThrow();
    });
  });
});
