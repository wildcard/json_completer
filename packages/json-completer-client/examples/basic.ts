/**
 * Basic Example: Simple one-shot JSON completion
 *
 * This example demonstrates the simplest way to use json_completer
 * for completing partial JSON strings.
 *
 * Run: npx tsx examples/basic.ts
 */

import { JsonCompleterClient, complete } from '@json-completer/client';

async function main() {
  console.log('=== Basic JSON Completion Examples ===\n');

  // Example 1: Using the helper function
  console.log('1. Using helper function:');
  const result1 = await complete('{"name": "John", "age":');
  console.log('Input:  {"name": "John", "age":');
  console.log('Output:', result1);
  console.log();

  // Example 2: Using client instance
  console.log('2. Using client instance:');
  const client = new JsonCompleterClient();

  const result2 = await client.complete('{"message": "Hello wo');
  console.log('Input:  {"message": "Hello wo');
  console.log('Output:', result2);
  console.log();

  // Example 3: Incomplete array
  console.log('3. Incomplete array:');
  const result3 = await client.complete('[1, 2, 3, {"key": "value"');
  console.log('Input:  [1, 2, 3, {"key": "value"');
  console.log('Output:', result3);
  console.log();

  // Example 4: Nested structures
  console.log('4. Nested structures:');
  const result4 = await client.complete('{"user": {"profile": {"settings":');
  console.log('Input:  {"user": {"profile": {"settings":');
  console.log('Output:', result4);
  console.log();

  // Example 5: Array of objects
  console.log('5. Array of objects:');
  const result5 = await client.complete('{"items": [{"id": 1}, {"id": 2');
  console.log('Input:  {"items": [{"id": 1}, {"id": 2');
  console.log('Output:', result5);
  console.log();

  // Example 6: Parsing the result
  console.log('6. Parse and use the result:');
  const result6 = await client.complete('{"count": 42, "active":');
  console.log('Input:  {"count": 42, "active":');
  console.log('Output:', result6);
  const parsed = JSON.parse(result6);
  console.log('Parsed:', parsed);
  console.log('Type of count:', typeof parsed.count);
  console.log('Type of active:', typeof parsed.active);
  console.log();

  console.log('All examples completed successfully!');
}

main().catch(console.error);
