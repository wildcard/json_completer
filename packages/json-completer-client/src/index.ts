/**
 * @json-completer/client
 * TypeScript client for json_completer Rust binary
 *
 * High-performance JSON completion with streaming support
 */

import { spawn } from 'child_process';
import * as path from 'path';

export interface JsonCompleterState {
  output_tokens: string[];
  context_stack: string[];
  last_index: number;
  input_length: number;
  incomplete_string_start: number | null;
  incomplete_string_buffer: string | null;
  incomplete_string_escape_state: any | null;
}

export interface JsonCompleterResponse {
  result?: string;
  state?: JsonCompleterState;
  error?: string;
}

export interface JsonCompleterOptions {
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
export class JsonCompleterClient {
  private binPath: string;
  private state: JsonCompleterState | null = null;
  private timeout: number;

  constructor(options: JsonCompleterOptions = {}) {
    this.binPath = options.binPath || this.findBinary();
    this.timeout = options.timeout || 5000;
  }

  /**
   * Find the json_completer binary in common locations
   */
  private findBinary(): string {
    const commonPaths = [
      // Relative to node_modules
      path.resolve(__dirname, '../../../target/release/json_completer'),
      // Project root
      path.resolve(process.cwd(), 'target/release/json_completer'),
      // Monorepo root
      path.resolve(process.cwd(), '../../target/release/json_completer'),
      // System PATH
      'json_completer',
    ];

    // Return the first path (in production, could add existence checks)
    return commonPaths[0];
  }

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
  async complete(partialJson: string): Promise<string> {
    const request = {
      action: 'complete',
      input: partialJson,
    };

    const response = await this.executeCommand(request);

    if (response.error) {
      throw new Error(`JsonCompleter error: ${response.error}`);
    }

    return response.result!;
  }

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
  async completeIncremental(partialJson: string): Promise<string> {
    const request: any = {
      action: 'complete_incremental',
      input: partialJson,
    };

    if (this.state) {
      request.state = this.state;
    }

    const response = await this.executeCommand(request);

    if (response.error) {
      throw new Error(`JsonCompleter error: ${response.error}`);
    }

    // Save state for next incremental call
    if (response.state) {
      this.state = response.state;
    }

    return response.result!;
  }

  /**
   * Reset the incremental state
   *
   * Call this to start a new incremental completion session
   */
  reset(): void {
    this.state = null;
  }

  /**
   * Get the current parsing state
   *
   * Useful for debugging or serializing state
   */
  getState(): JsonCompleterState | null {
    return this.state;
  }

  /**
   * Set the parsing state
   *
   * Useful for deserializing state from a previous session
   */
  setState(state: JsonCompleterState | null): void {
    this.state = state;
  }

  /**
   * Execute a command against the json_completer binary
   */
  private async executeCommand(request: any): Promise<JsonCompleterResponse> {
    return new Promise((resolve, reject) => {
      const proc = spawn(this.binPath, ['--json-api'], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';
      let timedOut = false;

      // Set timeout
      const timeoutId = setTimeout(() => {
        timedOut = true;
        proc.kill();
        reject(new Error(`JsonCompleter timeout after ${this.timeout}ms`));
      }, this.timeout);

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        clearTimeout(timeoutId);

        if (timedOut) return;

        if (code !== 0) {
          reject(new Error(`json_completer exited with code ${code}: ${stderr}`));
          return;
        }

        try {
          const response = JSON.parse(stdout.trim());
          resolve(response);
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e}\nOutput: ${stdout}`));
        }
      });

      proc.on('error', (err) => {
        clearTimeout(timeoutId);
        reject(new Error(`Failed to spawn process: ${err.message}`));
      });

      // Write request and close stdin
      try {
        proc.stdin.write(JSON.stringify(request) + '\n');
        proc.stdin.end();
      } catch (err) {
        clearTimeout(timeoutId);
        reject(new Error(`Failed to write to process: ${err}`));
      }
    });
  }
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
export async function complete(
  partialJson: string,
  options?: JsonCompleterOptions
): Promise<string> {
  const client = new JsonCompleterClient(options);
  return client.complete(partialJson);
}

// Re-export types
export type { JsonCompleterOptions };
