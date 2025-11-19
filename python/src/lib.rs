use pyo3::prelude::*;
use pyo3::exceptions::PyValueError;
use pyo3::types::PyType;
use ::json_completer::{JsonCompleter as RustJsonCompleter, ParsingState};

/// Complete a truncated JSON string in one shot.
///
/// This is a convenience function for one-time JSON completion without maintaining state.
/// For processing multiple chunks of streaming JSON, use the JsonCompleter class instead.
///
/// Args:
///     partial_json (str): The truncated or partial JSON string to complete
///
/// Returns:
///     str: A valid, completed JSON string
///
/// Examples:
///     >>> import json_completer
///     >>> json_completer.complete('{"name": "Alice", "age":')
///     '{"name": "Alice", "age":null}'
///     >>> json_completer.complete('{"message": "Hello wo')
///     '{"message": "Hello wo"}'
///     >>> json_completer.complete('[1, 2, 3')
///     '[1, 2, 3]'
#[pyfunction]
fn complete(partial_json: &str) -> PyResult<String> {
    Ok(RustJsonCompleter::complete(partial_json))
}

/// A stateful JSON completer for incremental/streaming processing.
///
/// This class maintains parsing state between calls, making it efficient for processing
/// JSON that arrives in chunks (e.g., streaming from an API or LLM). Each call to
/// complete_incremental() only processes new data since the last call, achieving O(n)
/// complexity where n is the size of new data, not the total JSON size.
///
/// Examples:
///     >>> import json_completer
///     >>> completer = json_completer.JsonCompleter()
///     >>> result1 = completer.complete_incremental('{"users": [{"name": "')
///     >>> print(result1)
///     '{"users": [{"name": ""}]}'
///     >>> result2 = completer.complete_incremental('{"users": [{"name": "Alice"}')
///     >>> print(result2)
///     '{"users": [{"name": "Alice"}]}'
#[pyclass]
struct JsonCompleter {
    inner: RustJsonCompleter,
}

#[pymethods]
impl JsonCompleter {
    /// Create a new JsonCompleter instance.
    ///
    /// Returns:
    ///     JsonCompleter: A new instance ready for incremental processing
    #[new]
    fn new() -> Self {
        JsonCompleter {
            inner: RustJsonCompleter::new(),
        }
    }

    /// Complete a partial JSON string incrementally.
    ///
    /// This method maintains internal state to avoid reprocessing previously seen data.
    /// Each call should receive the full accumulated JSON so far (not just new chunks).
    ///
    /// Args:
    ///     partial_json (str): The current accumulated partial JSON string
    ///
    /// Returns:
    ///     str: A valid, completed JSON string
    ///
    /// Examples:
    ///     >>> completer = JsonCompleter()
    ///     >>> result = completer.complete_incremental('{"key": "val')
    ///     >>> print(result)
    ///     '{"key": "val"}'
    fn complete_incremental(&mut self, partial_json: &str) -> PyResult<String> {
        Ok(self.inner.complete_incremental(partial_json))
    }

    /// Get the current parsing state as a JSON string.
    ///
    /// This allows you to serialize the completer's state for storage or transmission,
    /// then restore it later with from_state(). Useful for checkpoint/resume scenarios.
    ///
    /// Returns:
    ///     str: JSON-serialized parsing state
    ///
    /// Raises:
    ///     ValueError: If state serialization fails
    ///
    /// Examples:
    ///     >>> completer = JsonCompleter()
    ///     >>> completer.complete_incremental('{"key": "val')
    ///     >>> state = completer.get_state()
    ///     >>> # Later...
    ///     >>> completer2 = JsonCompleter.from_state(state)
    fn get_state(&self) -> PyResult<String> {
        serde_json::to_string(self.inner.get_state())
            .map_err(|e| PyValueError::new_err(format!("Failed to serialize state: {}", e)))
    }

    /// Create a JsonCompleter from a previously saved state.
    ///
    /// This class method allows you to restore a JsonCompleter from a state string
    /// obtained via get_state(). Useful for resuming processing after a pause or
    /// transferring state between processes.
    ///
    /// Args:
    ///     state (str): JSON-serialized parsing state from get_state()
    ///
    /// Returns:
    ///     JsonCompleter: A new instance with the restored state
    ///
    /// Raises:
    ///     ValueError: If state deserialization fails
    ///
    /// Examples:
    ///     >>> state = completer.get_state()
    ///     >>> completer2 = JsonCompleter.from_state(state)
    ///     >>> # completer2 continues where completer left off
    #[classmethod]
    fn from_state(_cls: &Bound<'_, PyType>, state: &str) -> PyResult<Self> {
        let parsing_state: ParsingState = serde_json::from_str(state)
            .map_err(|e| PyValueError::new_err(format!("Failed to deserialize state: {}", e)))?;

        Ok(JsonCompleter {
            inner: RustJsonCompleter::with_state(parsing_state),
        })
    }

    /// Reset the parsing state to start fresh.
    ///
    /// This clears all internal state, making the completer ready to process
    /// a new JSON document from scratch.
    ///
    /// Examples:
    ///     >>> completer = JsonCompleter()
    ///     >>> completer.complete_incremental('{"key": "val')
    ///     >>> completer.reset()
    ///     >>> # Now ready for a new document
    fn reset(&mut self) -> PyResult<()> {
        self.inner.reset();
        Ok(())
    }

    fn __repr__(&self) -> String {
        "JsonCompleter()".to_string()
    }

    fn __str__(&self) -> String {
        "JsonCompleter(state=...)".to_string()
    }
}

/// Python bindings for json_completer - Complete truncated JSON strings.
///
/// This module provides high-performance JSON completion with support for both
/// one-shot and incremental/streaming processing. It's particularly useful for:
///
/// - Streaming JSON from LLMs (OpenAI, Claude) with real-time UI updates
/// - Handling truncated API responses due to size limits
/// - Processing large JSON efficiently as it arrives over the network
///
/// The implementation is written in Rust for maximum performance, achieving
/// 10-50x speedup over naive Python approaches for large/streaming JSON.
#[pymodule]
fn json_completer(m: &Bound<'_, PyModule>) -> PyResult<()> {
    m.add_function(wrap_pyfunction!(complete, m)?)?;
    m.add_class::<JsonCompleter>()?;
    Ok(())
}
