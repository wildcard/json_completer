# Build and Test Guide for Python Bindings

This guide provides step-by-step instructions for building, testing, and preparing the json_completer Python package for PyPI publication.

## Prerequisites

- **Python**: 3.8 or higher
- **Rust**: Latest stable (install from https://rustup.rs/)
- **Maturin**: Python package builder for Rust extensions

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install maturin
pip install maturin[patchelf]
```

## Quick Start

```bash
# Navigate to python directory
cd python

# Build and install in development mode
maturin develop

# Run tests
pytest tests/ -v

# Run examples
python examples/streaming_llm.py
```

## Development Workflow

### 1. Build the Extension

**Development build** (faster, includes debug symbols):
```bash
cd python
maturin develop
```

**Release build** (optimized):
```bash
cd python
maturin develop --release
```

### 2. Run Tests

**Basic test run**:
```bash
cd python
pytest tests/ -v
```

**With coverage**:
```bash
cd python
pytest tests/ --cov=json_completer --cov-report=html --cov-report=term
```

**Specific test**:
```bash
cd python
pytest tests/test_json_completer.py::test_complete_incomplete_string -v
```

### 3. Run Examples

```bash
cd python

# Streaming LLM example
python examples/streaming_llm.py

# Truncated API response example
python examples/truncated_api_response.py

# State persistence example
python examples/state_persistence.py

# Log parsing example
python examples/log_parsing.py
```

### 4. Run Benchmarks

```bash
cd python

# Install benchmark dependencies
pip install pytest-benchmark

# Run benchmarks
pytest benchmarks/ --benchmark-only

# With detailed output
pytest benchmarks/ --benchmark-only --benchmark-verbose

# Save results
pytest benchmarks/ --benchmark-only --benchmark-json=results.json
```

### 5. Type Checking

```bash
cd python
pip install mypy
mypy --install-types --non-interactive json_completer.pyi tests/
```

### 6. Linting and Formatting

```bash
cd python

# Install tools
pip install black ruff

# Check formatting
black --check .

# Format code
black .

# Lint
ruff check .

# Lint with auto-fix
ruff check --fix .
```

## Building Distribution Packages

### Build Wheels

**For current platform**:
```bash
cd python
maturin build --release
```

**For specific Python version**:
```bash
cd python
maturin build --release --interpreter python3.11
```

**For multiple Python versions**:
```bash
cd python
maturin build --release --interpreter python3.8 python3.9 python3.10 python3.11 python3.12
```

**Output**: Wheels will be in `../dist/`

### Build Source Distribution

```bash
cd python
maturin sdist
```

**Output**: Source tarball will be in `../dist/`

### Build for manylinux (Linux compatibility)

```bash
cd python

# Use maturin's Docker-based builder
docker run --rm -v $(pwd):/io ghcr.io/pyo3/maturin build --release --manylinux 2014

# Or use maturin directly (requires Docker)
maturin build --release --compatibility manylinux2014
```

## Testing Distribution Packages

### Test wheel installation

```bash
# Create a virtual environment
python -m venv test-env
source test-env/bin/activate  # On Windows: test-env\Scripts\activate

# Install from wheel
pip install dist/json_completer-*.whl

# Test import
python -c "import json_completer; print(json_completer.complete('{\"test\":'))"

# Deactivate and clean up
deactivate
rm -rf test-env
```

### Test with different Python versions

```bash
# Using pyenv or multiple Python installations
for version in 3.8 3.9 3.10 3.11 3.12; do
    echo "Testing Python $version..."
    python$version -m venv test-env-$version
    source test-env-$version/bin/activate
    pip install dist/json_completer-*-cp${version/./}-*.whl
    python -c "import json_completer; print('OK')"
    deactivate
    rm -rf test-env-$version
done
```

## Performance Verification

### Expected benchmark results

Run benchmarks and verify performance meets expectations:

```bash
cd python
pytest benchmarks/ --benchmark-only --benchmark-verbose
```

**Expected results** (approximate):
- Small JSON (1KB) one-shot: <20µs
- Medium JSON (10KB) one-shot: <100µs
- Large JSON (100KB) one-shot: <1ms
- Streaming (50 chunks, 100KB): <20ms

### Compare with pure Python

The benchmarks include comparisons with naive Python approaches. json_completer should be:
- 5-10x faster for one-shot completion
- 10-50x faster for streaming (small to medium JSON)
- 50-150x faster for streaming large JSON

## Publishing to PyPI (When Ready)

### Prerequisites

1. **PyPI account**: Create at https://pypi.org/
2. **API token**: Generate at https://pypi.org/manage/account/token/
3. **Twine**: `pip install twine`

### Test PyPI (Recommended first)

```bash
# Build distributions
cd python
maturin build --release --sdist

# Upload to Test PyPI
twine upload --repository testpypi ../dist/*

# Test installation from Test PyPI
pip install --index-url https://test.pypi.org/simple/ json_completer
```

### Production PyPI

```bash
# Build distributions
cd python
maturin build --release --sdist

# Upload to PyPI
twine upload ../dist/*

# Or use maturin directly
maturin publish
```

## CI/CD

The Python bindings include comprehensive CI/CD:

- **Location**: `.github/workflows/python-ci.yml`
- **Triggers**: Push to main/develop, PRs affecting Python code
- **Platforms**: Ubuntu, macOS, Windows
- **Python versions**: 3.8, 3.9, 3.10, 3.11, 3.12

### CI Jobs

1. **Test**: Run tests on all platforms and Python versions
2. **Type Check**: Verify type hints with mypy
3. **Lint**: Check code quality with ruff
4. **Format**: Verify formatting with black
5. **Benchmark**: Run performance benchmarks
6. **Build Wheels**: Build wheels for all platforms
7. **Build Source**: Build source distribution
8. **Test Wheel**: Verify wheel installation

### Local CI Simulation

Run the same checks locally:

```bash
cd python

# 1. Tests
pytest tests/ -v --cov=json_completer

# 2. Type checking
mypy --install-types --non-interactive json_completer.pyi tests/

# 3. Linting
ruff check .

# 4. Formatting
black --check .

# 5. Benchmarks
pytest benchmarks/ --benchmark-only

# 6. Build
maturin build --release
```

## Troubleshooting

### Build fails with "cannot find -lpython"

**Solution**: Install Python development headers
```bash
# Ubuntu/Debian
sudo apt-get install python3-dev

# macOS (usually not needed)
# Python from python.org or Homebrew includes headers

# Windows (usually not needed)
# Python installer includes development files
```

### Import fails with "DLL load failed" (Windows)

**Solution**: Install Visual C++ Redistributable
- Download from https://aka.ms/vs/17/release/vc_redist.x64.exe

### Tests fail with "ModuleNotFoundError: No module named 'json_completer'"

**Solution**: Build the extension first
```bash
cd python
maturin develop
```

### Benchmark comparison shows <2x speedup

**Possible causes**:
1. Debug build instead of release: Use `maturin develop --release`
2. Small JSON size: Speedup is more noticeable with larger JSON
3. Python overhead dominates: Try streaming benchmarks

### Type checking fails with "Cannot find implementation or library stub"

**Solution**: The `.pyi` file must be in the same directory as the built module
```bash
# Verify .pyi file exists
ls python/json_completer.pyi

# If using pip install, ensure .pyi is included in package
```

## Verification Checklist

Before publishing to PyPI, verify:

- [ ] All tests pass: `pytest tests/ -v`
- [ ] Type hints work: `mypy json_completer.pyi`
- [ ] Benchmarks show expected speedup
- [ ] Wheel installs cleanly in fresh venv
- [ ] Examples run without errors
- [ ] README is up to date
- [ ] Version number is correct in `pyproject.toml` and `Cargo.toml`
- [ ] LICENSE file is included
- [ ] CHANGELOG updated (if exists)

## Next Steps

1. **Testing**: Run the full test suite on multiple platforms
2. **Performance**: Verify benchmarks meet targets
3. **Documentation**: Review README and examples
4. **Version**: Update version numbers for release
5. **Tag**: Create git tag for version (e.g., `v0.1.0`)
6. **Publish**: Upload to Test PyPI, then production PyPI

## Support

- **Issues**: https://github.com/aha-app/json_completer/issues
- **Discussions**: https://github.com/aha-app/json_completer/discussions
- **Contributing**: See CONTRIBUTING.md in repository root
