"""
Comprehensive tests for json_completer Python bindings.

Tests cover:
- One-shot completion
- Incremental/streaming processing
- State serialization/deserialization
- Various JSON structures (objects, arrays, nested)
- Edge cases and error handling
"""

import json
import pytest


def test_complete_empty_string():
    """Test completing an empty string."""
    import json_completer

    result = json_completer.complete("")
    assert result == ""


def test_complete_valid_primitives():
    """Test that valid primitives are returned unchanged."""
    import json_completer

    assert json_completer.complete("true") == "true"
    assert json_completer.complete("false") == "false"
    assert json_completer.complete("null") == "null"
    assert json_completer.complete("42") == "42"
    assert json_completer.complete('"hello"') == '"hello"'


def test_complete_incomplete_string():
    """Test completing incomplete strings."""
    import json_completer

    result = json_completer.complete('"foo')
    assert result == '"foo"'

    result = json_completer.complete('"hello world')
    assert result == '"hello world"'


def test_complete_incomplete_number():
    """Test completing incomplete numbers."""
    import json_completer

    assert json_completer.complete("2.") == "2.0"
    assert json_completer.complete("2e") == "2e0"
    assert json_completer.complete("2.5e") == "2.5e0"


def test_complete_incomplete_keywords():
    """Test completing incomplete boolean and null keywords."""
    import json_completer

    assert json_completer.complete("tru") == "true"
    assert json_completer.complete("fal") == "false"
    assert json_completer.complete("nul") == "null"


def test_complete_unclosed_object():
    """Test completing unclosed objects."""
    import json_completer

    result = json_completer.complete('{"foo"')
    assert result == '{"foo":null}'

    result = json_completer.complete('{"foo":')
    assert result == '{"foo":null}'

    result = json_completer.complete('{"foo":"')
    assert result == '{"foo":""}'

    result = json_completer.complete('{"foo":"bar"')
    assert result == '{"foo":"bar"}'


def test_complete_unclosed_array():
    """Test completing unclosed arrays."""
    import json_completer

    result = json_completer.complete("[1,2,3")
    assert result == "[1,2,3]"

    result = json_completer.complete("[1,2,")
    assert result == "[1,2,null]"


def test_complete_nested_structures():
    """Test completing nested objects and arrays."""
    import json_completer

    result = json_completer.complete('{"users": [{"name": "Alice"')
    assert result == '{"users": [{"name": "Alice"}]}'

    result = json_completer.complete('[{"key": "value"}, {"another":')
    assert result == '[{"key": "value"}, {"another":null}]'


def test_incremental_processing():
    """Test incremental JSON processing."""
    import json_completer

    completer = json_completer.JsonCompleter()

    result1 = completer.complete_incremental('{"users": [{"name": "')
    assert result1 == '{"users": [{"name": ""}]}'

    result2 = completer.complete_incremental('{"users": [{"name": "Alice"}')
    assert result2 == '{"users": [{"name": "Alice"}]}'

    result3 = completer.complete_incremental(
        '{"users": [{"name": "Alice"}, {"name": "Bob"}]}'
    )
    assert result3 == '{"users": [{"name": "Alice"}, {"name": "Bob"}]}'


def test_incremental_with_reset():
    """Test that reset clears state for new document."""
    import json_completer

    completer = json_completer.JsonCompleter()

    # Process first document
    result1 = completer.complete_incremental('{"key": "value1')
    assert result1 == '{"key": "value1"}'

    # Reset and start new document
    completer.reset()

    # Process second document
    result2 = completer.complete_incremental('{"different": "value2')
    assert result2 == '{"different": "value2"}'


def test_state_serialization():
    """Test get_state and from_state for state persistence."""
    import json_completer

    # Create completer and process some data
    completer1 = json_completer.JsonCompleter()
    result1 = completer1.complete_incremental('{"users": [{"name": "Alice"}')

    # Save state
    state = completer1.get_state()
    assert isinstance(state, str)
    assert len(state) > 0

    # Verify state is valid JSON
    state_dict = json.loads(state)
    assert "output_tokens" in state_dict
    assert "context_stack" in state_dict

    # Restore state in new completer
    completer2 = json_completer.JsonCompleter.from_state(state)

    # Continue processing from where we left off
    result2 = completer2.complete_incremental(
        '{"users": [{"name": "Alice"}, {"name": "Bob"}]}'
    )
    assert result2 == '{"users": [{"name": "Alice"}, {"name": "Bob"}]}'


