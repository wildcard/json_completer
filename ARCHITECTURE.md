# WASM Playground Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          User Browser                            │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Next.js Website (React)                     │   │
│  │                                                           │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │          page.tsx (Homepage)                       │ │   │
│  │  │                                                     │ │   │
│  │  │  ┌──────────────────────────────────────────────┐ │ │   │
│  │  │  │   Playground Component                       │ │ │   │
│  │  │  │                                               │ │ │   │
│  │  │  │  ┌────────────┐      ┌──────────────────┐  │ │ │   │
│  │  │  │  │   Input    │      │     Output       │  │ │ │   │
│  │  │  │  │  Textarea  │ ──▶  │ Syntax Highlight │  │ │ │   │
│  │  │  │  └────────────┘      └──────────────────┘  │ │ │   │
│  │  │  │         │                      ▲            │ │ │   │
│  │  │  │         │                      │            │ │ │   │
│  │  │  │         ▼                      │            │ │ │   │
│  │  │  │  ┌─────────────────────────────┐           │ │ │   │
│  │  │  │  │   Debounce (250ms)          │           │ │ │   │
│  │  │  │  └─────────────────────────────┘           │ │ │   │
│  │  │  │         │                                   │ │ │   │
│  │  │  │         ▼                                   │ │ │   │
│  │  │  │  ┌─────────────────────────────┐           │ │ │   │
│  │  │  │  │  WASM Module Interface      │           │ │ │   │
│  │  │  │  │  complete(input) -> output  │           │ │ │   │
│  │  │  │  └─────────────────────────────┘           │ │ │   │
│  │  │  │         │                                   │ │ │   │
│  │  │  └─────────┼───────────────────────────────────┘ │ │   │
│  │  │            │                                      │ │   │
│  │  └────────────┼──────────────────────────────────────┘ │   │
│  │               │                                         │   │
│  └───────────────┼─────────────────────────────────────────┘   │
│                  │                                               │
│    ┌─────────────▼──────────────────────────────────────────┐  │
│    │          WebAssembly Runtime                           │  │
│    │                                                         │  │
│    │  ┌───────────────────────────────────────────────┐    │  │
│    │  │   json_completer_bg.wasm (163KB)              │    │  │
│    │  │                                                │    │  │
│    │  │   Compiled Rust Code:                         │    │  │
│    │  │   - JsonCompleter struct                      │    │  │
│    │  │   - complete() function                       │    │  │
│    │  │   - Parsing logic                             │    │  │
│    │  │   - Context tracking                          │    │  │
│    │  │   - String/number/keyword completion          │    │  │
│    │  │                                                │    │  │
│    │  └───────────────────────────────────────────────┘    │  │
│    │               ▲                                        │  │
│    │               │                                        │  │
│    │  ┌────────────┴──────────────────────────────────┐    │  │
│    │  │   json_completer.js (11KB)                    │    │  │
│    │  │   JavaScript Bindings (wasm-bindgen)          │    │  │
│    │  └───────────────────────────────────────────────┘    │  │
│    │                                                         │  │
│    └─────────────────────────────────────────────────────────┘  │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
User Types Input
      │
      ▼
┌─────────────────┐
│  Input Textarea │
└─────────────────┘
      │
      ▼
┌─────────────────┐
│ onChange Event  │
└─────────────────┘
      │
      ▼
┌─────────────────────┐
│ Debounce (250ms)    │  ◀── Prevents excessive calls
└─────────────────────┘
      │
      ▼
┌────────────────────────────┐
│ wasmRef.current.complete() │  ◀── WASM function call
└────────────────────────────┘
      │
      ▼
┌──────────────────────────┐
│ JavaScript → WASM bridge │  ◀── wasm-bindgen
└──────────────────────────┘
      │
      ▼
┌──────────────────────────┐
│ Rust: JsonCompleter      │
│ - Parse input            │
│ - Track context stack    │
│ - Complete structures    │
│ - Return valid JSON      │
└──────────────────────────┘
      │
      ▼
┌──────────────────────────┐
│ WASM → JavaScript bridge │
└──────────────────────────┘
      │
      ▼
┌──────────────────────────┐
│ setOutput(result)        │
└──────────────────────────┘
      │
      ▼
┌──────────────────────────┐
│ Prism Syntax Highlighting│
└──────────────────────────┘
      │
      ▼
┌──────────────────────────┐
│ Render to Output Panel   │
└──────────────────────────┘
```

## Build Pipeline

```
┌─────────────────────────┐
│   Rust Source Code      │
│   src/lib.rs            │
│   src/wasm.rs           │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   cargo build           │
│   --target wasm32...    │
│   --features wasm       │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   rustc + LLVM          │
│   Optimize & Compile    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   .wasm Binary          │
│   (raw WebAssembly)     │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   wasm-bindgen          │
│   Generate JS bindings  │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   pkg/ Directory        │
│   - .wasm (binary)      │
│   - .js (bindings)      │
│   - .d.ts (types)       │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   Copy to public/wasm/  │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   Next.js Static Build  │
│   Includes WASM files   │
└─────────────────────────┘
```

## Component Hierarchy

```
page.tsx
│
└── Playground
    │
    ├── State Management
    │   ├── input (string)
    │   ├── output (string)
    │   ├── selectedExample (string)
    │   ├── isLoading (boolean)
    │   ├── error (string | null)
    │   ├── completionTime (number | null)
    │   └── wasmRef (ref to WASM module)
    │
    ├── Effects
    │   └── useEffect (load WASM on mount)
    │
    ├── Callbacks
    │   ├── processCompletion()
    │   ├── handleInputChange()
    │   ├── handleExampleChange()
    │   └── handleCopyOutput()
    │
    └── Render
        ├── Loading State
        ├── Error State
        └── Main UI
            ├── Controls Row
            │   ├── Example Selector
            │   └── Performance Display
            │
            ├── Editor Grid
            │   ├── Input Panel
            │   │   ├── Header (title + char count)
            │   │   └── Textarea
            │   │
            │   └── Output Panel
            │       ├── Header (title + copy button)
            │       └── Syntax Highlighted Code
            │
            └── Info Box
