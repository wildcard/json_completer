//! JsonCompleter - A library for completing partial/truncated JSON strings into valid JSON.
//!
//! This library handles incomplete primitives, missing values, and unclosed structures.
//! It supports both one-shot completion and incremental/streaming processing for efficient
//! handling of JSON data as it arrives in chunks.
//!
//! # Examples
//!
//! ## One-shot completion
//!
//! ```
//! use json_completer::JsonCompleter;
//!
//! let result = JsonCompleter::complete(r#"{"name": "John", "age":"#);
//! assert_eq!(result, r#"{"name": "John", "age":null}"#);
//! ```
//!
//! ## Incremental/streaming processing
//!
//! ```
//! use json_completer::JsonCompleter;
//!
//! let mut completer = JsonCompleter::new();
//!
//! let result1 = completer.complete_incremental(r#"{"users": [{"name": ""#);
//! assert_eq!(result1, r#"{"users": [{"name": ""}]}"#);
//!
//! let result2 = completer.complete_incremental(r#"{"users": [{"name": "Alice"}"#);
//! assert_eq!(result2, r#"{"users": [{"name": "Alice"}]}"#);
//! ```

use serde::{Deserialize, Serialize};

// Export WASM bindings when the wasm feature is enabled
#[cfg(feature = "wasm")]
pub mod wasm;

/// Context type for tracking nested structures
#[derive(Debug, Clone, PartialEq, Eq)]
enum Context {
    Object, // {
    Array,  // [
}

/// Escape sequence state for string parsing
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
enum EscapeState {
    Backslash,
    Unicode { hex: String },
}

/// Parsing state for incremental processing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsingState {
    output_tokens: Vec<String>,
    context_stack: Vec<String>, // Serialized as strings for JSON compatibility
    last_index: usize,
    input_length: usize,
    incomplete_string_start: Option<usize>,
    incomplete_string_buffer: Option<String>,
    incomplete_string_escape_state: Option<EscapeState>,
}

impl Default for ParsingState {
    fn default() -> Self {
        Self::new()
    }
}

impl ParsingState {
    pub fn new() -> Self {
        Self {
            output_tokens: Vec::new(),
            context_stack: Vec::new(),
            last_index: 0,
            input_length: 0,
            incomplete_string_start: None,
            incomplete_string_buffer: None,
            incomplete_string_escape_state: None,
        }
    }
}

/// Main JsonCompleter struct
pub struct JsonCompleter {
    state: ParsingState,
}

impl Default for JsonCompleter {
    fn default() -> Self {
        Self::new()
    }
}

impl JsonCompleter {
    /// Creates a new JsonCompleter instance for incremental processing
    pub fn new() -> Self {
        Self {
            state: ParsingState::new(),
        }
    }

    /// Creates a JsonCompleter with existing state (for serialization/deserialization)
    pub fn with_state(state: ParsingState) -> Self {
        Self { state }
    }

    /// One-shot JSON completion (static method)
    pub fn complete(partial_json: &str) -> String {
        let mut completer = Self::new();
        completer.complete_incremental(partial_json)
    }

