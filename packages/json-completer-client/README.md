# @json-completer/client

[![npm version](https://badge.fury.io/js/@json-completer%2Fclient.svg)](https://www.npmjs.com/package/@json-completer/client)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

High-performance TypeScript/Node.js client for **json_completer** - Complete partial JSON strings with intelligent streaming support.

## Features

- **Fast**: Zero-copy operations, O(n) incremental parsing
- **Streaming**: Efficient LLM response handling with state management
- **Type-Safe**: Full TypeScript support with complete type definitions
- **Universal**: Works with Node.js 18+, TypeScript, Bun, and modern runtimes
- **Simple**: Clean API with both one-shot and incremental modes

## Installation

```bash
npm install @json-completer/client
```

### Binary Requirement

This package requires the `json_completer` Rust binary. You have several options:

**Option 1: Build from source (recommended)**
```bash
# Clone the repository
git clone https://github.com/aha-app/json_completer.git
cd json_completer

# Build the Rust binary
cargo build --release

# Binary will be at: ./target/release/json_completer
```

**Option 2: Download prebuilt binary** (coming soon)
```bash
# Future: npm will include platform-specific binaries
```

**Option 3: Use custom binary path**
```typescript
import { JsonCompleterClient } from '@json-completer/client';

const client = new JsonCompleterClient({
  binPath: '/custom/path/to/json_completer'
});
```

## Quick Start

### One-Shot Completion

Complete partial JSON in a single call:

```typescript
import { complete } from '@json-completer/client';

// Simple helper function
const result = await complete('{"name": "John", "age":');
console.log(result);
// Output: {"name": "John", "age":null}

// With incomplete strings
const result2 = await complete('{"message": "Hello wo');
console.log(result2);
// Output: {"message": "Hello wo"}
```

### Incremental Streaming

Perfect for LLM responses and progressive data:

```typescript
import { JsonCompleterClient } from '@json-completer/client';

const client = new JsonCompleterClient();

// Process streaming chunks
const chunk1 = await client.completeIncremental('{"users": [');
console.log(chunk1); // {"users": []}

const chunk2 = await client.completeIncremental('{"users": [{"id": 1}');
console.log(chunk2); // {"users": [{"id": 1}]}

const chunk3 = await client.completeIncremental('{"users": [{"id": 1}, {"id": 2}]}');
console.log(chunk3); // {"users": [{"id": 1}, {"id": 2}]}

// Reset state for new session
client.reset();
```

### Class Instance with Options

```typescript
import { JsonCompleterClient } from '@json-completer/client';

const client = new JsonCompleterClient({
  binPath: './target/release/json_completer', // Custom binary path
  timeout: 10000, // 10 second timeout
});

const result = await client.complete('{"data":');
console.log(result); // {"data":null}
```

## API Reference

### `JsonCompleterClient`

Main client class for interacting with json_completer.

#### Constructor

```typescript
new JsonCompleterClient(options?: JsonCompleterOptions)
```

**Parameters:**
- `options.binPath?: string` - Path to json_completer binary (default: auto-detected)
- `options.timeout?: number` - Timeout in milliseconds (default: 5000)

#### Methods

##### `complete(partialJson: string): Promise<string>`

Complete partial JSON in one shot. Does not maintain state between calls.

**Example:**
```typescript
const result = await client.complete('{"test":');
// Returns: {"test":null}
```

##### `completeIncremental(partialJson: string): Promise<string>`

Complete partial JSON incrementally with state tracking. Each call processes only new data efficiently (O(n) where n = new data size).

**Example:**
```typescript
const result1 = await client.completeIncremental('{"stream": [');
const result2 = await client.completeIncremental('{"stream": [1, 2, 3]}');
```

##### `reset(): void`

Reset the incremental state. Call this to start a new streaming session.

**Example:**
```typescript
client.reset();
```

##### `getState(): JsonCompleterState | null`

Get the current parsing state for debugging or serialization.

##### `setState(state: JsonCompleterState | null): void`

Set the parsing state for deserialization or state restoration.

### Helper Functions

##### `complete(partialJson: string, options?: JsonCompleterOptions): Promise<string>`

Convenience function for one-shot completion without creating a client instance.

**Example:**
```typescript
import { complete } from '@json-completer/client';

const result = await complete('{"test":');
```

### Types

```typescript
interface JsonCompleterOptions {
  binPath?: string;
  timeout?: number;
}

interface JsonCompleterState {
  output_tokens: string[];
  context_stack: string[];
  last_index: number;
  input_length: number;
  incomplete_string_start: number | null;
  incomplete_string_buffer: string | null;
  incomplete_string_escape_state: any | null;
}

interface JsonCompleterResponse {
  result?: string;
  state?: JsonCompleterState;
  error?: string;
}
```

## Usage Examples

### LLM Streaming (OpenAI/Claude)

```typescript
import { JsonCompleterClient } from '@json-completer/client';

const client = new JsonCompleterClient();
let accumulated = '';

// Simulate LLM streaming
async function handleLLMChunk(chunk: string) {
  accumulated += chunk;

  // Complete partial JSON for real-time UI updates
  const validJson = await client.completeIncremental(accumulated);

  // Parse and display to user
  const data = JSON.parse(validJson);
  updateUI(data);
}

// When stream ends
client.reset();
```

### Express Middleware

```typescript
import express from 'express';
import { complete } from '@json-completer/client';

const app = express();

app.use(express.text({ type: 'application/json' }));

app.post('/complete', async (req, res) => {
  try {
    const result = await complete(req.body);
    res.json({ completed: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(3000);
```

### Batch Processing

```typescript
import { JsonCompleterClient } from '@json-completer/client';

const client = new JsonCompleterClient({ timeout: 30000 });

const partialJsonStrings = [
  '{"id": 1, "name":',
  '{"id": 2, "items": [1, 2',
  '{"status": "incomplete'
];

const completed = await Promise.all(
  partialJsonStrings.map(partial => client.complete(partial))
);

console.log(completed);
// [
//   '{"id": 1, "name":null}',
//   '{"id": 2, "items": [1, 2]}',
//   '{"status": "incomplete"}'
// ]
```

### Error Handling

```typescript
import { JsonCompleterClient } from '@json-completer/client';

const client = new JsonCompleterClient();

try {
  const result = await client.complete('{"test":');
  console.log(result);
} catch (error) {
  if (error.message.includes('timeout')) {
    console.error('Operation timed out');
  } else if (error.message.includes('Failed to spawn')) {
    console.error('Binary not found. Please install json_completer.');
  } else {
    console.error('Completion failed:', error.message);
  }
}
```

## Performance Notes

### One-Shot vs Incremental

- **One-Shot (`complete`)**: Best for single completions, no state overhead
- **Incremental (`completeIncremental`)**: Best for streaming, O(n) per chunk
  - Only processes new data since last call
  - Maintains parsing state efficiently
  - Ideal for LLM streaming (10-50x faster than naive reparsing)

### Benchmarks

For streaming 100KB JSON in 1KB chunks:
- **Incremental**: ~5ms per chunk (O(n) where n = chunk size)
- **Naive reparse**: ~250ms per chunk (O(n²) where n = total size)

### Memory Usage

- **Client overhead**: <1KB per instance
- **State size**: Typically 1-5KB depending on nesting depth
- **Binary spawning**: ~2-5ms per call

## Troubleshooting

### Binary Not Found

**Error**: `Failed to spawn process: ENOENT`

**Solution**:
1. Build the binary: `cargo build --release`
2. Verify it exists: `ls ./target/release/json_completer`
3. Set custom path:
   ```typescript
   const client = new JsonCompleterClient({
     binPath: '/absolute/path/to/json_completer'
   });
   ```

### Timeout Errors

**Error**: `JsonCompleter timeout after 5000ms`

**Solution**:
```typescript
const client = new JsonCompleterClient({
  timeout: 30000 // Increase to 30 seconds
});
```

### Permission Denied

**Error**: `spawn EACCES`

**Solution**:
```bash
chmod +x ./target/release/json_completer
```

### Invalid JSON Input

The library completes structural issues but doesn't fix syntax errors:

**Works**:
```typescript
await complete('{"test":');  // Missing value
await complete('{"test"');   // Unclosed structure
```

**Doesn't work**:
```typescript
await complete('{test:}');   // Invalid syntax (unquoted key)
await complete('{"test",}'); // Trailing comma
```

For syntax repair, use [jsonrepair](https://github.com/josdejong/jsonrepair).

## Platform Support

- **Node.js**: 18.0.0 or higher
- **Bun**: Latest version
- **Deno**: Via npm compatibility mode
- **TypeScript**: 5.0.0 or higher (optional)

Tested on:
- Linux (x64, arm64)
- macOS (x64, arm64)
- Windows (x64)

## Related Links

- [Main Repository](https://github.com/aha-app/json_completer)
- [Rust Implementation](https://github.com/aha-app/json_completer/tree/main/rust)
- [Documentation](https://github.com/aha-app/json_completer#readme)
- [Issue Tracker](https://github.com/aha-app/json_completer/issues)
- [Use Case Analysis](https://github.com/aha-app/json_completer/blob/main/docs/USE_CASE_ANALYSIS.md)

## Examples

See the [examples/](./examples/) directory for complete working examples:
- `basic.ts` - Simple one-shot completion
- `streaming.ts` - LLM streaming simulation
- `express.ts` - Express middleware
- `error-handling.ts` - Error scenarios

## Contributing

Contributions welcome! See the [Contributing Guide](https://github.com/aha-app/json_completer/blob/main/CONTRIBUTING.md).

## License

MIT License - see [LICENSE](https://github.com/aha-app/json_completer/blob/main/LICENSE) for details.

---

**Built with TypeScript** | **Powered by Rust** | **Made for Developers**
