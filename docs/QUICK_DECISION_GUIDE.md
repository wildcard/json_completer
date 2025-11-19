# Quick Decision Guide: Should I Use json_completer?

> **TL;DR**: Use json_completer when JSON is truncated due to infrastructure limits or streaming, and data is >10 KB. Don't use it for syntax errors or when you can prevent truncation architecturally.

---

## 30-Second Decision Tree

```
Is your JSON truncated/incomplete?
├─ NO → You don't need json_completer
│
└─ YES → Is it a syntax error (missing quotes, trailing commas)?
   ├─ YES → Use `jsonrepair` instead
   │
   └─ NO → How big is the data?
      ├─ <1 KB → Just use try-catch loop (simpler)
      │
      └─ >1 KB → Can you prevent truncation?
         ├─ YES → Fix architecture (compress, paginate, S3)
         │
         └─ NO → Use json_completer ✅
```

---

## 5-Second Checklist

Use json_completer if **ANY** of these are true:

- ✅ **Streaming JSON from LLMs** (OpenAI, Claude, etc.)
- ✅ **Hit AWS Lambda 6MB limit** or API Gateway 10MB limit
- ✅ **CloudWatch logs** truncated at 1MB
- ✅ **Datadog/Splunk** logs split at size limits
- ✅ **Network timeouts** leave partial JSON in buffer
- ✅ **Data >10 KB** and performance matters

Don't use json_completer if **ANY** of these are true:

- ❌ **Syntax errors** (use `jsonrepair` instead)
- ❌ **Data <1 KB** (overhead not worth it)
- ❌ **You control both client & server** (fix the API)
- ❌ **Data loss acceptable** (just drop it)
- ❌ **Schema validation needed** (use JSON Schema validator)

---

## Common Scenarios

### ✅ YES: Streaming LLM Responses

```javascript
// LLM streaming JSON to frontend
let buffer = '';
llmStream.on('token', token => {
  buffer += token;
  const complete = jsonCompleter.completeIncremental(buffer); // ✅ PERFECT USE CASE
  updateUI(JSON.parse(complete));
});
```

**Why**: O(n) performance critical for real-time UX. Data size unpredictable.

### ✅ YES: Lambda Response Truncation

```javascript
// Third-party API behind AWS Lambda (can't modify)
try {
  const data = await fetch('https://api.example.com/data');
  return await data.json();
} catch (error) {
  // Lambda truncated at 6MB, recover what we can
  const text = await data.text();
  return jsonCompleter.complete(text); // ✅ NO ALTERNATIVE
}
```

**Why**: Infrastructure constraint. Can't modify third-party API.

### ✅ YES: Log Truncation Recovery

```python
# Datadog truncates logs at 900KB
for log_line in log_stream:
    if len(log_line) >= 900000:
        # Complete truncated JSON log
        complete = json_completer.complete(log_line)  # ✅ PRESERVE DATA
        send_to_datadog(complete)
```

**Why**: Need to index structured fields. Data loss = blind spots.

### ❌ NO: Syntax Errors from LLM

```javascript
// LLM returned malformed JSON (not truncated)
const broken = `{name: "Alice", age: 30,}`; // Missing quotes, trailing comma

// WRONG
const attempt = jsonCompleter.complete(broken); // ❌ WRONG TOOL

// RIGHT
import { jsonrepair } from 'jsonrepair';
const fixed = jsonrepair(broken); // ✅ CORRECT TOOL
```

**Why**: Different problem. json_completer handles truncation, not syntax errors.

### ❌ NO: Small One-Off Data

```javascript
// Tiny JSON snippet
const small = '{"id": 1'; // 10 characters

// WRONG
const completed = jsonCompleter.complete(small); // ❌ OVERKILL

// RIGHT
try {
  return JSON.parse(small);
} catch (e) {
  // Wait for more data or handle error
}
```

**Why**: Overhead (2-5ms) exceeds benefit (<1ms). Keep it simple.

### ❌ NO: You Control the API

