"""
Type stubs for json_completer.

This module provides type hints for the json_completer package.
"""

from typing import ClassVar, final

def complete(partial_json: str) -> str:
    """
    Complete a truncated JSON string in one shot.

    This is a convenience function for one-time JSON completion without maintaining state.
    For processing multiple chunks of streaming JSON, use the JsonCompleter class instead.

    Args:
        partial_json: The truncated or partial JSON string to complete

    Returns:
        A valid, completed JSON string

    Examples:
        >>> import json_completer
        >>> json_completer.complete('{"name": "Alice", "age":')
        '{"name": "Alice", "age":null}'
        >>> json_completer.complete('{"message": "Hello wo')
        '{"message": "Hello wo"}'
        >>> json_completer.complete('[1, 2, 3')
        '[1, 2, 3]'
    """
    ...

@final
class JsonCompleter:
    """
    A stateful JSON completer for incremental/streaming processing.

    This class maintains parsing state between calls, making it efficient for processing
    JSON that arrives in chunks (e.g., streaming from an API or LLM). Each call to
    complete_incremental() only processes new data since the last call, achieving O(n)
    complexity where n is the size of new data, not the total JSON size.

    Examples:
        >>> import json_completer
        >>> completer = json_completer.JsonCompleter()
        >>> result1 = completer.complete_incremental('{"users": [{"name": "')
        >>> print(result1)
        '{"users": [{"name": ""}]}'
        >>> result2 = completer.complete_incremental('{"users": [{"name": "Alice"}')
        >>> print(result2)
        '{"users": [{"name": "Alice"}]}'
    """

    def __init__(self) -> None:
        """
        Create a new JsonCompleter instance.

        Returns:
            A new JsonCompleter instance ready for incremental processing
        """
        ...

    def complete_incremental(self, partial_json: str) -> str:
        """
        Complete a partial JSON string incrementally.

        This method maintains internal state to avoid reprocessing previously seen data.
        Each call should receive the full accumulated JSON so far (not just new chunks).

        Args:
            partial_json: The current accumulated partial JSON string

        Returns:
            A valid, completed JSON string

        Examples:
            >>> completer = JsonCompleter()
            >>> result = completer.complete_incremental('{"key": "val')
            >>> print(result)
            '{"key": "val"}'
        """
        ...

    def get_state(self) -> str:
        """
        Get the current parsing state as a JSON string.

        This allows you to serialize the completer's state for storage or transmission,
        then restore it later with from_state(). Useful for checkpoint/resume scenarios.

        Returns:
            JSON-serialized parsing state

        Raises:
            ValueError: If state serialization fails

        Examples:
            >>> completer = JsonCompleter()
            >>> completer.complete_incremental('{"key": "val')
            >>> state = completer.get_state()
            >>> # Later...
            >>> completer2 = JsonCompleter.from_state(state)
        """
        ...

    @classmethod
    def from_state(cls, state: str) -> "JsonCompleter":
        """
        Create a JsonCompleter from a previously saved state.

        This class method allows you to restore a JsonCompleter from a state string
        obtained via get_state(). Useful for resuming processing after a pause or
        transferring state between processes.

        Args:
            state: JSON-serialized parsing state from get_state()

        Returns:
            A new JsonCompleter instance with the restored state

        Raises:
            ValueError: If state deserialization fails

        Examples:
            >>> state = completer.get_state()
            >>> completer2 = JsonCompleter.from_state(state)
            >>> # completer2 continues where completer left off
        """
        ...

    def reset(self) -> None:
        """
        Reset the parsing state to start fresh.

        This clears all internal state, making the completer ready to process
        a new JSON document from scratch.

        Examples:
            >>> completer = JsonCompleter()
            >>> completer.complete_incremental('{"key": "val')
            >>> completer.reset()
            >>> # Now ready for a new document
        """
        ...

    def __repr__(self) -> str: ...
    def __str__(self) -> str: ...

__all__ = ["complete", "JsonCompleter"]
