# Changelog

All notable changes to `@json-completer/client` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-19

### Added

#### Core Features
- **JsonCompleterClient class** - Main client for interacting with json_completer binary
- **One-shot completion** via `complete()` method - Complete partial JSON in a single call
- **Incremental streaming** via `completeIncremental()` method - Efficient state-based processing for streaming scenarios
- **State management** - `getState()`, `setState()`, and `reset()` methods for managing parsing state
- **Helper function** - `complete()` standalone function for quick one-shot completions

#### TypeScript Support
- Full TypeScript type definitions
- Exported types: `JsonCompleterOptions`, `JsonCompleterState`, `JsonCompleterResponse`
- Complete JSDoc documentation on all public APIs
- ESM and CommonJS module support

#### Configuration
- Configurable binary path via `binPath` option
- Configurable timeout via `timeout` option (default: 5000ms)
- Automatic binary path detection in common locations

#### Error Handling
- Timeout error detection and handling
- Binary spawn error detection
- Process exit code handling
- JSON parse error handling
- Comprehensive error messages

#### Documentation
- Comprehensive README.md with:
  - Installation instructions
  - Quick start examples
  - Complete API reference
  - Usage examples (one-shot, streaming, Express, batch)
  - Performance notes and benchmarks
  - Troubleshooting guide
  - Platform support information
- Four example files demonstrating:
  - Basic usage (`examples/basic.ts`)
  - Streaming scenarios (`examples/streaming.ts`)
  - Express middleware integration (`examples/express.ts`)
  - Error handling patterns (`examples/error-handling.ts`)
- CHANGELOG.md (this file)

#### Testing
- Comprehensive unit test suite using Node.js test runner
- Tests for all core functionality
- Tests for state management
- Tests for error scenarios
- Tests for concurrent operations
- Tests for edge cases

#### Package Management
- npm package configuration with dual ESM/CJS exports
- Proper `files` field to include only necessary files
- `.npmignore` to exclude development files
- `engines` field specifying Node.js >=18.0.0
- `prepublishOnly` script for build validation
- Repository, bugs, and homepage URLs
- Comprehensive keywords for discoverability

### Technical Details

#### Performance
- **Zero-copy operations** - Direct binary communication
- **O(n) incremental parsing** - Only processes new data
- **State preservation** - Efficient streaming without reprocessing
- **Low memory overhead** - <1KB client overhead, 1-5KB state size

#### Platform Support
- Node.js 18.0.0 or higher
- TypeScript 5.0.0 or higher (optional peer dependency)
- Cross-platform: Linux, macOS, Windows
- Runtime compatibility: Node.js, Bun, Deno (npm mode)

#### Binary Integration
- Spawns json_completer Rust binary as child process
- Communicates via stdin/stdout with JSON protocol
- Automatic binary path resolution
- Custom binary path support
- Clear error messages when binary not found

### Dependencies

#### Runtime
- No runtime dependencies (zero-dependency package)

#### Development
- `@types/node` ^20.0.0 - Node.js type definitions
- `tsx` ^4.7.0 - TypeScript execution for tests
- `tsup` ^7.2.0 - TypeScript bundler
- `typescript` ^5.0.0 - TypeScript compiler

#### Peer Dependencies
- `typescript` >=5.0.0 (optional)

### Notes

This is the initial stable release of `@json-completer/client`. The package provides a production-ready TypeScript/Node.js client for the json_completer Rust binary.

**Requirements:**
- Requires the json_completer binary to be built separately
- See README.md for binary installation instructions

**Future Plans:**
- Platform-specific binary bundling (1.1.0)
- Automatic binary download/installation (1.2.0)
- WebAssembly version for browser support (2.0.0)
- See main repository roadmap for long-term plans

### Migration Guide

N/A - This is the first release.

---

## [Unreleased]

### Planned Features
- Automatic binary download in postinstall script
- Platform-specific binary packages
- Browser/WebAssembly support
- Advanced caching mechanisms
- Batch processing optimizations

---

[1.0.0]: https://github.com/aha-app/json_completer/releases/tag/@json-completer/client-v1.0.0
[Unreleased]: https://github.com/aha-app/json_completer/compare/@json-completer/client-v1.0.0...HEAD
