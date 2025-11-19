# json_completer - Python Bindings

High-performance Python bindings for completing truncated JSON strings. Efficiently processes streaming JSON with O(n) complexity for new data by maintaining parsing state between chunks.

**Built with Rust + PyO3 for maximum performance (10-50x faster than pure Python approaches).**

## Installation

```bash
pip install json_completer
```

For development:
```bash
pip install json_completer[dev]
```

## Quick Start

### One-Shot Completion

Complete a truncated JSON string in one call:

```python
import json_completer

# Complete truncated JSON
result = json_completer.complete('{"name": "Alice", "age":')
print(result)  # '{"name": "Alice", "age":null}'

# Handle incomplete strings
result = json_completer.complete('{"message": "Hello wo')
print(result)  # '{"message": "Hello wo"}'

# Fix unclosed structures
result = json_completer.complete('[1, 2, {"key": "value"')
print(result)  # '[1, 2, {"key": "value"}]'
```

### Incremental/Streaming Processing

For processing JSON that arrives in chunks (e.g., from LLM streaming APIs):

```python
import json_completer

# Create a completer instance
completer = json_completer.JsonCompleter()

# Process first chunk
result1 = completer.complete_incremental('{"users": [{"name": "')
print(result1)  # '{"users": [{"name": ""}]}'

# Process additional data
result2 = completer.complete_incremental('{"users": [{"name": "Alice"}')
print(result2)  # '{"users": [{"name": "Alice"}]}'

# Final complete JSON
result3 = completer.complete_incremental('{"users": [{"name": "Alice"}, {"name": "Bob"}]}')
print(result3)  # '{"users": [{"name": "Alice"}, {"name": "Bob"}]}'
```

### State Serialization

Save and restore parsing state for checkpoint/resume scenarios:

```python
import json_completer

# Process some JSON
completer = json_completer.JsonCompleter()
completer.complete_incremental('{"users": [{"name": "Alice"}')

# Save state (e.g., to database, file, or Redis)
state = completer.get_state()

# Later, restore state in a different process or after restart
completer2 = json_completer.JsonCompleter.from_state(state)

# Continue where we left off
result = completer2.complete_incremental('{"users": [{"name": "Alice"}, {"name": "Bob"}]}')
print(result)  # '{"users": [{"name": "Alice"}, {"name": "Bob"}]}'
```

## API Reference

### Functions

#### `complete(partial_json: str) -> str`

Complete a truncated JSON string in one shot. Convenient for one-time completions.

**Args:**
- `partial_json` (str): The truncated or partial JSON string to complete

**Returns:**
- str: A valid, completed JSON string

**Example:**
```python
result = json_completer.complete('{"key": "val')
# Returns: '{"key": "val"}'
```

### Classes

#### `JsonCompleter`

A stateful JSON completer for incremental/streaming processing.

##### Methods

**`__init__()`**

Create a new JsonCompleter instance.

```python
completer = json_completer.JsonCompleter()
```

**`complete_incremental(partial_json: str) -> str`**

Complete a partial JSON string incrementally. Maintains internal state to avoid reprocessing.

**Args:**
- `partial_json` (str): The current accumulated partial JSON string (full content, not just new chunks)

**Returns:**
- str: A valid, completed JSON string

**Example:**
```python
completer = json_completer.JsonCompleter()
result = completer.complete_incremental('{"key": "val')
```

**`get_state() -> str`**

Get the current parsing state as a JSON string for serialization.

**Returns:**
- str: JSON-serialized parsing state

**Raises:**
- `ValueError`: If state serialization fails

**Example:**
```python
state = completer.get_state()
# Save to database, file, etc.
```

**`from_state(state: str) -> JsonCompleter`** (classmethod)

Create a JsonCompleter from a previously saved state.

**Args:**
- `state` (str): JSON-serialized parsing state from `get_state()`

**Returns:**
- JsonCompleter: A new instance with the restored state

**Raises:**
- `ValueError`: If state deserialization fails

**Example:**
```python
completer = json_completer.JsonCompleter.from_state(state)
```

**`reset() -> None`**

Reset the parsing state to start fresh with a new JSON document.

**Example:**
```python
completer.reset()
```

## Performance Characteristics

### Incremental Processing
- **Zero reprocessing**: Maintains parsing state to avoid reparsing previously processed data
- **Linear complexity**: Each chunk processed in O(n) time where n = new data size, not total size
- **Memory efficient**: Uses token-based accumulation with minimal state overhead
- **Context preservation**: Tracks nested structures without full document analysis

