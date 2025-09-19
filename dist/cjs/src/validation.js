"use strict";
/**
 * class-validator 兼容性装饰器
 * 解决 TypeScript 5.x 新装饰器语法与 class-validator 旧装饰器语法的冲突
 *
 * 这个模块提供了与 class-validator 完全兼容的装饰器，
 * 同时支持 TypeScript 4.x 和 5.x 的装饰器语法。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Exclude = exports.Expose = exports.Transform = exports.instanceToPlain = exports.classToPlain = exports.plainToClass = exports.ValidatorConstraint = exports.ValidationError = exports.validate = exports.ValidateNested = exports.Type = exports.Max = exports.Min = exports.IsArray = exports.MaxLength = exports.MinLength = exports.IsEmail = exports.IsOptional = exports.IsBoolean = exports.IsNumber = exports.IsString = void 0;
require("reflect-metadata");
const class_validator_1 = require("class-validator");
/**
 * 创建兼容 TypeScript 5.x 的验证装饰器
 * 支持新旧装饰器语法的智能检测和适配
 */
function createCompatibleValidator(validatorName, validationFunction, constraints) {
    return function (validationOptions) {
        return function (target, context) {
            let propertyKey;
            // 智能检测装饰器语法类型
            if (typeof context === 'string') {
                // 旧装饰器语法：(target, propertyKey, descriptor)
                propertyKey = context;
            }
            else if (context && typeof context === 'object' && 'name' in context) {
                // TypeScript 5.x 新装饰器语法
                propertyKey = String(context.name);
            }
            else {
                // 回退处理 - 从 arguments 获取
                propertyKey = String(arguments[1]);
            }
            // 注册验证器到 class-validator
            (0, class_validator_1.registerDecorator)({
                name: validatorName,
                target: target.constructor,
                propertyName: propertyKey,
                constraints: constraints || [],
                options: validationOptions,
                validator: {
                    validate: validationFunction,
                    defaultMessage: (0, class_validator_1.buildMessage)((eachPrefix) => `${eachPrefix}$property must be a valid ${validatorName}`, validationOptions)
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
function createCompatibleType(typeFunction, options) {
    return function (target, context) {
        let propertyKey;
        // 智能检测装饰器语法类型
        if (typeof context === 'string') {
            // 旧装饰器语法
            propertyKey = context;
        }
        else if (context && typeof context === 'object' && 'name' in context) {
            // TypeScript 5.x 新装饰器语法
            propertyKey = String(context.name);
        }
        else {
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
const IsString = (validationOptions) => createCompatibleValidator('isString', (value) => typeof value === 'string', [])(validationOptions);
exports.IsString = IsString;
/**
 * 兼容 TypeScript 5.x 的 @IsNumber 装饰器
 * 验证属性值是否为数字类型
 */
const IsNumber = (validationOptions) => createCompatibleValidator('isNumber', (value) => typeof value === 'number' && !isNaN(value), [])(validationOptions);
exports.IsNumber = IsNumber;
/**
 * 兼容 TypeScript 5.x 的 @IsBoolean 装饰器
 * 验证属性值是否为布尔类型
 */
const IsBoolean = (validationOptions) => createCompatibleValidator('isBoolean', (value) => typeof value === 'boolean', [])(validationOptions);
exports.IsBoolean = IsBoolean;
/**
 * 兼容 TypeScript 5.x 的 @IsOptional 装饰器
 * 标记属性为可选，当值为 undefined 或 null 时跳过验证
 */
const IsOptional = (validationOptions) => createCompatibleValidator('isOptional', () => true, // IsOptional 应该总是返回 true，它只是一个标记装饰器
[])(validationOptions);
exports.IsOptional = IsOptional;
/**
 * 兼容 TypeScript 5.x 的 @IsEmail 装饰器
 * 验证属性值是否为有效的邮箱地址
 */
const IsEmail = (validationOptions) => createCompatibleValidator('isEmail', (value) => {
    if (typeof value !== 'string')
        return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
}, [])(validationOptions);
exports.IsEmail = IsEmail;
/**
 * 兼容 TypeScript 5.x 的 @MinLength 装饰器
 * 验证字符串属性的最小长度
 */
const MinLength = (min, validationOptions) => createCompatibleValidator('minLength', (value, args) => {
    if (typeof value !== 'string')
        return false;
    const minLength = args?.constraints?.[0] ?? min;
    return value.length >= minLength;
}, [min])(validationOptions);
exports.MinLength = MinLength;
/**
 * 兼容 TypeScript 5.x 的 @MaxLength 装饰器
 * 验证字符串属性的最大长度
 */
const MaxLength = (max, validationOptions) => createCompatibleValidator('maxLength', (value, args) => {
    if (typeof value !== 'string')
        return false;
    const maxLength = args?.constraints?.[0] ?? max;
    return value.length <= maxLength;
}, [max])(validationOptions);
exports.MaxLength = MaxLength;
/**
 * 兼容 TypeScript 5.x 的 @IsArray 装饰器
 * 验证属性值是否为数组类型
 */
const IsArray = (validationOptions) => createCompatibleValidator('isArray', (value) => Array.isArray(value), [])(validationOptions);
exports.IsArray = IsArray;
/**
 * 兼容 TypeScript 5.x 的 @Min 装饰器
 * 验证数字属性的最小值
 */
const Min = (min, validationOptions) => createCompatibleValidator('min', (value, args) => {
    if (typeof value !== 'number')
        return false;
    const minValue = args?.constraints?.[0] ?? min;
    return value >= minValue;
}, [min])(validationOptions);
exports.Min = Min;
/**
 * 兼容 TypeScript 5.x 的 @Max 装饰器
 * 验证数字属性的最大值
 */
const Max = (max, validationOptions) => createCompatibleValidator('max', (value, args) => {
    if (typeof value !== 'number')
        return false;
    const maxValue = args?.constraints?.[0] ?? max;
    return value <= maxValue;
}, [max])(validationOptions);
exports.Max = Max;
/**
 * 兼容 TypeScript 5.x 的 @Type 装饰器
 * 用于 class-transformer 的类型转换
 */
const Type = (typeFunction, options) => createCompatibleType(typeFunction, options);
exports.Type = Type;
/**
 * 兼容 TypeScript 5.x 的 @ValidateNested 装饰器
 * 验证嵌套对象
 */
const ValidateNested = (validationOptions) => createCompatibleValidator('validateNested', async (value, args) => {
    if (value == null)
        return true; // null/undefined 通过验证，由 @IsOptional 处理
    // 如果是数组，验证每个元素
    if (Array.isArray(value)) {
        const validator = new class_validator_1.Validator();
        for (const item of value) {
            const errors = await validator.validate(item);
            if (errors.length > 0)
                return false;
        }
        return true;
    }
    // 验证单个对象
    if (typeof value === 'object') {
        const validator = new class_validator_1.Validator();
        const errors = await validator.validate(value);
        return errors.length === 0;
    }
    return false;
}, [])(validationOptions);
exports.ValidateNested = ValidateNested;
// =============== 重新导出核心功能 ===============
/**
 * 重新导出 class-validator 的核心功能
 */
var class_validator_2 = require("class-validator");
Object.defineProperty(exports, "validate", { enumerable: true, get: function () { return class_validator_2.validate; } });
Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function () { return class_validator_2.ValidationError; } });
Object.defineProperty(exports, "ValidatorConstraint", { enumerable: true, get: function () { return class_validator_2.ValidatorConstraint; } });
/**
 * 重新导出 class-transformer 的核心功能
 */
var class_transformer_1 = require("class-transformer");
Object.defineProperty(exports, "plainToClass", { enumerable: true, get: function () { return class_transformer_1.plainToClass; } });
Object.defineProperty(exports, "classToPlain", { enumerable: true, get: function () { return class_transformer_1.classToPlain; } });
Object.defineProperty(exports, "instanceToPlain", { enumerable: true, get: function () { return class_transformer_1.instanceToPlain; } });
Object.defineProperty(exports, "Transform", { enumerable: true, get: function () { return class_transformer_1.Transform; } });
Object.defineProperty(exports, "Expose", { enumerable: true, get: function () { return class_transformer_1.Expose; } });
Object.defineProperty(exports, "Exclude", { enumerable: true, get: function () { return class_transformer_1.Exclude; } });
//# sourceMappingURL=validation.js.map