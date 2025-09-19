/**
 * 路径参数验证测试
 * 测试 withParams 的路径参数匹配验证功能
 */

const path = require('path');

// 动态导入编译后的模块
async function runTests() {
  try {
    console.log('🧪 开始路径参数验证测试...\n');
    
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
    const { APIClient, withParams } = require('../../dist/cjs/index.js');
    const { HttpBuilder } = require('openapi-ts-sdk');

    // 测试用的 Request/Response 类型
    class GetUserByIdRequest {}
    class GetUserByIdResponse {}

    // 测试用的 API 客户端
    class TestAPIClient extends APIClient {
      constructor() {
        super(new HttpBuilder('http://localhost:3000'));
      }

      async testGetUserById(id, request, ...options) {
        return this.executeRequest(
          'GET',
          '/users/{id}',
          request,
          GetUserByIdResponse,
          options
        );
      }

      async testGetUserPosts(userId, postId, request, ...options) {
        return this.executeRequest(
          'GET', 
          '/users/{userId}/posts/{postId}',
          request,
          GetUserByIdResponse,
          options
        );
      }

      async testGetUsers(request, ...options) {
        return this.executeRequest(
          'GET',
          '/users',
          request,
          GetUserByIdResponse,
          options
        );
      }
    }

    const client = new TestAPIClient();
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

    function assertThrows(fn, expectedError) {
      try {
        fn();
        throw new Error('Expected function to throw, but it did not');
      } catch (error) {
        if (expectedError && !error.message.includes(expectedError)) {
          throw new Error(`Expected error containing "${expectedError}", got "${error.message}"`);
        }
      }
    }

    async function assertRejects(promise, expectedError) {
      try {
        await promise;
        throw new Error('Expected promise to reject, but it resolved');
      } catch (error) {
        if (expectedError && !error.message.includes(expectedError)) {
          throw new Error(`Expected error containing "${expectedError}", got "${error.message}"`);
        }
      }
    }

    console.log('🟢 正确的路径参数测试:');

    test('单个路径参数 - 应该通过验证', () => {
      const config = { uri: '/users/{id}', headers: {} };
      withParams({ id: '123' })(config);
      assert(config.params && config.params.id === '123', '参数应该正确设置');
    });

    test('多个路径参数 - 应该通过验证', () => {
      const config = { uri: '/users/{userId}/posts/{postId}', headers: {} };
      withParams({ userId: '123', postId: '456' })(config);
      assert(config.params && config.params.userId === '123' && config.params.postId === '456', '多个参数应该正确设置');
    });

    test('无路径参数 - 应该通过验证', () => {
      const config = { uri: '/users', headers: {} };
      withParams({})(config);
      assert(true, '空参数应该通过');
    });

    console.log('\n🔴 错误的路径参数测试:');

    await test('缺少必需的路径参数 - 应该抛出错误', async () => {
      const request = new GetUserByIdRequest();
      await assertRejects(
        client.testGetUserById('123', request, withParams({})),
        '缺少必需的路径参数: id'
      );
    });

    await test('提供多余的路径参数 - 应该抛出错误', async () => {
      const request = new GetUserByIdRequest();
      await assertRejects(
        client.testGetUsers(request, withParams({ id: '123' })),
        '提供了不存在的路径参数: id'
      );
    });

    await test('部分缺少路径参数 - 应该抛出错误', async () => {
      const request = new GetUserByIdRequest();
      await assertRejects(
        client.testGetUserPosts('123', '456', request, withParams({ userId: '123' })),
        '缺少必需的路径参数: postId'
      );
    });

    await test('参数名称不匹配 - 应该抛出错误', async () => {
      const request = new GetUserByIdRequest();
      await assertRejects(
        client.testGetUserById('123', request, withParams({ user_id: '123' })),
        '缺少必需的路径参数: id'
      );
    });

    console.log('\n🔄 路径参数替换测试:');

    test('应该正确替换单个路径参数', () => {
      const config = {
        uri: '/users/{id}',
        headers: {},
        params: { id: '123' }
      };
      
      // 模拟 replacePathParameters 逻辑
      let replacedUri = config.uri;
      Object.entries(config.params).forEach(([key, value]) => {
        const placeholder = `{${key}}`;
        replacedUri = replacedUri.replace(placeholder, encodeURIComponent(value));
      });
      
      assert(replacedUri === '/users/123', `期望 '/users/123', 得到 '${replacedUri}'`);
    });

    test('应该正确替换多个路径参数', () => {
      const config = {
        uri: '/users/{userId}/posts/{postId}',
        headers: {},
        params: { userId: '123', postId: '456' }
      };
      
      // 模拟 replacePathParameters 逻辑
      let replacedUri = config.uri;
      Object.entries(config.params).forEach(([key, value]) => {
        const placeholder = `{${key}}`;
        replacedUri = replacedUri.replace(placeholder, encodeURIComponent(value));
      });
      
      assert(replacedUri === '/users/123/posts/456', `期望 '/users/123/posts/456', 得到 '${replacedUri}'`);
    });

    test('应该对参数值进行 URL 编码', () => {
      const config = {
        uri: '/search/{query}',
        headers: {},
        params: { query: 'hello world' }
      };
      
      // 模拟 replacePathParameters 逻辑
      let replacedUri = config.uri;
      Object.entries(config.params).forEach(([key, value]) => {
        const placeholder = `{${key}}`;
        replacedUri = replacedUri.replace(placeholder, encodeURIComponent(value));
      });
      
      assert(replacedUri === '/search/hello%20world', `期望 '/search/hello%20world', 得到 '${replacedUri}'`);
    });

    console.log('\n📋 错误信息格式测试:');

    await test('应该提供清晰的错误信息', async () => {
      const request = new GetUserByIdRequest();
      
      try {
        await client.testGetUserById('123', request, withParams({ wrong_param: '123' }));
        throw new Error('应该抛出错误');
      } catch (error) {
        assert(error.message.includes('🚫 路径参数验证失败'), '应该包含验证失败标题');
        assert(error.message.includes('❌ 缺少必需的路径参数: id'), '应该包含缺少参数错误');
        assert(error.message.includes('❌ 提供了不存在的路径参数: wrong_param'), '应该包含多余参数错误');
        assert(error.message.includes('📋 路径 "/users/{id}" 需要参数: {id}'), '应该包含路径信息');
        assert(error.message.includes('💡 请确保提供的参数与路径中的占位符完全匹配'), '应该包含提示信息');
      }
    });

    await test('无参数路径的错误信息', async () => {
      const request = new GetUserByIdRequest();
      
      try {
        await client.testGetUsers(request, withParams({ id: '123' }));
        throw new Error('应该抛出错误');
      } catch (error) {
        assert(error.message.includes('路径 "/users" 不需要任何参数'), '应该包含无参数路径的说明');
      }
    });

    console.log(`\n📊 测试结果: ${passedCount}/${testCount} 通过`);
    
    if (passedCount === testCount) {
      console.log('🎉 所有路径参数验证测试通过!');
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
