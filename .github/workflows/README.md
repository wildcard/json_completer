# GitHub Actions CI/CD Workflows

This directory contains all GitHub Actions workflows for automated testing, building, and deployment.

## Overview

We have three main workflows:

1. **`ci.yml`** - Ruby gem CI (original implementation)
2. **`rust-ci.yml`** - Comprehensive Rust CI 🆕
3. **`rust-integration.yml`** - Rust integration tests with Nest.js/Next.js
4. **`gem-push.yml`** - Ruby gem publishing

---

## Workflow Details

### 1. Ruby CI (`ci.yml`)

**Trigger**: Push to main, PRs to main

**Jobs**:
- **test**: Matrix testing across Ruby 3.2, 3.3, 3.4
- **lint**: RuboCop linting
- **build**: Gem building

**Purpose**: Ensures Ruby gem quality and compatibility

---

### 2. Rust CI (`rust-ci.yml`) 🆕

**Trigger**: Push to main, PRs to main

Comprehensive CI workflow similar to Ruby CI, testing the Rust implementation across multiple versions and platforms.

#### Jobs

##### Test Job (Matrix Strategy)
```yaml
Matrix:
  - Rust: stable, beta, nightly
  - OS: Ubuntu, macOS, Windows
```

- ✅ Runs all unit tests
- ✅ Runs doc tests
- ✅ Continues on error for nightly (experimental)
- ✅ Cross-platform validation

**Why Multiple Versions?**
- **stable**: Production-ready, guaranteed to work
- **beta**: Upcoming stable, early compatibility check
- **nightly**: Experimental features, optional

**Why Multiple OS?**
- **Ubuntu**: Primary development/CI environment
- **macOS**: Apple Silicon/Intel compatibility
- **Windows**: Windows developer support

##### Lint Job
```yaml
Components: rustfmt, clippy
```

- ✅ Code formatting with `rustfmt`
- ✅ Linting with `clippy` (warnings = errors)
- ✅ Ensures code quality standards

**Similar to**: Ruby's RuboCop lint job

##### Build Job

- ✅ Debug build (fast compilation, includes debug symbols)
- ✅ Release build (optimized, production-ready)
- ✅ Binary verification (smoke tests)
- ✅ Uploads artifact for downstream jobs

**Similar to**: Ruby's gem build job

##### Binary Verification Job

- ✅ Downloads built binary
- ✅ Runs 8 verification tests
- ✅ Validates all completion scenarios
- ✅ Ensures binary works standalone

**Tests Run**:
1. Incomplete object completion
2. Incomplete string completion
3. Incomplete array completion
4. Incomplete number completion
5. Incomplete keyword completion
6. Nested structure completion
7. Valid JSON preservation
8. Empty string handling

##### Security Audit Job

- ✅ Scans dependencies with `cargo-audit`
- ✅ Identifies security vulnerabilities
- ✅ Continuous security monitoring

**Why?**: Proactive security posture, early detection

##### Coverage Job

- ✅ Generates code coverage with `cargo-tarpaulin`
- ✅ Uploads to Codecov
- ✅ Tracks coverage trends

**Why?**: Ensures comprehensive test coverage

---

### 3. Rust Integration Tests (`rust-integration.yml`)

**Trigger**: Push to any branch, PRs to main

End-to-end integration testing with real-world frameworks.

#### Jobs

##### rust-tests
- Builds Rust workspace
- Runs all Rust tests
- Builds release binary
- Verifies binary functionality
- Uploads binary artifact

##### nestjs-integration
- Downloads binary artifact
- Installs Nest.js dependencies
- Runs 23 integration tests
- Uploads test results

**Tests**:
- One-shot completion (10 tests)
- Incremental streaming (4 tests)
- Real-world scenarios (5 tests)
- Error handling (2 tests)
- Performance benchmarks (2 tests)

##### nextjs-integration
- Downloads binary artifact
- Installs Next.js dependencies
- Runs 18 integration tests
- Uploads test results

**Tests**:
- API route testing (7 tests)
- Error handling (3 tests)
- Real-world scenarios (3 tests)
- Direct binary integration (3 tests)
- Performance tests (2 tests)

##### integration-summary
- Aggregates results
- Generates summary report
- Posts to GitHub Actions summary

---

### 4. Gem Push (`gem-push.yml`)

**Trigger**: Push tags matching `v*`

Automated Ruby gem publishing to RubyGems.org

---

## Workflow Comparison

| Feature | Ruby CI | Rust CI | Integration Tests |
|---------|---------|---------|-------------------|
| **Multi-version** | ✅ 3.2, 3.3, 3.4 | ✅ stable, beta, nightly | ❌ (stable only) |
| **Multi-OS** | ❌ (Ubuntu only) | ✅ Ubuntu, macOS, Windows | ❌ (Ubuntu only) |
| **Linting** | ✅ RuboCop | ✅ rustfmt + clippy | ❌ |
| **Tests** | ✅ RSpec | ✅ cargo test | ✅ Jest (58 tests) |
| **Build** | ✅ Gem | ✅ Binary (debug + release) | ✅ Release binary |
| **Security** | ❌ | ✅ cargo-audit | ❌ |
| **Coverage** | ❌ | ✅ Codecov | ❌ |
| **Artifacts** | ❌ | ✅ Binary | ✅ Binary + test results |

