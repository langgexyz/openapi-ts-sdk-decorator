import 'reflect-metadata';
import { APIClient, GET, POST, Param, Query, Request, ResponseType, Options, APIOption } from '../../index';
import { MockHttpBuilder } from '../setup';

describe('新参数装饰器设计', () => {
  
  interface GetUserRequest {
    includeProfile?: boolean;
  }

  interface GetUserResponse {
    id: string;
    name: string;
    profile?: any;
  }

  interface CreateUserRequest {
    name: string;
    email: string;
  }

  interface CreateUserResponse {
    id: string;
    name: string;
    email: string;
  }

  class TestAPIClient extends APIClient {
    constructor() {
      super(new MockHttpBuilder());
    }

    // ✅ 标准的新设计格式
    @GET('/users/{id}')
    async getUser<Request = GetUserRequest, Response = GetUserResponse>(
      @Param('id') id: string,
      @Request() request: Request,
      @ResponseType() responseType: { new (...args: any[]): Response },
      @Options() ...options: APIOption[]
    ): Promise<Response> {
      throw new Error("Auto-generated method stub");
    }

    // ✅ 无路径参数的POST方法
    @POST('/users')
    async createUser<Request = CreateUserRequest, Response = CreateUserResponse>(
      @Request() request: Request,
      @ResponseType() responseType: { new (...args: any[]): Response },
      @Options() ...options: APIOption[]
    ): Promise<Response> {
      throw new Error("Auto-generated method stub");
    }

    // ✅ 多路径参数
    @GET('/users/{userId}/posts/{postId}')
    async getUserPost<Request = any, Response = any>(
      @Param('userId') userId: string,
      @Param('postId') postId: string,
      @Request() request: Request,
      @ResponseType() responseType: { new (...args: any[]): Response },
      @Options() ...options: APIOption[]
    ): Promise<Response> {
      throw new Error("Auto-generated method stub");
    }
  }

  it('应该成功创建带有参数装饰器的客户端', () => {
    expect(() => {
      const client = new TestAPIClient();
    }).not.toThrow();
  });

  it('应该正确收集方法元数据', () => {
    const client = new TestAPIClient();
    const metadata = (client.constructor as any).__openapi_ts_sdk_decorator_apiMethods;
    
    expect(metadata).toBeDefined();
    expect(metadata.length).toBe(3);
    
    // 验证第一个方法
    const getUserMeta = metadata.find((m: any) => m.name === 'getUser');
    expect(getUserMeta).toBeDefined();
    expect(getUserMeta.method).toBe('GET');
    expect(getUserMeta.path).toBe('/users/{id}');
    
    // 验证第二个方法
    const createUserMeta = metadata.find((m: any) => m.name === 'createUser');
    expect(createUserMeta).toBeDefined();
    expect(createUserMeta.method).toBe('POST');
    expect(createUserMeta.path).toBe('/users');
    
    // 验证第三个方法
    const getUserPostMeta = metadata.find((m: any) => m.name === 'getUserPost');
    expect(getUserPostMeta).toBeDefined();
    expect(getUserPostMeta.method).toBe('GET');
    expect(getUserPostMeta.path).toBe('/users/{userId}/posts/{postId}');
  });

  it('验证参数装饰器元数据', () => {
    const client = new TestAPIClient();
    
    // 检查 getUser 方法的参数元数据
    const getUserParamMeta = Reflect.getMetadata('__openapi_ts_sdk_decorator_paramMetadata', client, 'getUser');
    expect(getUserParamMeta).toBeDefined();
    
    // 应该有4个参数：@Param('id'), @Request(), @ResponseType(), @Options()
    expect(Object.keys(getUserParamMeta).length).toBe(4);
    
    // 验证路径参数
    const paramMeta = Object.values(getUserParamMeta).find((m: any) => m.type === 'param');
    expect(paramMeta).toBeDefined();
    expect((paramMeta as any).paramName).toBe('id');
    
    // 验证请求参数
    const requestMeta = Object.values(getUserParamMeta).find((m: any) => m.type === 'request');
    expect(requestMeta).toBeDefined();
    
    // 验证响应类型参数
    const responseTypeMeta = Object.values(getUserParamMeta).find((m: any) => m.type === 'responseType');
    expect(responseTypeMeta).toBeDefined();
    
    // 验证选项参数
    const optionsMeta = Object.values(getUserParamMeta).find((m: any) => m.type === 'options');
    expect(optionsMeta).toBeDefined();
  });

  describe('@Query 装饰器测试', () => {
    class GetUsersResponse {
      users!: any[];
      constructor(data?: any) { if (data) Object.assign(this, data); }
    }

    it('应该支持查询参数', () => {
      expect(() => {
        class TestClientWithQuery extends APIClient {
          constructor() { super(new MockHttpBuilder()); }

          @GET('/users')
          async searchUsers(
            @Query() query: Record<string, string>,
            @Request() request: any,
            @ResponseType() responseType: { new (...args: any[]): GetUsersResponse },
            @Options() ...options: APIOption[]
          ): Promise<GetUsersResponse> {
            throw new Error("Auto-generated method stub");
          }
        }
      }).not.toThrow();
    });

    it('应该正确收集查询参数元数据', () => {
      class TestClientWithQuery extends APIClient {
        constructor() { super(new MockHttpBuilder()); }

        @GET('/search')
        async search(
          @Query() query: Record<string, string>,
          @Request() request: any,
          @ResponseType() responseType: { new (...args: any[]): any },
          @Options() ...options: APIOption[]
        ): Promise<any> {
          throw new Error("Auto-generated method stub");
        }
      }

      const client = new TestClientWithQuery();
      const paramMeta = Reflect.getMetadata('__openapi_ts_sdk_decorator_paramMetadata', client, 'search');
      
      expect(paramMeta).toBeDefined();
      
      // 查找 @Query 装饰器的元数据
      const queryMeta = Object.values(paramMeta).find((m: any) => m.type === 'query');
      expect(queryMeta).toBeDefined();
    });
  });

  describe('新设计的特点验证', () => {
    it('基于装饰器元数据验证', () => {
      // 新设计完全基于装饰器元数据，不依赖字符串解析
      const client = new TestAPIClient();
      
      // 验证元数据存在
      const paramMeta = Reflect.getMetadata('__openapi_ts_sdk_decorator_paramMetadata', client, 'getUser');
      expect(paramMeta).toBeDefined();
      expect(typeof paramMeta).toBe('object');
    });
  });
});
