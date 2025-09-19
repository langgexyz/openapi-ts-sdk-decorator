/**
 * Node.js 测试套件入口
 * 
 * 运行所有 Node.js 环境下的装饰器测试
 */

const path = require('path');

const tests = [
  { name: 'TypeScript 5.x 兼容性测试', file: './compatibility.test.js' },
  { name: '装饰器基础功能测试', file: './decorator-basics.test.js' },
  { name: '命名规则一致性测试', file: './naming-rules.test.js' },
  { name: '函数命名验证测试', file: './function-naming.test.js' },
  { name: '@RootUri 路径格式验证测试', file: './rooturi-normalization.test.js' },
  { name: 'HTTP 方法装饰器路径验证测试', file: './http-methods-validation.test.js' }
];

async function runAllTests() {
  console.log('🧪 OpenAPI TypeScript SDK Decorator - Node.js 测试套件');
  console.log('=' .repeat(80));
  console.log('');
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    console.log(`📋 运行: ${test.name}`);
    console.log('-'.repeat(60));
    
    try {
      // 清除 require 缓存以确保每次测试都是干净的
      const testPath = path.resolve(__dirname, test.file);
      delete require.cache[testPath];
      
      // 执行测试
      require(test.file);
      
      console.log(`✅ ${test.name} - 通过`);
      passedTests++;
    } catch (error) {
      console.error(`❌ ${test.name} - 失败:`, error.message);
    }
    
    console.log('');
  }
  
  console.log('📊 测试结果总结');
  console.log('=' .repeat(80));
  console.log(`总测试数: ${totalTests}`);
  console.log(`通过: ${passedTests}`);
  console.log(`失败: ${totalTests - passedTests}`);
  console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('🎉 所有测试通过！');
    process.exit(0);
  } else {
    console.log('❌ 部分测试失败！');
    process.exit(1);
  }
}

// 如果直接运行此文件，则执行所有测试
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests, tests };