    /// Incrementally completes JSON using previous parsing state to avoid reprocessing
    pub fn complete_incremental(&mut self, partial_json: &str) -> String {
        let input = partial_json;

        // Fresh start or input was truncated - start over
        if self.state.input_length > input.len() {
            self.state = ParsingState::new();
        }

        if input.is_empty() {
            return input.to_string();
        }

        if is_valid_json_primitive_or_document(input) {
            return input.to_string();
        }

        // If input hasn't grown since last time, just return completed version of existing state
        if self.state.input_length == input.len() && !self.state.output_tokens.is_empty() {
            let context_stack: Vec<Context> = self
                .state
                .context_stack
                .iter()
                .map(|s| if s == "{" { Context::Object } else { Context::Array })
                .collect();
            return finalize_completion(
                &self.state.output_tokens.clone(),
                &context_stack,
                &None,
            );
        }

        // Clone state for processing
        let mut output_tokens = self.state.output_tokens.clone();
        let mut context_stack: Vec<Context> = self
            .state
            .context_stack
            .iter()
            .map(|s| if s == "{" { Context::Object } else { Context::Array })
            .collect();
        let mut index = self.state.last_index;
        let length = input.len();
        let mut incomplete_string_start = None;
        let mut incomplete_string_buffer = None;
        let mut incomplete_string_escape_state = None;

        // If we had an incomplete string, continue from where we left off
        if self.state.incomplete_string_start.is_some() {
            incomplete_string_start = self.state.incomplete_string_start;
            incomplete_string_buffer = self.state.incomplete_string_buffer.clone();
            if incomplete_string_buffer.is_none() {
                incomplete_string_buffer = Some("\"".to_string());
            }
            incomplete_string_escape_state = self.state.incomplete_string_escape_state.clone();

            // Remove the auto-completed string from output_tokens since we'll add the real one
            if let Some(last) = output_tokens.last() {
                if last.starts_with('"') && last.ends_with('"') {
                    output_tokens.pop();
                }
            }
        }

        let input_bytes = input.as_bytes();

        // Process from the current index
        while index < length {
            // Special case: continuing an incomplete string
            if incomplete_string_buffer.is_some() && index == self.state.last_index {
                let (str_value, new_index, terminated, new_buffer, new_escape_state) =
                    continue_parsing_string(
                        input,
                        &incomplete_string_buffer.clone().unwrap(),
                        &incomplete_string_escape_state,
                        self.state.last_index,
                    );

                if terminated {
                    output_tokens.push(str_value);
                    incomplete_string_start = None;
                    incomplete_string_buffer = None;
                    incomplete_string_escape_state = None;
                    index = new_index;
                } else {
                    incomplete_string_buffer = Some(new_buffer);
                    incomplete_string_escape_state = new_escape_state;
                    index = length;
                }
                continue;
            }

            let ch = input_bytes[index] as char;
            let last_significant_char = get_last_significant_char(&output_tokens);

            match ch {
                '{' => {
                    ensure_comma_before_new_item(
                        &mut output_tokens,
                        &context_stack,
                        last_significant_char,
                    );
                    ensure_colon_if_value_expected(
                        &mut output_tokens,
                        &context_stack,
                        last_significant_char,
                    );
                    output_tokens.push(ch.to_string());
                    context_stack.push(Context::Object);
                    index += 1;
                }
                '[' => {
                    ensure_comma_before_new_item(
                        &mut output_tokens,
                        &context_stack,
                        last_significant_char,
                    );
                    ensure_colon_if_value_expected(
                        &mut output_tokens,
                        &context_stack,
                        last_significant_char,
                    );
                    output_tokens.push(ch.to_string());
                    context_stack.push(Context::Array);
                    index += 1;
                }
                '}' => {
                    remove_trailing_comma(&mut output_tokens);
                    output_tokens.push(ch.to_string());
                    if !context_stack.is_empty() && context_stack.last() == Some(&Context::Object) {
                        context_stack.pop();
                    }
                    index += 1;
                }
                ']' => {
                    output_tokens.push(ch.to_string());
                    if !context_stack.is_empty() && context_stack.last() == Some(&Context::Array) {
                        context_stack.pop();
                    }
                    index += 1;
                }
                '"' => {
                    ensure_comma_before_new_item(
                        &mut output_tokens,
                        &context_stack,
                        last_significant_char,
                    );
                    ensure_colon_if_value_expected(
                        &mut output_tokens,
                        &context_stack,
                        last_significant_char,
                    );

                    let string_start_index = index;
                    let (str_value, consumed, terminated, new_buffer, new_escape_state) =
                        parse_string_with_state(input, index);

                    if terminated {
                        output_tokens.push(str_value);
                        incomplete_string_start = None;
                        incomplete_string_buffer = None;
                        incomplete_string_escape_state = None;
                    } else {
                        incomplete_string_start = Some(string_start_index);
                        incomplete_string_buffer = Some(new_buffer);
                        incomplete_string_escape_state = new_escape_state;
                    }
                    index += consumed;
                }
                ':' => {
                    if last_significant_char == Some(',') {
                        remove_trailing_comma(&mut output_tokens);
                    }
                    output_tokens.push(ch.to_string());
                    index += 1;
                }
                ',' => {
                    remove_trailing_comma(&mut output_tokens);
                    output_tokens.push(ch.to_string());
                    index += 1;
                }
                't' | 'f' | 'n' => {
                    ensure_comma_before_new_item(
                        &mut output_tokens,
                        &context_stack,
                        last_significant_char,
                    );
                    ensure_colon_if_value_expected(
                        &mut output_tokens,
                        &context_stack,
                        last_significant_char,
                    );

                    let target_keyword = match ch {
                        't' => "true",
                        'f' => "false",
                        'n' => "null",
                        _ => unreachable!(),
                    };
                    let (keyword_val, consumed) =
                        consume_and_complete_keyword(input, index, target_keyword);
                    output_tokens.push(keyword_val);
                    index += consumed;
                }
                '-' | '0'..='9' => {
                    ensure_comma_before_new_item(
                        &mut output_tokens,
                        &context_stack,
                        last_significant_char,
                    );
                    ensure_colon_if_value_expected(
                        &mut output_tokens,
                        &context_stack,
                        last_significant_char,
                    );

                    let (num_str, consumed) = parse_number(input, index);
                    output_tokens.push(num_str);
                    index += consumed;
                }
                _ if ch.is_whitespace() => {
                    output_tokens.push(ch.to_string());
                    index += 1;
                }
                _ => {
                    // Skip unknown characters
                    index += 1;
                }
            }
        }

        // Update state
        let context_stack_strings: Vec<String> = context_stack
            .iter()
            .map(|ctx| match ctx {
                Context::Object => "{".to_string(),
                Context::Array => "[".to_string(),
            })
            .collect();

        self.state = ParsingState {
            output_tokens: output_tokens.clone(),
            context_stack: context_stack_strings,
            last_index: index,
            input_length: length,
            incomplete_string_start,
            incomplete_string_buffer: incomplete_string_buffer.clone(),
            incomplete_string_escape_state: incomplete_string_escape_state.clone(),
        };

        // Return completed JSON
        finalize_completion(&output_tokens, &context_stack, &incomplete_string_buffer)
    }

