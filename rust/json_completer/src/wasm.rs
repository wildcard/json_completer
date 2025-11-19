//! WASM bindings for json_completer
//!
//! This module provides WebAssembly bindings for the json_completer library,
//! allowing it to be used in web browsers and other WASM environments.

use wasm_bindgen::prelude::*;
use crate::{JsonCompleter, ParsingState};

/// WASM-compatible wrapper for JsonCompleter
#[wasm_bindgen]
pub struct WasmJsonCompleter {
    inner: JsonCompleter,
}

#[wasm_bindgen]
impl WasmJsonCompleter {
    /// Creates a new WASM JsonCompleter instance
    #[wasm_bindgen(constructor)]
    pub fn new() -> WasmJsonCompleter {
        WasmJsonCompleter {
            inner: JsonCompleter::new(),
        }
    }

    /// One-shot JSON completion (static method)
    #[wasm_bindgen(js_name = complete)]
    pub fn complete_static(partial_json: &str) -> String {
        JsonCompleter::complete(partial_json)
    }

    /// Incrementally completes JSON using previous parsing state
    #[wasm_bindgen(js_name = completeIncremental)]
    pub fn complete_incremental(&mut self, partial_json: &str) -> String {
        self.inner.complete_incremental(partial_json)
    }

    /// Reset the parsing state
    #[wasm_bindgen]
    pub fn reset(&mut self) {
        self.inner.reset();
    }

    /// Get the current parsing state as JSON string
    #[wasm_bindgen(js_name = getState)]
    pub fn get_state_json(&self) -> Result<String, JsValue> {
        serde_json::to_string(self.inner.get_state())
            .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
    }

    /// Create a JsonCompleter from a JSON state string
    #[wasm_bindgen(js_name = fromState)]
    pub fn from_state_json(state_json: &str) -> Result<WasmJsonCompleter, JsValue> {
        let state: ParsingState = serde_json::from_str(state_json)
            .map_err(|e| JsValue::from_str(&format!("Deserialization error: {}", e)))?;

        Ok(WasmJsonCompleter {
            inner: JsonCompleter::with_state(state),
        })
    }
}

/// Quick one-shot completion function for WASM
#[wasm_bindgen(js_name = complete)]
pub fn complete(partial_json: &str) -> String {
    JsonCompleter::complete(partial_json)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_wasm_complete_static() {
        let result = WasmJsonCompleter::complete_static(r#"{"name": "John", "age":"#);
        assert_eq!(result, r#"{"name": "John", "age":null}"#);
    }

    #[test]
    fn test_wasm_incremental() {
        let mut completer = WasmJsonCompleter::new();

        let result1 = completer.complete_incremental(r#"{"users": [{"name": ""#);
        assert_eq!(result1, r#"{"users": [{"name": ""}]}"#);

        let result2 = completer.complete_incremental(r#"{"users": [{"name": "Alice"}"#);
        assert_eq!(result2, r#"{"users": [{"name": "Alice"}]}"#);
    }

    #[test]
    fn test_wasm_reset() {
        let mut completer = WasmJsonCompleter::new();
        completer.complete_incremental(r#"{"test": "value"}"#);
        completer.reset();
        let result = completer.complete_incremental(r#"{"new": "#);
        assert_eq!(result, r#"{"new": null}"#);
    }
}
