/* tslint:disable */
/* eslint-disable */
/**
 * Quick one-shot completion function for WASM
 */
export function complete(partial_json: string): string;
/**
 * WASM-compatible wrapper for JsonCompleter
 */
export class WasmJsonCompleter {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Get the current parsing state as JSON string
   */
  getState(): string;
  /**
   * One-shot JSON completion (static method)
   */
  static complete(partial_json: string): string;
  /**
   * Create a JsonCompleter from a JSON state string
   */
  static fromState(state_json: string): WasmJsonCompleter;
  /**
   * Incrementally completes JSON using previous parsing state
   */
  completeIncremental(partial_json: string): string;
  /**
   * Creates a new WASM JsonCompleter instance
   */
  constructor();
  /**
   * Reset the parsing state
   */
  reset(): void;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_wasmjsoncompleter_free: (a: number, b: number) => void;
  readonly complete: (a: number, b: number) => [number, number];
  readonly wasmjsoncompleter_completeIncremental: (a: number, b: number, c: number) => [number, number];
  readonly wasmjsoncompleter_fromState: (a: number, b: number) => [number, number, number];
  readonly wasmjsoncompleter_getState: (a: number) => [number, number, number, number];
  readonly wasmjsoncompleter_new: () => number;
  readonly wasmjsoncompleter_reset: (a: number) => void;
  readonly wasmjsoncompleter_complete: (a: number, b: number) => [number, number];
  readonly __wbindgen_externrefs: WebAssembly.Table;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
