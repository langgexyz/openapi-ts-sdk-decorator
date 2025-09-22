/**
 * Unit tests for URI Builder functionality
 */

import { APIConfigURIBuilder, buildURI, buildURIFromPath } from '../../src/uri-builder';
import { APIConfig } from '../../src/types';

describe('APIConfigURIBuilder', () => {
  describe('静态工厂方法', () => {
    it('should create builder from config', () => {
      const config: APIConfig = {
        path: '/users',
        headers: { 'Content-Type': 'application/json' }
      };
      
      const builder = APIConfigURIBuilder.from(config);
      const result = builder.build();
      
      expect(result).toBe('/users');
    });

    it('should create builder from path', () => {
      const builder = APIConfigURIBuilder.fromPath('/users');
      const result = builder.build();
      
      expect(result).toBe('/users');
    });
  });

  describe('链式配置方法', () => {
    it('should support withRoot method', () => {
      const result = APIConfigURIBuilder
        .fromPath('/users')
        .withRoot('/api/v1')
        .build();
      
      expect(result).toBe('/api/v1/users');
    });

    it('should support withParams method', () => {
      const result = APIConfigURIBuilder
        .fromPath('/users/{id}')
        .withParams({ id: '123' })
        .build();
      
      expect(result).toBe('/users/123');
    });

    it('should support withQuery method', () => {
      const result = APIConfigURIBuilder
        .fromPath('/users')
        .withQuery({ limit: '10', sort: 'name' })
        .build();
      
      expect(result).toBe('/users?limit=10&sort=name');
    });

    it('should support method chaining in any order', () => {
      const result = APIConfigURIBuilder
        .fromPath('/users/{id}')
        .withQuery({ limit: '10' })
        .withRoot('/api/v1')
        .withParams({ id: '123' })
        .build();
      
      expect(result).toBe('/api/v1/users/123?limit=10');
    });
  });

  describe('根路径组合', () => {
    it('should handle missing root', () => {
      const result = APIConfigURIBuilder
        .fromPath('/users')
        .build();
      
      expect(result).toBe('/users');
    });

    it('should combine root and path correctly', () => {
      const result = APIConfigURIBuilder
        .fromPath('/users')
        .withRoot('/api/v1')
        .build();
      
      expect(result).toBe('/api/v1/users');
    });

    it('should handle root with trailing slash', () => {
      const result = APIConfigURIBuilder
        .fromPath('/users')
        .withRoot('/api/v1/')
        .build();
      
      expect(result).toBe('/api/v1/users');
    });

    it('should handle multiple trailing slashes', () => {
      const result = APIConfigURIBuilder
        .fromPath('/users')
        .withRoot('/api/v1///')
        .build();
      
      expect(result).toBe('/api/v1/users');
    });

    it('should handle path without leading slash', () => {
      const result = APIConfigURIBuilder
        .fromPath('users')
        .withRoot('/api/v1')
        .build();
      
      expect(result).toBe('/api/v1/users');
    });
  });

  describe('路径参数替换', () => {
    it('should replace single path parameter', () => {
      const result = APIConfigURIBuilder
        .fromPath('/users/{id}')
        .withParams({ id: '123' })
        .build();
      
      expect(result).toBe('/users/123');
    });

    it('should replace multiple path parameters', () => {
      const result = APIConfigURIBuilder
        .fromPath('/users/{userId}/posts/{postId}')
        .withParams({ userId: '123', postId: '456' })
        .build();
      
      expect(result).toBe('/users/123/posts/456');
    });

    it('should URL encode path parameters', () => {
      const result = APIConfigURIBuilder
        .fromPath('/users/{id}')
        .withParams({ id: 'user@example.com' })
        .build();
      
      expect(result).toBe('/users/user%40example.com');
    });

    it('should throw error for missing path parameters', () => {
      expect(() => {
        APIConfigURIBuilder
          .fromPath('/users/{id}')
          .withParams({ name: 'john' }) // missing 'id'
          .build();
      }).toThrow('Missing path parameters: [id]');
    });

    it('should throw error for multiple missing path parameters', () => {
      expect(() => {
        APIConfigURIBuilder
          .fromPath('/users/{userId}/posts/{postId}')
          .withParams({ name: 'john' }) // missing both
          .build();
      }).toThrow('Missing path parameters: [userId, postId]');
    });
  });

  describe('查询参数处理', () => {
    it('should add single query parameter', () => {
      const result = APIConfigURIBuilder
        .fromPath('/users')
        .withQuery({ limit: '10' })
        .build();
      
      expect(result).toBe('/users?limit=10');
    });

    it('should add multiple query parameters', () => {
      const result = APIConfigURIBuilder
        .fromPath('/users')
        .withQuery({ limit: '10', offset: '20', sort: 'name' })
        .build();
      
      expect(result).toBe('/users?limit=10&offset=20&sort=name');
    });

    it('should URL encode query parameters', () => {
      const result = APIConfigURIBuilder
        .fromPath('/users')
        .withQuery({ search: 'john doe', email: 'user@example.com' })
        .build();
      
      expect(result).toBe('/users?search=john%20doe&email=user%40example.com');
    });

    it('should filter out empty, null, and undefined query parameters', () => {
      const result = APIConfigURIBuilder
        .fromPath('/users')
        .withQuery({ 
          limit: '10', 
          empty: '', 
          nullValue: null as any, 
          undefinedValue: undefined as any,
          valid: 'test'
        })
        .build();
      
      expect(result).toBe('/users?limit=10&valid=test');
    });

    it('should append to existing query string', () => {
      const result = APIConfigURIBuilder
        .fromPath('/users?existing=param')
        .withQuery({ limit: '10' })
        .build();
      
      expect(result).toBe('/users?existing=param&limit=10');
    });
  });

  describe('完整工作流', () => {
    it('should handle all features together', () => {
      const result = APIConfigURIBuilder
        .fromPath('/users/{userId}/posts')
        .withRoot('/api/v1')
        .withParams({ userId: '123' })
        .withQuery({ limit: '10', sort: 'date' })
        .build();
      
      expect(result).toBe('/api/v1/users/123/posts?limit=10&sort=date');
    });

    it('should handle complex real-world scenario', () => {
      const result = APIConfigURIBuilder
        .fromPath('organizations/{orgId}/projects/{projectId}/issues')
        .withRoot('/api/v2/')
        .withParams({ 
          orgId: 'my-org', 
          projectId: 'project-123' 
        })
        .withQuery({ 
          status: 'open', 
          assignee: 'user@example.com',
          limit: '50'
        })
        .build();
      
      expect(result).toBe('/api/v2/organizations/my-org/projects/project-123/issues?status=open&assignee=user%40example.com&limit=50');
    });
  });

  describe('配置管理', () => {
    it('should return config copy for debugging', () => {
      const originalConfig: APIConfig = {
        path: '/users/{id}',
        headers: { 'Content-Type': 'application/json' },
        params: { id: '123' },
        query: { limit: '10' }
      };
      
      const builder = APIConfigURIBuilder.from(originalConfig);
      const config = builder.getConfig();
      
      expect(config).toEqual(originalConfig);
      expect(config).not.toBe(originalConfig); // 应该是副本
    });

    it('should not modify original config', () => {
      const originalConfig: APIConfig = {
        path: '/users',
        headers: { 'Content-Type': 'application/json' }
      };
      
      APIConfigURIBuilder
        .from(originalConfig)
        .withRoot('/api/v1')
        .withParams({ id: '123' })
        .build();
      
      // 原始配置不应该被修改
      expect(originalConfig.root).toBeUndefined();
      expect(originalConfig.params).toBeUndefined();
    });
  });
});

describe('便捷函数', () => {
  describe('buildURI', () => {
    it('should build URI from config', () => {
      const config: APIConfig = {
        path: '/users/{id}',
        headers: { 'Content-Type': 'application/json' },
        root: '/api/v1',
        params: { id: '123' },
        query: { limit: '10' }
      };
      
      const result = buildURI(config);
      
      expect(result).toBe('/api/v1/users/123?limit=10');
    });
  });

  describe('buildURIFromPath', () => {
    it('should build URI from path only', () => {
      const result = buildURIFromPath('/users');
      
      expect(result).toBe('/users');
    });

    it('should build URI from path with root', () => {
      const result = buildURIFromPath('/users', '/api/v1');
      
      expect(result).toBe('/api/v1/users');
    });
  });
});
