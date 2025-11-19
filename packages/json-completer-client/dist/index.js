"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  JsonCompleterClient: () => JsonCompleterClient,
  complete: () => complete
});
module.exports = __toCommonJS(src_exports);
var import_child_process = require("child_process");
var path = __toESM(require("path"));
var JsonCompleterClient = class {
  constructor(options = {}) {
    this.state = null;
    this.binPath = options.binPath || this.findBinary();
    this.timeout = options.timeout || 5e3;
  }
  /**
   * Find the json_completer binary in common locations
   */
  findBinary() {
    const commonPaths = [
      // Relative to node_modules
      path.resolve(__dirname, "../../../target/release/json_completer"),
      // Project root
      path.resolve(process.cwd(), "target/release/json_completer"),
      // Monorepo root
      path.resolve(process.cwd(), "../../target/release/json_completer"),
      // System PATH
      "json_completer"
    ];
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
  async complete(partialJson) {
    const request = {
      action: "complete",
      input: partialJson
    };
    const response = await this.executeCommand(request);
    if (response.error) {
      throw new Error(`JsonCompleter error: ${response.error}`);
    }
    return response.result;
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
  async completeIncremental(partialJson) {
    const request = {
      action: "complete_incremental",
      input: partialJson
    };
    if (this.state) {
      request.state = this.state;
    }
    const response = await this.executeCommand(request);
    if (response.error) {
      throw new Error(`JsonCompleter error: ${response.error}`);
    }
    if (response.state) {
      this.state = response.state;
    }
    return response.result;
  }
  /**
   * Reset the incremental state
   *
   * Call this to start a new incremental completion session
   */
  reset() {
    this.state = null;
  }
  /**
   * Get the current parsing state
   *
   * Useful for debugging or serializing state
   */
  getState() {
    return this.state;
  }
  /**
   * Set the parsing state
   *
   * Useful for deserializing state from a previous session
   */
  setState(state) {
    this.state = state;
  }
  /**
   * Execute a command against the json_completer binary
   */
  async executeCommand(request) {
    return new Promise((resolve2, reject) => {
      const proc = (0, import_child_process.spawn)(this.binPath, ["--json-api"], {
        stdio: ["pipe", "pipe", "pipe"]
      });
      let stdout = "";
      let stderr = "";
      let timedOut = false;
      const timeoutId = setTimeout(() => {
        timedOut = true;
        proc.kill();
        reject(new Error(`JsonCompleter timeout after ${this.timeout}ms`));
      }, this.timeout);
      proc.stdout.on("data", (data) => {
        stdout += data.toString();
      });
      proc.stderr.on("data", (data) => {
        stderr += data.toString();
      });
      proc.on("close", (code) => {
        clearTimeout(timeoutId);
        if (timedOut)
          return;
        if (code !== 0) {
          reject(new Error(`json_completer exited with code ${code}: ${stderr}`));
          return;
        }
        try {
          const response = JSON.parse(stdout.trim());
          resolve2(response);
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e}
Output: ${stdout}`));
        }
      });
      proc.on("error", (err) => {
        clearTimeout(timeoutId);
        reject(new Error(`Failed to spawn process: ${err.message}`));
      });
      try {
        proc.stdin.write(JSON.stringify(request) + "\n");
        proc.stdin.end();
      } catch (err) {
        clearTimeout(timeoutId);
        reject(new Error(`Failed to write to process: ${err}`));
      }
    });
  }
};
async function complete(partialJson, options) {
  const client = new JsonCompleterClient(options);
  return client.complete(partialJson);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  JsonCompleterClient,
  complete
});
