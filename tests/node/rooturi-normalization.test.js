/**
 * @RootUri 路径格式验证测试
 * 验证路径格式检查和错误提示功能
 */

console.log('🧪 测试：@RootUri 路径格式验证');

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
const { RootUri, getRootUri, getAllRootUriMappings } = require('../../dist/cjs/index.js');

try {
  console.log('');
  console.log('🔧 测试 1: 正确的路径格式验证');
  
  // 清理之前的全局状态
  if ((globalThis).__sdkRootUris) {
    (globalThis).__sdkRootUris.clear();
  }
  
  // 测试正确的路径格式
  class ValidAPIClass1 {
    constructor() {}
  }
  const decorator1 = RootUri('/api/users');
  decorator1(ValidAPIClass1);
  
  const rootUri1 = getRootUri(ValidAPIClass1);
  console.log('  📊 输入路径: "/api/users"');
  console.log('  📊 存储结果: "' + rootUri1 + '"');
  
  if (rootUri1 !== '/api/users') {
    throw new Error(`正确路径存储失败: 期望 "/api/users"，得到 "${rootUri1}"`);
  }
  console.log('  ✅ 正确格式路径处理成功');
  
  console.log('');
  console.log('🔧 测试 2: 无前导斜杠错误检测');
  
  let errorCaught = false;
  try {
    class InvalidAPIClass1 {
      constructor() {}
    }
    const invalidDecorator = RootUri('api/users');
    invalidDecorator(InvalidAPIClass1);
  } catch (error) {
    errorCaught = true;
    console.log('  📊 错误信息预览:');
    console.log('    ' + error.message.split('\n')[0]);
    console.log('    ' + error.message.split('\n')[1]);
    console.log('    ' + error.message.split('\n')[2]);
    
    if (!error.message.includes('必须以 \'/\' 开头') || 
        !error.message.includes('建议修改为: "/api/users"')) {
      throw new Error(`错误信息不完整: ${error.message}`);
    }
  }
  
  if (!errorCaught) {
    throw new Error('应该抛出格式错误，但没有');
  }
  console.log('  ✅ 无前导斜杠错误检测正确');
  
         console.log('');
         console.log('🔧 测试 3: 空字符串错误检测');

         let emptyStringErrorCaught = false;
         try {
           class EmptyPathAPI {
             constructor() {}
           }
           const emptyDecorator = RootUri('');
           emptyDecorator(EmptyPathAPI);
         } catch (error) {
           emptyStringErrorCaught = true;
           console.log('  📊 错误信息: ' + error.message.split('\n')[0]);

           if (!error.message.includes('路径不能为空') || 
               !error.message.includes("@RootUri('/') 表示根路径")) {
             throw new Error(`空字符串错误信息不正确: ${error.message}`);
           }
         }

         if (!emptyStringErrorCaught) {
           throw new Error('应该抛出空字符串错误，但没有');
         }
         console.log('  ✅ 空字符串错误检测正确');
  
  console.log('');
  console.log('🔧 测试 4: 空白字符错误检测');

  let whitespaceErrorCaught = false;
  try {
    class WhitespaceAPI {
      constructor() {}
    }
    const whitespaceDecorator = RootUri('   ');
    whitespaceDecorator(WhitespaceAPI);
  } catch (error) {
    whitespaceErrorCaught = true;
    console.log('  📊 错误信息: ' + error.message.split('\n')[0]);

    if (!error.message.includes('不能只包含空白字符')) {
      throw new Error(`空白字符错误信息不正确: ${error.message}`);
    }
  }

  if (!whitespaceErrorCaught) {
    throw new Error('应该抛出空白字符错误，但没有');
  }
  console.log('  ✅ 空白字符错误检测正确');
  
  console.log('');
  console.log('🔧 测试 5: 根路径处理');
  
  class RootAPISlash {
    constructor() {}
  }
  
  const rootDecorator = RootUri('/');
  rootDecorator(RootAPISlash);
  
  const slashRoot = getRootUri(RootAPISlash);
  console.log('  📊 输入路径: "/"');
  console.log('  📊 存储结果: "' + slashRoot + '"');
  
  if (slashRoot !== '/') {
    throw new Error(`根路径处理失败: 期望 "/"，得到 "${slashRoot}"`);
  }
  
  console.log('  ✅ 根路径处理正确');
  
  console.log('');
  console.log('🔧 测试 6: 复杂路径格式验证');
  
  class ComplexValidAPI {
    constructor() {}
  }
  
  const complexDecorator = RootUri('/api/v1/admin/users');
  complexDecorator(ComplexValidAPI);
  
  const complexRoot = getRootUri(ComplexValidAPI);
  console.log('  📊 输入路径: "/api/v1/admin/users"');
  console.log('  📊 存储结果: "' + complexRoot + '"');
  
  if (complexRoot !== '/api/v1/admin/users') {
    throw new Error(`复杂路径处理失败: 期望 "/api/v1/admin/users"，得到 "${complexRoot}"`);
  }
  
  console.log('  ✅ 复杂路径处理正确');
  
  console.log('');
  console.log('🔧 测试 7: 尾部斜杠错误检测');
  
  let trailingSlashErrorCaught = false;
  try {
    class InvalidTrailingSlashAPI {
      constructor() {}
    }
    const trailingSlashDecorator = RootUri('/api/users/');
    trailingSlashDecorator(InvalidTrailingSlashAPI);
  } catch (error) {
    trailingSlashErrorCaught = true;
    console.log('  📊 尾部斜杠错误信息:');
    console.log('    ' + error.message.split('\n')[0]);
    console.log('    ' + error.message.split('\n')[1]);
    console.log('    ' + error.message.split('\n')[2]);
    
    if (!error.message.includes('不能以 \'/\' 结尾') || 
        !error.message.includes('建议修改为: "/api/users"')) {
      throw new Error(`尾部斜杠错误信息不正确: ${error.message}`);
    }
  }
  
  if (!trailingSlashErrorCaught) {
    throw new Error('应该抛出尾部斜杠错误，但没有');
  }
  console.log('  ✅ 尾部斜杠错误检测正确');
  
  console.log('');
  console.log('🔧 测试 8: 连续斜杠错误检测');
  
  let doubleSlashErrorCaught = false;
  try {
    class InvalidDoubleSlashAPI {
      constructor() {}
    }
    const doubleSlashDecorator = RootUri('/api//users');
    doubleSlashDecorator(InvalidDoubleSlashAPI);
  } catch (error) {
    doubleSlashErrorCaught = true;
    console.log('  📊 连续斜杠错误信息:');
    console.log('    ' + error.message.split('\n')[0]);
    console.log('    ' + error.message.split('\n')[1]);
    
    if (!error.message.includes('不能包含连续的斜杠')) {
      throw new Error(`连续斜杠错误信息不正确: ${error.message}`);
    }
  }
  
  if (!doubleSlashErrorCaught) {
    throw new Error('应该抛出连续斜杠错误，但没有');
  }
  console.log('  ✅ 连续斜杠错误检测正确');
  
         console.log('');
         console.log('🔧 测试 9: 非字符串参数错误检测 (仅限 JavaScript 环境)');

         let typeErrorCaught = false;
         try {
           class InvalidTypeAPI {
             constructor() {}
           }
           const typeDecorator = RootUri(123);  // 传入数字而不是字符串
           typeDecorator(InvalidTypeAPI);
         } catch (error) {
           typeErrorCaught = true;
           console.log('  📊 类型错误信息: ' + error.message);

           // 注意：在 TypeScript 环境中，这种错误会在编译时被捕获
           // 这个测试主要验证 JavaScript 运行时行为
           if (error.message.includes('trim is not a function')) {
             console.log('  ℹ️  错误被自然检测 (trim 方法不存在)');
           } else {
             throw new Error(`意外的错误信息: ${error.message}`);
           }
         }

         if (!typeErrorCaught) {
           throw new Error('应该抛出类型错误，但没有');
         }
         console.log('  ✅ 非字符串参数错误检测正确 (JavaScript 环境)');
  
  console.log('');
  console.log('🔧 测试 10: 全局映射表验证');
  
  const globalMappings = getAllRootUriMappings();
  console.log('  📊 全局映射数量:', globalMappings.size);
  
  const expectedMappings = {
    'ValidAPIClass1': '/api/users',
    'RootAPISlash': '/',
    'ComplexValidAPI': '/api/v1/admin/users'
  };
  
  for (const [className, expectedPath] of Object.entries(expectedMappings)) {
    const actualPath = globalMappings.get(className);
    console.log('  📊 ' + className + ': "' + actualPath + '"');
    
    if (actualPath !== expectedPath) {
      throw new Error(`全局映射不正确: ${className} 期望 "${expectedPath}"，得到 "${actualPath}"`);
    }
  }
  
  console.log('  ✅ 全局映射表验证通过');
  
  console.log('');
  console.log('🎉 @RootUri 路径格式验证测试完成!');
  console.log('');
  console.log('📊 格式验证规则:');
  console.log('  ✅ 路径必须以 "/" 开头，否则抛出明确错误');
  console.log('  ✅ 路径不能以 "/" 结尾（根路径 "/" 除外）');
  console.log('  ✅ 空字符串被严格拒绝，不会被"修复"');
  console.log('  ✅ 空白字符被严格拒绝，不会被"修复"');
  console.log('  ✅ 正确格式路径保持不变');
  console.log('  ✅ 连续斜杠被检测并报错');
  console.log('  ✅ 非字符串参数被自然检测并报错');
  console.log('  ✅ 错误信息包含具体的修复建议');
  console.log('  ✅ 全局映射表只包含有效路径');
  console.log('');
  console.log('🎯 结论: @RootUri 装饰器执行严格的格式验证，确保 API 路径规范!');
  
  console.log('✅ @RootUri 路径格式验证测试 - 通过');
  
} catch (error) {
  console.error('❌ 测试失败:', error.message);
  process.exit(1);
}
