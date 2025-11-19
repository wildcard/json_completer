# Performance Benchmarks

This directory contains performance benchmarks comparing json_completer against naive pure Python approaches.

## Running Benchmarks

First, install the benchmark dependencies:

```bash
pip install json_completer[benchmark]
```

Then run the benchmarks:

```bash
# Basic benchmark
pytest benchmark_performance.py --benchmark-only

# With detailed statistics
pytest benchmark_performance.py --benchmark-only --benchmark-verbose

# Save results to file
pytest benchmark_performance.py --benchmark-only --benchmark-json=results.json

# Compare with previous results
pytest benchmark_performance.py --benchmark-only --benchmark-compare
```

## Benchmark Categories

### One-Shot Completion

Tests single-call completion performance for various JSON sizes:
- **Small** (~1KB): User profile JSON
- **Medium** (~10KB): Array of 100 user objects
- **Large** (~100KB): Array of 1000 record objects

### Streaming/Incremental Processing

Tests incremental processing performance:
- Simulates JSON arriving in chunks
- Measures total time to process all chunks
- Demonstrates O(n) vs O(n²) complexity

### State Serialization

Tests state save/restore performance:
- Serialization to JSON
- Deserialization from JSON
- Useful for understanding checkpoint/resume overhead

## Expected Results

Based on typical runs:

### One-Shot Completion

| Size   | json_completer (Rust) | Naive Python | Speedup |
|--------|----------------------|--------------|---------|
| Small  | ~10 µs               | ~50 µs       | 5x      |
| Medium | ~50 µs               | ~500 µs      | 10x     |
| Large  | ~500 µs              | ~25 ms       | 50x     |

### Streaming (10-50 chunks)

| Size   | json_completer (Rust) | Naive Python | Speedup |
|--------|----------------------|--------------|---------|
| Small  | ~100 µs              | ~500 µs      | 5x      |
| Medium | ~1 ms                | ~50 ms       | 50x     |
| Large  | ~10 ms               | ~1.5 s       | 150x    |

**Note**: The streaming speedup is much larger because the naive Python approach has O(n²) complexity (reprocesses everything each time), while json_completer has O(n) complexity (only processes new data).

## Understanding the Results

### Why is json_completer faster?

1. **Compiled code**: Written in Rust and compiled to native code
2. **Incremental parsing**: Maintains state to avoid reprocessing
3. **Efficient memory usage**: Uses token-based accumulation
4. **Optimized algorithms**: Specialized for JSON completion

### When does the speedup matter?

- **Large JSON** (>10KB): Naive approaches become noticeably slow
- **Streaming scenarios**: Each chunk compounds the O(n²) problem
- **High throughput**: Processing many JSONs per second
- **Real-time applications**: Need <10ms response times

### When is the speedup less important?

- **Small JSON** (<1KB): Both are fast enough
- **One-time processing**: Setup overhead may dominate
- **Low frequency**: Processing one JSON per minute

## Interpreting pytest-benchmark Output

```
Name (time in us)                          Min      Max     Mean  StdDev
------------------------------------------------------------------------
test_benchmark_small_oneshot_rust         8.2     15.3     9.1    1.2
test_benchmark_small_oneshot_python      45.1     67.8    48.3    3.4
```

- **Min**: Fastest run (best case)
- **Max**: Slowest run (worst case)
- **Mean**: Average time across all runs
- **StdDev**: Standard deviation (lower = more consistent)

## Visualizing Results

Generate comparison charts:

```bash
# Install visualization dependencies
pip install matplotlib

# Run benchmarks with JSON output
pytest benchmark_performance.py --benchmark-only --benchmark-json=results.json

# Create chart (you'll need to create this script)
python visualize_benchmarks.py results.json
```

## Contributing Benchmarks

To add new benchmarks:

1. Add a test function following the `test_benchmark_*` pattern
2. Use the `benchmark` fixture provided by pytest-benchmark
3. Ensure the benchmark tests valid functionality
4. Update this README with expected results

See [pytest-benchmark documentation](https://pytest-benchmark.readthedocs.io/) for more details.

## CI Integration

These benchmarks run in CI to detect performance regressions:

- Runs on every PR
- Compares against main branch baseline
- Fails if performance degrades by >20%
- Results published to GitHub Actions artifacts

See `.github/workflows/python-ci.yml` for configuration.
