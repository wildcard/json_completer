/**
 * @json-completer/client
 * TypeScript client for json_completer Rust binary
 *
 * High-performance JSON completion with streaming support
 */
interface JsonCompleterState {
    output_tokens: string[];
    context_stack: string[];
    last_index: number;
    input_length: number;
    incomplete_string_start: number | null;
    incomplete_string_buffer: string | null;
    incomplete_string_escape_state: any | null;
}
interface JsonCompleterResponse {
    result?: string;
    state?: JsonCompleterState;
    error?: string;
}
interface JsonCompleterOptions {
    /** Path to the json_completer binary. If not provided, will search common locations */
    binPath?: string;
    /** Timeout in milliseconds for completion operations. Default: 5000 */
    timeout?: number;
}
/**
 * JsonCompleter client for Node.js environments
 *
 * Provides both one-shot and incremental JSON completion with state management
 *
 * @example
 * ```typescript
 * const client = new JsonCompleterClient();
 *
 * // One-shot completion
 * const result = await client.complete('{"test":');
 * console.log(result); // {"test":null}
 *
 * // Incremental streaming
 * const result1 = await client.completeIncremental('{"stream": [');
 * const result2 = await client.completeIncremental('{"stream": [1, 2, 3]}');
 * ```
 */
declare class JsonCompleterClient {
    private binPath;
    private state;
    private timeout;
    constructor(options?: JsonCompleterOptions);
    /**
     * Find the json_completer binary in common locations
     */
    private findBinary;
    /**
     * Complete a partial JSON string (one-shot)
     *
     * @param partialJson - The partial JSON string to complete
     * @returns The completed valid JSON string
     * @throws Error if completion fails
     *
     * @example
     * ```typescript
     * const result = await client.complete('{"name": "John", "age":');
     * // Result: {"name": "John", "age":null}
     * ```
     */
    complete(partialJson: string): Promise<string>;
    /**
     * Complete a partial JSON string incrementally with state tracking
     *
     * This method maintains state between calls for efficient streaming processing
     *
     * @param partialJson - The current accumulated partial JSON string
     * @returns The completed valid JSON string
     * @throws Error if completion fails
     *
     * @example
     * ```typescript
     * const result1 = await client.completeIncremental('{"users": [');
     * // Result: {"users": []}
     *
     * const result2 = await client.completeIncremental('{"users": [{"id": 1}');
     * // Result: {"users": [{"id": 1}]}
     * ```
     */
    completeIncremental(partialJson: string): Promise<string>;
    /**
     * Reset the incremental state
     *
     * Call this to start a new incremental completion session
     */
    reset(): void;
    /**
     * Get the current parsing state
     *
     * Useful for debugging or serializing state
     */
    getState(): JsonCompleterState | null;
    /**
     * Set the parsing state
     *
     * Useful for deserializing state from a previous session
     */
    setState(state: JsonCompleterState | null): void;
    /**
     * Execute a command against the json_completer binary
     */
    private executeCommand;
}
/**
 * Helper function for one-shot completion without creating a client instance
 *
 * @param partialJson - The partial JSON string to complete
 * @param options - Optional configuration
 * @returns The completed valid JSON string
 *
 * @example
 * ```typescript
 * import { complete } from '@json-completer/client';
 *
 * const result = await complete('{"test":');
 * console.log(result); // {"test":null}
 * ```
 */
declare function complete(partialJson: string, options?: JsonCompleterOptions): Promise<string>;

export { JsonCompleterClient, JsonCompleterOptions, JsonCompleterResponse, JsonCompleterState, complete };
