# JsonCompleter

A library that converts partial JSON strings into valid JSON with high-performance incremental parsing. Efficiently processes streaming JSON with O(n) complexity for new data by maintaining parsing state between chunks. Handles truncated primitives, missing values, and unclosed structures without reprocessing previously parsed data.

**Available in two implementations:**
- **Ruby gem**: Original implementation for Ruby applications
- **Rust cargo + CLI**: High-performance Rust implementation with CLI binary for language-agnostic interop (Node.js, TypeScript, Bun, Nest.js, Next.js, etc.)

## 🚀 Quick Start

### Ruby
```ruby
gem install json_completer
```

### Rust + CLI (for all languages)
```bash
cargo build --release
# Use the binary: ./target/release/json_completer
```

See [Rust README](./rust/README.md) for integration with Node.js, TypeScript, Bun, Nest.js, and Next.js.

---

## Ruby Gem

## Installation

Add this line to your application's Gemfile:

```ruby
gem 'json_completer'
```

And then execute:

```bash
bundle install
```

Or install it yourself as:

```bash
gem install json_completer
```

## Usage

### Basic Usage

Complete partial JSON strings in one call:

```ruby
require 'json_completer'

# Complete truncated JSON
JsonCompleter.complete('{"name": "John", "age":')
# => '{"name": "John", "age": null}'

# Handle incomplete strings
JsonCompleter.complete('{"message": "Hello wo')
# => '{"message": "Hello wo"}'

# Fix unclosed structures
JsonCompleter.complete('[1, 2, {"key": "value"')
# => '[1, 2, {"key": "value"}]'
```

### Incremental Processing

For streaming scenarios where JSON arrives in chunks. Each call processes only new data (O(n) complexity) by maintaining parsing state, making it highly efficient for large streaming responses:

```ruby
completer = JsonCompleter.new

# Process first chunk
result1 = completer.complete('{"users": [{"name": "')
# => '{"users": [{"name": ""}]}'

# Process additional data
result2 = completer.complete('{"users": [{"name": "Alice"}')
# => '{"users": [{"name": "Alice"}]}'

# Final complete JSON
result3 = completer.complete('{"users": [{"name": "Alice"}, {"name": "Bob"}]}')
# => '{"users": [{"name": "Alice"}, {"name": "Bob"}]}'
```

#### Performance Characteristics

- **Zero reprocessing**: Maintains parsing state to avoid reparsing previously processed data
- **Linear complexity**: Each chunk processed in O(n) time where n = new data size, not total size
- **Memory efficient**: Uses token-based accumulation with minimal state overhead
- **Context preservation**: Tracks nested structures without full document analysis

### Common Use Cases

- **High-performance streaming JSON**: Process large JSON responses efficiently as data arrives over network connections
- **Truncated API responses**: Complete JSON that was cut off due to size limits
- **Log parsing**: Handle incomplete JSON entries in log files

## 🗺️ Roadmap

We're building the industry-standard JSON completion library across all major programming ecosystems. See our comprehensive roadmap:

- **[📋 Full Roadmap](ROADMAP.md)** - Complete vision, features, and timeline
- **[⚡ Executive Summary](docs/ROADMAP_SUMMARY.md)** - Quick reference for stakeholders
- **[🔧 Implementation Guide](docs/ROADMAP_IMPLEMENTATION.md)** - For maintainers executing the roadmap

**Coming Soon**:
- Python, Go, Ruby, and Java bindings
- Interactive playground on our website
- Schema-aware completion
- Framework integrations (Express, FastAPI, Spring)
- Enterprise features and cloud integrations

[Vote on features](https://github.com/aha-app/json_completer/discussions) or [view our progress](https://github.com/aha-app/json_completer/projects).

## 🤝 Contributing

We welcome contributions of all kinds! Whether you're fixing bugs, adding features, improving documentation, or helping in the community.

**Get Started**:
- Read our [Contributing Guide](CONTRIBUTING.md)
- Browse [good first issues](https://github.com/aha-app/json_completer/labels/good-first-issue)
- Join our [Discord community](https://discord.gg/json-completer) (coming soon)
- Check the [roadmap](ROADMAP.md) for upcoming features

**Quick Contribution Steps**:
1. Fork the repository
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Make your changes and add tests
4. Run the test suite (`bundle exec rspec` for Ruby, `cargo test` for Rust)
5. Commit your changes (`git commit -am 'Add some feature'`)
6. Push to the branch (`git push origin my-new-feature`)
7. Create a new Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📄 License

This gem is available as open source under the terms of the [MIT License](LICENSE).