```

## File Structure

```
json_completer/
│
├── rust/
│   └── json_completer/
│       ├── Cargo.toml              ← WASM dependencies & config
│       ├── src/
│       │   ├── lib.rs              ← Core library + WASM export
│       │   └── wasm.rs             ← WASM bindings (NEW)
│       │
│       └── pkg/                    ← Generated by wasm-pack
│           ├── json_completer_bg.wasm
│           ├── json_completer.js
│           └── json_completer.d.ts
│
├── apps/
│   └── website/
│       ├── public/
│       │   └── wasm/               ← Copied from pkg/ (NEW)
│       │       ├── json_completer_bg.wasm
│       │       ├── json_completer.js
│       │       └── json_completer.d.ts
│       │
│       ├── src/
│       │   ├── components/
│       │   │   └── Playground.tsx  ← Main component (NEW)
│       │   │
│       │   └── app/
│       │       └── page.tsx        ← Homepage (MODIFIED)
│       │
│       ├── next.config.js          ← WASM webpack config (MODIFIED)
│       └── package.json            ← Dependencies (MODIFIED)
│
├── build-wasm.sh                   ← Build automation (NEW)
├── WASM_PLAYGROUND.md              ← Documentation (NEW)
├── WASM_BUILD_SUMMARY.md           ← This summary (NEW)
└── ARCHITECTURE.md                 ← Architecture diagram (NEW)
```

## Technology Stack

### Backend (Rust → WASM)
- **Language**: Rust (edition 2021)
- **Compiler**: rustc + LLVM
- **Target**: wasm32-unknown-unknown
- **Bindings**: wasm-bindgen 0.2
- **Build Tool**: wasm-pack
- **Features**: Conditional compilation with `wasm` feature flag

### Frontend (React + Next.js)
- **Framework**: Next.js 14.0.4
- **UI Library**: React 18.2.0
- **Styling**: Tailwind CSS
- **Syntax Highlighting**: prism-react-renderer
- **Type Safety**: TypeScript
- **Build**: Webpack with WASM support

### Runtime
- **Environment**: Browser (Chrome, Firefox, Safari, Edge)
- **WASM Runtime**: Browser's native WebAssembly runtime
- **Module Format**: ES6 modules
- **Loading**: Async/dynamic import

## Performance Characteristics

### Bundle Size Breakdown
```
Total Bundle:        ~177KB uncompressed
├── WASM Binary:     163KB (92%)
├── JS Bindings:     11KB  (6%)
└── TS Definitions:  3KB   (2%)

Compressed (gzip):   ~60-70KB (estimated)
```

### Execution Performance
```
Initialization:      50-100ms (one-time)
Small Input (<1KB):  <1ms
Medium (1-10KB):     1-5ms
Large (10-100KB):    5-15ms
Debounce Delay:      250ms
```

### Memory Usage
```
WASM Memory:         ~2MB allocated
JS Heap:             Minimal (strings only)
Total Overhead:      <5MB typical
```

## Security Considerations

1. **Sandboxing**: WASM runs in browser's secure sandbox
2. **Memory Safety**: Rust's memory safety guarantees
3. **No Network**: WASM module operates entirely offline
4. **No DOM Access**: WASM cannot access DOM directly
5. **Input Validation**: All input handled safely by Rust

## Browser Loading Sequence

```
1. User loads page
2. React initializes
3. Playground component mounts
4. useEffect triggers
5. Dynamic import of /wasm/json_completer.js
6. JS module loaded
7. initWasm() called with .wasm path
8. Browser fetches .wasm file
9. WebAssembly.instantiate()
10. WASM module initialized
11. complete() function available
12. Loading state → Ready
13. User can interact
```

## Error Handling Flow

```
┌─────────────────┐
│   WASM Load     │
└────────┬────────┘
         │
    Success? ─────No─────▶ Show Error + Reload Button
         │
        Yes
         │
         ▼
┌─────────────────┐
│  User Input     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  complete()     │
└────────┬────────┘
         │
    Success? ─────No─────▶ Show Error Message
         │                 (keep previous output)
        Yes
         │
         ▼
┌─────────────────┐
│  Display Output │
└─────────────────┘
```

## Future Architecture Considerations

### Potential Optimizations
1. **Web Worker**: Move WASM to background thread
2. **Streaming WASM**: Use WebAssembly.instantiateStreaming()
3. **Code Splitting**: Lazy load playground only when needed
4. **WASM Caching**: Cache compiled module in IndexedDB
5. **Progressive Loading**: Show partial results during completion

### Scalability
1. **Multiple Instances**: Support multiple playgrounds per page
2. **State Persistence**: Save/restore editor state in localStorage
3. **URL State**: Encode input in URL for sharing
4. **Server-Side**: Optional server fallback for non-WASM browsers

---

This architecture provides:
- ✅ Fast performance (<100ms latency)
- ✅ Small bundle size (<200KB)
- ✅ Type safety (TypeScript)
- ✅ Memory safety (Rust)
- ✅ Browser security (WASM sandbox)
- ✅ Excellent UX (loading states, error handling)
- ✅ Maintainability (clear separation of concerns)
