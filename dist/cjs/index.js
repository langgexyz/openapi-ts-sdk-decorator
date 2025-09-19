"use strict";
/**
 * OpenAPI TypeScript SDK Decorator Package
 *
 * This package provides decorators, validation rules, and base client
 * functionality for OpenAPI-generated TypeScript SDKs.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpMethod = exports.setValidationEnabled = exports.isValidationEnabled = void 0;
// Export shared rules and interfaces
__exportStar(require("./src/rules"), exports);
// Export decorators
__exportStar(require("./src/decorators"), exports);
// Export base client and utilities
__exportStar(require("./src/client"), exports);
// Export validation decorators (TypeScript 5.x compatible)
__exportStar(require("./src/validation"), exports);
// Export configuration API
var config_1 = require("./src/config");
Object.defineProperty(exports, "isValidationEnabled", { enumerable: true, get: function () { return config_1.isValidationEnabled; } });
Object.defineProperty(exports, "setValidationEnabled", { enumerable: true, get: function () { return config_1.setValidationEnabled; } });
// Re-export commonly used types from dependencies
var openapi_ts_sdk_1 = require("openapi-ts-sdk");
Object.defineProperty(exports, "HttpMethod", { enumerable: true, get: function () { return openapi_ts_sdk_1.HttpMethod; } });
//# sourceMappingURL=index.js.map