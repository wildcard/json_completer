"""
Example: State Persistence and Restoration

This example demonstrates how to save and restore completer state,
useful for:
- Long-running streaming sessions with checkpoints
- Distributed processing across multiple workers
- Crash recovery scenarios
- Transferring state between processes
"""

import json
import json_completer
import tempfile
import os


def process_with_checkpoints():
    """
    Demonstrates saving state to disk for checkpoint/resume scenarios.
    """
    print("State Persistence Example")
    print("=" * 50)
    print()

    # Simulate processing chunks with checkpoints
    chunks = [
        '{"stream_data": [',
        '{"stream_data": [{"id": 1, "value": "first"}',
        '{"stream_data": [{"id": 1, "value": "first"}, {"id": 2, "value": "second"}',
    ]

    completer = json_completer.JsonCompleter()

    with tempfile.TemporaryDirectory() as tmpdir:
        state_file = os.path.join(tmpdir, "completer_state.json")

        for i, chunk in enumerate(chunks, 1):
            print(f"Processing chunk {i}...")
            result = completer.complete_incremental(chunk)

            # Save state after each chunk
            state = completer.get_state()
            with open(state_file, 'w') as f:
                f.write(state)

            print(f"  Result: {result}")
            print(f"  State saved to: {state_file}")
            print()

            # Simulate crash and recovery
            if i == 2:
                print("⚠️  Simulating crash... Recovering from saved state!")
                print()

                # Load state from file
                with open(state_file, 'r') as f:
                    saved_state = f.read()

                # Create new completer from saved state
                completer = json_completer.JsonCompleter.from_state(saved_state)
                print("✓ State restored successfully")
                print()


def transfer_state_between_processes():
    """
    Demonstrates transferring state between different completer instances
    (simulating different processes or workers).
    """
    print("State Transfer Between Processes")
    print("=" * 50)
    print()

    # Process 1: Start processing
    print("Process 1: Starting to process stream...")
    completer1 = json_completer.JsonCompleter()
    result1 = completer1.complete_incremental('{"large_dataset": [{"id": 1}')
    print(f"  Result: {result1}")

    # Serialize state
    state = completer1.get_state()
    print(f"  State serialized: {len(state)} bytes")
    print()

    # In a real scenario, you would:
    # - Send state over network (Redis, RabbitMQ, etc.)
    # - Store in database
    # - Save to shared filesystem

    # Process 2: Continue processing with transferred state
    print("Process 2: Continuing with transferred state...")
    completer2 = json_completer.JsonCompleter.from_state(state)
    result2 = completer2.complete_incremental(
        '{"large_dataset": [{"id": 1}, {"id": 2}]}'
    )
    print(f"  Result: {result2}")
    print()

    parsed = json.loads(result2)
    print(f"✓ Successfully transferred state and continued processing")
    print(f"  Final dataset has {len(parsed['large_dataset'])} items")


def demonstrate_state_inspection():
    """
    Shows how to inspect the saved state structure.
    """
    print()
    print("State Structure Inspection")
    print("=" * 50)
    print()

    completer = json_completer.JsonCompleter()
    completer.complete_incremental('{"processing": {"status": "in_progress", "items": [1, 2')

    state = completer.get_state()
    state_dict = json.loads(state)

    print("State contains:")
    for key in state_dict.keys():
        value = state_dict[key]
        if isinstance(value, list):
            print(f"  - {key}: list with {len(value)} items")
        elif isinstance(value, (int, str)):
            print(f"  - {key}: {type(value).__name__} = {value}")
        else:
            print(f"  - {key}: {type(value).__name__}")

    print()
    print("Full state structure:")
    print(json.dumps(state_dict, indent=2))


def main():
    """Main example function."""
    process_with_checkpoints()
    print()
    print()
    transfer_state_between_processes()
    print()
    demonstrate_state_inspection()


if __name__ == "__main__":
    main()
