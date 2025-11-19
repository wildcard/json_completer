/**
 * TypeScript/Node.js wrapper for json_completer Rust binary
 *
 * This provides a convenient interface to the json_completer CLI
 * for use in Node.js, TypeScript, Bun, and other JavaScript environments.
 *
 * Usage:
 *   const completer = new JsonCompleter();
 *   const result = await completer.complete('{"test":');
 *   console.log(result); // {"test":null}
 */

import { spawn, exec as execCallback } from 'child_process';
import { promisify } from 'util';

const exec = promisify(execCallback);

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

/**
 * JsonCompleter class for completing partial JSON strings
 */
export class JsonCompleter {
  private binPath: string;
  private state: JsonCompleterState | null = null;

  /**
   * Create a new JsonCompleter instance
   * @param binPath Path to the json_completer binary (default: looks in common locations)
   */
  constructor(binPath?: string) {
    this.binPath = binPath || this.findBinary();
  }

  /**
   * Find the json_completer binary in common locations
   */
  private findBinary(): string {
    const commonPaths = [
      './target/release/json_completer',
      './rust/target/release/json_completer',
      '../target/release/json_completer',
      'json_completer', // Assumes it's in PATH
    ];

    // In production, you might want to check if the binary exists
    // For now, just use the first common path
    return commonPaths[0];
  }

  /**
   * Complete a partial JSON string (one-shot)
   * @param partialJson The partial JSON string to complete
   * @returns The completed JSON string
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
   * @param partialJson The current accumulated partial JSON string
   * @returns The completed JSON string
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
   */
  reset(): void {
    this.state = null;
  }

  /**
   * Execute a command against the json_completer binary
   */
  private async executeCommand(request: any): Promise<JsonCompleterResponse> {
    try {
      // Use spawn for better control and to avoid shell escaping issues
      const proc = spawn(this.binPath, ['--json-api'], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      return new Promise((resolve, reject) => {
        let stdout = '';
        let stderr = '';

        proc.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        proc.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        proc.on('close', (code) => {
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
          reject(new Error(`Failed to spawn process: ${err.message}`));
        });

        // Write request and close stdin
        proc.stdin.write(JSON.stringify(request) + '\n');
        proc.stdin.end();
      });
    } catch (error: any) {
      throw new Error(`Failed to execute json_completer: ${error.message}`);
    }
  }

  /**
   * Get the current state (useful for serialization/debugging)
   */
  getState(): JsonCompleterState | null {
    return this.state;
  }

  /**
   * Set the state (useful for deserialization)
   */
  setState(state: JsonCompleterState | null): void {
    this.state = state;
  }
}

/**
 * Bun-optimized version using Bun's native process APIs
 */
export class JsonCompleterBun extends JsonCompleter {
  protected async executeCommand(request: any): Promise<JsonCompleterResponse> {
    try {
      const proc = Bun.spawn([this.binPath, '--json-api'], {
        stdin: 'pipe',
        stdout: 'pipe',
        stderr: 'pipe',
      });

      // Write request
      proc.stdin.write(JSON.stringify(request) + '\n');
      proc.stdin.end();

      // Read response
      const output = await new Response(proc.stdout).text();
      const exitCode = await proc.exited;

      if (exitCode !== 0) {
        const errorOutput = await new Response(proc.stderr).text();
        throw new Error(`json_completer exited with code ${exitCode}: ${errorOutput}`);
      }

      const response = JSON.parse(output.trim());
      return response;
    } catch (error: any) {
      throw new Error(`Failed to execute json_completer: ${error.message}`);
    }
  }
}

/**
 * Synchronous version (uses the binary directly, blocks the event loop)
 * Use only for simple scripts or testing
 */
export class JsonCompleterSync {
  private binPath: string;

  constructor(binPath?: string) {
    this.binPath = binPath || './target/release/json_completer';
  }

  complete(partialJson: string): string {
    const { execSync } = require('child_process');
    const result = execSync(
      `${this.binPath} '${partialJson.replace(/'/g, "'\\''")}'`,
      { encoding: 'utf-8' }
    );
    return result.trim();
  }
}

// Example usage (uncomment to run):
/*
async function example() {
  const completer = new JsonCompleter();

  // One-shot completion
  console.log('One-shot completion:');
  const result1 = await completer.complete('{"name": "John", "age":');
  console.log(result1); // {"name": "John", "age":null}

  // Incremental completion
  console.log('\nIncremental completion:');
  const result2 = await completer.completeIncremental('{"users": [{"name": "');
  console.log(result2); // {"users": [{"name": ""}]}

  const result3 = await completer.completeIncremental('{"users": [{"name": "Alice"}');
  console.log(result3); // {"users": [{"name": "Alice"}]}

  const result4 = await completer.completeIncremental('{"users": [{"name": "Alice"}, {"name": "Bob"}]}');
  console.log(result4); // {"users": [{"name": "Alice"}, {"name": "Bob"}]}
}

example().catch(console.error);
*/
