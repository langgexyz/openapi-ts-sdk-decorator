# OpenAPI TypeScript SDK Decorator

**装饰器和共享验证规则包** - 为 OpenAPI 生成的 TypeScript SDK 提供装饰器系统和命名约定验证。

## 🎯 用途

这个包是 OpenAPI TypeScript SDK 生态系统的核心组件，提供：

- 🎨 **HTTP 方法装饰器** - `@GET`, `@POST`, `@PUT`, `@DELETE`, `@PATCH` 等
- 📏 **命名规范验证** - 确保生成的代码遵循一致的命名约定
- 🏗️ **基础客户端类** - 提供通用的请求处理和验证逻辑
- 🔧 **共享规则** - 代码生成器和运行时验证使用相同的逻辑

## 📦 安装

```bash
npm install openapi-ts-sdk-decorator
```

## 🚀 使用

### 装饰器

```typescript
import { APIClient, GET, POST, PUT, DELETE, PATCH } from 'openapi-ts-sdk-decorator';

export class UserClient extends APIClient {
  @GET('/api/users/')
  getUsers(...options: APIOption[]): Promise<GetUsersResponse> {
    throw new Error("Auto-generated method stub. Please don't modify, it will not be executed at runtime.");
  }

  @POST('/api/users/')
  createUser(request: CreateUserRequest, ...options: APIOption[]): Promise<CreateUserResponse> {
    throw new Error("Auto-generated method stub. Please don't modify, it will not be executed at runtime.");
  }

  @PUT('/api/users/{id}')
  updateUser(id: string, request: UpdateUserRequest, ...options: APIOption[]): Promise<UpdateUserResponse> {
    throw new Error("Auto-generated method stub. Please don't modify, it will not be executed at runtime.");
  }
}
```

### 共享规则

```typescript
import { OpenAPINamingRule } from 'openapi-ts-sdk-decorator';

const operation = {
  method: 'get',
  path: '/api/users/{id}',
  parameters: [{name: 'id', in: 'path', type: 'string'}]
};

const methodName = OpenAPINamingRule.generateMethodName(operation);
console.log(methodName); // "getUsersById"

const validation = OpenAPINamingRule.validateMethodName('getUsersById', operation);
console.log(validation.isValid); // true
```

### 基础客户端

```typescript
import { APIClient, APIOption, withUri, withHeaders } from 'openapi-ts-sdk-decorator';

class MyClient extends APIClient {
  async callApi() {
    return this.executeRequest(
      HttpMethod.GET,
      '/api/users/',
      {},
      MyResponseType,
      [withUri('https://api.example.com'), withHeaders({'Authorization': 'Bearer token'})]
    );
  }
}
```

## 🏗️ 架构设计

### 模块结构

```
openapi-ts-sdk-decorator/
├── src/
│   ├── rules.ts             # 命名规则和验证逻辑
│   ├── decorators.ts        # HTTP 方法装饰器
│   └── client.ts            # 基础客户端类
├── index.ts                 # 主导出文件
└── package.json
```

### 依赖关系

```
openapi-ts-sdk-cli ──→ openapi-ts-sdk-decorator ──→ openapi-ts-sdk
                   ↓                           ↓
            Generated SDKs ────────────────────┘
```

## 🔧 特性

### 1. 统一的命名规范

- ✅ **方法名**: `getUsers`, `createUser`, `updateUsersById`
- ✅ **类型名**: `GetUsersRequest/Response`, `CreateUserRequest/Response`
- ✅ **参数顺序**: 与 URL 路径中的出现顺序一致

### 2. 运行时验证

- 🔍 **Request/Response 类型命名检查**
- 📝 **Class-validator 集成**
- ⚠️ **详细的错误信息和修复建议**

### 3. 装饰器系统

- 🎨 **简洁的 API 定义语法**
- 📊 **元数据保存**
- 🔧 **可扩展的选项配置**

## 🧪 验证规则

### 方法名验证

```typescript
// ✅ 正确
getUsersById    // GET /api/users/{id}
createUser      // POST /api/users/
updateUsersById // PUT /api/users/{id}

// ❌ 错误
fetchUsers      // 应该是 getUsers
addUser         // 应该是 createUser
modifyUser      // 应该是 updateUser
```

### 类型名验证

```typescript
// ✅ 正确的配对
GetUsersRequest  + GetUsersResponse
CreateUserRequest + CreateUserResponse

// ❌ 错误的配对
GetUsersRequest + CreateUserResponse  // 前缀不一致
UserInfo + UserData                   // 缺少 Request/Response 后缀
```

## 📚 相关包

- [`openapi-ts-sdk`](../openapi-ts-sdk/) - 核心 HTTP 构建器和接口
- [`openapi-ts-sdk-cli`](../openapi-ts-sdk-cli/) - 代码生成器
- [`openapi-ts-sdk-axios`](../openapi-ts-sdk-axios/) - Axios 实现
- [`openapi-ts-sdk-fetch`](../openapi-ts-sdk-fetch/) - Fetch API 实现

## 📄 许可证

MIT License