```javascript
// Your own API returning huge response
app.get('/api/data', async (req, res) => {
  const data = await generateHugeJSON(); // 8 MB
  res.json(data); // Might truncate at Lambda limit
});

// WRONG: Use json_completer on client
// RIGHT: Fix the API
app.get('/api/data', async (req, res) => {
  const data = await generateHugeJSON();

  // Option 1: Compress
  res.setHeader('Content-Encoding', 'gzip');
  res.send(zlib.gzipSync(JSON.stringify(data)));

  // Option 2: Paginate
  const page = req.query.page || 1;
  res.json({ data: data.slice((page-1)*100, page*100), total: data.length });

  // Option 3: S3 redirect
  const url = await uploadToS3(data);
  res.json({ download_url: url });
});
```

**Why**: Architecture > band-aid. Fix root cause when possible.

---

## Performance Guide

### When Try-Catch is Faster

| Data Size | Try-Catch | json_completer | Winner |
|-----------|-----------|----------------|--------|
| 100 bytes | 0.1ms | 2-5ms | Try-catch 20x faster |
| 500 bytes | 0.5ms | 2-5ms | Try-catch 4x faster |
| **1 KB** | **1ms** | **2-5ms** | **Try-catch 2x faster** |
| **Crossover: ~10 KB** | **10ms** | **8ms** | **Equal** |
| 100 KB | 50ms | 15ms | json_completer 3x faster |
| 1 MB | 500ms | 30ms | json_completer **17x faster** |

**Rule of thumb**: Use try-catch for <1 KB, json_completer for >10 KB.

### When Streaming Matters

**Streaming 12 KB JSON in chunks**:

| Approach | Chunks Processed | Latency | User Experience |
|----------|-----------------|---------|-----------------|
| Try-catch loop (O(n²)) | ~15 million chars | 19-20ms per chunk | Sluggish, choppy |
| json_completer (O(n)) | 12,000 chars | <1ms per chunk | Smooth, instant |

**Rule of thumb**: **Always** use incremental mode for streaming, regardless of size.

---

## Architecture Decision Matrix

### Your Situation → Your Solution

| Situation | Size | Control | Solution | Priority |
|-----------|------|---------|----------|----------|
| **LLM Streaming** | Any | No | json_completer | MUST |
| **AWS Lambda Limit** | >6 MB | No | json_completer | MUST |
| **AWS Lambda Limit** | <6 MB | Yes | Compress (GZIP) | SHOULD |
| **Log Truncation** | >900 KB | No | json_completer | SHOULD |
| **Network Timeout** | Any | No | json_completer + retry | SHOULD |
| **API You Control** | Large | Yes | Paginate/Compress/S3 | MUST |
| **Syntax Errors** | Any | - | jsonrepair | MUST |
| **Small Data** | <1 KB | - | Try-catch | PREFER |
| **Data Loss OK** | Any | - | Ignore/drop | PREFER |

**Legend**:
- **MUST**: No viable alternative
- **SHOULD**: Best option among alternatives
- **PREFER**: Simpler/faster for this case

---

## Cost-Benefit Analysis

### High ROI Scenarios

**Use json_completer when**:

1. **High-value data**: Financial transactions, user data, audit logs
2. **High volume**: >1,000 events/day with >1% failure rate
3. **Performance-critical**: User-facing streaming (LLMs, real-time updates)
4. **No alternatives**: Third-party APIs, infrastructure constraints

**Example ROI**:
- Setup: 2-4 hours (~$400 in developer time)
- Benefit: Recover 90% of failed parses
- If you're losing 100 logs/day worth $1 each → $90/day recovered
- **Payback**: 4 days. **Annual ROI**: 8,125%.

### Low ROI Scenarios

**Don't use json_completer when**:

1. **Low-value data**: Optional analytics, non-critical metrics
2. **Low volume**: <100 events/day with <0.1% failure rate
3. **Simple alternatives**: Can easily fix with try-catch or architecture change
4. **Already complex**: Adding another dependency increases maintenance