    /// Get the current parsing state (for serialization)
    pub fn get_state(&self) -> &ParsingState {
        &self.state
    }

    /// Reset the parsing state
    pub fn reset(&mut self) {
        self.state = ParsingState::new();
    }
}

// Helper functions

fn finalize_completion(
    output_tokens: &[String],
    context_stack: &[Context],
    incomplete_string_buffer: &Option<String>,
) -> String {
    let mut output_tokens = output_tokens.to_vec();
    let mut context_stack = context_stack.to_vec();

    // If we have an incomplete string buffer, add it with closing quote
    if let Some(buffer) = incomplete_string_buffer {
        let mut buffer_str = buffer.clone();

        // Count consecutive trailing backslashes
        let trailing_backslashes = buffer_str
            .chars()
            .rev()
            .take_while(|&c| c == '\\')
            .count();

        // If odd number of trailing backslashes, remove the last one (incomplete escape)
        if trailing_backslashes % 2 == 1 {
            buffer_str.pop();
        }

        // Check for incomplete unicode escape after handling backslashes
        if let Some(pos) = buffer_str.rfind("\\u") {
            let after_u = &buffer_str[pos + 2..];
            if after_u.len() < 4 && after_u.chars().all(|c| c.is_ascii_hexdigit()) {
                buffer_str.truncate(pos);
            }
        }

        // Always add closing quote for incomplete strings
        buffer_str.push('"');
        output_tokens.push(buffer_str);
    }

    // Post-loop cleanup and final completions
    let last_sig_char_final = get_last_significant_char(&output_tokens);

    // If the last significant character suggests an incomplete structure
    if !context_stack.is_empty() {
        let current_ctx = context_stack.last().unwrap();
        match current_ctx {
            Context::Object => {
                if last_sig_char_final == Some('"') {
                    // Check if this is a key (not a value)
                    let prev_sig_char = get_previous_significant_char(&output_tokens);
                    if prev_sig_char == Some('{') || prev_sig_char == Some(',') {
                        output_tokens.push(":".to_string());
                        output_tokens.push("null".to_string());
                    }
                } else if last_sig_char_final == Some(':') {
                    output_tokens.push("null".to_string());
                }
            }
            Context::Array => {
                if last_sig_char_final == Some(',') {
                    output_tokens.push("null".to_string());
                }
            }
        }
    }

    // Close any remaining open structures
    while !context_stack.is_empty() {
        let opener = context_stack.pop().unwrap();
        remove_trailing_comma(&mut output_tokens);
        match opener {
            Context::Object => output_tokens.push("}".to_string()),
            Context::Array => output_tokens.push("]".to_string()),
        }
    }

    let reassembled_json = output_tokens.join("");

    // Final check: if the reassembled JSON is just a standalone comma or colon, it's invalid
    let trimmed = reassembled_json.trim();
    if trimmed == "," || trimmed == ":" {
        return "null".to_string();
    }

    reassembled_json
}

