/**
 * 测试特定的方法签名是否通过验证
 */

const { APIClient, GET } = require('./dist/cjs/index.js');
const { HttpBuilder } = require('openapi-ts-sdk');

// 测试Response类型
class GetKOLInviteCodeUsageResponse {}

try {
  console.log('🧪 测试特定方法签名...\n');
  
  class TestClient extends APIClient {
    constructor() {
      super(new HttpBuilder('http://localhost:3000'));
    }

    async getKOLInviteCodeUsage(kolId, ...options) {
      throw new Error("Auto-generated method stub. Please don't modify, it will not be executed at runtime.");
    }
  }
  
  console.log('📝 待测试的方法签名:');
  console.log('@GET(\'/kol/{kolId}/invite-usage\')');
  console.log('async getKOLInviteCodeUsage(kolId: string, ...options: APIOption[]): Promise<GetKOLInviteCodeUsageResponse>');
  console.log('');
  
  // 手动应用装饰器，这会触发验证
  console.log('🔍 应用装饰器验证...');
  const decorator = GET('/kol/{kolId}/invite-usage');
  decorator(TestClient.prototype, 'getKOLInviteCodeUsage', {
    value: TestClient.prototype.getKOLInviteCodeUsage
  });
  
  console.log('✅ 验证通过！');
  
} catch (error) {
  console.log('❌ 验证失败！');
  console.log('');
  console.log('错误信息:');
  console.log(error.message);
}
