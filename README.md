# OpenAPI TypeScript SDK Decorator

**TypeScript 装饰器和验证规则包** - 为 OpenAPI 生成的 TypeScript SDK 提供装饰器系统、命名约定验证和运行时类型检查。

[![TypeScript](https://img.shields.io/badge/TypeScript-4.9%2B%20%7C%205.x-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## ✨ 特性

- 🎨 **现代装饰器语法** - 支持 TypeScript 4.x 和 5.x 装饰器
- 📏 **智能命名验证** - 自动检查 API 方法和类型的命名一致性
- 🏗️ **类型安全基类** - 提供完整的类型约束和运行时验证
- 🔧 **代码生成集成** - CLI 工具和运行时验证使用相同的规则
- 🌐 **跨平台支持** - Node.js 和浏览器环境都可使用

## 📦 安装

```bash
npm install openapi-ts-sdk-decorator
```

## 🚀 快速开始

### 基本使用

```typescript
import { APIClient, RootUri, GET, POST, PUT, DELETE } from 'openapi-ts-sdk-decorator';
import { HttpBuilder } from 'openapi-ts-sdk';

// 1. 定义 API 客户端类
@RootUri('api/users')
export class UserAPI extends APIClient {
  @GET('/')
  getUsers(): Promise<GetUsersResponse> {
    throw new Error("Auto-generated method stub");
  }

  @GET('/{id}')
  getUserById(id: string): Promise<GetUserResponse> {
    throw new Error("Auto-generated method stub");
  }

  @POST('/')
  createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
    throw new Error("Auto-generated method stub");
  }

  @PUT('/{id}')
  updateUser(id: string, request: UpdateUserRequest): Promise<UpdateUserResponse> {
    throw new Error("Auto-generated method stub");
  }

  @DELETE('/{id}')
  deleteUser(id: string): Promise<void> {
    throw new Error("Auto-generated method stub");
  }
}

// 2. 使用客户端
const httpBuilder = new YourHttpBuilder('https://api.example.com');
const userAPI = new UserAPI(httpBuilder);

// 3. 调用 API（装饰器会自动处理请求）
const users = await userAPI.getUsers();
const user = await userAPI.getUserById('123');
```

### 高级功能

#### 1. 命名规则验证

```typescript
import { OpenAPINamingRule } from 'openapi-ts-sdk-decorator';

// 自动生成方法名
const operation = {
  method: 'get',
  path: '/api/users/{id}',
  parameters: [{name: 'id', in: 'path', type: 'string'}]
};

const methodName = OpenAPINamingRule.generateMethodName(operation);
console.log(methodName); // "getUsersById"

// 验证命名是否符合规范
const validation = OpenAPINamingRule.validateMethodName('getUsersById', operation);
console.log(validation.isValid); // true
```

#### 2. 装饰器选项

```typescript
@RootUri('api/products')
export class ProductAPI extends APIClient {
  @GET('/', { 
    summary: 'Get all products',
    description: 'Retrieve a list of all available products' 
  })
  getProducts(): Promise<ProductListResponse> {
    throw new Error("Auto-generated method stub");
  }

  @POST('/', {
    summary: 'Create product',
    description: 'Create a new product in the catalog'
  })
  createProduct(request: CreateProductRequest): Promise<CreateProductResponse> {
    throw new Error("Auto-generated method stub");
  }
}
```


## 🏗️ TypeScript 兼容性

### 支持的 TypeScript 版本

- ✅ **TypeScript 4.9+** - 传统装饰器语法
- ✅ **TypeScript 5.x** - 新装饰器语法 (Stage 3)
- ✅ **自动检测** - 运行时自动适配装饰器语法

### 配置示例

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "useDefineForClassFields": false
  }
}
```

## 📚 API 参考

### 装饰器

| 装饰器 | 用途 | 示例 |
|--------|------|------|
| `@RootUri(path)` | 定义 API 根路径 | `@RootUri('api/users')` |
| `@GET(path, options?)` | GET 请求 | `@GET('/{id}')` |
| `@POST(path, options?)` | POST 请求 | `@POST('/', {summary: 'Create'})` |
| `@PUT(path, options?)` | PUT 请求 | `@PUT('/{id}')` |
| `@DELETE(path, options?)` | DELETE 请求 | `@DELETE('/{id}')` |
| `@PATCH(path, options?)` | PATCH 请求 | `@PATCH('/{id}')` |

### 工具函数

| 函数 | 用途 | 返回值 |
|------|------|--------|
| `getAPIMethodsMetadata(target)` | 获取 API 方法元数据 | `APIMethodMetadata[]` |
| `getRootUri(clientClass)` | 获取根路径 | `string \| null` |
| `getAllRootUriMappings()` | 获取全局映射 | `Map<string, string>` |

### 命名规则

| 规则 | 说明 | 示例 |
|------|------|------|
| **方法名** | HTTP 方法 + 资源名 + 参数 | `getUsersById`, `createUser` |
| **类型名** | 方法名 + Request/Response | `GetUsersRequest`, `CreateUserResponse` |
| **参数顺序** | 与 URL 路径中出现顺序一致 | `updateUser(id, data)` 对应 `/users/{id}` |

## ⚡ 性能和最佳实践

### 错误处理

```typescript
import { OpenAPINamingRule } from 'openapi-ts-sdk-decorator';