fn parse_string_with_state(
    input: &str,
    index: usize,
) -> (String, usize, bool, String, Option<EscapeState>) {
    let input_bytes = input.as_bytes();
    let start_index = index;
    let mut output_str = String::from("\"");
    let mut index = index + 1; // Skip opening quote
    let mut terminated = false;
    let mut escape_state: Option<EscapeState> = None;

    while index < input.len() {
        let ch = input_bytes[index] as char;

        match &escape_state {
            Some(EscapeState::Backslash) => {
                if ch == 'u' {
                    escape_state = Some(EscapeState::Unicode {
                        hex: String::new(),
                    });
                    output_str.push('u');
                    index += 1;
                } else {
                    output_str.push(ch);
                    index += 1;
                    escape_state = None;
                }
            }
            Some(EscapeState::Unicode { hex }) => {
                if ch.is_ascii_hexdigit() {
                    let mut new_hex = hex.clone();
                    new_hex.push(ch);
                    output_str.push(ch);
                    index += 1;
                    if new_hex.len() == 4 {
                        escape_state = None;
                    } else {
                        escape_state = Some(EscapeState::Unicode { hex: new_hex });
                    }
                } else {
                    // Invalid unicode escape - remove it
                    if let Some(pos) = output_str.rfind("\\u") {
                        output_str.truncate(pos);
                    }
                    output_str.push('"');
                    return (
                        output_str,
                        index - start_index,
                        false,
                        String::new(),
                        None,
                    );
                }
            }
            None => {
                if ch == '\\' {
                    output_str.push(ch);
                    escape_state = Some(EscapeState::Backslash);
                    index += 1;
                } else if ch == '"' {
                    output_str.push(ch);
                    terminated = true;
                    index += 1;
                    break;
                } else {
                    output_str.push(ch);
                    index += 1;
                }
            }
        }
    }

    if terminated {
        (output_str, index - start_index, true, String::new(), None)
    } else {
        (
            output_str.clone(),
            index - start_index,
            false,
            output_str,
            escape_state,
        )
    }
}