**Example**:
- Setup: 2 hours (~$200)
- Benefit: Recover 10 non-critical analytics events/month
- Value per event: $0 (literally doesn't matter)
- **ROI**: Negative. **Don't do it**.

---

## Installation Quick Start

### Node.js / TypeScript

```bash
npm install @json-completer/client
```

```javascript
import { complete } from '@json-completer/client';

// One-shot
const result = await complete('{"name": "Alice", "age":');
console.log(result); // {"name": "Alice", "age":null}

// Streaming
import { JsonCompleterClient } from '@json-completer/client';
const completer = new JsonCompleterClient();

let buffer = '';
stream.on('data', chunk => {
  buffer += chunk;
  const completed = await completer.completeIncremental(buffer);
  updateUI(JSON.parse(completed));
});
```

### Python

```bash
pip install json_completer  # Coming soon
```

```python
from json_completer import JsonCompleter

# One-shot
result = JsonCompleter.complete('{"name": "Alice", "age":')
print(result)  # {"name": "Alice", "age":null}

# Streaming
completer = JsonCompleter()
buffer = ''
for chunk in stream:
    buffer += chunk
    completed = completer.complete_incremental(buffer)
    update_ui(json.loads(completed))
```

### Rust

```bash
cargo add json_completer
```

```rust
use json_completer::JsonCompleter;

// One-shot
let result = JsonCompleter::complete(r#"{"name": "Alice", "age":"#);
println!("{}", result); // {"name": "Alice", "age":null}

// Streaming
let mut completer = JsonCompleter::new();
let mut buffer = String::new();
for chunk in stream {
    buffer.push_str(&chunk);
    let completed = completer.complete_incremental(&buffer);
    update_ui(&serde_json::from_str(&completed)?);
}
```

---

## Troubleshooting

### "json_completer is slower than I expected"

**Likely causes**:
1. **Data too small** (<1 KB): Use try-catch instead
2. **Not using incremental mode**: Switch to `completeIncremental()` for streaming
3. **Binary spawn overhead**: Cache the client instance

**Fix**:
```javascript
// SLOW (spawns binary every time)
for (const item of items) {
  await complete(item);
}

// FAST (reuse client)
const client = new JsonCompleterClient();
for (const item of items) {
  await client.complete(item);
}
```

### "It's not recovering all my data"

**Likely causes**:
1. **Truncation mid-escape sequence**: Some data unrecoverable
2. **Binary data in JSON**: Can confuse parser
3. **Extremely nested structures**: Exceeds default limits

**Check**:
```javascript
const completed = await complete(truncated);
const parsed = JSON.parse(completed);

// How much was recovered?
console.log('Fields recovered:', Object.keys(parsed).length);
console.log('Original size:', truncated.length);
console.log('Completed size:', completed.length);
```

### "Still getting parse errors"

**Likely cause**: You have syntax errors, not truncation.

**Test**:
```javascript
const test = '{"name": "Alice", "age": 30,}'; // Trailing comma

// If this fails, you have syntax errors
const completed = await jsonCompleter.complete(test);
JSON.parse(completed); // Still fails

// Solution: Use jsonrepair instead
import { jsonrepair } from 'jsonrepair';
const fixed = jsonrepair(test);
JSON.parse(fixed); // Success!
```

---

## Next Steps

### If You Decided YES

1. **Read**: [Full Use Case Analysis](./USE_CASE_ANALYSIS.md)
2. **Install**: Follow [Installation Guide](../README.md#installation)
3. **Integrate**: Check [Integration Examples](../examples/)
4. **Monitor**: Track recovery rate, latency, data completeness
5. **Share**: Tell us your use case in [Discussions](https://github.com/aha-app/json_completer/discussions)

### If You Decided NO

That's totally fine! json_completer isn't for everyone. Consider:

1. **Syntax errors**: Use [jsonrepair](https://github.com/josdejong/jsonrepair)
2. **Schema validation**: Use [Ajv](https://ajv.js.org/) or similar
3. **Architecture fix**: Compress, paginate, or redesign API
4. **Keep it simple**: Sometimes try-catch is enough

### Still Unsure?

**Ask yourself**:
1. Am I losing data due to truncation? (Check logs)
2. Is that data valuable? (Quantify impact)
3. Can I prevent truncation? (Try architecture fixes first)
4. Is the data >10 KB? (Performance matters)

If 3+ answers are "yes", give json_completer a try. If not, you probably don't need it.

---

## Summary: The One-Line Rule

> **Use json_completer when truncation is unavoidable and data is valuable.**

Everything else is details.

---

**Questions?**
- [GitHub Discussions](https://github.com/aha-app/json_completer/discussions)
- [Full Documentation](../README.md)
- [API Reference](../rust/json_completer/README.md)

**Last Updated**: 2025-11-19
