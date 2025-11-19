"""
Example: Streaming LLM Response Completion

This example demonstrates how to use json_completer with a streaming LLM API
(like OpenAI's GPT models) to get valid JSON at any point during the stream.
"""

import json_completer
import time


def simulate_streaming_llm_response():
    """
    Simulates a streaming LLM API that returns JSON in chunks.

    In a real application, you would use:
    - OpenAI's streaming API
    - Anthropic Claude's streaming API
    - Other LLM providers with streaming support
    """
    # Simulate chunks arriving over time
    chunks = [
        '{"',
        'response',
        '": "',
        'Hello',
        ' ',
        'world',
        '!',
        '", "',
        'tokens',
        '": ',
        '42',
        ', "',
        'finish_reason',
        '": "',
        'stop',
        '"',
        '}',
    ]

    for chunk in chunks:
        time.sleep(0.1)  # Simulate network delay
        yield chunk


def main():
    """Main example function."""
    print("Streaming LLM Response Completion Example")
    print("=" * 50)
    print()

    # Create a completer instance for incremental processing
    completer = json_completer.JsonCompleter()

    # Accumulate the full response
    accumulated = ""

    print("Simulating streaming response from LLM...")
    print()

    for i, chunk in enumerate(simulate_streaming_llm_response(), 1):
        # Add new chunk to accumulated data
        accumulated += chunk

        # Complete the JSON to get a valid snapshot
        completed_json = completer.complete_incremental(accumulated)

        # Parse to demonstrate it's valid JSON
        try:
            parsed = json.loads(completed_json)
            print(f"Chunk {i:2d}: {chunk!r:20s} -> Response: {parsed.get('response', 'N/A')!r}")
        except json.JSONDecodeError as e:
            print(f"Chunk {i:2d}: {chunk!r:20s} -> ERROR: {e}")

    print()
    print("Final completed JSON:")
    print(json.dumps(json.loads(completed_json), indent=2))
    print()
    print("✓ All intermediate states were valid JSON!")


if __name__ == "__main__":
    main()