fn continue_parsing_string(
    input: &str,
    buffer: &str,
    escape_state: &Option<EscapeState>,
    last_index: usize,
) -> (String, usize, bool, String, Option<EscapeState>) {
    let input_bytes = input.as_bytes();
    let mut buffer = buffer.to_string();
    let mut index = last_index;
    let mut terminated = false;
    let mut escape_state = escape_state.clone();

    while index < input.len() {
        let ch = input_bytes[index] as char;

        match &escape_state {
            Some(EscapeState::Backslash) => {
                if ch == 'u' {
                    escape_state = Some(EscapeState::Unicode {
                        hex: String::new(),
                    });
                    buffer.push('u');
                    index += 1;
                } else {
                    buffer.push(ch);
                    index += 1;
                    escape_state = None;
                }
            }
            Some(EscapeState::Unicode { hex }) => {
                if ch.is_ascii_hexdigit() {
                    let mut new_hex = hex.clone();
                    new_hex.push(ch);
                    buffer.push(ch);
                    index += 1;
                    if new_hex.len() == 4 {
                        escape_state = None;
                    } else {
                        escape_state = Some(EscapeState::Unicode { hex: new_hex });
                    }
                } else {
                    // Invalid unicode escape - remove it
                    if let Some(pos) = buffer.rfind("\\u") {
                        buffer.truncate(pos);
                    }
                    buffer.push('"');
                    return (buffer, index, false, String::new(), None);
                }
            }
            None => {
                if ch == '\\' {
                    buffer.push(ch);
                    escape_state = Some(EscapeState::Backslash);
                    index += 1;
                } else if ch == '"' {
                    buffer.push(ch);
                    terminated = true;
                    index += 1;
                    break;
                } else {
                    buffer.push(ch);
                    index += 1;
                }
            }
        }
    }

    if terminated {
        (buffer, index, true, String::new(), None)
    } else {
        (buffer.clone(), index, false, buffer, escape_state)
    }
}

fn parse_number(input: &str, index: usize) -> (String, usize) {
    let input_bytes = input.as_bytes();
    let start_index = index;
    let mut num_str = String::new();
    let mut index = index;

    // Optional leading minus
    if index < input.len() && input_bytes[index] == b'-' {
        num_str.push('-');
        index += 1;
    }

    // Integer part
    let mut digits_before_dot = false;
    while index < input.len() && input_bytes[index].is_ascii_digit() {
        num_str.push(input_bytes[index] as char);
        index += 1;
        digits_before_dot = true;
    }

    // Decimal part
    let mut has_dot = false;
    if index < input.len() && input_bytes[index] == b'.' {
        has_dot = true;
        num_str.push('.');
        index += 1;
        let mut digits_after_dot = false;
        while index < input.len() && input_bytes[index].is_ascii_digit() {
            num_str.push(input_bytes[index] as char);
            index += 1;
            digits_after_dot = true;
        }
        if !digits_after_dot {
            num_str.push('0'); // Append '0' if it's just "X." or "."
        }
    }

    // Handle special cases
    if num_str == "." {
        num_str = "0.0".to_string();
    } else if num_str == "-." {
        num_str = "-0.0".to_string();
    } else if num_str == "-" {
        num_str = "0".to_string();
    } else if !digits_before_dot && has_dot {
        // e.g. ".5" -> "0.5"
        num_str = format!("0{}", num_str);
    }

    // Exponent part
    if index < input.len() && (input_bytes[index] == b'e' || input_bytes[index] == b'E') {
        // Check if there was a number before 'e'
        if num_str.is_empty() || num_str == "-" || num_str == "." || num_str == "-." {
            let result = if num_str == "-" {
                "0".to_string()
            } else if num_str.contains('.') {
                format!("{}0", num_str)
            } else {
                num_str
            };
            return (result, index - start_index);
        }

        num_str.push(input_bytes[index] as char);
        index += 1;

        if index < input.len() && (input_bytes[index] == b'+' || input_bytes[index] == b'-') {
            num_str.push(input_bytes[index] as char);
            index += 1;
        }

        let mut exponent_digits = false;
        while index < input.len() && input_bytes[index].is_ascii_digit() {
            num_str.push(input_bytes[index] as char);
            index += 1;
            exponent_digits = true;
        }

        if !exponent_digits {
            num_str.push('0');
        }
    }

    if num_str.is_empty() || num_str == "-" {
        return ("0".to_string(), index - start_index);
    }

    (num_str, index - start_index)
}

