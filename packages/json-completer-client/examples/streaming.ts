/**
 * Streaming Example: LLM Response Simulation
 *
 * This example demonstrates incremental JSON completion for streaming scenarios,
 * such as processing JSON responses from LLMs (OpenAI, Claude, etc.)
 *
 * Run: npx tsx examples/streaming.ts
 */

import { JsonCompleterClient } from '@json-completer/client';

// Simulate streaming chunks from an LLM
const streamingChunks = [
  '{"response',
  '{"response":',
  '{"response": ',
  '{"response": "H',
  '{"response": "Hel',
  '{"response": "Hello',
  '{"response": "Hello wo',
  '{"response": "Hello world',
  '{"response": "Hello world!',
  '{"response": "Hello world!", ',
  '{"response": "Hello world!", "to',
  '{"response": "Hello world!", "tokens',
  '{"response": "Hello world!", "tokens":',
  '{"response": "Hello world!", "tokens": 1',
  '{"response": "Hello world!", "tokens": 15',
  '{"response": "Hello world!", "tokens": 15,',
  '{"response": "Hello world!", "tokens": 15, "d',
  '{"response": "Hello world!", "tokens": 15, "done',
  '{"response": "Hello world!", "tokens": 15, "done":',
  '{"response": "Hello world!", "tokens": 15, "done": t',
  '{"response": "Hello world!", "tokens": 15, "done": true}',
];

async function simulateStreaming() {
  console.log('=== Streaming LLM Response Simulation ===\n');

  const client = new JsonCompleterClient();
  let lastValid = '';

  console.log('Processing streaming chunks...\n');

  for (let i = 0; i < streamingChunks.length; i++) {
    const chunk = streamingChunks[i];

    // Complete the partial JSON incrementally
    const validJson = await client.completeIncremental(chunk);

    // Only log when the valid JSON changes
    if (validJson !== lastValid) {
      console.log(`Chunk ${i + 1}/${streamingChunks.length}:`);
      console.log(`  Input:  ${chunk}`);
      console.log(`  Valid:  ${validJson}`);

      // Parse and display
      try {
        const parsed = JSON.parse(validJson);
        console.log(`  Parsed:`, parsed);
      } catch (e) {
        console.log(`  Parse error:`, e.message);
      }
      console.log();

      lastValid = validJson;
    }
  }

  console.log('Final result:');
  const final = JSON.parse(lastValid);
  console.log(JSON.stringify(final, null, 2));

  // Reset for next streaming session
  client.reset();
  console.log('\nClient state reset for next session');
}

async function multipleStreams() {
  console.log('\n=== Multiple Streaming Sessions ===\n');

  const client = new JsonCompleterClient();

  // First stream
  console.log('Stream 1:');
  const stream1_chunks = ['{"count":', '{"count": 1', '{"count": 10}'];
  for (const chunk of stream1_chunks) {
    const result = await client.completeIncremental(chunk);
    console.log(`  ${chunk} -> ${result}`);
  }

  // Reset between streams
  client.reset();
  console.log('\n  [Client reset]\n');

  // Second stream
  console.log('Stream 2:');
  const stream2_chunks = ['{"name":', '{"name": "A', '{"name": "Alice"}'];
  for (const chunk of stream2_chunks) {
    const result = await client.completeIncremental(chunk);
    console.log(`  ${chunk} -> ${result}`);
  }

  client.reset();
}

async function performanceDemo() {
  console.log('\n=== Performance Comparison ===\n');

  const client = new JsonCompleterClient();

  // Simulate large JSON streaming
  let accumulated = '';
  const startIncremental = Date.now();

  for (let i = 0; i < 100; i++) {
    accumulated += `{"index": ${i}, "data": "item${i}"}`;
    if (i < 99) accumulated += ',';

    // Wrap in array brackets for each iteration
    const partial = `[${accumulated}`;
    await client.completeIncremental(partial);
  }

  const timeIncremental = Date.now() - startIncremental;

  console.log(`Incremental processing (100 chunks): ${timeIncremental}ms`);
  console.log(`Average per chunk: ${(timeIncremental / 100).toFixed(2)}ms`);

  client.reset();
}

async function main() {
  try {
    await simulateStreaming();
    await multipleStreams();
    await performanceDemo();

    console.log('\nAll streaming examples completed successfully!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
