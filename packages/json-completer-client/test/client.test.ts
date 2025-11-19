/**
 * Unit tests for JsonCompleterClient
 *
 * Run: npm test
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { JsonCompleterClient, complete } from '../src/index.js';
import { spawn } from 'child_process';
import path from 'path';

// Check if binary exists before running tests
function binaryExists(): boolean {
  const binPath = path.resolve(__dirname, '../../../target/release/json_completer');
  try {
    const proc = spawn(binPath, ['--version'], { stdio: 'ignore' });
    proc.on('error', () => {});
    return true;
  } catch {
    return false;
  }
}

const SKIP_TESTS = !binaryExists();

if (SKIP_TESTS) {
  console.warn('\n⚠️  Skipping tests: json_completer binary not found');
  console.warn('   Build it with: cargo build --release\n');
}

describe('JsonCompleterClient', { skip: SKIP_TESTS }, () => {
  describe('constructor', () => {
    test('creates instance with default options', () => {
      const client = new JsonCompleterClient();
      assert.ok(client instanceof JsonCompleterClient);
    });

    test('creates instance with custom timeout', () => {
      const client = new JsonCompleterClient({ timeout: 10000 });
      assert.ok(client instanceof JsonCompleterClient);
    });

    test('creates instance with custom binPath', () => {
      const client = new JsonCompleterClient({
        binPath: '/custom/path/json_completer',
      });
      assert.ok(client instanceof JsonCompleterClient);
    });
  });

  describe('complete()', () => {
    test('completes incomplete object with missing value', async () => {
      const client = new JsonCompleterClient();
      const result = await client.complete('{"test":');
      assert.strictEqual(result, '{"test":null}');
    });

    test('completes incomplete string', async () => {
      const client = new JsonCompleterClient();
      const result = await client.complete('{"message": "Hello wo');
      assert.strictEqual(result, '{"message": "Hello wo"}');
    });

    test('completes incomplete array', async () => {
      const client = new JsonCompleterClient();
      const result = await client.complete('[1, 2, 3');
      assert.strictEqual(result, '[1, 2, 3]');
    });

    test('completes nested objects', async () => {
      const client = new JsonCompleterClient();
      const result = await client.complete('{"user": {"name":');
      assert.strictEqual(result, '{"user": {"name":null}}');
    });

    test('handles already complete JSON', async () => {
      const client = new JsonCompleterClient();
      const result = await client.complete('{"test": "value"}');
      assert.strictEqual(result, '{"test": "value"}');
    });

    test('completes array of objects', async () => {
      const client = new JsonCompleterClient();
      const result = await client.complete('[{"id": 1}, {"id": 2');
      const parsed = JSON.parse(result);
      assert.strictEqual(Array.isArray(parsed), true);
      assert.strictEqual(parsed.length, 2);
    });

    test('handles empty string', async () => {
      const client = new JsonCompleterClient();
      const result = await client.complete('');
      assert.strictEqual(result, 'null');
    });

    test('completes multiple levels of nesting', async () => {
      const client = new JsonCompleterClient();
      const result = await client.complete('{"a": {"b": {"c":');
      assert.strictEqual(result, '{"a": {"b": {"c":null}}}');
    });
  });

  describe('completeIncremental()', () => {
    test('maintains state between calls', async () => {
      const client = new JsonCompleterClient();

      const result1 = await client.completeIncremental('{"stream": [');
      assert.strictEqual(result1, '{"stream": []}');

      const result2 = await client.completeIncremental('{"stream": [1, 2');
      assert.strictEqual(result2, '{"stream": [1, 2]}');

      const result3 = await client.completeIncremental('{"stream": [1, 2, 3]}');
      assert.strictEqual(result3, '{"stream": [1, 2, 3]}');
    });

    test('processes streaming chunks efficiently', async () => {
      const client = new JsonCompleterClient();

      const chunks = [
        '{"name":',
        '{"name": "A',
        '{"name": "Al',
        '{"name": "Alice',
        '{"name": "Alice"}',
      ];

      for (const chunk of chunks) {
        const result = await client.completeIncremental(chunk);
        const parsed = JSON.parse(result);
        assert.ok(parsed.name !== undefined);
      }
    });

    test('resets state correctly', async () => {
      const client = new JsonCompleterClient();

      await client.completeIncremental('{"first": [');
      const state1 = client.getState();
      assert.ok(state1 !== null);

      client.reset();
      const state2 = client.getState();
      assert.strictEqual(state2, null);

      // Should work correctly after reset
      const result = await client.completeIncremental('{"second": [');
      assert.strictEqual(result, '{"second": []}');
    });
  });

  describe('state management', () => {
    test('getState() returns null initially', () => {
      const client = new JsonCompleterClient();
      assert.strictEqual(client.getState(), null);
    });

    test('getState() returns state after incremental call', async () => {
      const client = new JsonCompleterClient();
      await client.completeIncremental('{"test":');
      const state = client.getState();
      assert.ok(state !== null);
      assert.ok(Array.isArray(state?.output_tokens));
    });

    test('setState() allows state restoration', async () => {
      const client1 = new JsonCompleterClient();
      await client1.completeIncremental('{"data": [1, 2');
      const savedState = client1.getState();

      const client2 = new JsonCompleterClient();
      client2.setState(savedState);

      const result = await client2.completeIncremental('{"data": [1, 2, 3]}');
      assert.strictEqual(result, '{"data": [1, 2, 3]}');
    });

    test('reset() clears state', async () => {
      const client = new JsonCompleterClient();
      await client.completeIncremental('{"test":');
      assert.ok(client.getState() !== null);

      client.reset();
      assert.strictEqual(client.getState(), null);
    });
  });

  describe('error handling', () => {
    test('throws error for invalid binary path', async () => {
      const client = new JsonCompleterClient({
        binPath: '/nonexistent/binary',
        timeout: 1000,
      });

      await assert.rejects(
        async () => await client.complete('{"test":'),
        /Failed to spawn process/
      );
    });

    test('throws error on timeout', async () => {
      const client = new JsonCompleterClient({
        timeout: 1, // Very short timeout
      });

      await assert.rejects(
        async () => await client.complete('{"test":'),
        /timeout/
      );
    });
  });

  describe('concurrent operations', () => {
    test('handles concurrent complete() calls', async () => {
      const client = new JsonCompleterClient();

      const promises = [
        client.complete('{"a":'),
        client.complete('{"b":'),
        client.complete('{"c":'),
      ];

      const results = await Promise.all(promises);
      assert.strictEqual(results.length, 3);
      assert.strictEqual(results[0], '{"a":null}');
      assert.strictEqual(results[1], '{"b":null}');
      assert.strictEqual(results[2], '{"c":null}');
    });
  });

  describe('edge cases', () => {
    test('handles very long strings', async () => {
      const client = new JsonCompleterClient();
      const longString = 'a'.repeat(10000);
      const result = await client.complete(`{"long": "${longString}`);
      const parsed = JSON.parse(result);
      assert.ok(parsed.long.includes(longString));
    });

    test('handles deeply nested structures', async () => {
      const client = new JsonCompleterClient();
      let input = '{"a":'.repeat(10);
      const result = await client.complete(input);
      const parsed = JSON.parse(result);
      assert.ok(typeof parsed === 'object');
    });

    test('handles arrays with many elements', async () => {
      const client = new JsonCompleterClient();
      const items = Array.from({ length: 100 }, (_, i) => i).join(',');
      const result = await client.complete(`[${items.substring(0, items.length - 2)}`);
      const parsed = JSON.parse(result);
      assert.ok(Array.isArray(parsed));
    });
  });
});

describe('complete() helper function', { skip: SKIP_TESTS }, () => {
  test('completes without creating client instance', async () => {
    const result = await complete('{"test":');
    assert.strictEqual(result, '{"test":null}');
  });

  test('accepts custom options', async () => {
    const result = await complete('{"test":', { timeout: 10000 });
    assert.strictEqual(result, '{"test":null}');
  });

  test('works with various incomplete JSON', async () => {
    const testCases = [
      { input: '{"a":', expected: '{"a":null}' },
      { input: '[1, 2', expected: '[1, 2]' },
      { input: '{"str": "val', expected: '{"str": "val"}' },
    ];

    for (const { input, expected } of testCases) {
      const result = await complete(input);
      assert.strictEqual(result, expected);
    }
  });
});

describe('TypeScript types', () => {
  test('exports JsonCompleterClient class', () => {
    assert.ok(JsonCompleterClient);
    assert.strictEqual(typeof JsonCompleterClient, 'function');
  });

  test('exports complete function', () => {
    assert.ok(complete);
    assert.strictEqual(typeof complete, 'function');
  });
});