---

## Caching Strategy

All workflows use GitHub Actions cache for faster builds:

### Rust Workflows
```yaml
- Cargo registry (~/.cargo/registry)
- Cargo git (~/.cargo/git)
- Build artifacts (target/)
```

**Cache Keys**: Include Rust version, OS, and Cargo.lock hash

**Benefits**:
- ⚡ Faster CI runs (2-5x speedup)
- 💰 Reduced CI minutes usage
- 🌍 Less bandwidth consumption

### Ruby Workflow
```yaml
- Bundler cache (via setup-ruby)
```

---

## Action Versions

All workflows use latest action versions:

| Action | Version | Purpose |
|--------|---------|---------|
| `actions/checkout` | v4 | Repository checkout |
| `actions/cache` | v4 | Dependency caching |
| `actions/upload-artifact` | v4 | Artifact uploads |
| `actions/download-artifact` | v4 | Artifact downloads |
| `actions/setup-node` | v4 | Node.js setup |
| `actions-rs/toolchain` | v1 | Rust toolchain |
| `codecov/codecov-action` | v3 | Coverage upload |

**Why v4?**: GitHub deprecated v3 of artifact actions (April 2024)

---

## Status Badges

Add to README.md:

```markdown
![Ruby CI](https://github.com/aha-app/json_completer/workflows/CI/badge.svg)
![Rust CI](https://github.com/aha-app/json_completer/workflows/Rust%20CI/badge.svg)
![Integration Tests](https://github.com/aha-app/json_completer/workflows/Rust%20Integration%20Tests/badge.svg)
```

---

## Local Testing

### Ruby
```bash
bundle install
bundle exec rspec
bundle exec rubocop ./lib
```

### Rust
```bash
cd rust

# Run tests (all versions)
cargo test --workspace

# Run tests (like CI - stable)
cargo +stable test --workspace

# Lint
cargo fmt --all -- --check
cargo clippy --workspace --all-targets -- -D warnings

# Build
cargo build --release

# Verify binary
../rust/integration-tests/verify-binary.sh
```

### Integration Tests
```bash
cd rust/integration-tests

# Quick verification (8 tests)
./verify-binary.sh

# Full integration suite (58 tests)
./run-ci-simulation.sh
```

---

## Debugging CI Failures

### View Logs
1. Go to Actions tab
2. Click on failed workflow run
3. Click on failed job
4. Expand failed step

### Common Issues

**Rust compilation errors**:
- Check Rust version compatibility
- Verify Cargo.lock is committed
- Review clippy warnings

**Integration test failures**:
- Ensure binary was built successfully
- Check binary has execute permissions
- Verify npm dependencies installed

**Cache issues**:
- Clear cache via GitHub Actions UI
- Force rebuild: push commit with [skip cache]

### Re-run Failed Jobs
- Click "Re-run failed jobs" button
- Or re-run entire workflow

---

## Performance Metrics

### Typical Run Times

| Workflow | Duration | Cost (CI minutes) |
|----------|----------|-------------------|
| Ruby CI | ~2-3 min | 6-9 minutes |
| Rust CI | ~5-8 min | 50-80 minutes* |
| Integration Tests | ~3-5 min | 9-15 minutes |

*Matrix jobs run in parallel, so wall-clock time is lower

### Optimization Tips

1. **Use caching** - Already implemented
2. **Selective job running** - Use `paths` filter
3. **Cancel redundant runs** - Enabled by default
4. **Fail fast** - `fail-fast: false` for better diagnostics

---

## Adding New Tests

### Rust Unit Test
1. Add test to `rust/json_completer/src/lib.rs`
2. Run locally: `cargo test`
3. Push - CI will run automatically

### Integration Test
1. Add test to appropriate file:
   - Nest.js: `rust/integration-tests/nestjs/src/*.spec.ts`
   - Next.js: `rust/integration-tests/nextjs/__tests__/*.test.ts`
2. Run locally: `npm test`
3. Push - CI will run automatically

---

## Security

### Secrets Used
- `RUBYGEMS_API_KEY` - For gem publishing (gem-push workflow)

### Best Practices
- ✅ No secrets in logs
- ✅ Minimal permissions
- ✅ Dependency scanning (cargo-audit)
- ✅ No arbitrary code execution

---

## Contributing

When modifying workflows:

1. **Test locally first** - Use `act` or manual testing
2. **Update this README** - Document changes
3. **Test on fork** - Create PR from fork to test
4. **Monitor first run** - Check new workflow succeeds

---

## Resources

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Rust CI/CD Guide](https://doc.rust-lang.org/cargo/guide/continuous-integration.html)
- [actions-rs GitHub Actions](https://github.com/actions-rs)
- [Codecov Documentation](https://docs.codecov.io/)

---

**Last Updated**: 2024-11-16
**Maintainer**: json_completer contributors
