const { OpenAPINamingRule } = require('../../dist/cjs/src/rules');

/**
 * 测试shared-rules与实际生成代码的一致性
 */
async function testSharedRulesConsistency() {
  console.log('🔍 测试shared-rules与实际CLI生成的一致性');
  console.log('='.repeat(60));
  
  const namingRule = OpenAPINamingRule;
  
  // 基于实际生成代码中的方法的测试用例
  const realGeneratedMethods = [
    // User模块 - 基础路径
    {
      path: '/api/users/',
      method: 'get',
      expectedMethodName: 'getUsers',
      actualMethodName: 'getUsers'
    },
    {
      path: '/api/users/',
      method: 'post',
      expectedMethodName: 'createUsers',
      actualMethodName: 'createUsers'
    },
    
    // User模块 - 带单个路径参数
    {
      path: '/api/users/{id}',
      method: 'get',
      expectedMethodName: 'getUsersById',
      actualMethodName: 'getUsersById',
      parameters: [{name: 'id', in: 'path', type: 'string'}]
    },
    {
      path: '/api/users/{id}',
      method: 'put',
      expectedMethodName: 'updateUsersById',
      actualMethodName: 'updateUsersById',
      parameters: [{name: 'id', in: 'path', type: 'string'}]
    },
    {
      path: '/api/users/{id}',
      method: 'delete',
      expectedMethodName: 'deleteUsersById',
      actualMethodName: 'deleteUsersById',
      parameters: [{name: 'id', in: 'path', type: 'string'}]
    },
    {
      path: '/api/users/{id}',
      method: 'patch',
      expectedMethodName: 'patchUsersById',
      actualMethodName: 'patchUsersById',
      parameters: [{name: 'id', in: 'path', type: 'string'}]
    },
    
    // Productservice模块 - 复杂路径
    {
      path: '/api/products/',
      method: 'get',
      expectedMethodName: 'getProducts',
      actualMethodName: 'getProducts'
    },
    {
      path: '/api/products/{categoryId}/brands/{brandId}/items/{itemId}',
      method: 'get',
      expectedMethodName: 'getProductsBrandsItemsByItemIdBrandIdCategoryId',
      actualMethodName: 'getProductsBrandsItemsByItemIdBrandIdCategoryId',
      parameters: [
        {name: 'itemId', in: 'path', type: 'string'},
        {name: 'brandId', in: 'path', type: 'string'},
        {name: 'categoryId', in: 'path', type: 'string'}
      ]
    },
    {
      path: '/api/products/{productId}/categories/{categoryId}',
      method: 'put',
      expectedMethodName: 'updateProductsCategoriesByCategoryIdProductId',
      actualMethodName: 'updateProductsCategoriesByCategoryIdProductId',
      parameters: [
        {name: 'categoryId', in: 'path', type: 'string'},
        {name: 'productId', in: 'path', type: 'string'}
      ]
    },
    {
      path: '/api/products/{productId}/reviews/{reviewId}/replies/{replyId}',
      method: 'delete',
      expectedMethodName: 'deleteProductsReviewsRepliesByReplyIdReviewIdProductId',
      actualMethodName: 'deleteProductsReviewsRepliesByReplyIdReviewIdProductId',
      parameters: [
        {name: 'replyId', in: 'path', type: 'string'},
        {name: 'reviewId', in: 'path', type: 'string'},
        {name: 'productId', in: 'path', type: 'string'}
      ]
    },
    {
      path: '/api/products/{id}/inventory/{warehouseId}/adjust',
      method: 'patch',
      expectedMethodName: 'patchProductsInventoryAdjustByWarehouseIdId',
      actualMethodName: 'patchProductsInventoryAdjustByWarehouseIdId',
      parameters: [
        {name: 'warehouseId', in: 'path', type: 'string'},
        {name: 'id', in: 'path', type: 'string'}
      ]
    }
  ];
  
  console.log(`📋 测试 ${realGeneratedMethods.length} 个实际生成的方法名...\n`);
  
  let passedTests = 0;
  let totalTests = realGeneratedMethods.length;
  
  for (let i = 0; i < realGeneratedMethods.length; i++) {
    const testCase = realGeneratedMethods[i];
    const testNum = i + 1;
    
    console.log(`🔄 测试 ${testNum}: ${testCase.method.toUpperCase()} ${testCase.path}`);
    console.log(`   期望方法名: ${testCase.expectedMethodName}`);
    console.log(`   实际方法名: ${testCase.actualMethodName}`);
    
    try {
      const operation = {
        name: testCase.expectedMethodName,
        method: testCase.method,
        path: testCase.path,
        parameters: testCase.parameters || []
      };
      
      const generatedName = namingRule.generateMethodName(operation);
      console.log(`   shared-rules生成: ${generatedName}`);
      
      if (generatedName === testCase.actualMethodName) {
        console.log('   ✅ 通过 - shared-rules与实际生成一致');
        passedTests++;
      } else {
        console.log('   ❌ 失败 - shared-rules与实际生成不一致');
        console.log(`   应该生成: ${testCase.actualMethodName}`);
        console.log(`   实际生成: ${generatedName}`);
      }
    } catch (error) {
      console.log(`   💥 异常 - ${error.message}`);
    }
    
    console.log(''); // 空行分隔
  }
  
  // 测试总结
  console.log('🏁 shared-rules一致性测试总结');
  console.log('-'.repeat(40));
  console.log(`✅ 通过测试: ${passedTests}/${totalTests}`);
  console.log(`❌ 失败测试: ${totalTests - passedTests}/${totalTests}`);
  console.log(`📊 通过率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 shared-rules与实际CLI生成完全一致！');
  } else {
    console.log('\n⚠️  shared-rules与实际CLI生成存在差异，需要修复。');
  }
  
  return passedTests === totalTests;
}

// 主测试函数
async function main() {
  console.log('🚀 开始shared-rules一致性测试');
  console.log('='.repeat(60));
  
  try {
    const result = await testSharedRulesConsistency();
    
    console.log('\n' + '='.repeat(60));
    console.log('📈 测试结果');
    console.log('='.repeat(60));
    
    if (result) {
      console.log('🎉 shared-rules与实际生成完全一致！');
      process.exit(0);
    } else {
      console.log('⚠️  shared-rules需要修复以匹配实际生成逻辑');
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 测试执行异常:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  main();
}

module.exports = {
  testSharedRulesConsistency,
  main
};
