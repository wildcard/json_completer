// Quick WASM test in Node.js
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function test() {
    console.log('Loading WASM module...');

    // Load the WASM module
    const wasmPath = join(__dirname, 'rust/json_completer/pkg/json_completer_bg.wasm');
    const wasmBuffer = readFileSync(wasmPath);

    // Import the JS bindings
    const { complete } = await import('./rust/json_completer/pkg/json_completer.js');
    const init = (await import('./rust/json_completer/pkg/json_completer.js')).default;

    // Initialize
    await init(wasmBuffer);

    console.log('WASM loaded successfully!\n');

    // Run tests
    const tests = [
        { input: '{"name": "John", "age":', expected: '{"name": "John", "age":null}' },
        { input: '{"message": "Hello', expected: '{"message": "Hello"}' },
        { input: '{"items": [1, 2, 3', expected: '{"items": [1, 2, 3]}' },
        { input: '{"users": [{"name": "Alice"}, {"name":', expected: '{"users": [{"name": "Alice"}, {"name":null}]}' },
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        const startTime = performance.now();
        const result = complete(test.input);
        const endTime = performance.now();
        const time = (endTime - startTime).toFixed(3);

        const success = result === test.expected;
        if (success) {
            passed++;
            console.log(`✅ PASS (${time}ms)`);
        } else {
            failed++;
            console.log(`❌ FAIL`);
            console.log(`  Input:    ${test.input}`);
            console.log(`  Expected: ${test.expected}`);
            console.log(`  Got:      ${result}`);
        }
    }

    console.log(`\nResults: ${passed} passed, ${failed} failed`);

    // Performance test
    console.log('\nPerformance test:');
    const largeInput = '{"items": [' + Array(1000).fill('{"id": 1, "value": "test"').join(', ');
    const perfStart = performance.now();
    complete(largeInput);
    const perfEnd = performance.now();
    console.log(`Large input (${largeInput.length} chars): ${(perfEnd - perfStart).toFixed(3)}ms`);
}

test().catch(console.error);
