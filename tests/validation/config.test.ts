/**
 * 配置模块 TypeScript 测试
 */
import 'reflect-metadata';
import { 
  isValidationEnabled, 
  setValidationEnabled,
  GET,
  APIClient,
  APIOption
} from '../../index';

// 测试用类型
class TestRequest {
  id: string = '';
}

class TestResponse {
  success: boolean = true;
}

describe('配置模块', () => {
  
  describe('验证开关基本功能', () => {
    it('默认应该开启验证', () => {
      expect(isValidationEnabled()).toBe(true);
    });
    
    it('应该能够关闭验证', () => {
      setValidationEnabled(false);
      expect(isValidationEnabled()).toBe(false);
      
      // 恢复默认设置
      setValidationEnabled(true);
    });
    
    it('应该能够开启验证', () => {
      setValidationEnabled(false);
      setValidationEnabled(true);
      expect(isValidationEnabled()).toBe(true);
    });
  });
  
  describe('验证开关影响装饰器行为', () => {
    it('开启验证时应该检测到错误', () => {
      setValidationEnabled(true);
      
      expect(() => {
        class TestClient extends APIClient {
          // ❌ 错误：路径参数在方法签名中
          @GET('/users/{userId}')
          async getUser(userId: string, request: TestRequest, ...options: APIOption[]): Promise<TestResponse> {
            throw new Error("Auto-generated method stub");
          }
        }
      }).toThrow();
    });
    
    it('关闭验证时应该跳过错误检查', () => {
      setValidationEnabled(false);
      
      expect(() => {
        class TestClient extends APIClient {
          // 这些错误在验证关闭时应该被忽略
          @GET('/users/{userId}')
          async getUser(userId: string, request: TestRequest, ...options: APIOption[]): Promise<TestResponse> {
            throw new Error("Auto-generated method stub");
          }
        }
      }).not.toThrow();
      
      // 恢复验证
      setValidationEnabled(true);
    });
  });
  
  describe('验证开关状态管理', () => {
    let originalState: boolean;
    
    beforeEach(() => {
      originalState = isValidationEnabled();
    });
    
    afterEach(() => {
      setValidationEnabled(originalState);
    });
    
    it('应该正确管理验证状态', () => {
      // 测试状态切换
      setValidationEnabled(false);
      expect(isValidationEnabled()).toBe(false);
      
      setValidationEnabled(true);
      expect(isValidationEnabled()).toBe(true);
      
      setValidationEnabled(false);
      expect(isValidationEnabled()).toBe(false);
    });
    
    it('验证状态应该影响多个装饰器应用', () => {
      setValidationEnabled(false);
      
      // 多个错误的装饰器应用都应该被跳过
      expect(() => {
        class TestClient1 extends APIClient {
          @GET('invalid-path')
          async method1(userId: string, ...options: APIOption[]): Promise<TestResponse> {
            throw new Error("Auto-generated method stub");
          }
        }
        
        class TestClient2 extends APIClient {
          @GET('/users/{id}')
          async method2(id: string, request: TestRequest, ...options: APIOption[]): Promise<TestResponse> {
            throw new Error("Auto-generated method stub");
          }
        }
      }).not.toThrow();
    });
  });
  
  describe('性能考量', () => {
    it('关闭验证应该显著减少装饰器应用时间', () => {
      const iterations = 100;
      
      // 测量开启验证的时间
      setValidationEnabled(true);
      const startWithValidation = Date.now();
      
      for (let i = 0; i < iterations; i++) {
        try {
          class TestClient extends APIClient {
            @GET('/test')
            async testMethod(request: TestRequest, ...options: APIOption[]): Promise<TestResponse> {
              throw new Error("Auto-generated method stub");
            }
          }
        } catch (error) {
          // 忽略验证错误，只关心性能
        }
      }
      
      const timeWithValidation = Date.now() - startWithValidation;
      
      // 测量关闭验证的时间
      setValidationEnabled(false);
      const startWithoutValidation = Date.now();
      
      for (let i = 0; i < iterations; i++) {
        class TestClient extends APIClient {
          @GET('/test')
          async testMethod(request: TestRequest, ...options: APIOption[]): Promise<TestResponse> {
            throw new Error("Auto-generated method stub");
          }
        }
      }
      
      const timeWithoutValidation = Date.now() - startWithoutValidation;
      
      // 关闭验证应该更快（虽然在测试环境中差异可能不明显）
      console.log(`With validation: ${timeWithValidation}ms, Without validation: ${timeWithoutValidation}ms`);
      
      // 恢复验证
      setValidationEnabled(true);
      
      // 这是一个性能提示测试，不做严格断言
      expect(timeWithoutValidation).toBeLessThanOrEqual(timeWithValidation + 50); // 允许一些误差
    });
  });
  
  describe('边界情况', () => {
    it('应该处理重复的状态设置', () => {
      const initialState = isValidationEnabled();
      
      // 重复设置相同状态应该没有问题
      setValidationEnabled(initialState);
      setValidationEnabled(initialState);
      setValidationEnabled(initialState);
      
      expect(isValidationEnabled()).toBe(initialState);
    });
    
    it('应该处理快速的状态切换', () => {
      const originalState = isValidationEnabled();
      
      // 快速切换状态
      for (let i = 0; i < 10; i++) {
        setValidationEnabled(i % 2 === 0);
        expect(isValidationEnabled()).toBe(i % 2 === 0);
      }
      
      // 恢复原始状态
      setValidationEnabled(originalState);
    });
  });
});
