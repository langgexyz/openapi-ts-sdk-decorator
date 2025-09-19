/**
 * HTTP 方法装饰器路径格式验证测试
 * 验证 @GET、@POST、@PUT、@DELETE、@PATCH 等装饰器的路径格式检查
 */

console.log('🧪 测试：HTTP 方法装饰器路径格式验证');

// 编译并导入模块
const { execSync } = require('child_process');

console.log('📦 编译 TypeScript 代码...');
try {
  const path = require('path');
  const projectRoot = path.resolve(__dirname, '../..');
  execSync('npm run build', { cwd: projectRoot, stdio: 'pipe' });
  console.log('✅ 编译成功!');
} catch (error) {
  console.error('❌ 编译失败:', error.message);
  process.exit(1);
}

// 导入装饰器
const { GET, POST, PUT, DELETE, PATCH } = require('../../dist/cjs/index.js');

try {
  console.log('');
  console.log('🔧 测试 1: 正确的路径格式验证');
  
  class ValidAPI {
    constructor() {}
  }
  
  // 测试正确的路径格式
  const validDecorators = [
    { decorator: GET('/api/users'), method: 'GET', path: '/api/users' },
    { decorator: POST('/api/users'), method: 'POST', path: '/api/users' },
    { decorator: PUT('/api/users/{id}'), method: 'PUT', path: '/api/users/{id}' },
    { decorator: DELETE('/api/users/{id}'), method: 'DELETE', path: '/api/users/{id}' },
    { decorator: PATCH('/api/users/{id}'), method: 'PATCH', path: '/api/users/{id}' },
    { decorator: GET('/'), method: 'GET', path: '/' }  // 根路径
  ];
  
  for (const { decorator, method, path } of validDecorators) {
    try {
      decorator(ValidAPI.prototype, 'testMethod', {
        value: function() { return Promise.resolve(); }
      });
      console.log(`  ✅ ${method}("${path}") - 格式正确`);
    } catch (error) {
      throw new Error(`${method}("${path}") 应该是有效的，但抛出错误: ${error.message}`);
    }
  }
  
  console.log('');
  console.log('🔧 测试 2: 无前导斜杠错误检测');
  
  const invalidStartTests = [
    { method: 'GET', path: 'api/users' },
    { method: 'POST', path: 'users' },
    { method: 'PUT', path: 'api/users/{id}' },
    { method: 'DELETE', path: 'users/{id}' },
    { method: 'PATCH', path: 'api' }
  ];
  
  for (const { method, path } of invalidStartTests) {
    let errorCaught = false;
    try {
      const decoratorMap = { GET, POST, PUT, DELETE, PATCH };
      const decorator = decoratorMap[method](path);
      decorator(ValidAPI.prototype, 'testMethod', {
        value: function() { return Promise.resolve(); }
      });
    } catch (error) {
      errorCaught = true;
      if (!error.message.includes(`@${method} 路径必须以 '/' 开头`) ||
          !error.message.includes(`建议修改为: "/${path}"`)) {
        throw new Error(`${method} 路径验证错误信息不正确: ${error.message}`);
      }
      console.log(`  ✅ ${method}("${path}") - 无前导斜杠错误检测正确`);
    }
    
    if (!errorCaught) {
      throw new Error(`${method}("${path}") 应该抛出无前导斜杠错误，但没有`);
    }
  }
  
  console.log('');
  console.log('🔧 测试 3: 尾部斜杠错误检测');
  
  const invalidEndTests = [
    { method: 'GET', path: '/api/users/' },
    { method: 'POST', path: '/users/' },
    { method: 'PUT', path: '/api/users/{id}/' },
    { method: 'DELETE', path: '/users/{id}/' },
    { method: 'PATCH', path: '/api/' }
  ];
  
  for (const { method, path } of invalidEndTests) {
    let errorCaught = false;
    try {
      const decoratorMap = { GET, POST, PUT, DELETE, PATCH };
      const decorator = decoratorMap[method](path);
      decorator(ValidAPI.prototype, 'testMethod', {
        value: function() { return Promise.resolve(); }
      });
    } catch (error) {
      errorCaught = true;
      const expectedCorrected = path.slice(0, -1);
      if (!error.message.includes(`@${method} 路径不能以 '/' 结尾`) ||
          !error.message.includes(`建议修改为: "${expectedCorrected}"`)) {
        throw new Error(`${method} 尾部斜杠错误信息不正确: ${error.message}`);
      }
      console.log(`  ✅ ${method}("${path}") - 尾部斜杠错误检测正确`);
    }
    
    if (!errorCaught) {
      throw new Error(`${method}("${path}") 应该抛出尾部斜杠错误，但没有`);
    }
  }
  
  console.log('');
  console.log('🔧 测试 4: 连续斜杠错误检测');
  
  const doubleSlashTests = [
    { method: 'GET', path: '/api//users' },
    { method: 'POST', path: '/users//create' },
    { method: 'PUT', path: '/api///users/{id}' },
    { method: 'DELETE', path: '//users/{id}' },
    { method: 'PATCH', path: '/api/users//{id}//update' }
  ];
  
  for (const { method, path } of doubleSlashTests) {
    let errorCaught = false;
    try {
      const decoratorMap = { GET, POST, PUT, DELETE, PATCH };
      const decorator = decoratorMap[method](path);
      decorator(ValidAPI.prototype, 'testMethod', {
        value: function() { return Promise.resolve(); }
      });
    } catch (error) {
      errorCaught = true;
      if (!error.message.includes(`@${method} 路径不能包含连续的斜杠`)) {
        throw new Error(`${method} 连续斜杠错误信息不正确: ${error.message}`);
      }
      console.log(`  ✅ ${method}("${path}") - 连续斜杠错误检测正确`);
    }
    
    if (!errorCaught) {
      throw new Error(`${method}("${path}") 应该抛出连续斜杠错误，但没有`);
    }
  }
  
  console.log('');
  console.log('🔧 测试 5: 空路径错误检测');
  
  const emptyPathTests = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
  
  for (const method of emptyPathTests) {
    let errorCaught = false;
    try {
      const decoratorMap = { GET, POST, PUT, DELETE, PATCH };
      const decorator = decoratorMap[method]('');
      decorator(ValidAPI.prototype, 'testMethod', {
        value: function() { return Promise.resolve(); }
      });
    } catch (error) {
      errorCaught = true;
      if (!error.message.includes(`@${method} 路径不能为空`) ||
          !error.message.includes(`建议使用: @${method}('/') 表示根路径`)) {
        throw new Error(`${method} 空路径错误信息不正确: ${error.message}`);
      }
      console.log(`  ✅ ${method}("") - 空路径错误检测正确`);
    }
    
    if (!errorCaught) {
      throw new Error(`${method}("") 应该抛出空路径错误，但没有`);
    }
  }
  
  console.log('');
  console.log('🔧 测试 6: 空白字符路径错误检测');
  
  for (const method of emptyPathTests) {
    let errorCaught = false;
    try {
      const decoratorMap = { GET, POST, PUT, DELETE, PATCH };
      const decorator = decoratorMap[method]('   ');
      decorator(ValidAPI.prototype, 'testMethod', {
        value: function() { return Promise.resolve(); }
      });
    } catch (error) {
      errorCaught = true;
      if (!error.message.includes(`@${method} 路径不能只包含空白字符`)) {
        throw new Error(`${method} 空白字符错误信息不正确: ${error.message}`);
      }
      console.log(`  ✅ ${method}("   ") - 空白字符错误检测正确`);
    }
    
    if (!errorCaught) {
      throw new Error(`${method}("   ") 应该抛出空白字符错误，但没有`);
    }
  }
  
  console.log('');
  console.log('🔧 测试 7: 非字符串参数错误检测 (JavaScript 环境)');
  console.log('  ℹ️  在 TypeScript 中，这种错误会在编译时被捕获');
  
  const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
  for (const method of httpMethods) {
    let errorCaught = false;
    try {
      const decoratorMap = { GET, POST, PUT, DELETE, PATCH };
      const decorator = decoratorMap[method](123);  // 传入数字
      decorator(ValidAPI.prototype, 'testMethod', {
        value: function() { return Promise.resolve(); }
      });
    } catch (error) {
      errorCaught = true;
      // 现在预期的错误是 "path.trim is not a function"
      if (error.message.includes('trim is not a function')) {
        console.log(`  ✅ ${method}(123) - 非字符串参数被自然检测 (trim 方法不存在)`);
      } else {
        throw new Error(`${method} 意外的错误信息: ${error.message}`);
      }
    }
    
    if (!errorCaught) {
      throw new Error(`${method}(123) 应该抛出错误，但没有`);
    }
  }
  
  console.log('');
  console.log('🔧 测试 8: 复杂路径格式验证');
  
  const complexValidPaths = [
    '/api/v1/users',
    '/api/v2/admin/users/{id}',
    '/api/v1/products/{productId}/reviews/{reviewId}',
    '/health',
    '/auth/login'
  ];
  
  for (const path of complexValidPaths) {
    try {
      GET(path)(ValidAPI.prototype, 'testMethod', {
        value: function() { return Promise.resolve(); }
      });
      console.log(`  ✅ GET("${path}") - 复杂路径格式正确`);
    } catch (error) {
      throw new Error(`GET("${path}") 应该是有效的，但抛出错误: ${error.message}`);
    }
  }
  
  console.log('');
  console.log('🎉 HTTP 方法装饰器路径格式验证测试完成!');
  console.log('');
  console.log('📊 格式验证规则:');
  console.log('  ✅ 所有 HTTP 方法装饰器路径必须以 "/" 开头');
  console.log('  ✅ 路径不能以 "/" 结尾（根路径 "/" 除外）');
  console.log('  ✅ 空路径和空白字符路径被严格拒绝');
  console.log('  ✅ 路径不能包含连续的斜杠');
  console.log('  ✅ 非字符串参数在运行时被自然检测');
  console.log('  ✅ 错误信息包含具体的修复建议');
  console.log('  ✅ 支持复杂的 RESTful 路径格式');
  console.log('');
  console.log('🎯 结论: HTTP 方法装饰器执行严格的路径格式验证，确保 API 路径规范!');
  
  console.log('✅ HTTP 方法装饰器路径格式验证测试 - 通过');
  
} catch (error) {
  console.error('❌ 测试失败:', error.message);
  process.exit(1);
}
