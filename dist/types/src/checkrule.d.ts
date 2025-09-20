/**
 * Runtime API规范检查工具
 * 用于在开发和测试阶段验证API客户端是否符合OpenAPI规范
 */
import { APIClient } from './client';
import { ValidationResult } from './rules';
export type { ValidationResult };
export interface CheckRuleOptions {
    /**
     * 启用方法命名验证
     * @default true
     */
    enableNamingValidation?: boolean;
    /**
     * 启用类型名称验证
     * 注意：由于TypeScript类型擦除，此功能在运行时有限
     * @default true
     */
    enableTypeValidation?: boolean;
    /**
     * 启用参数验证
     * @default true
     */
    enableParameterValidation?: boolean;
    /**
     * 检查根URI配置
     * @default true
     */
    checkRootUri?: boolean;
    /**
     * 要求API方法有文档注释
     * @default false
     */
    requireDocumentation?: boolean;
    /**
     * 模块上下文，用于获取真实的类型构造函数
     * 传入对应的模块对象（如 Auth, User 等），以便进行准确的类型验证
     * @example Auth, User, BD, etc.
     */
    moduleContext?: Record<string, new (...args: any[]) => any>;
}
/**
 * 检查单个API客户端是否符合OpenAPI规范
 *
 * @param client - APIClient实例
 * @param options - 检查选项
 * @returns ValidationResult - 验证结果
 *
 * @example
 * ```typescript
 * import { checkRule } from 'openapi-ts-sdk-decorator';
 *
 * const result = checkRule(client, {
 *   enableNamingValidation: true,
 *   enableParameterValidation: true
 * });
 *
 * if (!result.isValid) {
 *   console.log('规范检查失败:', result.errors);
 *   console.log('建议修改:', result.suggestions);
 * }
 * ```
 */
export declare function checkRule(client: APIClient, options?: CheckRuleOptions): ValidationResult;
//# sourceMappingURL=checkrule.d.ts.map