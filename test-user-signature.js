/**
 * 测试用户提供的方法签名
 * 方法签名：async getKOLInviteCodeUsage(kolId: string, ...options: APIOption[])
 */

const { APIClient, GET } = require('./dist/cjs/index.js');
const { HttpBuilder } = require('openapi-ts-sdk');

// 测试Response类型
class GetKOLInviteCodeUsageResponse {}

console.log('🧪 测试用户提供的方法签名...\n');

console.log('📝 用户的方法定义:');
console.log('/** 获取KOL邀请码使用情况 */');
console.log('@GET(\'/kol/{kolId}/invite-usage\')');
console.log('async getKOLInviteCodeUsage(kolId: string, ...options: APIOption[]): Promise<GetKOLInviteCodeUsageResponse> {');
console.log('  throw new Error("Auto-generated method stub. Please don\'t modify, it will not be executed at runtime.");');
console.log('}');
console.log('');

try {
  class TestClient extends APIClient {
    constructor() {
      super(new HttpBuilder('http://localhost:3000'));
    }

    /** 获取KOL邀请码使用情况 */
    async getKOLInviteCodeUsage(kolId, ...options) {
      throw new Error("Auto-generated method stub. Please don't modify, it will not be executed at runtime.");
    }
  }
  
  console.log('🔍 开始应用 @GET 装饰器...');
  
  // 手动应用装饰器，这会触发我们的验证逻辑
  const decorator = GET('/kol/{kolId}/invite-usage');
  decorator(TestClient.prototype, 'getKOLInviteCodeUsage', {
    value: TestClient.prototype.getKOLInviteCodeUsage
  });
  
  console.log('✅ 意外通过了验证！这不应该发生。');
  
} catch (error) {
  console.log('❌ 验证失败（这是预期的）\n');
  console.log('=== 完整错误信息 ===');
  console.log(error.message);
  console.log('==================\n');
  
  // 解析错误信息的关键部分
  console.log('📋 错误分析:');
  if (error.message.includes('路径参数')) {
    console.log('• ⚠️  检测到路径参数在方法签名中的问题');
  }
  if (error.message.includes('request')) {
    console.log('• ⚠️  检测到request参数相关问题');
  }
  if (error.message.includes('标准格式')) {
    console.log('• 💡 提供了标准格式建议');
  }
  if (error.message.includes('withParams')) {
    console.log('• 🔧 提到了使用withParams()的建议');
  }
}