def test_state_serialization_with_incomplete_string():
    """Test state serialization when in the middle of parsing a string."""
    import json_completer

    completer1 = json_completer.JsonCompleter()
    result1 = completer1.complete_incremental('{"message": "This is a long')

    state = completer1.get_state()
    completer2 = json_completer.JsonCompleter.from_state(state)

    result2 = completer2.complete_incremental('{"message": "This is a long message"}')
    assert result2 == '{"message": "This is a long message"}'


def test_from_state_invalid_json():
    """Test that from_state raises ValueError for invalid state JSON."""
    import json_completer

    with pytest.raises(ValueError, match="Failed to deserialize state"):
        json_completer.JsonCompleter.from_state("not valid json")


def test_complete_with_escape_sequences():
    """Test completing strings with escape sequences."""
    import json_completer

    # String with newline escape
    result = json_completer.complete(r'{"text": "line1\nline2')
    assert result == r'{"text": "line1\nline2"}'

    # String with quote escape
    result = json_completer.complete(r'{"text": "say \"hello')
    assert result == r'{"text": "say \"hello"}'


def test_complete_with_unicode_escapes():
    """Test completing strings with unicode escape sequences."""
    import json_completer

    # Complete unicode escape
    result = json_completer.complete(r'{"text": "\u0041BC')
    assert result == r'{"text": "\u0041BC"}'

    # Incomplete unicode escape (should be removed)
    result = json_completer.complete(r'{"text": "test\u00')
    assert result == r'{"text": "test"}'


def test_complete_complex_nested_json():
    """Test completing complex nested JSON structures."""
    import json_completer

    partial = '''{
        "data": {
            "users": [
                {"id": 1, "name": "Alice", "email": "alice@example.com"},
                {"id": 2, "name": "Bob", "email": "bob@'''

    result = json_completer.complete(partial)

    # Should be valid JSON
    parsed = json.loads(result)
    assert "data" in parsed
    assert "users" in parsed["data"]
    assert len(parsed["data"]["users"]) == 2
    assert parsed["data"]["users"][1]["name"] == "Bob"


def test_complete_array_of_primitives():
    """Test completing arrays with various primitive types."""
    import json_completer

    result = json_completer.complete("[1, 2, 3, true, false, null")
    assert result == "[1, 2, 3, true, false, null]"

    result = json_completer.complete('["a", "b", "c')
    assert result == '["a", "b", "c"]'


def test_complete_mixed_types():
    """Test completing JSON with mixed types."""
    import json_completer

    result = json_completer.complete('{"num": 42, "str": "text", "bool": true, "arr": [1,2')
    parsed = json.loads(result)
    assert parsed["num"] == 42
    assert parsed["str"] == "text"
    assert parsed["bool"] is True
    assert parsed["arr"] == [1, 2]


def test_complete_with_whitespace():
    """Test that whitespace is preserved."""
    import json_completer

    result = json_completer.complete('{\n  "key": "value"\n')
    assert "\n" in result
    parsed = json.loads(result)
    assert parsed["key"] == "value"


def test_incremental_no_change():
    """Test that passing the same input twice returns consistent result."""
    import json_completer

    completer = json_completer.JsonCompleter()

    result1 = completer.complete_incremental('{"key": "value')
    result2 = completer.complete_incremental('{"key": "value')

    assert result1 == result2
    assert result1 == '{"key": "value"}'


def test_incremental_truncation_detection():
    """Test that completer detects when input is truncated and resets."""
    import json_completer

    completer = json_completer.JsonCompleter()

    # Process long input
    result1 = completer.complete_incremental('{"key": "long value"}')
    assert result1 == '{"key": "long value"}'

    # Pass shorter input (simulating truncation)
    result2 = completer.complete_incremental('{"new":')
    assert result2 == '{"new":null}'


