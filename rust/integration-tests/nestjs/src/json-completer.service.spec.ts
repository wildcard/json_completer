import { Test, TestingModule } from '@nestjs/testing';
import { JsonCompleterService } from './json-completer.service';

/**
 * Integration tests for JsonCompleterService with Nest.js
 * These are blackbox tests that actually run the Rust binary
 */
describe('JsonCompleterService (Integration)', () => {
  let service: JsonCompleterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JsonCompleterService],
    }).compile();

    service = module.get<JsonCompleterService>(JsonCompleterService);
  });

  afterEach(() => {
    // Reset state after each test
    service.reset();
  });

  describe('complete (one-shot)', () => {
    it('should complete incomplete object', async () => {
      const result = await service.complete('{"name": "John", "age":');
      expect(result).toBe('{"name": "John", "age":null}');
    });

    it('should complete incomplete string', async () => {
      const result = await service.complete('{"message": "Hello wo');
      expect(result).toBe('{"message": "Hello wo"}');
    });

    it('should complete incomplete array', async () => {
      const result = await service.complete('[1, 2, 3');
      expect(result).toBe('[1, 2, 3]');
    });

    it('should complete nested structures', async () => {
      const result = await service.complete('{"user": {"name": "Alice", "posts": [{"id": 1');
      expect(result).toBe('{"user": {"name": "Alice", "posts": [{"id": 1}]}}');
    });

    it('should handle incomplete numbers', async () => {
      const result = await service.complete('{"value": 2.');
      expect(result).toBe('{"value": 2.0}');
    });

    it('should handle incomplete exponents', async () => {
      const result = await service.complete('{"value": 2e');
      expect(result).toBe('{"value": 2e0}');
    });

    it('should handle incomplete keywords', async () => {
      const result = await service.complete('{"active": tru');
      expect(result).toBe('{"active": true}');
    });

    it('should handle missing colons', async () => {
      const result = await service.complete('{"foo"');
      expect(result).toBe('{"foo":null}');
    });

    it('should handle incomplete unicode escapes', async () => {
      const result = await service.complete('"\\u260');
      expect(result).toBe('""');
    });

    it('should preserve valid JSON', async () => {
      const valid = '{"name": "John", "age": 30}';
      const result = await service.complete(valid);
      expect(result).toBe(valid);
    });
  });

  describe('completeIncremental (streaming)', () => {
    it('should handle incremental completion with state', async () => {
      // First chunk
      const result1 = await service.completeIncremental('{"users": [{"name": "');
      expect(result1).toBe('{"users": [{"name": ""}]}');

      // Second chunk (accumulated input)
      const result2 = await service.completeIncremental('{"users": [{"name": "Alice"}');
      expect(result2).toBe('{"users": [{"name": "Alice"}]}');

      // Third chunk (complete)
      const result3 = await service.completeIncremental('{"users": [{"name": "Alice"}, {"name": "Bob"}]}');
      expect(result3).toBe('{"users": [{"name": "Alice"}, {"name": "Bob"}]}');
    });

    it('should maintain state across calls', async () => {
      const result1 = await service.completeIncremental('{"data":');
      expect(result1).toBe('{"data":null}');

      const result2 = await service.completeIncremental('{"data":"test"');
      expect(result2).toBe('{"data":"test"}');

      const result3 = await service.completeIncremental('{"data":"test","count":5}');
      expect(result3).toBe('{"data":"test","count":5}');
    });

    it('should handle complex nested streaming', async () => {
      const result1 = await service.completeIncremental('{"response": {"items": [');
      expect(result1).toBe('{"response": {"items": []}}');

      const result2 = await service.completeIncremental('{"response": {"items": [{"id": 1, "name": "Item 1"}');
      expect(result2).toBe('{"response": {"items": [{"id": 1, "name": "Item 1"}]}}');

      const result3 = await service.completeIncremental('{"response": {"items": [{"id": 1, "name": "Item 1"}, {"id": 2, "name": "Item 2"}]}}');
      expect(result3).toBe('{"response": {"items": [{"id": 1, "name": "Item 1"}, {"id": 2, "name": "Item 2"}]}}');
    });

    it('should reset state correctly', async () => {
      await service.completeIncremental('{"test":');

      service.reset();

      const result = await service.completeIncremental('{"new":');
      expect(result).toBe('{"new":null}');
    });
  });

  describe('real-world scenarios', () => {
    it('should handle streaming API response simulation', async () => {
      // Simulate receiving a large JSON response in chunks
      const chunks = [
        '{"status": "success", "data": {',
        '{"status": "success", "data": {"users": [',
        '{"status": "success", "data": {"users": [{"id": 1, "name": "Alice"',
        '{"status": "success", "data": {"users": [{"id": 1, "name": "Alice", "email": "alice@example.com"}',
        '{"status": "success", "data": {"users": [{"id": 1, "name": "Alice", "email": "alice@example.com"}, {"id": 2, "name": "Bob", "email": "bob@example.com"}]}}',
      ];

      const client = service.createClient();

      for (const chunk of chunks) {
        const result = await client.completeIncremental(chunk);
        // Each result should be valid JSON
        expect(() => JSON.parse(result)).not.toThrow();
      }
    });

    it('should handle truncated log entries', async () => {
      const truncatedLog = '{"timestamp": "2024-01-01T12:00:00Z", "level": "info", "message": "User logged in", "user": {"id": 123, "name": "John';

      const result = await service.complete(truncatedLog);

      // Should be valid JSON
      const parsed = JSON.parse(result);
      expect(parsed.timestamp).toBe('2024-01-01T12:00:00Z');
      expect(parsed.level).toBe('info');
      expect(parsed.user.id).toBe(123);
      expect(parsed.user.name).toBe('John');
    });

    it('should handle malformed API responses', async () => {
      const malformed = '{"error": false, "data": {"items": [1, 2, 3,';

      const result = await service.complete(malformed);

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe(false);
      expect(parsed.data.items).toEqual([1, 2, 3, null]);
    });

    it('should handle empty and whitespace', async () => {
      const result1 = await service.complete('  {  ');
      expect(result1.trim()).toBe('{}');

      const result2 = await service.complete('');
      expect(result2).toBe('');
    });

    it('should handle deeply nested objects', async () => {
      const deep = '{"a": {"b": {"c": {"d": {"e": {"f":';

      const result = await service.complete(deep);

      const parsed = JSON.parse(result);
      expect(parsed.a.b.c.d.e.f).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should handle multiple instances concurrently', async () => {
      const promises = [
        service.complete('{"a":'),
        service.complete('{"b":'),
        service.complete('{"c":'),
      ];

      const results = await Promise.all(promises);

      expect(results[0]).toBe('{"a":null}');
      expect(results[1]).toBe('{"b":null}');
      expect(results[2]).toBe('{"c":null}');
    });

    it('should handle large JSON documents', async () => {
      // Generate a large partial JSON
      const largeArray = '{"data": [' + Array(1000).fill('{"id": 1, "value": "test"').join(',');

      const result = await service.complete(largeArray);

      // Should complete without errors
      expect(() => JSON.parse(result)).not.toThrow();
      const parsed = JSON.parse(result);
      expect(parsed.data).toHaveLength(1000);
    });
  });

  describe('performance', () => {
    it('should complete JSON quickly', async () => {
      const start = Date.now();

      await service.complete('{"test": "value", "nested": {"a": 1, "b":');

      const elapsed = Date.now() - start;

      // Should complete in less than 100ms
      expect(elapsed).toBeLessThan(100);
    });

    it('should handle incremental processing efficiently', async () => {
      const iterations = 50;
      const start = Date.now();

      const client = service.createClient();
      let input = '{"items": [';

      for (let i = 0; i < iterations; i++) {
        input += `{"id": ${i}},`;
        await client.completeIncremental(input);
      }

      const elapsed = Date.now() - start;
      const avgTime = elapsed / iterations;

      // Average time per iteration should be reasonable
      expect(avgTime).toBeLessThan(20); // Less than 20ms per iteration
    });
  });
});
