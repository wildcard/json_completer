/**
 * Next.js API Route Integration Tests
 * These are blackbox tests that actually run the Rust binary through the Next.js API
 */

import { createMocks } from 'node-mocks-http';
import handler from '../pages/api/complete-json';
import { JsonCompleterClient } from '../../shared/json-completer-client';

describe('Next.js API Route Integration', () => {
  describe('POST /api/complete-json', () => {
    it('should complete incomplete object', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          partialJson: '{"name": "John", "age":',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.result).toBe('{"name": "John", "age":null}');
    });

    it('should complete incomplete string', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          partialJson: '{"message": "Hello wo',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.result).toBe('{"message": "Hello wo"}');
    });

    it('should complete incomplete array', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          partialJson: '[1, 2, 3',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.result).toBe('[1, 2, 3]');
    });

    it('should handle nested structures', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          partialJson: '{"user": {"name": "Alice", "posts": [{"id": 1',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.result).toBe('{"user": {"name": "Alice", "posts": [{"id": 1}]}}');
    });

    it('should handle incomplete numbers', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          partialJson: '{"value": 2.',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.result).toBe('{"value": 2.0}');
    });

    it('should preserve valid JSON', async () => {
      const validJson = '{"name": "John", "age": 30}';
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          partialJson: validJson,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.result).toBe(validJson);
    });

    it('should handle empty string', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          partialJson: '',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.result).toBe('');
    });
  });

  describe('Error Handling', () => {
    it('should return 405 for non-POST requests', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe('Method not allowed');
    });

    it('should return 400 for missing partialJson', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {},
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toContain('Missing partialJson');
    });

    it('should return 400 for invalid type', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          partialJson: 123,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toContain('must be a string');
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle truncated API response', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          partialJson: '{"status": "success", "data": {"items": [{"id": 1, "name": "Item 1"}',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());

      // Result should be valid JSON
      const parsed = JSON.parse(data.result);
      expect(parsed.status).toBe('success');
      expect(parsed.data.items).toHaveLength(1);
      expect(parsed.data.items[0].id).toBe(1);
    });

    it('should handle truncated log entry', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          partialJson: '{"timestamp": "2024-01-01T12:00:00Z", "level": "error", "message": "Connection failed", "details": {"host": "example.com", "port":',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());

      const parsed = JSON.parse(data.result);
      expect(parsed.timestamp).toBe('2024-01-01T12:00:00Z');
      expect(parsed.level).toBe('error');
      expect(parsed.details.host).toBe('example.com');
      expect(parsed.details.port).toBeNull();
    });

    it('should handle large JSON', async () => {
      // Generate a large partial JSON
      const items = Array(100).fill(0).map((_, i) => `{"id": ${i}, "name": "Item ${i}"}`);
      const partialJson = '{"data": [' + items.join(',');

      const { req, res } = createMocks({
        method: 'POST',
        body: { partialJson },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());

      // Should complete without errors
      const parsed = JSON.parse(data.result);
      expect(parsed.data).toHaveLength(100);
    });
  });

  describe('Direct Binary Integration', () => {
    let client: JsonCompleterClient;

    beforeEach(() => {
      client = new JsonCompleterClient();
    });

    afterEach(() => {
      client.reset();
    });

    it('should work with direct client usage', async () => {
      const result = await client.complete('{"test":');
      expect(result).toBe('{"test":null}');
    });

    it('should handle incremental streaming', async () => {
      const result1 = await client.completeIncremental('{"stream": [');
      expect(result1).toBe('{"stream": []}');

      const result2 = await client.completeIncremental('{"stream": [1, 2, 3');
      expect(result2).toBe('{"stream": [1, 2, 3]}');

      const result3 = await client.completeIncremental('{"stream": [1, 2, 3, 4, 5]}');
      expect(result3).toBe('{"stream": [1, 2, 3, 4, 5]}');
    });

    it('should handle complex streaming scenario', async () => {
      // Simulate a real streaming API response
      const chunks = [
        '{"response": {',
        '{"response": {"status": "ok", "data": {',
        '{"response": {"status": "ok", "data": {"users": [',
        '{"response": {"status": "ok", "data": {"users": [{"id": 1',
        '{"response": {"status": "ok", "data": {"users": [{"id": 1, "name": "Alice"}',
        '{"response": {"status": "ok", "data": {"users": [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]}}',
      ];

      for (const chunk of chunks) {
        const result = await client.completeIncremental(chunk);
        // Each result should be valid JSON
        expect(() => JSON.parse(result)).not.toThrow();
      }
    });
  });

  describe('Performance', () => {
    it('should complete JSON quickly', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          partialJson: '{"test": "value", "nested": {"a": 1, "b":',
        },
      });

      const start = Date.now();
      await handler(req, res);
      const elapsed = Date.now() - start;

      expect(res._getStatusCode()).toBe(200);
      // Should complete in less than 100ms
      expect(elapsed).toBeLessThan(100);
    });

    it('should handle concurrent requests', async () => {
      const requests = Array(10).fill(0).map((_, i) => {
        const { req, res } = createMocks({
          method: 'POST',
          body: {
            partialJson: `{"request": ${i}, "data":`,
          },
        });
        return handler(req, res).then(() => res);
      });

      const responses = await Promise.all(requests);

      responses.forEach((res, i) => {
        expect(res._getStatusCode()).toBe(200);
        const data = JSON.parse(res._getData());
        expect(data.success).toBe(true);
        const parsed = JSON.parse(data.result);
        expect(parsed.request).toBe(i);
      });
    });
  });
});