def test_repr_and_str():
    """Test __repr__ and __str__ methods."""
    import json_completer

    completer = json_completer.JsonCompleter()

    repr_str = repr(completer)
    assert "JsonCompleter" in repr_str

    str_str = str(completer)
    assert "JsonCompleter" in str_str


def test_multiple_completers_independent():
    """Test that multiple completer instances maintain independent state."""
    import json_completer

    completer1 = json_completer.JsonCompleter()
    completer2 = json_completer.JsonCompleter()

    result1 = completer1.complete_incremental('{"key1": "value1')
    result2 = completer2.complete_incremental('{"key2": "value2')

    assert result1 == '{"key1": "value1"}'
    assert result2 == '{"key2": "value2"}'


def test_complete_negative_numbers():
    """Test completing negative numbers."""
    import json_completer

    assert json_completer.complete("-123") == "-123"
    assert json_completer.complete("-123.") == "-123.0"
    assert json_completer.complete("-") == "0"
    assert json_completer.complete("-.") == "-0.0"


def test_complete_decimal_numbers():
    """Test completing decimal numbers."""
    import json_completer

    assert json_completer.complete(".5") == "0.5"
    assert json_completer.complete("123.45") == "123.45"
    assert json_completer.complete("0.") == "0.0"


def test_complete_exponential_numbers():
    """Test completing exponential notation numbers."""
    import json_completer

    assert json_completer.complete("1e") == "1e0"
    assert json_completer.complete("1e+") == "1e+0"
    assert json_completer.complete("1e-") == "1e-0"
    assert json_completer.complete("1.5e") == "1.5e0"
    assert json_completer.complete("1.5e+2") == "1.5e+2"


def test_streaming_use_case():
    """Test realistic streaming scenario like LLM API."""
    import json_completer

    completer = json_completer.JsonCompleter()

    # Simulate chunks arriving from streaming API
    chunks = [
        '{"response": "',
        '{"response": "Hello',
        '{"response": "Hello world',
        '{"response": "Hello world",',
        '{"response": "Hello world", "tokens": 5',
        '{"response": "Hello world", "tokens": 5}',
    ]

    results = []
    for chunk in chunks:
        result = completer.complete_incremental(chunk)
        results.append(result)
        # Each result should be valid JSON
        parsed = json.loads(result)
        assert "response" in parsed

    # Final result should match input
    assert results[-1] == '{"response": "Hello world", "tokens": 5}'


def test_complete_only_comma():
    """Test edge case of only a comma."""
    import json_completer

    result = json_completer.complete(",")
    assert result == "null"


def test_complete_only_colon():
    """Test edge case of only a colon."""
    import json_completer

    result = json_completer.complete(":")
    assert result == "null"


def test_deeply_nested_structure():
    """Test completing deeply nested JSON."""
    import json_completer

    partial = '{"a":{"b":{"c":{"d":{"e":'
    result = json_completer.complete(partial)

    parsed = json.loads(result)
    assert parsed["a"]["b"]["c"]["d"]["e"] is None


def test_array_with_nested_objects():
    """Test array containing nested objects."""
    import json_completer

    partial = '[{"name":"Alice","meta":{"age":30}},{"name":"Bob","meta":{"age":'
    result = json_completer.complete(partial)

    parsed = json.loads(result)
    assert len(parsed) == 2
    assert parsed[0]["name"] == "Alice"
    assert parsed[0]["meta"]["age"] == 30
    assert parsed[1]["name"] == "Bob"


def test_type_annotations_work():
    """Test that type annotations are recognized (for type checkers)."""
    import json_completer

    # These should not raise type errors in mypy/pyright
    completer: json_completer.JsonCompleter = json_completer.JsonCompleter()
    result: str = completer.complete_incremental('{"test": "value"}')
    state: str = completer.get_state()
    restored: json_completer.JsonCompleter = json_completer.JsonCompleter.from_state(state)

    assert isinstance(result, str)
    assert isinstance(state, str)
    assert isinstance(restored, json_completer.JsonCompleter)


def test_module_exports():
    """Test that the module exports the expected names."""
    import json_completer

    assert hasattr(json_completer, "complete")
    assert hasattr(json_completer, "JsonCompleter")
    assert callable(json_completer.complete)
    assert callable(json_completer.JsonCompleter)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
