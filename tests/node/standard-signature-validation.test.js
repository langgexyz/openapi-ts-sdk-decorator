/**
 * 标准API方法签名验证测试
 * 测试装饰器是否正确验证标准格式：
 * @GET('/kol/{kolId}/social')
 * async getKOLSocialData(request: GetKOLSocialDataRequest, ...options: APIOption[]): Promise<GetKOLSocialDataResponse>
 */

const path = require('path');

// 动态导入编译后的模块
async function runTests() {
  try {
    console.log('🧪 开始标准方法签名验证测试...\n');
    
    // 首先确保编译完成
    console.log('📦 检查编译结果...');
    const { execSync } = require('child_process');
    
    try {
      execSync('npm run build', { 
        cwd: path.join(__dirname, '../..'),
        stdio: 'pipe'
      });
      console.log('✅ 编译成功!\n');
    } catch (error) {
      console.error('❌ 编译失败:', error.message);
      process.exit(1);
    }
    
    // 导入编译后的模块
    const { GET, POST, APIClient } = require('../../dist/cjs/index.js');
    const { HttpBuilder } = require('openapi-ts-sdk');

    let testCount = 0;
    let passedCount = 0;

    // 辅助函数
    function test(name, testFn) {
      testCount++;
      try {
        const result = testFn();
        if (result && typeof result.then === 'function') {
          return result.then(() => {
            console.log(`✅ ${name}`);
            passedCount++;
          }).catch(error => {
            console.log(`❌ ${name}`);
            console.log(`   错误: ${error.message}`);
          });
        } else {
          console.log(`✅ ${name}`);
          passedCount++;
        }
      } catch (error) {
        console.log(`❌ ${name}`);
        console.log(`   错误: ${error.message}`);
      }
    }

    function assert(condition, message) {
      if (!condition) {
        throw new Error(message || 'Assertion failed');
      }
    }

    function assertThrows(fn, expectedErrorPattern) {
      try {
        fn();
        throw new Error('Expected function to throw, but it did not');
      } catch (error) {
        if (expectedErrorPattern && !error.message.includes(expectedErrorPattern)) {
          throw new Error(`Expected error containing "${expectedErrorPattern}", got "${error.message}"`);
        }
      }
    }

    // 测试用的Request/Response类型
    class GetKOLSocialDataRequest {}
    class GetKOLSocialDataResponse {}
    class CreateUserRequest {}
    class CreateUserResponse {}

    console.log('✅ 正确的标准方法签名测试:');

    test('标准格式 - 只有options参数（无request参数的GET请求）', () => {
      class TestClient extends APIClient {
        constructor() {
          super(new HttpBuilder('http://localhost:3000'));
        }

        async getHealth(...options) {
          return this.executeRequest('GET', '/health', {}, GetKOLSocialDataResponse, options);
        }
      }
      
      // 手动应用装饰器
      const decorator = GET('/health');
      decorator(TestClient.prototype, 'getHealth', {
        value: TestClient.prototype.getHealth
      });
      
      assert(true, '只有options参数应该通过验证');
    });

    test('标准格式说明 - 在JavaScript中无法验证TypeScript类型', () => {
      // 由于JavaScript运行时无法获得TypeScript类型信息，
      // 我们只能在编译时进行完整的类型验证
      console.log('注意：在JavaScript中无法完全验证TypeScript类型声明');
      console.log('完整的类型验证需要在TypeScript编译时进行');
      assert(true, '这只是说明性测试');
    });


    console.log('\n❌ 错误的方法签名测试:');

    test('路径参数出现在方法签名中 - 应该抛出错误', () => {
      assertThrows(() => {
        class TestClient extends APIClient {
          constructor() {
            super(new HttpBuilder('http://localhost:3000'));
          }

          async getUser(userId, request, ...options) {
            return this.executeRequest('GET', '/users/{userId}', request, GetKOLSocialDataResponse, options);
          }
        }
        
        // 手动应用装饰器，这应该抛出错误
        const decorator = GET('/users/{userId}');
        decorator(TestClient.prototype, 'getUser', {
          value: TestClient.prototype.getUser
        });
      }, '路径参数');
    });

    test('多个request参数 - 应该抛出错误', () => {
      assertThrows(() => {
        class TestClient extends APIClient {
          constructor() {
            super(new HttpBuilder('http://localhost:3000'));
          }

          async createUser(request1, request2, ...options) {
            return this.executeRequest('POST', '/users', request1, CreateUserResponse, options);
          }
        }
        
        // 手动应用装饰器，这应该抛出错误
        const decorator = POST('/users');
        decorator(TestClient.prototype, 'createUser', {
          value: TestClient.prototype.createUser
        });
      }, '只能有一个 request 参数');
    });

    test('非标准参数名 - 应该抛出错误', () => {
      assertThrows(() => {
        class TestClient extends APIClient {
          constructor() {
            super(new HttpBuilder('http://localhost:3000'));
          }

          async getUsers(customParam, ...options) {
            return this.executeRequest('GET', '/users', customParam, GetKOLSocialDataResponse, options);
          }
        }
        
        // 手动应用装饰器，这应该抛出错误
        const decorator = GET('/users');
        decorator(TestClient.prototype, 'getUsers', {
          value: TestClient.prototype.getUsers
        });
      }, 'request 参数必须有类型声明');
    });

    test('多个options参数 - 应该抛出错误', () => {
      // 由于JavaScript语法限制，无法定义多个rest参数
      // 这个测试更多是理论上的，实际代码中不可能出现
      // 我们跳过这个测试或者改为测试其他情况
      console.log('⚠️  跳过多个rest参数测试（JavaScript语法不支持）');
    });

    console.log('\n📋 错误信息格式测试:');

    test('应该提供标准格式示例', () => {
      try {
        class TestClient extends APIClient {
          constructor() {
            super(new HttpBuilder('http://localhost:3000'));
          }

          async getUser(userId, request, ...options) {
            return this.executeRequest('GET', '/users/{userId}', request, GetKOLSocialDataResponse, options);
          }
        }
        
        // 手动应用装饰器，这应该抛出错误
        const decorator = GET('/users/{userId}');
        decorator(TestClient.prototype, 'getUser', {
          value: TestClient.prototype.getUser
        });
        
        throw new Error('应该抛出错误');
      } catch (error) {
        assert(error.message.includes('🚫'), '应该包含错误标识');
        assert(error.message.includes('标准格式:'), '应该包含标准格式示例');
        assert(error.message.includes('@GET'), '应该显示正确的HTTP方法');
        assert(error.message.includes('withParams()'), '应该提到withParams使用方法');
        assert(error.message.includes('Request'), '应该提到Request类型要求');
      }
    });

    console.log(`\n📊 测试结果: ${passedCount}/${testCount} 通过`);
    
    if (passedCount === testCount) {
      console.log('🎉 所有标准方法签名验证测试通过!');
      return true;
    } else {
      console.log('❌ 部分测试失败');
      return false;
    }
    
  } catch (error) {
    console.error('💥 测试运行出错:', error.message);
    console.error(error.stack);
    return false;
  }
}

// 运行测试
runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 测试执行失败:', error);
  process.exit(1);
});
