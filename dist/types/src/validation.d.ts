/**
 * class-validator 兼容性装饰器
 * 解决 TypeScript 5.x 新装饰器语法与 class-validator 旧装饰器语法的冲突
 *
 * 这个模块提供了与 class-validator 完全兼容的装饰器，
 * 同时支持 TypeScript 4.x 和 5.x 的装饰器语法。
 */
import 'reflect-metadata';
import { ValidationOptions } from 'class-validator';
import { TransformOptions } from 'class-transformer';
/**
 * 装饰器上下文类型定义
 */
type DecoratorContext = string | {
    kind: 'field' | 'method' | 'class';
    name: string | symbol;
    static: boolean;
    private: boolean;
};
/**
 * 兼容 TypeScript 5.x 的 @IsString 装饰器
 * 验证属性值是否为字符串类型
 */
export declare const IsString: (validationOptions?: ValidationOptions) => (target: any, context?: DecoratorContext) => any;
/**
 * 兼容 TypeScript 5.x 的 @IsNumber 装饰器
 * 验证属性值是否为数字类型
 */
export declare const IsNumber: (validationOptions?: ValidationOptions) => (target: any, context?: DecoratorContext) => any;
/**
 * 兼容 TypeScript 5.x 的 @IsBoolean 装饰器
 * 验证属性值是否为布尔类型
 */
export declare const IsBoolean: (validationOptions?: ValidationOptions) => (target: any, context?: DecoratorContext) => any;
/**
 * 兼容 TypeScript 5.x 的 @IsOptional 装饰器
 * 标记属性为可选，当值为 undefined 或 null 时跳过验证
 */
export declare const IsOptional: (validationOptions?: ValidationOptions) => (target: any, context?: DecoratorContext) => any;
/**
 * 兼容 TypeScript 5.x 的 @IsEmail 装饰器
 * 验证属性值是否为有效的邮箱地址
 */
export declare const IsEmail: (validationOptions?: ValidationOptions) => (target: any, context?: DecoratorContext) => any;
/**
 * 兼容 TypeScript 5.x 的 @MinLength 装饰器
 * 验证字符串属性的最小长度
 */
export declare const MinLength: (min: number, validationOptions?: ValidationOptions) => (target: any, context?: DecoratorContext) => any;
/**
 * 兼容 TypeScript 5.x 的 @MaxLength 装饰器
 * 验证字符串属性的最大长度
 */
export declare const MaxLength: (max: number, validationOptions?: ValidationOptions) => (target: any, context?: DecoratorContext) => any;
/**
 * 兼容 TypeScript 5.x 的 @IsArray 装饰器
 * 验证属性值是否为数组类型
 */
export declare const IsArray: (validationOptions?: ValidationOptions) => (target: any, context?: DecoratorContext) => any;
/**
 * 兼容 TypeScript 5.x 的 @Min 装饰器
 * 验证数字属性的最小值
 */
export declare const Min: (min: number, validationOptions?: ValidationOptions) => (target: any, context?: DecoratorContext) => any;
/**
 * 兼容 TypeScript 5.x 的 @Max 装饰器
 * 验证数字属性的最大值
 */
export declare const Max: (max: number, validationOptions?: ValidationOptions) => (target: any, context?: DecoratorContext) => any;
/**
 * 兼容 TypeScript 5.x 的 @Type 装饰器
 * 用于 class-transformer 的类型转换
 */
export declare const Type: (typeFunction: () => any, options?: TransformOptions) => (target: any, context?: DecoratorContext) => any;
/**
 * 兼容 TypeScript 5.x 的 @ValidateNested 装饰器
 * 验证嵌套对象
 */
export declare const ValidateNested: (validationOptions?: ValidationOptions) => (target: any, context?: DecoratorContext) => any;
/**
 * 重新导出 class-validator 的核心功能
 */
export { validate, ValidationError, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';
/**
 * 重新导出 class-transformer 的核心功能
 */
export { plainToClass, classToPlain, instanceToPlain, Transform, TransformOptions, Expose, Exclude } from 'class-transformer';
//# sourceMappingURL=validation.d.ts.map