# OpenAPI TypeScript SDK Decorators - 使用指南

## 🎯 完整的API设计

基于您的需求完全重构的参数装饰器设计，提供最佳的类型安全和开发体验。

## 🚀 核心装饰器

### HTTP方法装饰器
```typescript
@GET('/path')     // GET 请求
@POST('/path')    // POST 请求  
@PUT('/path')     // PUT 请求
@DELETE('/path')  // DELETE 请求
@PATCH('/path')   // PATCH 请求
@HEAD('/path')    // HEAD 请求
@OPTIONS('/path') // OPTIONS 请求
```

### 参数装饰器
```typescript
@Param('name')      // 路径参数：{name} → 实际值
@Query()           // 查询参数：Record<string, string>
@Request()         // 请求体：任意类型
@ResponseType()    // 响应类型构造函数
@Options()         // 选项参数：...APIOption[]
```

## 📚 完整使用示例

### 1. 基本类型定义

```typescript
import { APIClient, GET, POST, Param, Query, Request, ResponseType, Options, APIOption } from 'openapi-ts-sdk-decorator';

// 请求类型
interface GetUserRequest {
  includeProfile?: boolean;
  includeSettings?: boolean;
}

interface CreateUserRequest {
  name: string;
  email: string;
  role?: string;
}

// 响应类型（使用类以支持运行时转换）
class GetUserResponse {
  id!: string;
  name!: string;
  email!: string;
  profile?: UserProfile;
  settings?: UserSettings;
  createdAt!: Date;
  
  constructor(data?: any) {
    if (data) {
      Object.assign(this, data);
      // 自动转换日期字符串为Date对象
      if (data.createdAt) {
        this.createdAt = new Date(data.createdAt);
      }
    }
  }
  
  // 类方法
  getDisplayName(): string {
    return `${this.name} (${this.email})`;
  }
}

class CreateUserResponse {
  id!: string;
  name!: string;
  email!: string;
  createdAt!: Date;
  
  constructor(data?: any) {
    if (data) {
      Object.assign(this, data);
      if (data.createdAt) {
        this.createdAt = new Date(data.createdAt);
      }
    }
  }
}
```

### 2. API客户端定义

```typescript
@RootUri('/api/v1')
class UserAPI extends APIClient {
  
  // ✅ 完整示例：路径参数 + 查询参数 + 请求体
  @GET('/users/{category}')
  async getUsers<Request = GetUserRequest, Response = GetUserResponse>(
    @Param('category') category: string,                        // 路径参数
    @Query() query: Record<string, string>,                     // 查询参数
    @Request() request: Request,                                // 请求体
    @ResponseType() responseType: { new (...args: any[]): Response }, // 响应类型
    @Options() ...options: APIOption[]                          // 选项参数
  ): Promise<Response> {
    // 实现由装饰器自动生成
  }
  
  // ✅ 简单示例：只有请求体
  @POST('/users')
  async createUser<Request = CreateUserRequest, Response = CreateUserResponse>(
    @Request() request: Request,
    @ResponseType() responseType: { new (...args: any[]): Response },
    @Options() ...options: APIOption[]
  ): Promise<Response> {
    // 实现由装饰器自动生成
  }
  
  // ✅ 路径参数示例：只有路径参数
  @DELETE('/users/{id}')
  async deleteUser<Response = { success: boolean }>(
    @Param('id') id: string,
    @ResponseType() responseType: { new (...args: any[]): Response },
    @Options() ...options: APIOption[]
  ): Promise<Response> {
    // 实现由装饰器自动生成  
  }
  
  // ✅ 查询参数示例：只有查询参数
  @GET('/search')
  async searchUsers<Request = any, Response = any>(
    @Query() query: Record<string, string>,
    @Request() request: Request,
    @ResponseType() responseType: { new (...args: any[]): Response },
    @Options() ...options: APIOption[]
  ): Promise<Response> {
    // 实现由装饰器自动生成
  }
  
  // ✅ 复杂示例：多个路径参数
  @PUT('/users/{userId}/posts/{postId}')
  async updateUserPost<Request = any, Response = any>(
    @Param('userId') userId: string,
    @Param('postId') postId: string,
    @Query() query: Record<string, string>,
    @Request() request: Request,
    @ResponseType() responseType: { new (...args: any[]): Response },
    @Options() ...options: APIOption[]
  ): Promise<Response> {
    // 实现由装饰器自动生成
  }
}
```

### 3. 使用方式

```typescript
import { HttpBuilder } from 'openapi-ts-sdk';
import { withHeaders } from 'openapi-ts-sdk-decorator';

// 创建API客户端
const httpBuilder = new HttpBuilder();
const api = new UserAPI(httpBuilder);

// ✅ 复杂API调用：路径参数 + 查询参数 + 请求体 + 选项
const users = await api.getUsers(
  'active',                               // @Param('category') → /users/active
  { page: '1', size: '10', sort: 'name' }, // @Query() → ?page=1&size=10&sort=name
  { includeProfile: true },               // @Request() → 请求体JSON
  GetUserResponse,                        // @ResponseType() → 响应类型转换
  withHeaders({ 'Authorization': 'Bearer token' }) // @Options() → 额外选项
);

// 最终URL: /api/v1/users/active?page=1&size=10&sort=name
// 返回结果: GetUserResponse 实例，包含类方法

console.log(users.getDisplayName()); // 可以调用类方法
console.log(users.createdAt instanceof Date); // true - 正确的类型转换

// ✅ 简单API调用：只有请求体
const newUser = await api.createUser(
  { name: 'John Doe', email: 'john@example.com' }, // @Request()
  CreateUserResponse                               // @ResponseType()
);

// ✅ 删除用户：只有路径参数
const result = await api.deleteUser(
  '123',        // @Param('id') → /users/123
  Object        // @ResponseType()
);

// ✅ 搜索用户：只有查询参数
const searchResult = await api.searchUsers(
  { keyword: 'john', active: 'true' }, // @Query() → ?keyword=john&active=true
  {},                                  // @Request()
  Object                              // @ResponseType()
);
```

