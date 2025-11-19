"""
Example: Parsing Truncated JSON Logs

This example shows how to parse log files that may contain truncated JSON entries,
common in scenarios like:
- CloudWatch logs (1MB limit per entry)
- Application logs with size constraints
- Rotated log files cut mid-entry
"""

import json
import json_completer
from io import StringIO


def simulate_log_file_with_truncated_entries():
    """
    Simulates a log file with some complete and some truncated JSON entries.
    """
    log_entries = [
        # Complete entry
        '{"timestamp": "2024-01-15T10:00:00Z", "level": "INFO", "message": "User logged in", "user_id": 123}',

        # Truncated in the middle of a string
        '{"timestamp": "2024-01-15T10:01:00Z", "level": "ERROR", "message": "Database connection failed: timeout after',

        # Truncated with unclosed object
        '{"timestamp": "2024-01-15T10:02:00Z", "level": "INFO", "user": {"id": 456, "name": "Alice", "metadata": {"role": "admin"',

        # Complete entry
        '{"timestamp": "2024-01-15T10:03:00Z", "level": "WARN", "message": "High memory usage", "memory_mb": 1024}',

        # Truncated with incomplete array
        '{"timestamp": "2024-01-15T10:04:00Z", "level": "INFO", "events": [{"type": "click", "x": 100}, {"type": "scroll"',

        # Complete entry
        '{"timestamp": "2024-01-15T10:05:00Z", "level": "INFO", "message": "Request completed", "duration_ms": 45}',
    ]

    return log_entries


def parse_log_entry(line, line_number):
    """
    Parse a single log entry, handling truncation.
    """
    # Try to parse as-is first
    try:
        return json.loads(line), False
    except json.JSONDecodeError:
        # Entry is truncated, complete it
        completed = json_completer.complete(line)
        try:
            return json.loads(completed), True
        except json.JSONDecodeError as e:
            print(f"Warning: Line {line_number} could not be parsed: {e}")
            return None, True


def main():
    """Main example function."""
    print("Log Parsing Example - Handling Truncated JSON Entries")
    print("=" * 60)
    print()

    log_entries = simulate_log_file_with_truncated_entries()

    complete_count = 0
    truncated_count = 0
    failed_count = 0

    print("Processing log entries:")
    print("-" * 60)

    for i, line in enumerate(log_entries, 1):
        print(f"\nEntry {i}:")

        # Show first 80 chars of the raw entry
        display_line = line if len(line) <= 80 else line[:77] + "..."
        print(f"  Raw: {display_line}")

        # Parse the entry
        parsed, was_truncated = parse_log_entry(line, i)

        if parsed is None:
            failed_count += 1
            print("  Status: ✗ FAILED")
            continue

        if was_truncated:
            truncated_count += 1
            print("  Status: ⚠️  TRUNCATED (recovered)")
        else:
            complete_count += 1
            print("  Status: ✓ COMPLETE")

        # Display parsed fields
        print(f"  Timestamp: {parsed.get('timestamp', 'N/A')}")
        print(f"  Level: {parsed.get('level', 'N/A')}")

        if 'message' in parsed:
            msg = parsed['message']
            if len(msg) > 50:
                msg = msg[:47] + "..."
            print(f"  Message: {msg}")

        if 'user' in parsed:
            print(f"  User: {parsed['user']}")

        if 'events' in parsed:
            print(f"  Events: {len(parsed['events'])} events")

    print()
    print("-" * 60)
    print("\nSummary:")
    print(f"  Total entries: {len(log_entries)}")
    print(f"  Complete: {complete_count}")
    print(f"  Truncated (recovered): {truncated_count}")
    print(f"  Failed: {failed_count}")
    print()

    success_rate = ((complete_count + truncated_count) / len(log_entries)) * 100
    print(f"✓ Successfully processed {success_rate:.1f}% of log entries")


def demonstrate_batch_processing():
    """
    Shows how to process large log files efficiently.
    """
    print()
    print()
    print("Batch Processing Example")
    print("=" * 60)
    print()

    # Simulate a larger log file
    print("Processing 1000 log entries...")

    processed = 0
    truncated_recovered = 0

    for i in range(1000):
        # Simulate mix of complete and truncated entries
        if i % 7 == 0:  # Every 7th entry is truncated
            line = '{"id": ' + str(i) + ', "data": {"partial":'
        else:
            line = '{"id": ' + str(i) + ', "data": {"complete": true}}'

        try:
            json.loads(line)
            processed += 1
        except json.JSONDecodeError:
            completed = json_completer.complete(line)
            json.loads(completed)  # Verify it's valid
            processed += 1
            truncated_recovered += 1

    print(f"✓ Processed {processed} entries")
    print(f"  Recovered {truncated_recovered} truncated entries ({truncated_recovered/processed*100:.1f}%)")


if __name__ == "__main__":
    main()
    demonstrate_batch_processing()
