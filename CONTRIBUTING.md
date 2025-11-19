# Contributing to json_completer

Thank you for your interest in contributing to json_completer! This guide will help you get started.

## 🎯 Ways to Contribute

### Code Contributions
- **Bug fixes**: Fix issues tagged with `bug` or `good-first-issue`
- **New features**: Implement items from [ROADMAP.md](ROADMAP.md)
- **Performance improvements**: Optimize hot paths, reduce allocations
- **Language bindings**: Create bindings for new languages
- **Framework integrations**: Build plugins for popular frameworks

### Non-Code Contributions
- **Documentation**: Improve guides, fix typos, add examples
- **Translations**: Translate docs to other languages
- **Testing**: Write tests, report bugs, verify fixes
- **Community**: Answer questions, help others get started
- **Content**: Write blog posts, create tutorials, record videos

## 🚀 Getting Started

### Prerequisites

- **Rust**: Install via [rustup](https://rustup.rs/) (version 1.70+)
- **Node.js**: Version 18+ for integration tests (via [nvm](https://github.com/nvm-sh/nvm))
- **Git**: For version control

### Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/aha-app/json_completer.git
cd json_completer

# Build the Rust library and CLI
cd rust
cargo build --release

# Run tests
cargo test

# Run integration tests (requires Node.js)
cd integration-tests
npm install
npm test

# Build the monorepo (optional)
cd ../..
npm install
npm run build
```

### Project Structure

```
json_completer/
├── rust/
│   ├── json_completer/          # Core library
│   ├── json_completer_cli/      # CLI binary
│   └── integration-tests/       # Integration tests
├── packages/
│   └── json-completer-client/   # TypeScript/Node.js client
├── apps/
│   └── website/                 # Documentation website
├── ROADMAP.md                   # Product roadmap
└── CONTRIBUTING.md              # This file
```

## 📝 Development Workflow

### 1. Find or Create an Issue

- Browse [existing issues](https://github.com/aha-app/json_completer/issues)
- Look for `good-first-issue` or `help-wanted` labels
- For new features, create an issue first to discuss the approach

### 2. Fork and Branch

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/json_completer.git
cd json_completer

# Create a feature branch
git checkout -b feature/your-feature-name
```

### 3. Make Changes

- Write clean, readable code following project conventions
- Add tests for new functionality
- Update documentation as needed
- Keep commits focused and atomic

### 4. Test Your Changes

```bash
# Rust unit tests
cd rust
cargo test

# Rust integration tests
cargo test --test '*'

# Node.js integration tests
cd integration-tests/nestjs
npm test

cd ../nextjs
npm test

# Lint and format
cargo fmt --check
cargo clippy -- -D warnings
```

### 5. Commit and Push

```bash
# Stage your changes
git add .

# Commit with a descriptive message
git commit -m "feat: add schema-aware completion support"

# Push to your fork
git push origin feature/your-feature-name
```

### 6. Create a Pull Request

- Go to the [original repository](https://github.com/aha-app/json_completer)
- Click "New Pull Request"
- Select your fork and branch
- Fill out the PR template
- Link related issues

## 🎨 Code Style Guidelines

### Rust

- **Format**: Use `cargo fmt` (rustfmt)
- **Lint**: Pass `cargo clippy` with no warnings
- **Naming**: `snake_case` for functions/variables, `PascalCase` for types
- **Documentation**: Add doc comments (`///`) for public APIs
- **Error handling**: Use `Result` and `?` operator, avoid `unwrap()`

```rust
/// Completes a partial JSON string.
///
/// # Arguments
///
/// * `partial_json` - The incomplete JSON string
///
/// # Returns
///
/// A completed, valid JSON string
///
/// # Examples
///
/// ```
/// let result = JsonCompleter::complete(r#"{"key": "val"#);
/// assert_eq!(result, r#"{"key": "val"}"#);
/// ```
pub fn complete(partial_json: &str) -> String {
    // Implementation
}
```

### TypeScript/JavaScript

- **Format**: Use Prettier (configured in project)
- **Lint**: Pass ESLint checks
- **Naming**: `camelCase` for variables/functions, `PascalCase` for classes
- **Types**: Use TypeScript types, avoid `any`

```typescript
/**
 * Complete a partial JSON string.
 *
 * @param partialJson - The incomplete JSON string
 * @returns A promise resolving to the completed JSON
 *
 * @example
 * ```typescript
 * const result = await completer.complete('{"key": "val');
 * console.log(result); // {"key": "val"}
 * ```
 */
async complete(partialJson: string): Promise<string> {
  // Implementation
}
```

## 🧪 Testing Guidelines

### Test Coverage

- **Unit tests**: Test individual functions and edge cases
- **Integration tests**: Test end-to-end workflows
- **Benchmark tests**: Verify performance characteristics

### Writing Good Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_complete_simple_object() {
        let input = r#"{"key": "value"#;
        let expected = r#"{"key": "value"}"#;
        assert_eq!(JsonCompleter::complete(input), expected);
    }

    #[test]
    fn test_complete_nested_array() {
        let input = r#"{"items": [1, 2, {"nested"#;
        let expected = r#"{"items": [1, 2, {"nested": null}]}"#;
        assert_eq!(JsonCompleter::complete(input), expected);
    }

    #[test]
    fn test_empty_input() {
        assert_eq!(JsonCompleter::complete(""), "null");
    }
}
```

### Performance Testing

```rust
#[test]
fn benchmark_large_document() {
    let large_json = generate_large_json(10000); // 10K items
    let start = std::time::Instant::now();
    JsonCompleter::complete(&large_json);
    let duration = start.elapsed();
    assert!(duration.as_millis() < 100, "Should complete in <100ms");
}
```

## 📚 Documentation Guidelines

### Code Documentation

- **Public APIs**: Must have doc comments with examples
- **Complex logic**: Add inline comments explaining the "why"
- **README**: Keep README.md updated with new features

### Writing Guides

- **Audience**: Assume readers are experienced developers, new to this library
- **Structure**: Start with the problem, show the solution, explain why
- **Examples**: Include complete, runnable code examples
- **Visuals**: Add diagrams, screenshots, or GIFs when helpful

## 🐛 Reporting Bugs

### Before Reporting

1. **Search existing issues** to avoid duplicates
2. **Update to latest version** and verify the bug still exists
3. **Create a minimal reproduction** if possible

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
1. Input JSON: `{"key": "val`
2. Expected: `{"key": "val"}`
3. Actual: `{"key": "val"` (not completed)

**Environment**
- OS: macOS 13.0
- Rust version: 1.75.0
- Library version: 2.0.0

**Additional context**
Add any other context about the problem here.
```

## 🎁 Recognition

We value all contributions! Contributors are recognized through:

- **All Contributors**: Listed in README.md (via [all-contributors](https://allcontributors.org/))
- **Changelog**: Mentioned in release notes
- **Community Spotlights**: Featured in monthly updates
- **Swag**: Stickers and t-shirts for significant contributions

## 🤝 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive experience for everyone, regardless of:

- Age, body size, disability, ethnicity
- Gender identity and expression
- Level of experience, education
- Nationality, personal appearance, race
- Religion, sexual identity and orientation

### Our Standards

**Positive behaviors:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behaviors:**
- Harassment, trolling, or insulting comments
- Public or private harassment
- Publishing others' private information
- Other conduct which could reasonably be considered inappropriate

### Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported by contacting the project team. All complaints will be reviewed and investigated promptly and fairly.

## 💡 Need Help?

- **Discord**: Join our [community server](https://discord.gg/json-completer) (coming soon)
- **GitHub Discussions**: Ask questions in [Discussions](https://github.com/aha-app/json_completer/discussions)
- **Email**: Reach out to maintainers (see MAINTAINERS.md)

## 📄 License

By contributing to json_completer, you agree that your contributions will be licensed under the same license as the project (see [LICENSE](LICENSE)).

---

**Thank you for contributing to json_completer!** 🎉

Every contribution, no matter how small, helps make this project better for everyone.