## 🌟 核心特点

### 1. 完全的类型安全
```typescript
// ✅ 编译时类型检查
const user: GetUserResponse = await api.getUsers(
  'active',                    // 必须是 string
  { page: '1' },              // 必须是 Record<string, string>
  { includeProfile: true },   // 必须符合 GetUserRequest
  GetUserResponse             // 必须是构造函数
);

// ✅ 运行时类型转换
console.log(user instanceof GetUserResponse); // true
console.log(user.createdAt instanceof Date);  // true
```

### 2. 自动化处理
```typescript
// 用户只需要提供参数值，装饰器自动处理：
api.getUsers('active', query, request, ResponseType)

// 装饰器内部自动转换为：
// 1. withParams({ category: 'active' })    ← @Param('category')
// 2. withQuery(query)                      ← @Query()  
// 3. executeRequest('/users/active?...', ...)
```

### 3. 智能的错误检查
```typescript
// ❌ 如果忘记 @Param 装饰器：
@GET('/users/{id}')
async getUser(@Request() request: any): Promise<any> {}

// 运行时会抛出错误：
// 🚫 路径参数未完全替换
// ❌ 缺少参数: [id]  
// 💡 请确保为所有路径参数添加对应的 @Param() 装饰器
```

## 🛠️ 高级功能

### 自定义选项组合
```typescript
import { withHeaders, withTimeout } from 'openapi-ts-sdk';

const result = await api.getUsers(
  'active',
  { page: '1' },
  { includeProfile: true },
  GetUserResponse,
  withHeaders({ 'Authorization': 'Bearer token' }),
  withTimeout(5000)
);
```

### 泛型类型扩展
```typescript
// 扩展请求类型
interface ExtendedGetUserRequest extends GetUserRequest {
  includeAnalytics: boolean;
  locale: string;
}

const users = await api.getUsers<ExtendedGetUserRequest, GetUserResponse>(
  'active',
  { page: '1' },
  { 
    includeProfile: true,
    includeAnalytics: true,  // 扩展字段
    locale: 'zh-CN'          // 扩展字段
  },
  GetUserResponse
);
```

### 配置管理
```typescript
import { setValidationEnabled } from 'openapi-ts-sdk-decorator';

// 生产环境禁用验证提高性能
if (process.env.NODE_ENV === 'production') {
  setValidationEnabled(false);
}
```

## 📊 与旧设计对比

| 特性 | 旧设计 | 新设计 |
|------|--------|--------|
| **参数处理** | ❌ 字符串解析脆弱 | ✅ 装饰器精确绑定 |
| **类型安全** | ⚠️ 仅编译时 | ✅ 编译时+运行时 |
| **路径参数** | ⚠️ withParams() 链式 | ✅ @Param() 直接声明 |
| **查询参数** | ⚠️ withQuery() 手动 | ✅ @Query() 自动处理 |
| **返回值验证** | ❌ 解析失败 | ✅ 强制类型传递 |
| **复杂格式** | ❌ 解析失败 | ✅ 装饰器无视格式 |
| **维护性** | ❌ 复杂正则逻辑 | ✅ 简洁元数据逻辑 |

## 🎉 解决的问题

### 原始问题
```typescript
// ❌ 这种定义在旧系统中无法正确验证
@GET('/trading/{id}')
async getTradingRecordById(request: GetTradingRecordByIdRequest, ...options: APIOption[]): Promise<TradingRecord> {
  // 返回值应该是 GetTradingRecordByIdResponse，而不是 TradingRecord
}
```

### 新设计解决
```typescript
// ✅ 新设计强制正确的类型传递
@GET('/trading/{id}')
async getTradingRecordById(
  @Param('id') id: string,
  @Request() request: GetTradingRecordByIdRequest,
  @ResponseType() responseType: { new (...args: any[]): GetTradingRecordByIdResponse },
  @Options() ...options: APIOption[]
): Promise<GetTradingRecordByIdResponse> {
  // 类型安全完全由装饰器和TypeScript保证
  // 运行时进行真正的JSON到类实例转换
}

// 调用
const record = await api.getTradingRecordById(
  '123',                            // id
  { includeDetails: true },         // request
  GetTradingRecordByIdResponse     // responseType - 强制传递正确类型！
);

// record 是真正的 GetTradingRecordByIdResponse 实例
console.log(record instanceof GetTradingRecordByIdResponse); // true
```

## 🏆 总结

这个新设计**彻底解决了字符串解析的所有问题**：

✅ **健壮性** - 基于装饰器元数据，不会因为代码格式变化而失败  
✅ **类型安全** - 编译时检查 + 运行时转换的双重保障  
✅ **简洁易用** - 清晰的参数角色，直观的API调用  
✅ **高性能** - 智能使用正则，避免复杂解析  
✅ **易维护** - 单一职责，逻辑清晰  
✅ **完整功能** - 支持路径参数、查询参数、请求体、响应转换  

这是一个真正生产就绪的、类型安全的、高性能的装饰器系统！
