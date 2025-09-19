const { OpenAPINamingRule, OpenAPINamingRuleImpl } = require('../../dist/cjs/src/rules');

// 使用真实的CLI命名规则

/**
 * 测试函数名规范验证
 */
async function testFunctionNameValidation() {
  console.log('\n🔍 函数名规范验证测试');
  console.log('='.repeat(50));
  
  const namingRule = OpenAPINamingRule;
  
  // 测试用例数据
  const testCases = [
    // 正确的函数名
    {
      actualName: 'getUsers',
      operation: { method: 'get', path: '/api/users/', summary: '获取用户列表' },
      shouldPass: true,
      description: '正确的GET方法命名'
    },
    {
      actualName: 'createUsers',
      operation: { method: 'post', path: '/api/users/', summary: '创建用户' },
      shouldPass: true,
      description: '正确的POST方法命名'
    },
    {
      actualName: 'getUsersById',
      operation: { 
        method: 'get', 
        path: '/api/users/{id}', 
        summary: '获取单个用户',
        parameters: [{name: 'id', in: 'path', type: 'string'}]
      },
      shouldPass: true,
      description: '正确的带路径参数GET方法命名'
    },
    {
      actualName: 'updateUsersById',
      operation: { 
        method: 'put', 
        path: '/api/users/{id}', 
        summary: '更新用户',
        parameters: [{name: 'id', in: 'path', type: 'string'}]
      },
      shouldPass: true,
      description: '正确的PUT方法命名'
    },
    {
      actualName: 'deleteUsersById',
      operation: { 
        method: 'delete', 
        path: '/api/users/{id}', 
        summary: '删除用户',
        parameters: [{name: 'id', in: 'path', type: 'string'}]
      },
      shouldPass: true,
      description: '正确的DELETE方法命名'
    },
    {
      actualName: 'patchUsersById',
      operation: { 
        method: 'patch', 
        path: '/api/users/{id}', 
        summary: '部分更新用户',
        parameters: [{name: 'id', in: 'path', type: 'string'}]
      },
      shouldPass: true,
      description: '正确的PATCH方法命名'
    },
    
    // 错误的函数名
    {
      actualName: 'fetchUsers',  // 应该是 getUsers
      operation: { method: 'get', path: '/api/users/', summary: '获取用户列表' },
      shouldPass: false,
      description: '错误的GET方法命名（使用fetchUsers而不是getUsers）'
    },
    {
      actualName: 'addUser',     // 应该是 createUsers
      operation: { method: 'post', path: '/api/users/', summary: '创建用户' },
      shouldPass: false,
      description: '错误的POST方法命名（使用addUser而不是createUsers）'
    },
    {
      actualName: 'modifyUsersById',  // 应该是 updateUsersById
      operation: { 
        method: 'put', 
        path: '/api/users/{id}', 
        summary: '更新用户',
        parameters: [{name: 'id', in: 'path', type: 'string'}]
      },
      shouldPass: false,
      description: '错误的PUT方法命名（使用modifyUsersById而不是updateUsersById）'
    },
    {
      actualName: 'removeUsersById', // 应该是 deleteUsersById
      operation: { 
        method: 'delete', 
        path: '/api/users/{id}', 
        summary: '删除用户',
        parameters: [{name: 'id', in: 'path', type: 'string'}]
      },
      shouldPass: false,
      description: '错误的DELETE方法命名（使用removeUsersById而不是deleteUsersById）'
    },
    {
      actualName: 'editUsersById',   // 应该是 patchUsersById
      operation: { 
        method: 'patch', 
        path: '/api/users/{id}', 
        summary: '部分更新用户',
        parameters: [{name: 'id', in: 'path', type: 'string'}]
      },
      shouldPass: false,
      description: '错误的PATCH方法命名（使用editUsersById而不是patchUsersById）'
    },
    
    // 复杂路径的测试
    {
      actualName: 'getProductsInventoryByWarehouseIdId',
      operation: { 
        method: 'get', 
        path: '/api/products/{id}/inventory/{warehouseId}', 
        summary: '获取产品库存',
        parameters: [
          {name: 'warehouseId', in: 'path', type: 'string'},
          {name: 'id', in: 'path', type: 'string'}
        ]
      },
      shouldPass: true,
      description: '复杂路径的正确命名'
    },
    {
      actualName: 'getProductInventory',  // 应该包含所有路径参数
      operation: { 
        method: 'get', 
        path: '/api/products/{id}/inventory/{warehouseId}', 
        summary: '获取产品库存',
        parameters: [
          {name: 'warehouseId', in: 'path', type: 'string'},
          {name: 'id', in: 'path', type: 'string'}
        ]
      },
      shouldPass: false,
      description: '复杂路径的错误命名（缺少路径参数）'
    }
  ];
  
  let passedTests = 0;
  let totalTests = testCases.length;
  
  console.log(`\n📋 开始测试 ${totalTests} 个函数名规范用例...\n`);
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const testNum = i + 1;
    
    console.log(`🔄 测试 ${testNum}: ${testCase.description}`);
    console.log(`   实际函数名: ${testCase.actualName}`);
    console.log(`   API操作: ${testCase.operation.method.toUpperCase()} ${testCase.operation.path}`);
    
    try {
      const result = namingRule.validateMethodName(testCase.actualName, testCase.operation);
      
      if (testCase.shouldPass) {
        // 期望通过的测试
        if (result.isValid) {
          console.log('   ✅ 通过 - 函数名符合规范');
          passedTests++;
        } else {
          console.log('   ❌ 失败 - 应该通过但被拒绝');
          console.log(`   错误信息: ${result.errors.join(', ')}`);
          console.log(`   建议: ${result.suggestions.join(', ')}`);
        }
      } else {
        // 期望失败的测试
        if (!result.isValid) {
          console.log('   ✅ 通过 - 正确识别了命名错误');
          console.log(`   错误信息: ${result.errors.join(', ')}`);
          console.log(`   建议: ${result.suggestions.join(', ')}`);
          passedTests++;
        } else {
          console.log('   ❌ 失败 - 应该拒绝但被接受');
        }
      }
    } catch (error) {
      console.log(`   💥 异常 - ${error.message}`);
    }
    
    console.log(''); // 空行分隔
  }
  
  // 测试总结
  console.log('🏁 函数名规范验证测试总结');
  console.log('-'.repeat(30));
  console.log(`✅ 通过测试: ${passedTests}/${totalTests}`);
  console.log(`❌ 失败测试: ${totalTests - passedTests}/${totalTests}`);
  console.log(`📊 通过率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 所有函数名规范测试通过！命名规则验证工作正常！');
  } else {
    console.log('\n⚠️  部分测试失败，请检查命名规则实现。');
  }
  
  return passedTests === totalTests;
}

/**
 * 测试生成的方法名
 */
async function testGeneratedMethodNames() {
  console.log('\n🏗️ 测试CLI生成的方法名');
  console.log('='.repeat(50));
  
  const namingRule = OpenAPINamingRule;
  
  // 基于实际OpenAPI规范的测试用例
  const realCases = [
    { method: 'get', path: '/api/users/', expected: 'getUsers', parameters: [] },
    { method: 'post', path: '/api/users/', expected: 'createUsers', parameters: [] },
    { 
      method: 'get', 
      path: '/api/users/{id}', 
      expected: 'getUsersById',
      parameters: [{name: 'id', in: 'path', type: 'string'}]
    },
    { 
      method: 'put', 
      path: '/api/users/{id}', 
      expected: 'updateUsersById',
      parameters: [{name: 'id', in: 'path', type: 'string'}]
    },
    { 
      method: 'delete', 
      path: '/api/users/{id}', 
      expected: 'deleteUsersById',
      parameters: [{name: 'id', in: 'path', type: 'string'}]
    },
    { 
      method: 'patch', 
      path: '/api/users/{id}', 
      expected: 'patchUsersById',
      parameters: [{name: 'id', in: 'path', type: 'string'}]
    },
    
    // 复杂路径测试
    { 
      method: 'get', 
      path: '/api/products/{id}/inventory/{warehouseId}', 
      expected: 'getProductsInventoryByWarehouseIdId',
      parameters: [
        {name: 'warehouseId', in: 'path', type: 'string'},
        {name: 'id', in: 'path', type: 'string'}
      ]
    },
    { 
      method: 'post', 
      path: '/api/warehouses/{warehouseId}/batches/', 
      expected: 'createWarehousesBatchesByWarehouseId',
      parameters: [{name: 'warehouseId', in: 'path', type: 'string'}]
    },
    { 
      method: 'delete', 
      path: '/api/warehouses/{warehouseId}/expired/batches/{batchId}/categories/{categoryId}', 
      expected: 'deleteWarehousesExpiredBatchesCategoriesByWarehouseIdBatchIdCategoryId',
      parameters: [
        {name: 'warehouseId', in: 'path', type: 'string'},
        {name: 'batchId', in: 'path', type: 'string'},
        {name: 'categoryId', in: 'path', type: 'string'}
      ]
    }
  ];
  
  console.log(`\n📋 测试 ${realCases.length} 个方法名生成规则...\n`);
  
  let generationTests = 0;
  for (let i = 0; i < realCases.length; i++) {
    const testCase = realCases[i];
    const testNum = i + 1;
    
    console.log(`🔄 测试 ${testNum}: ${testCase.method.toUpperCase()} ${testCase.path}`);
    
    try {
      const generated = namingRule.generateMethodName({
        method: testCase.method,
        path: testCase.path,
        summary: `Test ${testCase.method} operation`,
        parameters: testCase.parameters || []
      });
      
      console.log(`   期望结果: ${testCase.expected}`);
      console.log(`   生成结果: ${generated}`);
      
      if (generated === testCase.expected) {
        console.log('   ✅ 通过 - 方法名生成正确');
        generationTests++;
      } else {
        console.log('   ❌ 失败 - 方法名生成不符合预期');
      }
    } catch (error) {
      console.log(`   💥 异常 - ${error.message}`);
    }
    
    console.log(''); // 空行分隔
  }
  
  console.log('🏁 方法名生成测试总结');
  console.log('-'.repeat(30));
  console.log(`✅ 通过测试: ${generationTests}/${realCases.length}`);
  console.log(`❌ 失败测试: ${realCases.length - generationTests}/${realCases.length}`);
  console.log(`📊 通过率: ${((generationTests / realCases.length) * 100).toFixed(1)}%`);
  
  return generationTests === realCases.length;
}

// 主测试函数
async function main() {
  console.log('🚀 开始函数名规范完整测试');
  console.log('='.repeat(60));
  
  try {
    const validationResult = await testFunctionNameValidation();
    const generationResult = await testGeneratedMethodNames();
    
    console.log('\n' + '='.repeat(60));
    console.log('📈 总体测试结果');
    console.log('='.repeat(60));
    
    if (validationResult && generationResult) {
      console.log('🎉 所有函数名规范测试全部通过！');
      console.log('✅ 函数名验证规则工作正常');
      console.log('✅ 函数名生成规则工作正常');
      process.exit(0);
    } else {
      console.log('⚠️  部分函数名规范测试失败');
      if (!validationResult) console.log('❌ 函数名验证规则需要修复');
      if (!generationResult) console.log('❌ 函数名生成规则需要修复');
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 测试执行异常:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  main();
}

module.exports = {
  testFunctionNameValidation,
  testGeneratedMethodNames,
  main
};
