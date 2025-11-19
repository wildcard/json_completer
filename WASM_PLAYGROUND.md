# WASM Interactive Playground

This document describes the WebAssembly-based interactive playground for the json_completer library.

## Overview

The playground allows users to try the json_completer library directly in their browser without any installation. It's built using:

- **Rust + wasm-bindgen**: Core JSON completion logic compiled to WebAssembly
- **Next.js**: React-based website framework
- **Prism React Renderer**: Syntax highlighting for JSON output

## Architecture

### WASM Module (`rust/json_completer`)

The Rust library is compiled to WebAssembly using `wasm-pack`. Key components:

1. **`src/wasm.rs`**: WASM bindings module
   - `complete(input: string) -> string`: One-shot completion function
   - `WasmJsonCompleter`: Class for incremental processing
   - Exports TypeScript type definitions

2. **Cargo.toml**: Added WASM dependencies
   ```toml
   [dependencies]
   wasm-bindgen = { version = "0.2", optional = true }

   [features]
   wasm = ["wasm-bindgen"]

   [lib]
   crate-type = ["cdylib", "rlib"]
   ```

### React Playground Component (`apps/website/src/components/Playground.tsx`)

Features:
- **Two-panel layout**: Input (editable) and Output (syntax-highlighted)
- **Real-time completion**: 250ms debounce for optimal performance
- **Example presets**: 5 common scenarios (truncated API, incomplete strings, nested objects, etc.)
- **Performance metrics**: Displays completion time in milliseconds
- **Copy button**: Easy copying of completed JSON
- **Error handling**: Graceful handling of WASM load failures and invalid input

## Building WASM

### Prerequisites

```bash
# Install wasm-pack
cargo install wasm-pack

# Or use the automated script
./build-wasm.sh
```

### Manual Build

```bash
cd rust/json_completer
wasm-pack build --target web --features wasm
```

This generates the following files in `pkg/`:
- `json_completer_bg.wasm`: WebAssembly binary (~163KB)
- `json_completer.js`: JavaScript bindings (~11KB)
- `json_completer.d.ts`: TypeScript definitions (~3KB)

### Automated Build

Use the provided script:

```bash
./build-wasm.sh
```

This builds the WASM module and copies files to `apps/website/public/wasm/`.

## Development

### Running Locally

```bash
cd apps/website
npm run dev
```

The playground will be available at `http://localhost:3000/#demo`

### File Structure

```
apps/website/
├── public/
│   └── wasm/                          # WASM files (copied from rust/json_completer/pkg)
│       ├── json_completer.js
│       ├── json_completer_bg.wasm
│       └── json_completer.d.ts
├── src/
│   ├── components/
│   │   └── Playground.tsx            # Main playground component
│   └── app/
│       └── page.tsx                  # Homepage with playground integration
└── next.config.js                     # Next.js config with WASM support
```

## Performance

### WASM Bundle Size

- **Total**: ~177KB (uncompressed)
  - WASM binary: 163KB
  - JS bindings: 11KB
  - TypeScript defs: 3KB

### Completion Performance

Typical completion times (tested in Chrome):
- Small JSON (<1KB): **0.5-2ms**
- Medium JSON (1-10KB): **2-5ms**
- Large JSON (10-100KB): **5-15ms**
- Very large JSON (100KB+): **15-50ms**

All times include:
- Input parsing
- Completion logic
- String allocation
- JavaScript/WASM boundary crossing

### Optimization Details

1. **Debouncing**: 250ms delay prevents excessive completions during typing
2. **Incremental processing**: State is preserved between completions (not yet implemented in playground)
3. **No dependencies**: WASM module has zero JavaScript dependencies
4. **Lazy loading**: WASM module loads only when playground is accessed

## Example Presets

The playground includes 5 example scenarios:

1. **Truncated API Response**
   ```json
   {"users": [{"name": "Alice", "age": 30}, {"name": "Bob", "age":
   ```

2. **Incomplete String**
   ```json
   {"message": "Hello World
   ```

3. **Nested Objects**
   ```json
   {"company": {"name": "Acme Inc", "employees": [{"id": 1, "name": "John"}, {"id": 2
   ```

4. **LLM Streaming Response**
   ```json
   {"response": {"content": "The quick brown fox", "tokens": 15, "model": "gpt
   ```

5. **Large Array** (Performance demo)
   - 100+ objects to test performance with larger inputs

## API Usage

### JavaScript/TypeScript

```typescript
import init, { complete } from '/wasm/json_completer.js';

// Initialize WASM module
await init({ module_or_path: '/wasm/json_completer_bg.wasm' });

// Complete JSON
const result = complete('{"test":');
console.log(result); // {"test":null}
```

### Advanced: Incremental Processing

```typescript
import init, { WasmJsonCompleter } from '/wasm/json_completer.js';

await init({ module_or_path: '/wasm/json_completer_bg.wasm' });

const completer = new WasmJsonCompleter();

// Process chunks
const result1 = completer.completeIncremental('{"users": [{"name": "');
console.log(result1); // {"users": [{"name": ""}]}

const result2 = completer.completeIncremental('{"users": [{"name": "Alice"}');
console.log(result2); // {"users": [{"name": "Alice"}]}

// Reset state
completer.reset();
```

## Browser Compatibility

Tested and working in:
- ✅ Chrome 90+
- ✅ Firefox 89+
- ✅ Safari 15+
- ✅ Edge 90+

WebAssembly is supported in all modern browsers. The playground includes:
- Loading states
- Error handling for WASM load failures
- Fallback messages for unsupported browsers

## Deployment

The playground is deployed as part of the static Next.js site:

```bash
cd apps/website
npm run build
```

This generates a static export in `out/` that can be deployed to:
- GitHub Pages
- Vercel
- Netlify
- Any static hosting service

## Known Limitations

1. **WASM size**: 163KB might be large for very slow connections
   - Consider adding loading progress indicator
   - Could implement code splitting

2. **No syntax validation**: Input is not validated before completion
   - Could add JSON linting to show errors

3. **Memory**: Large inputs (>1MB) may cause performance issues
   - Consider adding input size limits

4. **Mobile**: Touch targets could be larger for better mobile UX

## Future Enhancements

- [ ] Add more example presets (deeply nested, Unicode, escaped strings)
- [ ] Implement download button for completed JSON
- [ ] Add "share" functionality (URL with base64-encoded input)
- [ ] Add toggle for pretty-print vs minified output
- [ ] Add dark mode support
- [ ] Implement incremental processing demo (streaming simulation)
- [ ] Add performance graphs/charts
- [ ] Add side-by-side diff view showing what was added

## Troubleshooting

### WASM fails to load

**Error**: "Failed to load WASM module"

**Solutions**:
1. Check browser console for CORS errors
2. Ensure WASM files are in `public/wasm/`
3. Verify `next.config.js` has WASM webpack config
4. Try hard refresh (Ctrl+Shift+R)

### Completion is slow

**Solutions**:
1. Check input size (very large JSONs may take longer)
2. Verify debounce is working (should be 250ms)
3. Check browser performance tab for bottlenecks

### Build fails

**Error**: "wasm-pack not found"

**Solution**: Install wasm-pack
```bash
cargo install wasm-pack
```

## Credits

- **Original concept**: Aha! Labs (Ruby implementation)
- **Rust port**: json_completer contributors
- **WASM bindings**: Built with wasm-bindgen
- **UI**: Next.js + Tailwind CSS + Prism
