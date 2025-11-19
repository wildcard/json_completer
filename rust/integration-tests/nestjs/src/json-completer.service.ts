import { Injectable, Logger } from '@nestjs/common';
import { JsonCompleterClient } from '../../shared/json-completer-client';

/**
 * Nest.js service wrapping the json_completer Rust binary
 * This demonstrates how to integrate json_completer in a real Nest.js application
 */
@Injectable()
export class JsonCompleterService {
  private readonly logger = new Logger(JsonCompleterService.name);
  private client: JsonCompleterClient;

  constructor() {
    this.client = new JsonCompleterClient();
    this.logger.log('JsonCompleterService initialized');
  }

  /**
   * Complete a partial JSON string (one-shot)
   */
  async complete(partialJson: string): Promise<string> {
    try {
      this.logger.debug(`Completing JSON: ${partialJson.substring(0, 50)}...`);
      const result = await this.client.complete(partialJson);
      this.logger.debug(`Completed successfully`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to complete JSON: ${error.message}`);
      throw error;
    }
  }

  /**
   * Complete a partial JSON string incrementally
   */
  async completeIncremental(partialJson: string): Promise<string> {
    try {
      this.logger.debug(`Completing JSON incrementally: ${partialJson.substring(0, 50)}...`);
      const result = await this.client.completeIncremental(partialJson);
      this.logger.debug(`Completed incrementally`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to complete JSON incrementally: ${error.message}`);
      throw error;
    }
  }

  /**
   * Reset the incremental state
   */
  reset(): void {
    this.logger.debug('Resetting incremental state');
    this.client.reset();
  }

  /**
   * Get the current state (for debugging)
   */
  getState() {
    return this.client.getState();
  }

  /**
   * Create a new client instance (for isolated operations)
   */
  createClient(): JsonCompleterClient {
    return new JsonCompleterClient();
  }
}
