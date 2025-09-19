/**
 * 测试灵活参数名的验证
 */

const { APIClient, GET } = require('./dist/cjs/index.js');
const { HttpBuilder } = require('openapi-ts-sdk');

console.log('🧪 测试灵活参数名的验证...\n');

// 测试1: 正确的格式 - 任意参数名 + Request类型
console.log('=== 测试1: 正确格式 - 任意参数名 + Request类型 ===');
console.log('代码: async getKOLInviteCodeUsage(data: GetKOLInviteCodeUsageRequest, ...options)');

try {
  class TestClient1 extends APIClient {
    constructor() {
      super(new HttpBuilder('http://localhost:3000'));
    }

    async getKOLInviteCodeUsage(data, ...options) {
      return {};
    }
  }
  
  const decorator1 = GET('/kol/invite-usage');
  decorator1(TestClient1.prototype, 'getKOLInviteCodeUsage', {
    value: TestClient1.prototype.getKOLInviteCodeUsage
  });
  
  console.log('✅ 通过验证！');
  
} catch (error) {
  console.log('❌ 验证失败:');
  console.log(error.message);
}

console.log('\n' + '='.repeat(60) + '\n');

// 测试2: 错误的格式 - 错误类型
console.log('=== 测试2: 错误格式 - 没有Request后缀的类型 ===');
console.log('代码: async getKOLInviteCodeUsage(someData: SomeData, ...options)');

try {
  class TestClient2 extends APIClient {
    constructor() {
      super(new HttpBuilder('http://localhost:3000'));
    }

    async getKOLInviteCodeUsage(someData, ...options) {
      return {};
    }
  }
  
  const decorator2 = GET('/kol/invite-usage');
  decorator2(TestClient2.prototype, 'getKOLInviteCodeUsage', {
    value: TestClient2.prototype.getKOLInviteCodeUsage
  });
  
  console.log('✅ 意外通过验证！');
  
} catch (error) {
  console.log('❌ 验证失败（预期的）:');
  console.log(error.message);
}

console.log('\n' + '='.repeat(60) + '\n');

// 测试3: 用户原始问题 - 路径参数在方法签名中
console.log('=== 测试3: 原始问题 - 路径参数在方法签名中 ===');
console.log('代码: async getKOLInviteCodeUsage(kolId: string, ...options)');

try {
  class TestClient3 extends APIClient {
    constructor() {
      super(new HttpBuilder('http://localhost:3000'));
    }

    async getKOLInviteCodeUsage(kolId, ...options) {
      return {};
    }
  }
  
  const decorator3 = GET('/kol/{kolId}/invite-usage');
  decorator3(TestClient3.prototype, 'getKOLInviteCodeUsage', {
    value: TestClient3.prototype.getKOLInviteCodeUsage
  });
  
  console.log('✅ 意外通过验证！');
  
} catch (error) {
  console.log('❌ 验证失败（预期的）:');
  console.log(error.message);
}
