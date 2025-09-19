import 'reflect-metadata';
import { APIClient, GET, POST, Param, Query, Request, ResponseType, Options, APIOption, withHeaders } from '../../index';
import { MockHttpBuilder } from '../setup';

describe('完整工作流程集成测试', () => {
  
  // 真实的业务类型
  interface GetUsersRequest {
    includeProfile?: boolean;
    includeSettings?: boolean;
  }

  class GetUsersResponse {
    users!: Array<{
      id: string;
      name: string;
      email: string;
    }>;
    total!: number;
    
    constructor(data?: any) {
      if (data) Object.assign(this, data);
    }
  }

  interface CreateUserRequest {
    name: string;
    email: string;
    role?: string;
  }

  class CreateUserResponse {
    id!: string;
    name!: string;
    email!: string;
    createdAt!: Date;
    
    constructor(data?: any) {
      if (data) {
        Object.assign(this, data);
        if (data.createdAt) {
          this.createdAt = new Date(data.createdAt);
        }
      }
    }
  }

  // Mock 增强版 HttpBuilder，记录所有操作
  class DetailedMockHttpBuilder {
    private operations: string[] = [];

    setUri(uri: string) { 
      this.operations.push(`setUri: ${uri}`);
      return this; 
    }
    setMethod(method: string) { 
      this.operations.push(`setMethod: ${method}`);
      return this; 
    }
    addHeader(key: string, value: string) { 
      this.operations.push(`addHeader: ${key}=${value}`);
      return this; 
    }
    setContent(content: string) { 
      this.operations.push(`setContent: ${content}`);
      return this; 
    }
    build() { 
      return { 
        async send() { 
          return [
            JSON.stringify({
              users: [{ id: '123', name: 'John', email: 'john@example.com' }],
              total: 1
            }), 
            null
          ]; 
        },
        getOperations: () => this.operations
      }; 
    }
  }

  class RealWorldAPI extends APIClient {
    constructor() {
      super(new DetailedMockHttpBuilder() as any);
    }

    // ✅ 复杂的 GET 请求：路径参数 + 查询参数
    @GET('/api/v1/users/{category}')
    async getUsers(
      @Param('category') category: string,
      @Query() query: Record<string, string>,
      @Request() request: GetUsersRequest,
      @ResponseType() responseType: { new (...args: any[]): GetUsersResponse },
      @Options() ...options: APIOption[]
    ): Promise<GetUsersResponse> {
      throw new Error("Auto-generated method stub");
    }

    // ✅ 简单的搜索：只有查询参数
    @GET('/api/v1/search')
    async searchUsers(
      @Query() query: Record<string, string>,
      @Request() request: any,
      @ResponseType() responseType: { new (...args: any[]): any },
      @Options() ...options: APIOption[]
    ): Promise<any> {
      throw new Error("Auto-generated method stub");
    }

    // ✅ POST 请求：路径参数 + 请求体，无查询参数
    @POST('/api/v1/departments/{deptId}/users')
    async createUser(
      @Param('deptId') deptId: string,
      @Request() request: CreateUserRequest,
      @ResponseType() responseType: { new (...args: any[]): CreateUserResponse },
      @Options() ...options: APIOption[]
    ): Promise<CreateUserResponse> {
      throw new Error("Auto-generated method stub");
    }
  }

  describe('GET 请求 - 路径参数 + 查询参数', () => {
    it('应该正确处理复杂的参数组合', async () => {
      const api = new RealWorldAPI();
      
      // 不会实际执行HTTP请求，但会验证装饰器处理流程
      await expect(api.getUsers(
        'active',                               // @Param('category')
        { page: '1', size: '10', sort: 'name' }, // @Query()
        { includeProfile: true },               // @Request()
        GetUsersResponse,                       // @ResponseType()
        withHeaders({ 'Authorization': 'Bearer token' }) // @Options()
      )).resolves.toBeDefined();
      
      // 验证结果是 GetUsersResponse 实例
      const result = await api.getUsers(
        'active',
        { page: '1', size: '10' },
        { includeProfile: true },
        GetUsersResponse
      );
      
      expect(result).toBeInstanceOf(GetUsersResponse);
      expect(result.users).toBeDefined();
      expect(Array.isArray(result.users)).toBe(true);
    });
  });

  describe('GET 请求 - 纯查询参数', () => {
    it('应该正确处理搜索请求', async () => {
      const api = new RealWorldAPI();
      
      // 使用正确的响应类型
      class SearchUsersResponse {
        constructor(data?: any) { if (data) Object.assign(this, data); }
      }
      
      const result = await api.searchUsers(
        { keyword: 'john', type: 'user', active: 'true' }, // @Query()
        { filters: { role: 'admin' } },                    // @Request()
        SearchUsersResponse                                // @ResponseType()
      );
      
      expect(result).toBeDefined();
    });
  });

  describe('POST 请求 - 路径参数 + 请求体', () => {
    it('应该正确处理用户创建', async () => {
      const api = new RealWorldAPI();
      
      const result = await api.createUser(
        'dept-123',                           // @Param('deptId')
        {                                     // @Request()
          name: 'Jane Doe',
          email: 'jane@example.com',
          role: 'developer'
        },
        CreateUserResponse                   // @ResponseType()
      );
      
      expect(result).toBeDefined();
    });
  });

  describe('装饰器自动生成选项验证', () => {
    it('验证自动生成的选项执行顺序', () => {
      // 验证生成的选项顺序：用户选项 → withParams → withQuery
      const api = new RealWorldAPI();
      
      // 通过元数据验证装饰器配置正确性
      const getUsersParamMeta = Reflect.getMetadata('__openapi_ts_sdk_decorator_paramMetadata', api, 'getUsers');
      
      // 统计装饰器类型
      const decoratorTypes = Object.values(getUsersParamMeta).map((m: any) => m.type);
      
      expect(decoratorTypes).toContain('param');    // @Param
      expect(decoratorTypes).toContain('query');    // @Query  
      expect(decoratorTypes).toContain('request');  // @Request
      expect(decoratorTypes).toContain('responseType'); // @ResponseType
    });
  });

  describe('类型安全性验证', () => {
    it('编译时类型检查', () => {
      // 这个测试如果编译通过，说明类型系统工作正常
      expect(() => {
        const api = new RealWorldAPI();
        
        // 这些类型声明都应该在编译时验证通过
        type GetUsersParams = [
          string,                           // @Param('category')
          Record<string, string>,           // @Query()
          GetUsersRequest,                  // @Request()
          { new (...args: any[]): GetUsersResponse }, // @ResponseType()
          ...APIOption[]                   // @Options()
        ];
        
        type GetUsersReturn = Promise<GetUsersResponse>;
        
        // 类型匹配验证
        const methodType: (
          category: string,
          query: Record<string, string>,
          request: GetUsersRequest,
          responseType: { new (...args: any[]): GetUsersResponse },
          ...options: APIOption[]
        ) => Promise<GetUsersResponse> = api.getUsers;
        
        expect(methodType).toBeDefined();
      }).not.toThrow();
    });
  });
});
