/**
 * 基础装饰器 TypeScript 测试
 */
import 'reflect-metadata';
import { 
  GET, POST, PUT, DELETE,
  APIClient, APIOption, getAPIMethodsMetadata 
} from '../../index';
import { MockHttpBuilder } from '../setup';

// 简单的测试类型
class SimpleRequest {
  id: string = '';
}

class SimpleResponse {
  success: boolean = true;
}

// 测试客户端类
class SimpleAPIClient extends APIClient {
  
  @GET('/users/{id}')
  async getUser(request: SimpleRequest, ...options: APIOption[]): Promise<SimpleResponse> {
    // 不实际调用，只用于装饰器测试
    return Promise.resolve(new SimpleResponse());
  }
  
  @POST('/users')
  async createUser(request: SimpleRequest, ...options: APIOption[]): Promise<SimpleResponse> {
    return Promise.resolve(new SimpleResponse());
  }
  
  @GET('/health')
  async getHealth(...options: APIOption[]): Promise<SimpleResponse> {
    return Promise.resolve(new SimpleResponse());
  }
}

describe('基础装饰器功能', () => {
  let client: SimpleAPIClient;
  
  beforeEach(() => {
    client = new SimpleAPIClient(new MockHttpBuilder());
  });
  
  describe('装饰器元数据', () => {
    it('应该正确收集 @GET 装饰器元数据', () => {
      const metadata = getAPIMethodsMetadata(client);
      const getUserMethod = metadata.find(m => m.name === 'getUser');
      
      expect(getUserMethod).toBeDefined();
      expect(getUserMethod?.method).toBe('GET');
      expect(getUserMethod?.path).toBe('/users/{id}');
    });
    
    it('应该正确收集 @POST 装饰器元数据', () => {
      const metadata = getAPIMethodsMetadata(client);
      const createUserMethod = metadata.find(m => m.name === 'createUser');
      
      expect(createUserMethod).toBeDefined();
      expect(createUserMethod?.method).toBe('POST');
      expect(createUserMethod?.path).toBe('/users');
    });
    
    it('应该收集所有装饰器方法的元数据', () => {
      const metadata = getAPIMethodsMetadata(client);
      
      expect(metadata).toHaveLength(3);
      
      const methods = metadata.map(m => ({ name: m.name, method: m.method, path: m.path }));
      
      expect(methods).toContainEqual({ name: 'getUser', method: 'GET', path: '/users/{id}' });
      expect(methods).toContainEqual({ name: 'createUser', method: 'POST', path: '/users' });
      expect(methods).toContainEqual({ name: 'getHealth', method: 'GET', path: '/health' });
    });
  });
  
  describe('TypeScript 类型验证', () => {
    it('方法应该有正确的 TypeScript 类型', () => {
      // 这些测试在 TypeScript 编译时进行类型检查
      expect(typeof client.getUser).toBe('function');
      expect(typeof client.createUser).toBe('function');
      expect(typeof client.getHealth).toBe('function');
    });
    
    it('应该接受正确的参数类型', () => {
      const request: SimpleRequest = { id: '123' };
      const options: APIOption[] = [];
      
      // TypeScript 编译器会检查这些类型是否匹配
      // 如果类型不匹配，编译会失败
      
      // 我们只检查函数签名，不实际调用
      expect(client.getUser).toBeInstanceOf(Function);
      expect(client.createUser).toBeInstanceOf(Function);
      expect(client.getHealth).toBeInstanceOf(Function);
    });
  });
  
  describe('装饰器选项', () => {
    it('应该支持装饰器选项', () => {
      class ClientWithOptions extends APIClient {
        @GET('/test', { summary: 'Test API', description: 'A test endpoint' })
        async testMethod(request: SimpleRequest, ...options: APIOption[]): Promise<SimpleResponse> {
          return Promise.resolve(new SimpleResponse());
        }
      }
      
      const testClient = new ClientWithOptions(new MockHttpBuilder());
      const metadata = getAPIMethodsMetadata(testClient);
      const testMethod = metadata.find(m => m.name === 'testMethod');
      
      expect(testMethod).toBeDefined();
      expect(testMethod?.options).toEqual({
        summary: 'Test API',
        description: 'A test endpoint'
      });
    });
  });
});