fn consume_and_complete_keyword(input: &str, index: usize, target_keyword: &str) -> (String, usize) {
    let input_bytes = input.as_bytes();
    let mut consumed_count = 0;

    for (k_idx, target_char) in target_keyword.chars().enumerate() {
        if index + k_idx >= input.len() {
            break;
        }

        let ch = (input_bytes[index + k_idx] as char).to_ascii_lowercase();
        if ch != target_char {
            break;
        }

        consumed_count += 1;
    }

    if consumed_count > 0 {
        (target_keyword.to_string(), consumed_count)
    } else {
        // Fallback - should not be reached
        (input_bytes[index].to_string(), 1)
    }
}

fn get_last_significant_char(output_tokens: &[String]) -> Option<char> {
    for token in output_tokens.iter().rev() {
        let trimmed = token.trim();
        if !trimmed.is_empty() {
            return trimmed.chars().last();
        }
    }
    None
}

fn get_previous_significant_char(output_tokens: &[String]) -> Option<char> {
    let mut significant_chars = Vec::new();
    for token in output_tokens.iter().rev() {
        let trimmed = token.trim();
        if !trimmed.is_empty() {
            if let Some(ch) = trimmed.chars().last() {
                significant_chars.push(ch);
                if significant_chars.len() >= 2 {
                    return Some(significant_chars[1]);
                }
            }
        }
    }
    None
}

fn ensure_comma_before_new_item(
    output_tokens: &mut Vec<String>,
    context_stack: &[Context],
    last_sig_char: Option<char>,
) {
    if output_tokens.is_empty() || context_stack.is_empty() || last_sig_char.is_none() {
        return;
    }

    let last_char = last_sig_char.unwrap();
    const STRUCTURE_CHARS: &[char] = &['[', '{', ',', ':'];

    // No comma needed right after an opener, a colon, or another comma
    if STRUCTURE_CHARS.contains(&last_char) {
        return;
    }

    // If last_sig_char indicates a completed value/key, add a comma if we are in an array or object
    let current_ctx = context_stack.last().unwrap();
    match current_ctx {
        Context::Array => {
            output_tokens.push(",".to_string());
        }
        Context::Object => {
            if last_char != ':' {
                output_tokens.push(",".to_string());
            }
        }
    }
}

fn ensure_colon_if_value_expected(
    output_tokens: &mut Vec<String>,
    context_stack: &[Context],
    last_sig_char: Option<char>,
) {
    if output_tokens.is_empty() || context_stack.is_empty() || last_sig_char.is_none() {
        return;
    }

    // In object, and last thing was a key (string)
    if let Some(Context::Object) = context_stack.last() {
        if last_sig_char == Some('"') {
            output_tokens.push(":".to_string());
        }
    }
}

fn remove_trailing_comma(output_tokens: &mut Vec<String>) {
    // Find the last non-whitespace token
    let mut last_token_idx = None;
    for (i, token) in output_tokens.iter().enumerate().rev() {
        if !token.trim().is_empty() {
            last_token_idx = Some(i);
            break;
        }
    }

    if let Some(idx) = last_token_idx {
        if output_tokens[idx].trim() == "," {
            output_tokens.remove(idx);
            // Also remove any whitespace tokens that were before this comma
            let mut remove_idx = idx;
            while remove_idx > 0 && output_tokens[remove_idx - 1].trim().is_empty() {
                output_tokens.remove(remove_idx - 1);
                remove_idx -= 1;
            }
        }
    }
}

fn is_valid_json_primitive_or_document(s: &str) -> bool {
    // Check for simple primitives
    if s == "true" || s == "false" || s == "null" {
        return true;
    }

    // Check for valid number
    if is_valid_number(s) {
        return true;
    }

    // Check for valid string literal
    if s.starts_with('"') && s.ends_with('"') && s.len() >= 2 {
        // Simple check - more complex validation would be needed for full correctness
        return true;
    }

    false
}

