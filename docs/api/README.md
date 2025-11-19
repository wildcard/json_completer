# json_completer API Reference

> Complete API documentation for all language bindings and interfaces

**Version**: 0.1.0
**Last Updated**: November 19, 2025

---

## Table of Contents

1. [Quick Start by Language](#quick-start-by-language)
2. [Rust API](#rust-api)
3. [Node.js/TypeScript API](#nodejstypescript-api)
4. [Python API](#python-api-coming-soon)
5. [Go API](#go-api-coming-soon)
6. [Ruby API](#ruby-api-coming-soon)
7. [CLI Reference](#cli-reference)
8. [JSON API Protocol](#json-api-protocol)
9. [Examples by Framework](#examples-by-framework)

---

## Quick Start by Language

### Rust

```rust
use json_completer::JsonCompleter;

// One-shot
let result = JsonCompleter::complete(r#"{"name": "Alice", "age":"#);

// Incremental
let mut completer = JsonCompleter::new();
let result = completer.complete_incremental(r#"{"partial":"#);
```

[Full Rust API →](#rust-api)

### Node.js / TypeScript

```typescript
import { complete, JsonCompleterClient } from '@json-completer/client';

// One-shot
const result = await complete('{"name": "Alice", "age":');

// Incremental
const completer = new JsonCompleterClient();
const result = await completer.completeIncremental('{"partial":');
```

[Full Node.js API →](#nodejstypescript-api)

### Python (Coming Soon)

```python
from json_completer import JsonCompleter

completer = JsonCompleter()
result = completer.complete('{"name": "Alice", "age":')
```

[Python API Status →](#python-api-coming-soon)

### Go (Coming Soon)

```go
import "github.com/aha-app/json_completer-go"

completer := jsonCompleter.New()
result := completer.Complete(`{"name": "Alice", "age":`)
```

[Go API Status →](#go-api-coming-soon)

### CLI

```bash
# One-shot
echo '{"incomplete":' | json_completer --stdin

# Incremental mode
json_completer --incremental

# JSON API mode
echo '{"action": "complete", "input": "{\"test\""}' | json_completer --json-api
```

[Full CLI Reference →](#cli-reference)

---

## Rust API

**Crate**: `json_completer`
**Documentation**: [docs.rs/json_completer](https://docs.rs/json_completer) (coming soon)
**Repository**: [github.com/aha-app/json_completer/tree/main/rust/json_completer](https://github.com/aha-app/json_completer/tree/main/rust/json_completer)

### Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
json_completer = "0.1"
```

Or use cargo:

```bash
cargo add json_completer
```

### Core Types

#### `JsonCompleter`

Main struct for JSON completion with state management.

```rust
pub struct JsonCompleter {
    state: ParsingState,
}
```

### Methods

#### `JsonCompleter::complete` (static)

Complete a truncated JSON string in one shot (no state tracking).

**Signature**:
```rust
pub fn complete(partial_json: &str) -> String
```

**Parameters**:
- `partial_json: &str` - Incomplete JSON string

**Returns**:
- `String` - Valid, completed JSON

**Example**:
```rust
let result = JsonCompleter::complete(r#"{"name": "Alice", "age":"#);
assert_eq!(result, r#"{"name": "Alice", "age":null}"#);
```

**Complexity**: O(n) where n = input length

---

#### `JsonCompleter::new`

Create a new instance for incremental processing.

**Signature**:
```rust
pub fn new() -> Self
```

**Returns**:
- `JsonCompleter` - New instance with empty state

**Example**:
```rust
let mut completer = JsonCompleter::new();
```

---

#### `JsonCompleter::complete_incremental`

Complete JSON incrementally, maintaining state between calls. Only processes new data.

**Signature**:
```rust
pub fn complete_incremental(&mut self, partial_json: &str) -> String
```

**Parameters**:
- `partial_json: &str` - Accumulated JSON string (including previous chunks)

**Returns**:
- `String` - Valid, completed JSON

**Example**:
```rust
let mut completer = JsonCompleter::new();

let result1 = completer.complete_incremental(r#"{"users": [{"name": ""#);
// Result: {"users": [{"name": ""}]}

let result2 = completer.complete_incremental(r#"{"users": [{"name": "Alice"}"#);
// Result: {"users": [{"name": "Alice"}]}

let result3 = completer.complete_incremental(r#"{"users": [{"name": "Alice"}]}"#);
// Result: {"users": [{"name": "Alice"}]}
```

**Complexity**: O(m) where m = number of new characters (not total)

**Important**: Pass the **full accumulated buffer**, not just the new chunk. The method tracks state internally to avoid reprocessing.

---

#### `JsonCompleter::reset`

Reset the parsing state (clear all accumulated data).

**Signature**:
```rust
pub fn reset(&mut self)
```

**Example**:
```rust
let mut completer = JsonCompleter::new();
completer.complete_incremental(r#"{"foo":"#);
completer.reset(); // Clear state, start fresh
completer.complete_incremental(r#"{"bar":"#); // Independent of previous
```

---

#### `JsonCompleter::get_state`

Get the current parsing state (for serialization/debugging).

**Signature**:
```rust
pub fn get_state(&self) -> &ParsingState
```

**Returns**:
- `&ParsingState` - Reference to current state

**Example**:
```rust
let state = completer.get_state();
println!("Last index: {}", state.last_index);
```

---

#### `JsonCompleter::with_state`

Create a JsonCompleter with existing state (for deserialization).

**Signature**:
```rust
pub fn with_state(state: ParsingState) -> Self
```

**Parameters**:
- `state: ParsingState` - Previously serialized state

**Returns**:
- `JsonCompleter` - New instance with given state

**Example**:
```rust
// Serialize state to JSON
let state_json = serde_json::to_string(&completer.get_state())?;

// Later: deserialize and restore
let state: ParsingState = serde_json::from_str(&state_json)?;
let mut restored = JsonCompleter::with_state(state);
```

---

### `ParsingState`

Internal state for incremental processing (serializable).

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsingState {
    output_tokens: Vec<String>,
    context_stack: Vec<String>,
    last_index: usize,
    input_length: usize,
    incomplete_string_start: Option<usize>,
    incomplete_string_buffer: Option<String>,
    incomplete_string_escape_state: Option<EscapeState>,
}
```

**Fields** (all public for serialization):
- `output_tokens` - Parsed tokens so far
- `context_stack` - Nesting context (`{` or `[`)
- `last_index` - Position where parsing stopped
- `input_length` - Total input length processed
- `incomplete_string_start` - Start position of incomplete string (if any)
- `incomplete_string_buffer` - Buffer for incomplete string
- `incomplete_string_escape_state` - Escape sequence state

---

## Node.js/TypeScript API

**Package**: `@json-completer/client` (coming soon to npm)
**Repository**: [github.com/aha-app/json_completer/tree/main/nodejs](https://github.com/aha-app/json_completer)

### Installation

```bash
npm install @json-completer/client
```

### Functions

#### `complete` (one-shot)

Complete a truncated JSON string without state tracking.

**Signature**:
```typescript
function complete(partialJson: string): Promise<string>
```

**Parameters**:
- `partialJson: string` - Incomplete JSON

**Returns**:
- `Promise<string>` - Completed JSON

**Example**:
```typescript
import { complete } from '@json-completer/client';

const result = await complete('{"name": "Alice", "age":');
console.log(result); // {"name": "Alice", "age":null}

const parsed = JSON.parse(result);
console.log(parsed.name); // "Alice"
```

---

### Classes

#### `JsonCompleterClient`

Stateful client for incremental processing.

**Constructor**:
```typescript
class JsonCompleterClient {
  constructor(options?: { binPath?: string })
}
```

**Options**:
- `binPath?: string` - Path to json_completer binary (defaults to auto-detect)

**Example**:
```typescript
const completer = new JsonCompleterClient();
// Or with custom binary path:
const completer = new JsonCompleterClient({ binPath: './custom/path/json_completer' });
```

---

#### `JsonCompleterClient.completeIncremental`

Complete JSON incrementally with state management.

**Signature**:
```typescript
async completeIncremental(partialJson: string): Promise<string>
```

**Parameters**:
- `partialJson: string` - Accumulated JSON (full buffer, not just new chunk)

**Returns**:
- `Promise<string>` - Completed JSON

**Example**:
```typescript
const completer = new JsonCompleterClient();
let buffer = '';

// Chunk 1
buffer += '{"users": [{"name": "';
const result1 = await completer.completeIncremental(buffer);
console.log(result1); // {"users": [{"name": ""}]}

// Chunk 2
buffer += 'Alice"}';
const result2 = await completer.completeIncremental(buffer);
console.log(result2); // {"users": [{"name": "Alice"}]}
```

---

#### `JsonCompleterClient.reset`

Reset the state (start fresh).

**Signature**:
```typescript
async reset(): Promise<void>
```

**Example**:
```typescript
await completer.reset();
```

---

## Python API (Coming Soon)

**Package**: `json-completer` (PyPI)
**Status**: In development (Phase 1, Q1 2025)
**Binding**: PyO3 (native Rust extension)

### Planned API

```python
from json_completer import JsonCompleter

# One-shot
result = JsonCompleter.complete('{"name": "Alice", "age":')

# Incremental
completer = JsonCompleter()
result1 = completer.complete_incremental('{"foo":')
result2 = completer.complete_incremental('{"foo": "bar"')
completer.reset()
```

**Track progress**: [GitHub Issue #XXX](#) (coming soon)

---

## Go API (Coming Soon)

**Package**: `github.com/aha-app/json_completer-go`
**Status**: In development (Phase 1, Q1 2025)
**Binding**: CGO wrapper

### Planned API

```go
package main

import "github.com/aha-app/json_completer-go"

func main() {
    // One-shot
    result := jsonCompleter.Complete(`{"name": "Alice", "age":`)

    // Incremental
    completer := jsonCompleter.New()
    result1 := completer.CompleteIncremental(`{"foo":`)
    result2 := completer.CompleteIncremental(`{"foo": "bar"`)
    completer.Reset()
}
```

**Track progress**: [GitHub Issue #XXX](#) (coming soon)

---

## Ruby API (Coming Soon)

**Gem**: `json_completer` (RubyGems.org)
**Status**: Planned (Phase 1, Q1 2025)
**Binding**: Ruby FFI

### Planned API

```ruby
require 'json_completer'

# One-shot
result = JsonCompleter.complete('{"name": "Alice", "age":')

# Incremental
completer = JsonCompleter.new
result1 = completer.complete_incremental('{"foo":')
result2 = completer.complete_incremental('{"foo": "bar"')
completer.reset
```

**Track progress**: [GitHub Issue #XXX](#) (coming soon)

---

## CLI Reference

**Binary**: `json_completer`
**Installation**: Download from [GitHub Releases](https://github.com/aha-app/json_completer/releases)

### Commands

#### Basic Completion

```bash
# Pass JSON as argument
json_completer '{"incomplete":'
# Output: {"incomplete":null}

# Read from stdin
echo '{"name": "Alice", "age":' | json_completer --stdin
# Output: {"name": "Alice", "age":null}

# Read from file
json_completer --file incomplete.json
# Output: (completed JSON)
```

#### Incremental Mode

```bash
json_completer --incremental
# Interactive: type/paste chunks, press Enter after each
# Ctrl+C to exit
```

**Example session**:
```
$ json_completer --incremental
{"users": [{"name": "
{"users": [{"name": ""}]}
{"users": [{"name": "Alice"}
{"users": [{"name": "Alice"}]}
^C
```

#### JSON API Mode

For programmatic use from other languages.

```bash
# One-shot completion
echo '{"action": "complete", "input": "{\"test\""}' | json_completer --json-api
# Output: {"result": "{\"test\":null}"}

# Incremental with state
echo '{"action": "complete_incremental", "input": "{\"foo\":"}' | json_completer --json-api
# Output: {"result": "{\"foo\":null}", "state": {...}}

# Continue with state
echo '{"action": "complete_incremental", "input": "{\"foo\":\"bar\"}", "state": {...}}' | json_completer --json-api
# Output: {"result": "{\"foo\":\"bar\"}", "state": {...}}

# Reset state
echo '{"action": "reset"}' | json_completer --json-api
# Output: {"state": {...}}
```

### Options

| Flag | Description |
|------|-------------|
| `--stdin` | Read from stdin instead of argument |
| `--file <path>` | Read from file |
| `--incremental` | Interactive incremental mode |
| `--json-api` | JSON API mode for IPC |
| `--help` | Show help message |
| `--version` | Show version |

---

## JSON API Protocol

For language bindings and IPC.

### Request Format

```json
{
  "action": "complete" | "complete_incremental" | "reset",
  "input": "partial json string",
  "state": { /* Optional, for incremental */ }
}
```

### Response Format

**Success**:
```json
{
  "result": "completed json string",
  "state": { /* Returned for incremental */ }
}
```

**Error**:
```json
{
  "error": "error message"
}
```

### Actions

#### `complete` (one-shot)

**Request**:
```json
{
  "action": "complete",
  "input": "{\"foo\":"
}
```

**Response**:
```json
{
  "result": "{\"foo\":null}"
}
```

#### `complete_incremental` (with state)

**Request** (first call):
```json
{
  "action": "complete_incremental",
  "input": "{\"foo\":"
}
```

**Response**:
```json
{
  "result": "{\"foo\":null}",
  "state": {
    "output_tokens": ["{", "\"foo\"", ":"],
    "context_stack": ["{"],
    "last_index": 7,
    "input_length": 7,
    "incomplete_string_start": null,
    "incomplete_string_buffer": null,
    "incomplete_string_escape_state": null
  }
}
```

**Request** (subsequent call, with state):
```json
{
  "action": "complete_incremental",
  "input": "{\"foo\": \"bar\"",
  "state": {
    "output_tokens": ["{", "\"foo\"", ":"],
    "context_stack": ["{"],
    "last_index": 7,
    "input_length": 7,
    "incomplete_string_start": null,
    "incomplete_string_buffer": null,
    "incomplete_string_escape_state": null
  }
}
```

**Response**:
```json
{
  "result": "{\"foo\": \"bar\"}",
  "state": { /* Updated state */ }
}
```

#### `reset` (clear state)

**Request**:
```json
{
  "action": "reset"
}
```

**Response**:
```json
{
  "state": {
    "output_tokens": [],
    "context_stack": [],
    "last_index": 0,
    "input_length": 0,
    "incomplete_string_start": null,
    "incomplete_string_buffer": null,
    "incomplete_string_escape_state": null
  }
}
```

---

## Examples by Framework

### Express.js Middleware

```typescript
import express from 'express';
import { JsonCompleterClient } from '@json-completer/client';

const app = express();
const completer = new JsonCompleterClient();

app.post('/api/complete', async (req, res) => {
  const { partialJson } = req.body;

  try {
    const completed = await completer.complete(partialJson);
    const parsed = JSON.parse(completed);
    res.json({ result: parsed });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Nest.js Service

```typescript
import { Injectable } from '@nestjs/common';
import { JsonCompleterClient } from '@json-completer/client';

@Injectable()
export class JsonCompleterService {
  private completer = new JsonCompleterClient();

  async complete(partialJson: string): Promise<any> {
    const completed = await this.completer.complete(partialJson);
    return JSON.parse(completed);
  }

  async completeIncremental(partialJson: string): Promise<any> {
    const completed = await this.completer.completeIncremental(partialJson);
    return JSON.parse(completed);
  }
}
```

### Next.js API Route

```typescript
// pages/api/complete.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { complete } from '@json-completer/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { partialJson } = req.body;

  try {
    const completed = await complete(partialJson);
    const parsed = JSON.parse(completed);
    res.status(200).json({ result: parsed });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

### FastAPI (Python, when available)

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from json_completer import JsonCompleter

app = FastAPI()
completer = JsonCompleter()

class CompletionRequest(BaseModel):
    partial_json: str

@app.post("/api/complete")
async def complete_json(request: CompletionRequest):
    try:
        completed = completer.complete(request.partial_json)
        return {"result": completed}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## Performance Tips

### 1. Reuse Instances

**❌ Don't** create a new instance for each request:
```typescript
// Bad: Creates overhead
for (const chunk of chunks) {
  const completer = new JsonCompleterClient(); // ❌ Recreates every time
  await completer.completeIncremental(chunk);
}
```

**✅ Do** reuse the same instance:
```typescript
// Good: Amortizes overhead
const completer = new JsonCompleterClient();
for (const chunk of chunks) {
  await completer.completeIncremental(chunk); // ✅ Reuses
}
```

### 2. Use Incremental Mode for Streaming

**❌ Don't** use one-shot for streaming:
```typescript
// Bad: O(n²) complexity
for (const chunk of chunks) {
  buffer += chunk;
  await complete(buffer); // ❌ Reprocesses everything
}
```

**✅ Do** use incremental mode:
```typescript
// Good: O(n) complexity
const completer = new JsonCompleterClient();
for (const chunk of chunks) {
  buffer += chunk;
  await completer.completeIncremental(buffer); // ✅ Only processes new data
}
```

### 3. Batch Small Chunks

For very small chunks (<10 characters), consider batching:

```typescript
const completer = new JsonCompleterClient();
let buffer = '';
let pendingBuffer = '';

stream.on('data', async (chunk) => {
  pendingBuffer += chunk;

  // Only update every 50 characters
  if (pendingBuffer.length >= 50) {
    buffer += pendingBuffer;
    pendingBuffer = '';
    const completed = await completer.completeIncremental(buffer);
    updateUI(completed);
  }
});
```

---

## Error Handling

### Common Errors

#### Binary Not Found

**Error**: `ENOENT: no such file or directory, spawn 'json_completer'`

**Solution**: Install binary or specify path:
```typescript
const completer = new JsonCompleterClient({
  binPath: '/absolute/path/to/json_completer'
});
```

#### Invalid JSON API Response

**Error**: `JSON.parse error` when calling methods

**Solution**: Check binary version compatibility:
```bash
json_completer --version
```

Ensure binary and client library versions match.

---

## Resources

- [GitHub Repository](https://github.com/aha-app/json_completer)
- [Rust Documentation](https://docs.rs/json_completer) (coming soon)
- [npm Package](https://www.npmjs.com/package/@json-completer/client) (coming soon)
- [Blog: Introducing json_completer](../blog/01-introducing-json-completer.md)
- [Blog: O(n²) Trap](../blog/03-streaming-performance.md)
- [Comparison Guide](../COMPARISON.md)

---

## Support

- **GitHub Issues**: [Report bugs](https://github.com/aha-app/json_completer/issues)
- **GitHub Discussions**: [Ask questions](https://github.com/aha-app/json_completer/discussions)
- **Discord** (coming soon): Community support channel

---

**Last Updated**: November 19, 2025
**Version**: 0.1.0
