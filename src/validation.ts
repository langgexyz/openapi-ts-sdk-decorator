/**
 * class-validator 兼容性装饰器
 * 解决 TypeScript 5.x 新装饰器语法与 class-validator 旧装饰器语法的冲突
 * 
 * 这个模块提供了与 class-validator 完全兼容的装饰器，
 * 同时支持 TypeScript 4.x 和 5.x 的装饰器语法。
 */

import 'reflect-metadata';
import { 
  ValidationOptions, 
  registerDecorator, 
  ValidationArguments,
  buildMessage,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validator
} from 'class-validator';
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
 * 创建兼容 TypeScript 5.x 的验证装饰器
 * 支持新旧装饰器语法的智能检测和适配
 */
function createCompatibleValidator(
  validatorName: string,
  validationFunction: (value: any, validationArguments?: ValidationArguments) => boolean | Promise<boolean>,
  constraints?: any[]
) {
  return function(validationOptions?: ValidationOptions) {
    return function(target: any, context?: DecoratorContext): any {
      let propertyKey: string;

      // 智能检测装饰器语法类型
      if (typeof context === 'string') {
        // 旧装饰器语法：(target, propertyKey, descriptor)
        propertyKey = context;
      } else if (context && typeof context === 'object' && 'name' in context) {
        // TypeScript 5.x 新装饰器语法
        propertyKey = String(context.name);
      } else {
        // 回退处理 - 从 arguments 获取
        propertyKey = String(arguments[1]);
      }

      // 注册验证器到 class-validator
      registerDecorator({
        name: validatorName,
        target: target.constructor,
        propertyName: propertyKey,
        constraints: constraints || [],
        options: validationOptions,
        validator: {
          validate: validationFunction,
          defaultMessage: buildMessage(
            (eachPrefix) => `${eachPrefix}$property must be a valid ${validatorName}`,
            validationOptions
          )
        }
      });

      // 对于新装饰器语法，返回 void
      if (context && typeof context === 'object' && 'kind' in context) {
        return;
      }
      return;
    };
  };
}

/**
 * 创建兼容的 Type 装饰器（用于 class-transformer）
 */
function createCompatibleType(typeFunction: () => any, options?: TransformOptions) {
  return function(target: any, context?: DecoratorContext): any {
    let propertyKey: string;

    // 智能检测装饰器语法类型
    if (typeof context === 'string') {
      // 旧装饰器语法
      propertyKey = context;
    } else if (context && typeof context === 'object' && 'name' in context) {
      // TypeScript 5.x 新装饰器语法
      propertyKey = String(context.name);
    } else {
      // 回退处理
      propertyKey = String(arguments[1]);
    }

    // 存储类型转换信息到元数据中
    // 这里需要与 class-transformer 兼容
    Reflect.defineMetadata('custom:transform:type', typeFunction, target, propertyKey);
    if (options) {
      Reflect.defineMetadata('custom:transform:options', options, target, propertyKey);
    }
    
    // 对于新装饰器语法，返回 void
    if (context && typeof context === 'object' && 'kind' in context) {
      return;
    }
    return;
  };
}

// =============== 导出兼容的验证装饰器 ===============

/**
 * 兼容 TypeScript 5.x 的 @IsString 装饰器
 * 验证属性值是否为字符串类型
 */
export const IsString = (validationOptions?: ValidationOptions) =>
  createCompatibleValidator(
    'isString',
    (value) => typeof value === 'string',
    []
  )(validationOptions);

/**
 * 兼容 TypeScript 5.x 的 @IsNumber 装饰器
 * 验证属性值是否为数字类型
 */
export const IsNumber = (validationOptions?: ValidationOptions) =>
  createCompatibleValidator(
    'isNumber',
    (value) => typeof value === 'number' && !isNaN(value),
    []
  )(validationOptions);

/**
 * 兼容 TypeScript 5.x 的 @IsBoolean 装饰器
 * 验证属性值是否为布尔类型
 */
export const IsBoolean = (validationOptions?: ValidationOptions) =>
  createCompatibleValidator(
    'isBoolean',
    (value) => typeof value === 'boolean',
    []
  )(validationOptions);

/**
 * 兼容 TypeScript 5.x 的 @IsOptional 装饰器
 * 标记属性为可选，当值为 undefined 或 null 时跳过验证
 */
