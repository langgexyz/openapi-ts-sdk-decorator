/**
 * OpenAPI TypeScript SDK Decorator 测试套件
 * 
 * 统一入口文件，支持运行所有测试
 */

const path = require('path');

async function runAllTests() {
  console.log('🧪 OpenAPI TypeScript SDK Decorator - 完整测试套件');
  console.log('='.repeat(80));
  console.log('');
  
  try {
    // 运行 Node.js 测试
    console.log('🖥️  Node.js 环境测试');
    console.log('-'.repeat(40));
    
    const nodeTests = require('./node/index.js');
    await nodeTests.runAllTests();
    
    console.log('');
    console.log('🌐 浏览器环境测试');
    console.log('-'.repeat(40));
    console.log('浏览器测试需要手动运行：');
    console.log('  🔗 打开: tests/browser/index.html');
    console.log('  📖 或运行: npm run test:browser');
    
  } catch (error) {
    console.error('❌ 测试执行失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'node':
      require('./node/index.js');
      break;
    case 'browser':
      console.log('🌐 启动浏览器测试...');
      console.log('请在浏览器中打开: tests/browser/index.html');
      break;
    default:
      runAllTests().catch(console.error);
  }
}

module.exports = { runAllTests };
