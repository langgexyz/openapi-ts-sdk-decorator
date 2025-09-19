/**
 * OpenAPI TypeScript SDK Decorator Package
 *
 * This package provides decorators, validation rules, and base client
 * functionality for OpenAPI-generated TypeScript SDKs.
 */
// Export shared rules and interfaces
export * from './src/rules';
// Export decorators
export * from './src/decorators';
// Export base client and utilities
export * from './src/client';
// Re-export commonly used types from dependencies
export { HttpMethod } from 'openapi-ts-sdk';
//# sourceMappingURL=index.js.map