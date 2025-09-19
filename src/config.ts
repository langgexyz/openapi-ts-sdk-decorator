/**
 * SDK 规范检查配置
 */

// 默认开启规范检查
let validationEnabled: boolean = true;

/**
 * 是否启用规范检查
 */
export function isValidationEnabled(): boolean {
  return validationEnabled;
}

/**
 * 设置规范检查开关
 */
export function setValidationEnabled(enabled: boolean): void {
  validationEnabled = enabled;
}
