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

// Export validation decorators (TypeScript 5.x compatible)
export * from './src/validation';

// Export configuration API
export { isValidationEnabled, setValidationEnabled } from './src/config';

// Re-export commonly used types from dependencies
export { HttpMethod } from 'openapi-ts-sdk';
