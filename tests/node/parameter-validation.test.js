/**
 * 参数验证测试
 * 验证装饰器对方法参数与路径参数匹配关系的检查
 */

console.log('🧪 测试：HTTP 装饰器参数验证');

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
  console.log('🔧 测试 1: 正确的参数匹配');
  
  class ValidAPI {
    constructor() {}
  }
  
  // 测试正确的参数匹配
  const validTests = [
    {
      decorator: GET('/users/{id}'),
      method: function getUser(id) { return Promise.resolve(); },
      name: 'getUser',
      description: 'GET /users/{id} - 正确匹配 id 参数'
    },
    {
      decorator: POST('/users'),
      method: function createUser() { return Promise.resolve(); },
      name: 'createUser', 
      description: 'POST /users - 没有额外参数（严格模式）'
    },
    {
      decorator: PUT('/users/{id}'),
      method: function updateUser(id) { return Promise.resolve(); },
      name: 'updateUser',
      description: 'PUT /users/{id} - 只有路径参数（严格模式）'
    },
    {
      decorator: DELETE('/users/{id}'),
      method: function deleteUser(id) { return Promise.resolve(); },
      name: 'deleteUser',
      description: 'DELETE /users/{id} - 只有路径参数'
    },
    {
      decorator: GET('/users/{userId}/posts/{postId}'),
      method: function getUserPost(userId, postId) { return Promise.resolve(); },
      name: 'getUserPost',
      description: 'GET /users/{userId}/posts/{postId} - 多个路径参数'
    }
  ];
  
  for (const { decorator, method, name, description } of validTests) {
    try {
      ValidAPI.prototype[name] = method;
      decorator(ValidAPI.prototype, name, {
        value: method,
        configurable: true,
        enumerable: true,
        writable: true
      });
      console.log(`  ✅ ${description}`);
    } catch (error) {
      throw new Error(`${description} 应该是有效的，但抛出错误: ${error.message}`);
    }
  }
  
  console.log('');
  console.log('🔧 测试 2: 缺少路径参数错误检测');
  
  const missingPathParamTests = [
    {
      decorator: GET('/users/{id}'),
      method: function getUser() { return Promise.resolve(); },
      name: 'getUser',
      description: 'GET /users/{id} - 缺少 id 参数'
    },
    {
      decorator: PUT('/users/{userId}/posts/{postId}'),
      method: function updateUserPost(userId) { return Promise.resolve(); },
      name: 'updateUserPost',
      description: 'PUT /users/{userId}/posts/{postId} - 缺少 postId 参数'
    }
  ];
  
  for (const { decorator, method, name, description } of missingPathParamTests) {
    let errorCaught = false;
    try {
      ValidAPI.prototype[name] = method;
      decorator(ValidAPI.prototype, name, {
        value: method,
        configurable: true,
        enumerable: true,
        writable: true
      });
    } catch (error) {
      errorCaught = true;
      if (!error.message.includes('路径参数验证失败')) {
        throw new Error(`${description} 错误信息不正确: ${error.message}`);
      }
      console.log(`  ✅ ${description} - 正确检测到缺少路径参数`);
    }
    
    if (!errorCaught) {
      throw new Error(`${description} 应该抛出缺少路径参数错误，但没有`);
    }
  }
  
  console.log('');
  console.log('🔧 测试 3: 多余参数错误检测（问题案例）');
  
  const extraParamTests = [
    {
      decorator: POST('/system/alerts/{alertId}/ignore'),
      method: function ignoreSystemAlert(alertId, note) { return Promise.resolve(); },
      name: 'ignoreSystemAlert',
      description: 'POST /system/alerts/{alertId}/ignore - note 参数未定义来源'
    },
    {
      decorator: GET('/users/{id}'),
      method: function getUser(id, extra1, extra2) { return Promise.resolve(); },
      name: 'getUser',
      description: 'GET /users/{id} - 多个多余参数'
    },
    {
      decorator: DELETE('/users/{id}'),
      method: function deleteUser(id, shouldConfirm) { return Promise.resolve(); },
      name: 'deleteUser',
      description: 'DELETE /users/{id} - DELETE 方法不应有额外参数'
    }
  ];
  
  for (const { decorator, method, name, description } of extraParamTests) {
    let errorCaught = false;
    try {
      ValidAPI.prototype[name] = method;
      decorator(ValidAPI.prototype, name, {
        value: method,
        configurable: true,
        enumerable: true,
        writable: true
      });
    } catch (error) {
      errorCaught = true;
      if (!error.message.includes('参数验证失败') ||
          !error.message.includes('既不是路径参数，也未明确定义为请求体或查询参数')) {
        throw new Error(`${description} 错误信息不正确: ${error.message}`);
      }
      console.log(`  ✅ ${description} - 正确检测到多余参数`);
    }
    
    if (!errorCaught) {
      throw new Error(`${description} 应该抛出多余参数错误，但没有`);
    }
  }
  
  console.log('');
  console.log('🔧 测试 4: 严格参数验证规则');
  
  // 严格模式：所有非路径参数都必须明确标注
  const strictParamTests = [
    {
      decorator: POST('/users/{id}/activate'),
      method: function activateUser(id, request) { return Promise.resolve(); },
      name: 'activateUser',
      description: 'POST /users/{id}/activate - 未标注的请求体参数应报错',
      shouldPass: false
    },
    {
      decorator: POST('/users/{id}/activate'),
      method: function activateUser(id, request, extra) { return Promise.resolve(); },
      name: 'activateUser2',
      description: 'POST /users/{id}/activate - 多个未标注参数应报错',
      shouldPass: false
    },
    {
      decorator: GET('/users/{id}'),
      method: function getUser(id, extra) { return Promise.resolve(); },
      name: 'getUser2',
      description: 'GET /users/{id} - GET 方法不应有额外参数',
      shouldPass: false
    }
  ];
  
  for (const { decorator, method, name, description, shouldPass } of strictParamTests) {
    let errorCaught = false;
    try {
      ValidAPI.prototype[name] = method;
      decorator(ValidAPI.prototype, name, {
        value: method,
        configurable: true,
        enumerable: true,
        writable: true
      });
    } catch (error) {
      errorCaught = true;
      if (shouldPass) {
        throw new Error(`${description} 应该通过验证，但抛出错误: ${error.message}`);
      }
    }
    
    if (shouldPass && !errorCaught) {
      console.log(`  ✅ ${description} - 验证通过`);
    } else if (!shouldPass && errorCaught) {
      console.log(`  ✅ ${description} - 正确检测到错误`);
    } else if (!shouldPass && !errorCaught) {
      throw new Error(`${description} 应该抛出错误，但没有`);
    }
  }
  
  console.log('');
  console.log('🔧 测试 5: 忽略 options 参数');
  
  const optionsTests = [
    {
      decorator: GET('/users/{id}'),
      method: function getUser(id, ...options) { return Promise.resolve(); },
      name: 'getUserWithOptions',
      description: 'GET /users/{id} - 正确忽略 ...options 参数'
    },
    {
      decorator: POST('/users'),
      method: function createUser(...options) { return Promise.resolve(); },
      name: 'createUserWithOptions', 
      description: 'POST /users - 正确忽略 ...options 参数'
    }
  ];
  
  for (const { decorator, method, name, description } of optionsTests) {
    try {
      ValidAPI.prototype[name] = method;
      decorator(ValidAPI.prototype, name, {
        value: method,
        configurable: true,
        enumerable: true,
        writable: true
      });
      console.log(`  ✅ ${description}`);
    } catch (error) {
      throw new Error(`${description} 应该是有效的，但抛出错误: ${error.message}`);
    }
  }
  
  console.log('');
  console.log('🎉 HTTP 装饰器参数验证测试完成!');
  console.log('');
  console.log('📊 参数验证规则（严格模式）:');
  console.log('  ✅ 路径中的所有参数必须在方法签名中定义');
  console.log('  ✅ 方法中的所有非路径参数必须明确标注来源');
  console.log('  ✅ 不允许未标注的隐式请求体参数');
  console.log('  ✅ 所有 HTTP 方法都要求明确的参数定义');
  console.log('  ✅ 自动忽略 ...options 参数');
  console.log('  ✅ 提供详细的错误信息和修复建议');
  console.log('');
  console.log('🎯 结论: HTTP 装饰器执行严格的参数验证，强制要求明确的 API 参数定义!');
  
  console.log('✅ HTTP 装饰器参数验证测试 - 通过');
  
} catch (error) {
  console.error('❌ 测试失败:', error.message);
  console.error('错误堆栈:', error.stack);
  process.exit(1);
}
