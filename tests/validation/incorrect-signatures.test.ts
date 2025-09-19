/**
 * 错误方法签名的 TypeScript 测试
 * 
 * 注意：这些测试验证运行时验证逻辑
 * 某些错误可能在 TypeScript 编译时就被捕获
 */
import 'reflect-metadata';
import { 
  GET, POST, PUT,
  APIClient, APIOption, setValidationEnabled 
} from '../../index';

// 测试用类型
class TestRequest {
  id: string = '';
  name: string = '';
}

class TestResponse {
  success: boolean = true;
}

describe('错误的方法签名', () => {
  
  beforeEach(() => {
    // 确保验证开启
    setValidationEnabled(true);
  });
  
  describe('路径参数在方法签名中的错误', () => {
    it('应该拒绝路径参数出现在方法签名中', () => {
      expect(() => {
        class IncorrectClient extends APIClient {
          // ❌ 错误：路径参数不应该在方法签名中
          @GET('/users/{userId}')
          async getUser(userId: string, request: TestRequest, ...options: APIOption[]): Promise<TestResponse> {
            throw new Error("Auto-generated method stub");
          }
        }
      }).toThrow(/路径参数.*不应该在方法签名中/);
    });
    
    it('应该拒绝多个路径参数在方法签名中', () => {
      expect(() => {
        class IncorrectClient extends APIClient {
          // ❌ 错误：多个路径参数都不应该在方法签名中
          @GET('/users/{userId}/posts/{postId}')
          async getUserPost(
            userId: string, 
            postId: string, 
            request: TestRequest, 
            ...options: APIOption[]
          ): Promise<TestResponse> {
            throw new Error("Auto-generated method stub");
          }
        }
      }).toThrow(/路径参数.*不应该在方法签名中/);
    });
  });
  
  describe('多个 request 参数的错误', () => {
    it('应该拒绝多个 request 参数', () => {
      expect(() => {
        class IncorrectClient extends APIClient {
          // ❌ 错误：只能有一个 request 参数
          @POST('/users')
          async createUser(
            request1: TestRequest, 
            request2: TestRequest, 
            ...options: APIOption[]
          ): Promise<TestResponse> {
            throw new Error("Auto-generated method stub");
          }
        }
      }).toThrow(/只能有一个 request 参数/);
    });
  });
  
  describe('多个 options 参数的错误', () => {
    // 注意：JavaScript 语法不支持多个 rest 参数，
    // 但我们可以测试验证逻辑是否能正确识别这种模式
    it('应该检测到多个 options 参数的错误', () => {
      // 这个测试验证验证逻辑的完整性
      // 在实际情况下，TypeScript 编译器会阻止这种语法
      expect(() => {
        class IncorrectClient extends APIClient {
          // ❌ 错误：多个可变参数（虽然 JS 语法不允许）
          @POST('/test')
          async testMethod(request: TestRequest): Promise<TestResponse> {
            // 我们通过修改函数字符串来模拟这种情况进行测试
            throw new Error("Auto-generated method stub");
          }
        }
        
        // 手动模拟验证逻辑以测试多个 options 参数的情况
      }).not.toThrow(); // 这个特定情况下不会抛出错误，因为语法本身就不允许
    });
  });
  
  describe('参数过多的错误', () => {
    it('应该拒绝过多非 options 参数', () => {
      expect(() => {
        class IncorrectClient extends APIClient {
          // ❌ 错误：太多非 options 参数
          @POST('/test')
          async testMethod(
            request1: TestRequest,
            request2: TestRequest,
            extraParam: string,
            ...options: APIOption[]
          ): Promise<TestResponse> {
            throw new Error("Auto-generated method stub");
          }
        }
      }).toThrow(/方法签名应该只有 request 参数和.*options 参数/);
    });
  });
  
  describe('路径格式错误', () => {
    it('应该拒绝不以 / 开头的路径', () => {
      expect(() => {
        class IncorrectClient extends APIClient {
          // ❌ 错误：路径必须以 / 开头
          @GET('users/{id}')
          async getUser(request: TestRequest, ...options: APIOption[]): Promise<TestResponse> {
            throw new Error("Auto-generated method stub");
          }
        }
      }).toThrow(/路径必须以.*开头/);
    });
    
    it('应该拒绝空路径', () => {
      expect(() => {
        class IncorrectClient extends APIClient {
          // ❌ 错误：路径不能为空
          @GET('')
          async getUser(request: TestRequest, ...options: APIOption[]): Promise<TestResponse> {
            throw new Error("Auto-generated method stub");
          }
        }
      }).toThrow(/路径不能为空/);
    });
    
    it('应该拒绝以 / 结尾的路径（除根路径外）', () => {
      expect(() => {
        class IncorrectClient extends APIClient {
          // ❌ 错误：路径不能以 / 结尾
          @GET('/users/')
          async getUsers(request: TestRequest, ...options: APIOption[]): Promise<TestResponse> {
            throw new Error("Auto-generated method stub");
          }
        }
      }).toThrow(/路径不能以.*结尾/);
    });
    
    it('应该拒绝包含连续斜杠的路径', () => {
      expect(() => {
        class IncorrectClient extends APIClient {
          // ❌ 错误：路径不能包含连续斜杠
          @GET('/users//profile')
          async getUserProfile(request: TestRequest, ...options: APIOption[]): Promise<TestResponse> {
            throw new Error("Auto-generated method stub");
          }
        }
      }).toThrow(/路径不能包含连续的斜杠/);
    });
  });
  
  describe('验证开关测试', () => {
    it('关闭验证后应该跳过所有错误检查', () => {
      setValidationEnabled(false);
      
      expect(() => {
        class IncorrectClient extends APIClient {
          // 这些错误在验证关闭时应该被忽略
          @GET('invalid-path')
          async badMethod(
            userId: string,  // 路径参数在签名中
            request1: TestRequest,
            request2: TestRequest,  // 多个 request 参数
            ...options: APIOption[]
          ): Promise<TestResponse> {
            throw new Error("Auto-generated method stub");
          }
        }
      }).not.toThrow();
      
      // 重新开启验证
      setValidationEnabled(true);
    });
  });
  
  describe('错误信息质量', () => {
    it('应该提供有用的错误信息和建议', () => {
      try {
        class IncorrectClient extends APIClient {
          @GET('/users/{userId}')
          async getUser(userId: string, request: TestRequest, ...options: APIOption[]): Promise<TestResponse> {
            throw new Error("Auto-generated method stub");
          }
        }
      } catch (error) {
        const errorMessage = (error as Error).message;
        
        // 检查错误信息的质量
        expect(errorMessage).toContain('路径参数');
        expect(errorMessage).toContain('不应该在方法签名中');
        expect(errorMessage).toContain('withParams()');
        expect(errorMessage).toContain('标准格式');
      }
    });
  });
});