try {
  // 装饰器会自动验证命名规范
  const userAPI = new UserAPI(httpBuilder);
  const result = await userAPI.getUsers();
} catch (error) {
  if (error.message.includes('naming convention')) {
    console.error('命名规范违规:', error.message);
    // 错误信息包含具体的修复建议
  }
}
```

### 开发时验证

```typescript
// 在开发阶段验证 API 定义是否符合规范
import { validateAPI } from 'openapi-ts-sdk-decorator';

const validationResult = validateAPI(UserAPI);
if (!validationResult.isValid) {
  console.warn('API 定义问题:', validationResult.errors);
}
```

### 代码生成集成

这个包主要配合 `openapi-ts-sdk-cli` 使用：

```bash
# 使用 CLI 生成 SDK
npx openapi-ts-sdk-cli generate \
  --input http://localhost:7001/swagger-ui/index.json \
  --output ./src/api

# 生成的代码自动包含装饰器和验证
```

## 🔗 生态系统

| 包名 | 用途 | GitHub |
|------|------|--------|
| `openapi-ts-sdk` | 核心 HTTP 接口 | [openapi-ts-sdk](https://github.com/langgexyz/openapi-ts-sdk) |
| `openapi-ts-sdk-cli` | 代码生成器 | [openapi-ts-sdk-cli](https://github.com/langgexyz/openapi-ts-sdk-cli) |
| `openapi-ts-sdk-axios` | Axios 实现 | [openapi-ts-sdk-axios](https://github.com/langgexyz/openapi-ts-sdk-axios) |
| `openapi-ts-sdk-fetch` | Fetch API 实现 | [openapi-ts-sdk-fetch](https://github.com/langgexyz/openapi-ts-sdk-fetch) |

## 🧪 测试

本包提供完整的单元测试覆盖：

```bash
# 运行所有测试
npm test

# 运行特定测试
npm run test:compatibility    # TypeScript 5.x 兼容性
npm run test:naming          # 命名规则验证  
npm run test:decorator-basics # 装饰器基础功能
npm run test:function-naming # 函数命名验证

# 浏览器环境测试
npm run test:browser
```

### 测试覆盖范围

- ✅ TypeScript 4.x/5.x 兼容性
- ✅ 装饰器元数据系统
- ✅ 命名规则一致性验证
- ✅ HTTP 方法装饰器功能
- ✅ 类装饰器 (@RootUri)
- ✅ 错误处理和验证
- ✅ 浏览器环境兼容性

> **注意**: 集成测试（需要外部依赖）位于独立的测试项目中。

## 🚀 版本历史

- **v1.0.2** - TypeScript 5.x 兼容性支持
- **v1.0.1** - 增加 @RootUri 装饰器和服务器接口推导
- **v1.0.0** - 首个稳定版本

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件
