/**
 * Error Handling Example
 *
 * This example demonstrates various error scenarios and how to handle them
 * when using the json_completer client.
 *
 * Run: npx tsx examples/error-handling.ts
 */

import { JsonCompleterClient, complete } from '@json-completer/client';

// Helper to demonstrate error handling
async function tryComplete(description: string, fn: () => Promise<void>) {
  console.log(`\n${description}`);
  console.log('='.repeat(description.length));
  try {
    await fn();
    console.log('✓ Success');
  } catch (error: any) {
    console.log(`✗ Error: ${error.message}`);
  }
}

async function main() {
  console.log('=== Error Handling Examples ===\n');

  // 1. Binary not found
  await tryComplete('1. Binary not found', async () => {
    const client = new JsonCompleterClient({
      binPath: '/nonexistent/path/to/json_completer',
    });
    await client.complete('{"test":');
  });

  // 2. Timeout error
  await tryComplete('2. Timeout (if binary is slow)', async () => {
    const client = new JsonCompleterClient({
      timeout: 1, // Very short timeout
    });
    await client.complete('{"test":');
  });

  // 3. Empty input
  await tryComplete('3. Empty input', async () => {
    const result = await complete('');
    console.log('Result:', result);
  });

  // 4. Valid complete JSON (should work fine)
  await tryComplete('4. Already complete JSON', async () => {
    const result = await complete('{"test": "value"}');
    console.log('Result:', result);
  });

  // 5. Complex nested structure
  await tryComplete('5. Complex nested structure', async () => {
    const result = await complete('{"a": {"b": {"c": {"d":');
    console.log('Result:', result);
  });

  // 6. Large array
  await tryComplete('6. Large incomplete array', async () => {
    const items = Array.from({ length: 100 }, (_, i) => `{"id": ${i}}`).join(',');
    const result = await complete(`[${items.substring(0, items.length - 5)}`);
    const parsed = JSON.parse(result);
    console.log(`Result: Array with ${parsed.length} items`);
  });

  // 7. Incremental with state management
  await tryComplete('7. Incremental state management', async () => {
    const client = new JsonCompleterClient();

    const result1 = await client.completeIncremental('{"stream": [');
    console.log('Chunk 1:', result1);

    const result2 = await client.completeIncremental('{"stream": [1, 2, 3');
    console.log('Chunk 2:', result2);

    const result3 = await client.completeIncremental('{"stream": [1, 2, 3]}');
    console.log('Chunk 3:', result3);

    // Get and inspect state
    const state = client.getState();
    console.log('Final state:', {
      tokensCount: state?.output_tokens.length,
      lastIndex: state?.last_index,
    });

    client.reset();
  });

  // 8. Restore state
  await tryComplete('8. Save and restore state', async () => {
    const client1 = new JsonCompleterClient();

    await client1.completeIncremental('{"data": [1, 2');
    const savedState = client1.getState();
    console.log('State saved');

    // Create new client and restore state
    const client2 = new JsonCompleterClient();
    client2.setState(savedState);

    const result = await client2.completeIncremental('{"data": [1, 2, 3]}');
    console.log('Restored and completed:', result);
  });

  // 9. Malformed but completable JSON
  await tryComplete('9. Various truncation points', async () => {
    const truncations = [
      '{"key"',
      '{"key":',
      '{"key": "val',
      '{"key": "value"',
      '{"key": [',
      '{"key": [1',
      '{"key": [1,',
      '{"key": [1, 2',
    ];

    for (const truncation of truncations) {
      const result = await complete(truncation);
      console.log(`  ${truncation.padEnd(20)} -> ${result}`);
    }
  });

  // 10. Production error handling pattern
  await tryComplete('10. Production error handling pattern', async () => {
    async function safeComplete(input: string): Promise<{
      success: boolean;
      result?: string;
      error?: string;
    }> {
      try {
        const result = await complete(input, { timeout: 5000 });
        return { success: true, result };
      } catch (error: any) {
        // Categorize errors
        if (error.message.includes('timeout')) {
          return { success: false, error: 'Timeout: Operation took too long' };
        } else if (error.message.includes('spawn')) {
          return {
            success: false,
            error: 'Binary not found: Please install json_completer',
          };
        } else if (error.message.includes('exited with code')) {
          return { success: false, error: 'Processing error: Invalid input' };
        } else {
          return { success: false, error: `Unknown error: ${error.message}` };
        }
      }
    }

    // Test with valid input
    const result1 = await safeComplete('{"test":');
    console.log('Result 1:', result1);

    // Test with binary path that might not exist
    // (This would fail in production but demonstrates error handling)
    console.log('Demonstrated safe error handling pattern');
  });

  // 11. Concurrent requests
  await tryComplete('11. Concurrent completion requests', async () => {
    const client = new JsonCompleterClient();

    const requests = [
      '{"id": 1, "name":',
      '{"id": 2, "value":',
      '{"id": 3, "items": [',
      '{"id": 4, "data": {"nested":',
    ];

    const results = await Promise.all(
      requests.map(req => client.complete(req))
    );

    console.log('Completed all concurrent requests:');
    results.forEach((result, i) => {
      console.log(`  Request ${i + 1}: ${result}`);
    });
  });

  // 12. Memory cleanup
  await tryComplete('12. Memory cleanup and reset', async () => {
    const client = new JsonCompleterClient();

    // Do some incremental operations
    for (let i = 0; i < 10; i++) {
      await client.completeIncremental(`{"index": ${i}`);
    }

    const stateBefore = client.getState();
    console.log('State before reset:', {
      tokens: stateBefore?.output_tokens.length,
      contextStack: stateBefore?.context_stack.length,
    });

    client.reset();

    const stateAfter = client.getState();
    console.log('State after reset:', stateAfter);
  });

  console.log('\n=== All error handling examples completed ===\n');
  console.log('Best practices:');
  console.log('  1. Always use try-catch for async operations');
  console.log('  2. Set appropriate timeouts for your use case');
  console.log('  3. Verify binary path before deployment');
  console.log('  4. Reset client state between streaming sessions');
  console.log('  5. Handle concurrent requests carefully');
  console.log('  6. Save/restore state for long-running operations');
  console.log('  7. Monitor for common error patterns');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
