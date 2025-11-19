"""
Performance benchmarks for json_completer.

Compares json_completer against naive pure Python approaches for:
- One-shot completion
- Incremental/streaming processing
- Various JSON sizes

Run with: pytest benchmark_performance.py --benchmark-only
Or with detailed stats: pytest benchmark_performance.py --benchmark-only --benchmark-verbose
"""

import json
import time


def naive_python_complete(partial_json):
    """
    Naive Python approach: try to parse, catch exception, and attempt to fix.

    This is O(n²) for incremental processing because it reprocesses
    the entire JSON each time.
    """
    # Try to parse as-is
    try:
        json.loads(partial_json)
        return partial_json
    except json.JSONDecodeError:
        pass

    # Try adding closing characters
    attempts = [
        partial_json + '"',
        partial_json + '"}',
        partial_json + '"}]',
        partial_json + '"]',
        partial_json + '}',
        partial_json + ']',
        partial_json + 'null}',
        partial_json + 'null]',
    ]

    for attempt in attempts:
        try:
            json.loads(attempt)
            return attempt
        except json.JSONDecodeError:
            continue

    # Give up, return null
    return 'null'


# Small JSON (~1KB)
SMALL_JSON = '''
{
  "user": {
    "id": 123,
    "name": "Alice",
    "email": "alice@example.com",
    "metadata": {
      "role": "admin",
      "permissions": ["read", "write", "delete"]
    }
  }
}
'''

# Medium JSON (~10KB)
MEDIUM_JSON = '{"users": [' + ','.join([
    f'{{"id": {i}, "name": "User{i}", "email": "user{i}@example.com", "active": true}}'
    for i in range(100)
]) + ']}'

# Large JSON (~100KB)
LARGE_JSON = '{"records": [' + ','.join([
    f'{{"id": {i}, "timestamp": "2024-01-15T10:00:00Z", "value": {i * 1.5}, '
    f'"tags": ["tag1", "tag2", "tag3"], "metadata": {{"processed": true}}}}'
    for i in range(1000)
]) + ']}'


# Generate truncated versions at various points
def truncate_at_percent(json_str, percent):
    """Truncate JSON at given percentage."""
    pos = int(len(json_str) * percent / 100)
    return json_str[:pos]


def test_benchmark_small_oneshot_rust(benchmark):
    """Benchmark json_completer (Rust) on small JSON."""
    import json_completer

    truncated = truncate_at_percent(SMALL_JSON, 50)
    result = benchmark(json_completer.complete, truncated)
    # Verify result is valid
    json.loads(result)


def test_benchmark_small_oneshot_python(benchmark):
    """Benchmark naive Python on small JSON."""
    truncated = truncate_at_percent(SMALL_JSON, 50)
    result = benchmark(naive_python_complete, truncated)
    # Verify result is valid
    json.loads(result)


def test_benchmark_medium_oneshot_rust(benchmark):
    """Benchmark json_completer (Rust) on medium JSON."""
    import json_completer

    truncated = truncate_at_percent(MEDIUM_JSON, 50)
    result = benchmark(json_completer.complete, truncated)
    json.loads(result)


def test_benchmark_medium_oneshot_python(benchmark):
    """Benchmark naive Python on medium JSON."""
    truncated = truncate_at_percent(MEDIUM_JSON, 50)
    result = benchmark(naive_python_complete, truncated)
    json.loads(result)


def test_benchmark_large_oneshot_rust(benchmark):
    """Benchmark json_completer (Rust) on large JSON."""
    import json_completer

    truncated = truncate_at_percent(LARGE_JSON, 50)
    result = benchmark(json_completer.complete, truncated)
    json.loads(result)


def test_benchmark_large_oneshot_python(benchmark):
    """Benchmark naive Python on large JSON."""
    truncated = truncate_at_percent(LARGE_JSON, 50)
    result = benchmark(naive_python_complete, truncated)
    json.loads(result)


def simulate_streaming_rust(json_str, num_chunks=10):
    """Simulate streaming with json_completer (Rust)."""
    import json_completer

    completer = json_completer.JsonCompleter()
    chunk_size = len(json_str) // num_chunks

    for i in range(num_chunks):
        chunk_end = min((i + 1) * chunk_size, len(json_str))
        partial = json_str[:chunk_end]
        result = completer.complete_incremental(partial)
        json.loads(result)  # Verify valid

    return result


def simulate_streaming_python(json_str, num_chunks=10):
    """Simulate streaming with naive Python (reprocesses each time)."""
    chunk_size = len(json_str) // num_chunks

    for i in range(num_chunks):
        chunk_end = min((i + 1) * chunk_size, len(json_str))
        partial = json_str[:chunk_end]
        result = naive_python_complete(partial)
        json.loads(result)  # Verify valid

    return result


def test_benchmark_streaming_small_rust(benchmark):
    """Benchmark streaming with json_completer (Rust) on small JSON."""
    result = benchmark(simulate_streaming_rust, SMALL_JSON, 10)
    json.loads(result)


def test_benchmark_streaming_small_python(benchmark):
    """Benchmark streaming with naive Python on small JSON."""
    result = benchmark(simulate_streaming_python, SMALL_JSON, 10)
    json.loads(result)


def test_benchmark_streaming_medium_rust(benchmark):
    """Benchmark streaming with json_completer (Rust) on medium JSON."""
    result = benchmark(simulate_streaming_rust, MEDIUM_JSON, 20)
    json.loads(result)


def test_benchmark_streaming_medium_python(benchmark):
    """Benchmark streaming with naive Python on medium JSON."""
    result = benchmark(simulate_streaming_python, MEDIUM_JSON, 20)
    json.loads(result)


def test_benchmark_streaming_large_rust(benchmark):
    """Benchmark streaming with json_completer (Rust) on large JSON."""
    result = benchmark(simulate_streaming_rust, LARGE_JSON, 50)
    json.loads(result)


def test_benchmark_streaming_large_python(benchmark):
    """Benchmark streaming with naive Python on large JSON."""
    result = benchmark(simulate_streaming_python, LARGE_JSON, 50)
    json.loads(result)


def test_benchmark_state_serialization(benchmark):
    """Benchmark state serialization/deserialization."""
    import json_completer

    completer = json_completer.JsonCompleter()
    completer.complete_incremental(truncate_at_percent(MEDIUM_JSON, 50))

    def serialize_deserialize():
        state = completer.get_state()
        completer2 = json_completer.JsonCompleter.from_state(state)
        return completer2

    result = benchmark(serialize_deserialize)
    assert result is not None


if __name__ == "__main__":
    import pytest
    import sys

    # Run benchmarks
    sys.exit(pytest.main([
        __file__,
        "--benchmark-only",
        "--benchmark-verbose",
        "--benchmark-sort=name",
        "-v"
    ]))
