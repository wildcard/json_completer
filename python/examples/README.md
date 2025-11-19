# json_completer Examples

This directory contains real-world examples demonstrating how to use json_completer in various scenarios.

## Running the Examples

First, install json_completer:

```bash
pip install json_completer
```

Then run any example:

```bash
python streaming_llm.py
python truncated_api_response.py
python state_persistence.py
python log_parsing.py
```

## Examples

### 1. streaming_llm.py

**Use Case**: Real-time JSON completion from streaming LLM APIs (OpenAI, Claude, etc.)

Demonstrates:
- Processing JSON as it arrives in chunks
- Getting valid JSON at any point during streaming
- Updating UI with intermediate results

**When to use**: Building chat interfaces, streaming API integrations, real-time displays

### 2. truncated_api_response.py

**Use Case**: Recovering data from API responses truncated due to size limits

Demonstrates:
- Handling AWS Lambda (6MB) and API Gateway (10MB) size limits
- Recovering partial data from network timeouts
- Graceful degradation when responses are cut off

**When to use**: Large API responses, size-constrained environments, unreliable networks

### 3. state_persistence.py

**Use Case**: Saving and restoring parser state for long-running or distributed processing

Demonstrates:
- Checkpoint/resume for streaming sessions
- State serialization and deserialization
- Transferring state between processes or workers
- Crash recovery scenarios

**When to use**: Distributed systems, long-running streams, fault-tolerant processing

### 4. log_parsing.py

**Use Case**: Parsing log files with truncated JSON entries

Demonstrates:
- Handling incomplete JSON in logs (CloudWatch, Datadog, Splunk)
- Batch processing large log files
- Recovering partial log entries

**When to use**: Log analysis, monitoring systems, data recovery from incomplete logs

## Common Patterns

### One-Shot Completion

For simple cases where you just need to complete a truncated JSON string once:

```python
import json_completer

result = json_completer.complete('{"partial": "json')
print(result)  # '{"partial": "json"}'
```

### Incremental Processing

For streaming scenarios where JSON arrives in chunks:

```python
import json_completer

completer = json_completer.JsonCompleter()

# Process chunks as they arrive
for chunk in stream:
    accumulated += chunk
    valid_json = completer.complete_incremental(accumulated)
    # Use valid_json for UI updates, etc.
```

### State Management

For long-running or distributed processing:

```python
import json_completer

# Save state
completer = json_completer.JsonCompleter()
completer.complete_incremental(chunk1)
state = completer.get_state()

# Later or in different process...
completer2 = json_completer.JsonCompleter.from_state(state)
completer2.complete_incremental(chunk2)
```

## Performance Tips

1. **Use incremental mode for large/streaming data**: The one-shot `complete()` function is convenient but creates a new completer each time. For streaming scenarios, reuse a `JsonCompleter` instance.

2. **Reset between documents**: If processing multiple independent JSON documents, call `reset()` between them:
   ```python
   completer = json_completer.JsonCompleter()
   completer.complete_incremental(doc1)
   completer.reset()
   completer.complete_incremental(doc2)
   ```

3. **Batch processing**: For processing many small JSON strings, the overhead of incremental state is not worth it. Use the one-shot function:
   ```python
   for entry in log_entries:
       completed = json_completer.complete(entry)
   ```

## Contributing Examples

Have a useful example? Please contribute!

1. Create a new Python file in this directory
2. Include docstrings explaining the use case
3. Add it to this README
4. Submit a pull request

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.
