/**
 * Shared JsonCompleter client for integration tests
 * This is used by both Nest.js and Next.js integration tests
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

export class JsonCompleterClient {
  private binPath: string;
  private state: JsonCompleterState | null = null;

  constructor(binPath?: string) {
    this.binPath = binPath || this.findBinary();
  }

  private findBinary(): string {
    // Look for the binary relative to this file
    const projectRoot = path.resolve(__dirname, '../../..');
    return path.join(projectRoot, 'target', 'release', 'json_completer');
  }

  /**
   * Complete a partial JSON string (one-shot)
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
   * Get the current state
   */
  getState(): JsonCompleterState | null {
    return this.state;
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
  }
}
