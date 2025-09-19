/**
 * 最终验证测试 - 展示新的验证规则
 */

const { APIClient, GET } = require('./dist/cjs/index.js');
const { HttpBuilder } = require('openapi-ts-sdk');

console.log('🎯 新的验证规则说明:\n');
console.log('✅ 允许: 任意参数名，但类型必须以 "Request" 结尾');
console.log('✅ 允许: data: GetKOLInviteCodeUsageRequest');
console.log('✅ 允许: request: GetKOLInviteCodeUsageRequest'); 
console.log('✅ 允许: param: GetKOLInviteCodeUsageRequest');
console.log('❌ 不允许: kolId (路径参数在方法签名中)');
console.log('❌ 不允许: data: SomeData (类型不以Request结尾)');
console.log('❌ 要求: 必须有类型声明');

console.log('\n' + '='.repeat(60) + '\n');

// 测试用户原始问题
console.log('🧪 测试用户原始问题...\n');
console.log('❌ 用户代码: async getKOLInviteCodeUsage(kolId: string, ...options)');

try {
  class TestClient extends APIClient {
    constructor() {
      super(new HttpBuilder('http://localhost:3000'));
    }

    async getKOLInviteCodeUsage(kolId, ...options) {
      throw new Error("Auto-generated method stub.");
    }
  }
  
  const decorator = GET('/kol/{kolId}/invite-usage');
  decorator(TestClient.prototype, 'getKOLInviteCodeUsage', {
    value: TestClient.prototype.getKOLInviteCodeUsage
  });
  
  console.log('✅ 意外通过验证！');
  
} catch (error) {
  console.log('❌ 验证失败（预期的）:');
  console.log(error.message);
}

console.log('\n' + '='.repeat(60) + '\n');

console.log('✅ 正确的格式应该是:');
console.log('@GET(\'/kol/{kolId}/invite-usage\')');
console.log('async getKOLInviteCodeUsage(data: GetKOLInviteCodeUsageRequest, ...options: APIOption[]): Promise<GetKOLInviteCodeUsageResponse>');
console.log('');
console.log('🎯 调用方式:');
console.log('const result = await client.getKOLInviteCodeUsage(');
console.log('  new GetKOLInviteCodeUsageRequest(),');
console.log('  withParams({ kolId: "some-id" })');
console.log(');');

console.log('\n🎉 改进总结:');
console.log('• 参数名不再强制要求是 "request"');
console.log('• 类型名必须以 "Request" 结尾'); 
console.log('• Response类型名必须以 "Response" 结尾');
console.log('• 路径参数通过 withParams() 提供');
console.log('• 错误信息更加具体和有用');
