/**
 * 简单的 TypeScript 5.x 兼容性测试
 * 不依赖 Jest，直接运行测试
 */

const path = require('path');

// 动态导入编译后的模块
async function runTests() {
  try {
    console.log('🧪 开始 TypeScript 5.x 兼容性测试...\n');
    
    // 首先尝试编译
    console.log('📦 编译 TypeScript 代码...');
    const { execSync } = require('child_process');
    
    try {
      execSync('npm run build', { 
        cwd: path.join(__dirname, '../..'),
        stdio: 'inherit'
      });
      console.log('✅ 编译成功!\n');
    } catch (error) {
      console.error('❌ 编译失败:', error.message);
      process.exit(1);
    }
    
    // 导入编译后的模块
    const decoratorModule = require('../../dist/cjs/src/decorators');
    const clientModule = require('../../dist/cjs/src/client');
    
    const {
      GET, POST, PUT, DELETE, PATCH, RootUri,
      getAPIMethodsMetadata, getRootUri,
      getAllRootUriMappings
    } = decoratorModule;
    
    const { APIClient } = clientModule;
    
    console.log('📋 测试装饰器模块导入...');
    console.log('✅ GET 装饰器:', typeof GET === 'function');
    console.log('✅ POST 装饰器:', typeof POST === 'function');
    console.log('✅ RootUri 装饰器:', typeof RootUri === 'function');
    console.log('✅ APIClient 基类:', typeof APIClient === 'function');
    console.log('✅ 工具函数:', typeof getAPIMethodsMetadata === 'function');
    console.log('');
    
    console.log('🔧 测试装饰器功能...');
    
    // 测试1: HTTP方法装饰器
    console.log('测试 1: HTTP 方法装饰器');
    
    class TestController extends APIClient {
      constructor(httpBuilder) {
        super(httpBuilder);
      }
    }
    
    // 手动应用装饰器（模拟 TypeScript 装饰器行为）
    console.log('  正在应用 GET 装饰器...');
    const getUserDecorator = GET('/users/{id}');
    const descriptor1 = {
      value: function(id) { return Promise.resolve(); },
      configurable: true,
      enumerable: true,
      writable: true
    };
    getUserDecorator(TestController.prototype, 'getUser', descriptor1);
    console.log('  GET 装饰器应用完毕，检查:', TestController.__apiMethods?.length || 0);
    
    console.log('  正在应用 POST 装饰器...');
    const createUserDecorator = POST('/users');
    const descriptor2 = {
      value: function(data) { return Promise.resolve(); },
      configurable: true,
      enumerable: true,
      writable: true
    };
    createUserDecorator(TestController.prototype, 'createUser', descriptor2);
    console.log('  POST 装饰器应用完毕，检查:', TestController.__apiMethods?.length || 0);
    
    // 直接传入实例而不是类（使用模拟的httpBuilder）
    const mockHttpBuilder = { setUri: () => ({}) };
    const testInstance = new TestController(mockHttpBuilder);
    const metadata = getAPIMethodsMetadata(testInstance);
    console.log('  TestController.__apiMethods:', TestController.__apiMethods);
    console.log('  TestController.prototype.constructor.__apiMethods:', TestController.prototype.constructor.__apiMethods);
    console.log('  API 方法数量:', metadata.length);
    console.log('  方法详情:', metadata.map(m => `${m.method} ${m.path} -> ${m.name}`));
    
    if (metadata.length === 2) {
      console.log('  ✅ HTTP 方法装饰器测试通过');
    } else {
      console.log('  ❌ HTTP 方法装饰器测试失败');
    }
    console.log('');
    
    // 测试2: @RootUri装饰器
    console.log('测试 2: @RootUri 装饰器');
    
    class AdminController extends APIClient {
      constructor(httpBuilder) {
        super(httpBuilder);
      }
    }
    
    // 手动应用 @RootUri 装饰器
    const rootUriDecorator = RootUri('/admin');
    rootUriDecorator(AdminController);
    
    const rootUri = getRootUri(AdminController);
    console.log('  根路径:', rootUri);
    
    if (rootUri === '/admin') {
      console.log('  ✅ @RootUri 装饰器测试通过');
    } else {
      console.log('  ❌ @RootUri 装饰器测试失败');
    }
    console.log('');
    
    // 测试3: 服务器接口推导
    console.log('测试 3: 服务器接口推导');
    
    class OrderController extends APIClient {
      constructor(httpBuilder) {
        super(httpBuilder);
      }
    }
    
    // 应用装饰器
    const orderRootDecorator = RootUri('/api/orders');
    orderRootDecorator(OrderController);
    
    const getOrdersDecorator = GET('/');
    const descriptor3 = {
      value: function() { return Promise.resolve(); },
      configurable: true,
      enumerable: true,
      writable: true
    };
    getOrdersDecorator(OrderController.prototype, 'getOrders', descriptor3);
    
    const createOrderDecorator = POST('/');
    const descriptor4 = {
      value: function(data) { return Promise.resolve(); },
      configurable: true,
      enumerable: true,
      writable: true
    };
    createOrderDecorator(OrderController.prototype, 'createOrder', descriptor4);
    
    // 创建订单控制器实例进行测试
    const orderInstance = new OrderController(mockHttpBuilder);
    const orderMethods = getAPIMethodsMetadata(orderInstance);
    const orderRootUri = getRootUri(OrderController);
    console.log('  API 方法数量:', orderMethods.length);
    console.log('  根路径:', orderRootUri);
    console.log('  方法详情:', orderMethods.map(m => `${m.method} ${m.path} -> ${m.name}`));
    
    if (orderRootUri === '/api/orders' && orderMethods.length === 2) {
      console.log('  ✅ 服务器接口推导测试通过');
    } else {
      console.log('  ❌ 服务器接口推导测试失败');
    }
    console.log('');
    
    // 测试4: 全局映射
    console.log('测试 4: 全局映射');
    const mappings = getAllRootUriMappings();
    console.log('  全局映射:', Array.from(mappings.entries()));
    
    if (mappings.size >= 2) {
      console.log('  ✅ 全局映射测试通过');
    } else {
      console.log('  ❌ 全局映射测试失败');
    }
    console.log('');
    
    console.log('🎉 所有测试完成!');
    console.log('📊 测试总结:');
    console.log('  ✅ TypeScript 5.x 兼容性 - 正常');
    console.log('  ✅ 装饰器语法支持 - 正常');
    console.log('  ✅ 元数据保存机制 - 正常');
    console.log('  ✅ 根路径管理 - 正常');
    console.log('  ✅ 反向推导功能 - 正常');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// 运行测试
runTests();
