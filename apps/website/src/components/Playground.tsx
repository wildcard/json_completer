'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Highlight, themes } from 'prism-react-renderer';

// Example presets
const EXAMPLES = {
  'truncated-api': {
    name: 'Truncated API Response',
    input: '{"users": [{"name": "Alice", "age": 30}, {"name": "Bob", "age":'
  },
  'incomplete-string': {
    name: 'Incomplete String',
    input: '{"message": "Hello World'
  },
  'nested-objects': {
    name: 'Nested Objects',
    input: '{"company": {"name": "Acme Inc", "employees": [{"id": 1, "name": "John"}, {"id": 2'
  },
  'streaming-llm': {
    name: 'LLM Streaming Response',
    input: '{"response": {"content": "The quick brown fox", "tokens": 15, "model": "gpt'
  },
  'large-array': {
    name: 'Large Array',
    input: `{"items": [${Array.from({ length: 100 }, (_, i) => `{"id": ${i}, "value": ${i * 10}}`).join(', ').slice(0, 200)}`
  }
};

type WasmModule = {
  complete: (input: string) => string;
};

export default function Playground() {
  const [input, setInput] = useState(EXAMPLES['truncated-api'].input);
  const [output, setOutput] = useState('');
  const [selectedExample, setSelectedExample] = useState('truncated-api');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completionTime, setCompletionTime] = useState<number | null>(null);
  const wasmRef = useRef<WasmModule | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize WASM
  useEffect(() => {
    let mounted = true;

    async function loadWasm() {
      try {
        setIsLoading(true);
        setError(null);

        // Dynamic import of the WASM module
        const initWasm = (await import('/wasm/json_completer.js')).default;
        await initWasm({ module_or_path: '/wasm/json_completer_bg.wasm' });

        // Import the complete function
        const { complete } = await import('/wasm/json_completer.js');

        if (mounted) {
          wasmRef.current = { complete };
          setIsLoading(false);
          // Run initial completion
          processCompletion(input);
        }
      } catch (err) {
        console.error('Failed to load WASM:', err);
        if (mounted) {
          setError('Failed to load WASM module. Please refresh the page.');
          setIsLoading(false);
        }
      }
    }

    loadWasm();

    return () => {
      mounted = false;
    };
  }, []);

  const processCompletion = useCallback((value: string) => {
    if (!wasmRef.current) return;

    try {
      const startTime = performance.now();
      const result = wasmRef.current.complete(value);
      const endTime = performance.now();

      setOutput(result);
      setCompletionTime(endTime - startTime);
      setError(null);
    } catch (err) {
      console.error('Completion error:', err);
      setError('Error completing JSON. Please check your input.');
      setOutput('');
    }
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);

    // Debounce completion
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      processCompletion(value);
    }, 250);
  }, [processCompletion]);

  const handleExampleChange = useCallback((exampleKey: string) => {
    setSelectedExample(exampleKey);
    const example = EXAMPLES[exampleKey as keyof typeof EXAMPLES];
    setInput(example.input);
    processCompletion(example.input);
  }, [processCompletion]);

  const handleCopyOutput = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(output);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [output]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading playground...</p>
        </div>
      </div>
    );
  }

  if (error && !wasmRef.current) {
    return (
      <div className="p-8 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Reload Page
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <label htmlFor="example-select" className="font-semibold text-gray-700">
            Example:
          </label>
          <select
            id="example-select"
            value={selectedExample}
            onChange={(e) => handleExampleChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(EXAMPLES).map(([key, example]) => (
              <option key={key} value={key}>
                {example.name}
              </option>
            ))}
          </select>
        </div>

        {completionTime !== null && (
          <div className="text-sm text-gray-600">
            Completion time: <span className="font-mono font-semibold">{completionTime.toFixed(2)}ms</span>
          </div>
        )}
      </div>

      {/* Editor Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Input (Incomplete JSON)</h3>
            <span className="text-sm text-gray-500">{input.length} chars</span>
          </div>
          <div className="relative">
            <textarea
              value={input}
              onChange={handleInputChange}
              className="w-full h-96 p-4 font-mono text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none bg-white"
              placeholder="Enter incomplete JSON here..."
              spellCheck={false}
            />
          </div>
        </div>

        {/* Output Panel */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Output (Completed JSON)</h3>
            <button
              onClick={handleCopyOutput}
              disabled={!output}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Copy
            </button>
          </div>
          <div className="relative h-96 overflow-auto border-2 border-green-300 rounded-lg bg-green-50">
            {output ? (
              <Highlight theme={themes.github} code={output} language="json">
                {({ className, style, tokens, getLineProps, getTokenProps }) => (
                  <pre className={`${className} p-4 text-sm`} style={style}>
                    {tokens.map((line, i) => (
                      <div key={i} {...getLineProps({ line })}>
                        {line.map((token, key) => (
                          <span key={key} {...getTokenProps({ token })} />
                        ))}
                      </div>
                    ))}
                  </pre>
                )}
              </Highlight>
            ) : (
              <div className="p-4 text-gray-400 text-sm font-mono">
                Completed JSON will appear here...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">How it works</h4>
        <p className="text-blue-800 text-sm">
          Type or paste incomplete JSON in the input panel. The completer automatically adds missing brackets,
          quotes, and values (using <code className="bg-blue-100 px-1 rounded">null</code> for incomplete values)
          to make it valid JSON. Changes are processed with a 250ms debounce for optimal performance.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
