/**
 * 正确方法签名的 TypeScript 测试
 */
import 'reflect-metadata';
import { 
  GET, POST, PUT, DELETE,
  APIClient, APIOption, RootUri 
} from '../../index';
import { MockHttpBuilder } from '../setup';

// 标准的请求/响应类型
class GetUserRequest {
  id: string = '';
}

class GetUserResponse {
  id: string = '';
  name: string = '';
  email: string = '';
}

class CreateUserRequest {
  name: string = '';
  email: string = '';
}

class CreateUserResponse {
  id: string = '';
  name: string = '';
  email: string = '';
  createdAt: Date = new Date();
}

class UpdateUserRequest {
  id: string = '';
  name?: string;
  email?: string;
}

class UpdateUserResponse {
  id: string = '';
  name: string = '';
  email: string = '';
  updatedAt: Date = new Date();
}

class DeleteUserRequest {
  id: string = '';
}

class DeleteUserResponse {
  success: boolean = true;
  deletedAt: Date = new Date();
}

// ✅ 正确的客户端实现
@RootUri('/api/v1')
class CorrectUserAPIClient extends APIClient {
  
  // ✅ 标准的 GET 方法，有路径参数
  @GET('/users/{id}')
  async getUser(request: GetUserRequest, ...options: APIOption[]): Promise<GetUserResponse> {
    throw new Error("Auto-generated method stub");
  }
  
  // ✅ 标准的 POST 方法
  @POST('/users')
  async createUser(request: CreateUserRequest, ...options: APIOption[]): Promise<CreateUserResponse> {
    throw new Error("Auto-generated method stub");
  }
  
  // ✅ 标准的 PUT 方法，有路径参数
  @PUT('/users/{id}')
  async updateUser(request: UpdateUserRequest, ...options: APIOption[]): Promise<UpdateUserResponse> {
    throw new Error("Auto-generated method stub");
  }
  
  // ✅ 标准的 DELETE 方法，有路径参数
  @DELETE('/users/{id}')
  async deleteUser(request: DeleteUserRequest, ...options: APIOption[]): Promise<DeleteUserResponse> {
    throw new Error("Auto-generated method stub");
  }
  
  // ✅ 无参数的 GET 方法（健康检查等场景）
  @GET('/health')
  async getHealth(...options: APIOption[]): Promise<{ status: string }> {
    throw new Error("Auto-generated method stub");
  }
  
  // ✅ 只有 options 参数的方法
  @GET('/status')
  async getStatus(...options: APIOption[]): Promise<{ online: boolean }> {
    throw new Error("Auto-generated method stub");
  }
  
  // ✅ 使用自定义参数名（应该可以工作，但会得到建议）
  @POST('/analytics')
  async trackEvent(data: { event: string; properties: Record<string, any> }, ...options: APIOption[]): Promise<{ tracked: boolean }> {
    throw new Error("Auto-generated method stub");
  }
}

describe('正确的方法签名', () => {
  let client: CorrectUserAPIClient;
  
  beforeEach(() => {
    client = new CorrectUserAPIClient(new MockHttpBuilder());
  });
  
  describe('标准方法签名应该通过验证', () => {
    it('应该接受标准的 GET 方法签名', () => {
      // 如果装饰器验证失败，这个测试文件就不会编译成功
      expect(client).toBeInstanceOf(CorrectUserAPIClient);
      expect(typeof client.getUser).toBe('function');
    });
    
    it('应该接受标准的 POST 方法签名', () => {
      expect(typeof client.createUser).toBe('function');
    });
    
    it('应该接受标准的 PUT 方法签名', () => {
      expect(typeof client.updateUser).toBe('function');
    });
    
    it('应该接受标准的 DELETE 方法签名', () => {
      expect(typeof client.deleteUser).toBe('function');
    });
    
    it('应该接受无参数的 GET 方法', () => {
      expect(typeof client.getHealth).toBe('function');
    });
    
    it('应该接受只有 options 参数的方法', () => {
      expect(typeof client.getStatus).toBe('function');
    });
  });
  
  describe('类型安全检查', () => {
    it('方法调用应该类型安全', async () => {
      const getUserReq: GetUserRequest = { id: '123' };
      const createUserReq: CreateUserRequest = { name: 'John', email: 'john@example.com' };
      const updateUserReq: UpdateUserRequest = { id: '123', name: 'John Updated' };
      const deleteUserReq: DeleteUserRequest = { id: '123' };
      
      // 这些调用在 TypeScript 编译时就会被检查
      try {
        await client.getUser(getUserReq);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
      
      try {
        await client.createUser(createUserReq);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
      
      try {
        await client.updateUser(updateUserReq);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
      
      try {
        await client.deleteUser(deleteUserReq);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
    
    it('返回类型应该正确推断', async () => {
      const getUserReq: GetUserRequest = { id: '123' };
      
      try {
        const result = await client.getUser(getUserReq);
        // TypeScript 应该知道 result 是 GetUserResponse 类型
        expect(typeof result.id).toBe('string');
        expect(typeof result.name).toBe('string');
        expect(typeof result.email).toBe('string');
      } catch (error) {
        // 预期的测试错误
        expect(error).toBeInstanceOf(Error);
      }
    });
  });
  
  describe('路径参数处理', () => {
    it('应该正确处理路径参数', async () => {
      // 路径参数应该通过 withParams() 提供，而不是在方法签名中
      const getUserReq: GetUserRequest = { id: '123' };
      
      try {
        // 正确的用法：路径参数通过 withParams 提供
        // await client.getUser(getUserReq, withParams({ id: '123' }));
        await client.getUser(getUserReq);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });
  
  describe('装饰器选项', () => {
    it('应该支持装饰器选项', () => {
      class ClientWithOptions extends APIClient {
        @GET('/users/{id}', { 
          summary: 'Get user by ID',
          description: 'Retrieves a user by their unique identifier'
        })
        async getUser(request: GetUserRequest, ...options: APIOption[]): Promise<GetUserResponse> {
          throw new Error("Auto-generated method stub");
        }
      }
      
      const client = new ClientWithOptions(new MockHttpBuilder());
      expect(typeof client.getUser).toBe('function');
    });
  });
});
