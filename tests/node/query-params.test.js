/**
 * 查询参数测试
 * 测试 withQuery 只支持 Record<string, string> 类型
 */

const path = require('path');

// 动态导入编译后的模块
async function runTests() {
  try {
    console.log('🧪 开始查询参数测试...\n');
    
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
    const { withQuery } = require('../../dist/cjs/index.js');

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

    console.log('🔍 withQuery 功能测试:');

    test('应该支持基本查询参数', () => {
      const config = { uri: '/api/users', headers: {} };
      withQuery({ page: '1', size: '10' })(config);
      assert(config.query === 'page=1&size=10', `期望 'page=1&size=10', 得到 '${config.query}'`);
    });

    test('应该过滤 undefined 和 null 值', () => {
      const config = { uri: '/api/users', headers: {} };
      withQuery({ 
        page: '1', 
        filter: undefined, 
        sort: null, 
        status: 'active' 
      })(config);
      assert(config.query === 'page=1&status=active', `期望 'page=1&status=active', 得到 '${config.query}'`);
    });

    test('应该正确进行 URL 编码', () => {
      const config = { uri: '/api/search', headers: {} };
      withQuery({ 
        q: 'hello world',
        category: 'food & drink',
        tags: 'tag1,tag2'
      })(config);
      const expected = 'q=hello%20world&category=food%20%26%20drink&tags=tag1%2Ctag2';
      assert(config.query === expected, `期望 '${expected}', 得到 '${config.query}'`);
    });

    test('应该处理空对象', () => {
      const config = { uri: '/api/users', headers: {} };
      withQuery({})(config);
      assert(config.query === '', `期望空字符串, 得到 '${config.query}'`);
    });

    test('应该支持特殊字符', () => {
      const config = { uri: '/api/data', headers: {} };
      withQuery({ 
        symbols: '!@#$%^&*()',
        chinese: '你好世界',
        emoji: '😀🎉'
      })(config);
      // 检查是否包含编码后的内容
      assert(config.query.includes('symbols='), '应该包含 symbols 参数');
      assert(config.query.includes('chinese='), '应该包含 chinese 参数');
      assert(config.query.includes('emoji='), '应该包含 emoji 参数');
      assert(config.query.includes('%'), '应该包含 URL 编码字符');
    });

    test('应该保持参数顺序（基于 Object.entries）', () => {
      const config = { uri: '/api/test', headers: {} };
      withQuery({ 
        a: '1',
        b: '2', 
        c: '3'
      })(config);
      assert(config.query === 'a=1&b=2&c=3', `期望 'a=1&b=2&c=3', 得到 '${config.query}'`);
    });

    console.log(`\n📊 测试结果: ${passedCount}/${testCount} 通过`);
    
    if (passedCount === testCount) {
      console.log('🎉 所有查询参数测试通过!');
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
