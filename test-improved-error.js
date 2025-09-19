/**
 * 测试改进后的错误信息
 */

const { APIClient, GET } = require('./dist/cjs/index.js');
const { HttpBuilder } = require('openapi-ts-sdk');

console.log('🧪 测试改进后的错误信息...\n');

console.log('📝 用户的方法定义:');
console.log('@GET(\'/kol/{kolId}/invite-usage\')');
console.log('async getKOLInviteCodeUsage(kolId: string, ...options: APIOption[])');
console.log('');

try {
  class TestClient extends APIClient {
    constructor() {
      super(new HttpBuilder('http://localhost:3000'));
    }

    async getKOLInviteCodeUsage(kolId, ...options) {
      throw new Error("Auto-generated method stub.");
    }
  }
  
  console.log('🔍 应用装饰器...');
  
  const decorator = GET('/kol/{kolId}/invite-usage');
  decorator(TestClient.prototype, 'getKOLInviteCodeUsage', {
    value: TestClient.prototype.getKOLInviteCodeUsage
  });
  
  console.log('✅ 意外通过了验证！');
  
} catch (error) {
  console.log('❌ 验证失败（预期的）\n');
  console.log('=== 改进后的错误信息 ===');
  console.log(error.message);
  console.log('========================\n');
  
  console.log('🎯 检查改进效果:');
  if (error.message.includes('GetKOLInviteCodeUsageResponse')) {
    console.log('✅ 现在显示具体的Response类型名: GetKOLInviteCodeUsageResponse');
  } else {
    console.log('❌ 仍然显示通用的SomeResponse');
  }
  
  if (error.message.includes('@GET(\'/kol/{kolId}/invite-usage\')')) {
    console.log('✅ 现在显示实际的路径: /kol/{kolId}/invite-usage');
  } else {
    console.log('❌ 仍然显示通用的路径');
  }
  
  if (error.message.includes('GetKOLInviteCodeUsageRequest')) {
    console.log('✅ 显示具体的Request类型名: GetKOLInviteCodeUsageRequest');
  }
}
