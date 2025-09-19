/**
 * Jest 测试设置文件
 */
import 'reflect-metadata';
import { HttpMethod } from 'openapi-ts-sdk';

// 确保 reflect-metadata 在所有测试前加载
// 这对于装饰器和元数据至关重要

// 创建 HttpBuilder 的模拟实现用于测试
import { HttpBuilder, Http } from 'openapi-ts-sdk';

class MockHttp implements Http {
  async send(): Promise<[string, Error | null]> {
    // 模拟 HTTP 请求执行
    return ['{"success": true}', null];
  }
}

export class MockHttpBuilder extends HttpBuilder {
  constructor() {
    super('http://mock-test-server');
  }

  build(): Http {
    return new MockHttp();
  }
}

// 全局测试配置
beforeAll(() => {
  // 可以在这里添加全局设置
});

afterAll(() => {
  // 清理工作
});