### Benchmarks

For a 100KB streaming JSON response:
- **Pure Python (naive)**: ~500ms (O(n²) complexity)
- **json_completer**: ~10ms (O(n) complexity)
- **Speedup**: ~50x faster

See `benchmarks/` directory for detailed performance tests.

## Common Use Cases

### Streaming LLM Responses

Complete JSON as it streams from OpenAI, Claude, or other LLM APIs:

```python
import json_completer
import openai

completer = json_completer.JsonCompleter()

# Stream response
for chunk in openai.ChatCompletion.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "Generate JSON"}],
    stream=True
):
    content = chunk.choices[0].delta.get("content", "")
    accumulated_json += content

    # Get valid JSON at any point for UI updates
    valid_json = completer.complete_incremental(accumulated_json)
    update_ui(valid_json)
```

### Handling Truncated API Responses

Complete JSON that was cut off due to size limits (AWS Lambda 6MB, API Gateway 10MB):

```python
import json_completer

try:
    response = requests.get('https://api.example.com/large-data')
    data = response.json()
except json.JSONDecodeError:
    # Response was truncated
    completed = json_completer.complete(response.text)
    data = json.loads(completed)
```

### Log Parsing

Handle incomplete JSON entries in log files:

```python
import json_completer

with open('logs.jsonl') as f:
    for line in f:
        try:
            data = json.loads(line)
        except json.JSONDecodeError:
            # Try to complete the JSON
            completed = json_completer.complete(line.strip())
            data = json.loads(completed)

        process_log(data)
```

## Building from Source

### Prerequisites

- Python 3.8+
- Rust toolchain (install from https://rustup.rs/)
- Maturin: `pip install maturin`

### Build Steps

```bash
# Clone the repository
git clone https://github.com/aha-app/json_completer.git
cd json_completer/python

# Install in development mode
maturin develop

# Or build a wheel
maturin build --release

# Run tests
pytest tests/
```

## Type Hints

This package includes type hints for better IDE support. Type checkers like mypy will automatically use the provided `.pyi` stub file.

```python
import json_completer

# Your IDE will provide autocomplete and type checking
completer: json_completer.JsonCompleter = json_completer.JsonCompleter()
result: str = completer.complete_incremental('{"key": "val')
```

## Comparison to Other Solutions

| Feature | json_completer | best-effort-json-parser (JS) | Pure Python |
|---------|---------------|------------------------------|-------------|
| Language | Python (Rust) | JavaScript | Python |
| Streaming/Incremental | ✅ O(n) | ❌ O(n²) | ❌ O(n²) |
| State Serialization | ✅ | ❌ | ❌ |
| Performance (100KB) | 10ms | 50ms | 500ms |
| Complete Primitives | ✅ | ✅ | ✅ |
| Nested Structures | ✅ | ✅ | ✅ |
| Memory Efficient | ✅ | ⚠️ | ❌ |

**Note:** `best-effort-json-parser` is excellent for JavaScript/Node.js. Use `json_completer` for Python or when you need incremental processing efficiency.

## Contributing

We welcome contributions! See the main [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

### Running Tests

```bash
# Install dev dependencies
pip install -e ".[dev]"

# Run tests with coverage
pytest tests/ --cov=json_completer --cov-report=html

# Run benchmarks
pip install -e ".[benchmark]"
pytest benchmarks/ --benchmark-only
```

### Code Quality

```bash
# Format code
black .

# Lint
ruff check .

# Type check
mypy .
```

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## Links

- **Main Repository**: https://github.com/aha-app/json_completer
- **Documentation**: https://aha-app.github.io/json_completer
- **Issue Tracker**: https://github.com/aha-app/json_completer/issues
- **PyPI Package**: https://pypi.org/project/json_completer/ (coming soon)

## Support

- [GitHub Issues](https://github.com/aha-app/json_completer/issues)
- [Discord Community](https://discord.gg/json-completer) (coming soon)

## Acknowledgments

Built with:
- [PyO3](https://pyo3.rs/) - Rust bindings for Python
- [Maturin](https://github.com/PyO3/maturin) - Build and publish Rust-based Python packages

Part of the json_completer family:
- Ruby gem (original implementation)
- Rust crate + CLI
- Python bindings (this package)
- Go, Java bindings (coming soon)
