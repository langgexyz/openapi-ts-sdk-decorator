/**
 * 测试用户提供的 TypeScript 示例
 */
import 'reflect-metadata';
import { 
  APIClient, APIOption, POST,
  IsString, RootUri
} from './index';

class LoginRequest {
  @IsString()
  username!: string;
  
  @IsString()
  password!: string;
}

class LoginResponse {
  @IsString()
  token!: string;
}

@RootUri("/api")
class TestClient extends APIClient {
  @POST('/auth/login')
  async login(request: LoginRequest, ...options: APIOption[]): Promise<LoginResponse> {
    throw new Error("Auto-generated method stub. Please don't modify, it will not be executed at runtime.");
  }
}

console.log('🎉 TypeScript 测试成功！现在可以正确处理 TypeScript 代码');
