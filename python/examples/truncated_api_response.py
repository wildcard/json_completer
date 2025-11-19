"""
Example: Handling Truncated API Responses

This example shows how to recover data from API responses that were truncated
due to size limits (e.g., AWS Lambda 6MB, API Gateway 10MB limits).
"""

import json
import json_completer


def simulate_truncated_response():
    """
    Simulates an API response that was truncated mid-JSON.

    In real scenarios, this happens due to:
    - AWS Lambda response size limits (6MB)
    - API Gateway payload limits (10MB)
    - Load balancer limits
    - Network timeouts
    """
    full_response = {
        "users": [
            {"id": 1, "name": "Alice", "email": "alice@example.com", "active": True},
            {"id": 2, "name": "Bob", "email": "bob@example.com", "active": True},
            {"id": 3, "name": "Charlie", "email": "charlie@example.com", "active": False},
        ],
        "metadata": {
            "total": 3,
            "page": 1,
            "timestamp": "2024-01-15T10:30:00Z"
        }
    }

    # Simulate truncation during serialization
    full_json = json.dumps(full_response, indent=2)

    # Truncate at various points
    truncation_points = [
        len(full_json) // 4,
        len(full_json) // 2,
        len(full_json) * 3 // 4,
    ]

    return [(full_json[:point], point) for point in truncation_points]


def main():
    """Main example function."""
    print("Truncated API Response Recovery Example")
    print("=" * 50)
    print()

    truncated_responses = simulate_truncated_response()

    for i, (truncated, point) in enumerate(truncated_responses, 1):
        print(f"Scenario {i}: Truncated at {point} characters")
        print("-" * 50)
        print()

        print("Truncated response (last 100 chars):")
        print(f"...{truncated[-100:]}")
        print()

        # Try to parse as-is (will fail)
        try:
            json.loads(truncated)
            print("✓ Response is valid JSON (no truncation)")
        except json.JSONDecodeError:
            print("✗ JSONDecodeError: Response is truncated")

        print()

        # Use json_completer to recover
        completed = json_completer.complete(truncated)

        try:
            recovered_data = json.loads(completed)
            print("✓ Successfully recovered data:")
            print(json.dumps(recovered_data, indent=2))

            # Show what we recovered
            if "users" in recovered_data:
                print(f"\nRecovered {len(recovered_data['users'])} users")
            if "metadata" in recovered_data:
                print(f"Recovered metadata: {recovered_data['metadata']}")
        except json.JSONDecodeError as e:
            print(f"✗ Still invalid: {e}")

        print()
        print()


if __name__ == "__main__":
    main()