export const IsOptional = (validationOptions?: ValidationOptions) =>
  createCompatibleValidator(
    'isOptional',
    () => true, // IsOptional 应该总是返回 true，它只是一个标记装饰器
    []
  )(validationOptions);

/**
 * 兼容 TypeScript 5.x 的 @IsEmail 装饰器
 * 验证属性值是否为有效的邮箱地址
 */
export const IsEmail = (validationOptions?: ValidationOptions) =>
  createCompatibleValidator(
    'isEmail',
    (value) => {
      if (typeof value !== 'string') return false;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },
    []
  )(validationOptions);

/**
 * 兼容 TypeScript 5.x 的 @MinLength 装饰器
 * 验证字符串属性的最小长度
 */
export const MinLength = (min: number, validationOptions?: ValidationOptions) =>
  createCompatibleValidator(
    'minLength',
    (value, args) => {
      if (typeof value !== 'string') return false;
      const minLength = args?.constraints?.[0] ?? min;
      return value.length >= minLength;
    },
    [min]
  )(validationOptions);

/**
 * 兼容 TypeScript 5.x 的 @MaxLength 装饰器
 * 验证字符串属性的最大长度
 */
export const MaxLength = (max: number, validationOptions?: ValidationOptions) =>
  createCompatibleValidator(
    'maxLength',
    (value, args) => {
      if (typeof value !== 'string') return false;
      const maxLength = args?.constraints?.[0] ?? max;
      return value.length <= maxLength;
    },
    [max]
  )(validationOptions);

/**
 * 兼容 TypeScript 5.x 的 @IsArray 装饰器
 * 验证属性值是否为数组类型
 */
export const IsArray = (validationOptions?: ValidationOptions) =>
  createCompatibleValidator(
    'isArray',
    (value) => Array.isArray(value),
    []
  )(validationOptions);

/**
 * 兼容 TypeScript 5.x 的 @Min 装饰器
 * 验证数字属性的最小值
 */
export const Min = (min: number, validationOptions?: ValidationOptions) =>
  createCompatibleValidator(
    'min',
    (value, args) => {
      if (typeof value !== 'number') return false;
      const minValue = args?.constraints?.[0] ?? min;
      return value >= minValue;
    },
    [min]
  )(validationOptions);

/**
 * 兼容 TypeScript 5.x 的 @Max 装饰器
 * 验证数字属性的最大值
 */
export const Max = (max: number, validationOptions?: ValidationOptions) =>
  createCompatibleValidator(
    'max',
    (value, args) => {
      if (typeof value !== 'number') return false;
      const maxValue = args?.constraints?.[0] ?? max;
      return value <= maxValue;
    },
    [max]
  )(validationOptions);

/**
 * 兼容 TypeScript 5.x 的 @Type 装饰器
 * 用于 class-transformer 的类型转换
 */
export const Type = (typeFunction: () => any, options?: TransformOptions) =>
  createCompatibleType(typeFunction, options);

/**
 * 兼容 TypeScript 5.x 的 @ValidateNested 装饰器
 * 验证嵌套对象
 */
export const ValidateNested = (validationOptions?: ValidationOptions) =>
  createCompatibleValidator(
    'validateNested',
    async (value, args) => {
      if (value == null) return true; // null/undefined 通过验证，由 @IsOptional 处理
      
      // 如果是数组，验证每个元素
      if (Array.isArray(value)) {
        const validator = new Validator();
        for (const item of value) {
          const errors = await validator.validate(item);
          if (errors.length > 0) return false;
        }
        return true;
      }
      
      // 验证单个对象
      if (typeof value === 'object') {
        const validator = new Validator();
        const errors = await validator.validate(value);
        return errors.length === 0;
      }
      
      return false;
    },
    []
  )(validationOptions);

// =============== 重新导出核心功能 ===============

/**
 * 重新导出 class-validator 的核心功能
 */
export { 
  validate, 
  ValidationError, 
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments
} from 'class-validator';

/**
 * 重新导出 class-transformer 的核心功能
 */
export { 
  plainToClass, 
  classToPlain, 
  instanceToPlain,
  Transform,
  TransformOptions,
  Expose,
  Exclude
} from 'class-transformer';
