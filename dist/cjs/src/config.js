"use strict";
/**
 * SDK 规范检查配置
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidationEnabled = isValidationEnabled;
exports.setValidationEnabled = setValidationEnabled;
// 默认开启规范检查
let validationEnabled = true;
/**
 * 是否启用规范检查
 */
function isValidationEnabled() {
    return validationEnabled;
}
/**
 * 设置规范检查开关
 */
function setValidationEnabled(enabled) {
    validationEnabled = enabled;
}
//# sourceMappingURL=config.js.map