fn is_valid_number(s: &str) -> bool {
    if s.is_empty() {
        return false;
    }

    let mut chars = s.chars().peekable();

    // Optional minus
    if chars.peek() == Some(&'-') {
        chars.next();
    }

    // Integer part
    let mut has_digits = false;
    while let Some(&ch) = chars.peek() {
        if ch.is_ascii_digit() {
            chars.next();
            has_digits = true;
        } else {
            break;
        }
    }

    if !has_digits {
        return false;
    }

    // Optional decimal part
    if chars.peek() == Some(&'.') {
        chars.next();
        let mut has_decimal_digits = false;
        while let Some(&ch) = chars.peek() {
            if ch.is_ascii_digit() {
                chars.next();
                has_decimal_digits = true;
            } else {
                break;
            }
        }
        if !has_decimal_digits {
            return false;
        }
    }

    // Optional exponent part
    if let Some(&ch) = chars.peek() {
        if ch == 'e' || ch == 'E' {
            chars.next();
            if let Some(&sign) = chars.peek() {
                if sign == '+' || sign == '-' {
                    chars.next();
                }
            }
            let mut has_exp_digits = false;
            while let Some(&ch) = chars.peek() {
                if ch.is_ascii_digit() {
                    chars.next();
                    has_exp_digits = true;
                } else {
                    break;
                }
            }
            if !has_exp_digits {
                return false;
            }
        }
    }

    chars.peek().is_none()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_complete_empty_string() {
        assert_eq!(JsonCompleter::complete(""), "");
    }

    #[test]
    fn test_complete_valid_primitives() {
        assert_eq!(JsonCompleter::complete("true"), "true");
        assert_eq!(JsonCompleter::complete("false"), "false");
        assert_eq!(JsonCompleter::complete("null"), "null");
        assert_eq!(JsonCompleter::complete("42"), "42");
        assert_eq!(JsonCompleter::complete(r#""hello""#), r#""hello""#);
    }

    #[test]
    fn test_complete_incomplete_string() {
        assert_eq!(JsonCompleter::complete(r#""foo"#), r#""foo""#);
        assert_eq!(JsonCompleter::complete(r#""hello world"#), r#""hello world""#);
    }

    #[test]
    fn test_complete_incomplete_number() {
        assert_eq!(JsonCompleter::complete("2."), "2.0");
        assert_eq!(JsonCompleter::complete("2e"), "2e0");
        assert_eq!(JsonCompleter::complete("2.5e"), "2.5e0");
    }

    #[test]
    fn test_complete_incomplete_keywords() {
        assert_eq!(JsonCompleter::complete("tru"), "true");
        assert_eq!(JsonCompleter::complete("fal"), "false");
        assert_eq!(JsonCompleter::complete("nul"), "null");
    }

    #[test]
    fn test_complete_unclosed_structures() {
        assert_eq!(JsonCompleter::complete(r#"{"foo""#), r#"{"foo":null}"#);

        // Test incomplete string after colon
        let test_input = "{\"foo\":\"";
        let result = JsonCompleter::complete(test_input);
        if result != "{\"foo\":\"\"}" {
            eprintln!("FAILED: input={:?}, result={:?}, expected={:?}",
                test_input, result, "{\"foo\":\"\"}");
        }
        assert_eq!(result, "{\"foo\":\"\"}");

        assert_eq!(JsonCompleter::complete(r#"{"foo":"bar"#), r#"{"foo":"bar"}"#);
        assert_eq!(JsonCompleter::complete("[1,2,3"), "[1,2,3]");
    }

    #[test]
    fn test_incremental_processing() {
        let mut completer = JsonCompleter::new();

        let result1 = completer.complete_incremental(r#"{"users": [{"name": ""#);
        assert_eq!(result1, r#"{"users": [{"name": ""}]}"#);

        let result2 = completer.complete_incremental(r#"{"users": [{"name": "Alice"}"#);
        assert_eq!(result2, r#"{"users": [{"name": "Alice"}]}"#);

        let result3 = completer.complete_incremental(r#"{"users": [{"name": "Alice"}, {"name": "Bob"}]}"#);
        assert_eq!(result3, r#"{"users": [{"name": "Alice"}, {"name": "Bob"}]}"#);
    }
}
