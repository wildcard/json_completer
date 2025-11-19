#!/bin/bash

# Simple verification script to test the json_completer binary
# This runs basic tests without requiring Node.js

set -e

echo "======================================"
echo "json_completer Binary Verification"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BINARY_PATH="$SCRIPT_DIR/../../target/release/json_completer"

# Check if binary exists
if [ ! -f "$BINARY_PATH" ]; then
    echo -e "${RED}✗ Binary not found at $BINARY_PATH${NC}"
    echo "  Run: cd ../.. && cargo build --release"
    exit 1
fi

echo -e "${GREEN}✓ Binary found${NC}"
echo ""

# Test counter
TESTS_RUN=0
TESTS_PASSED=0

# Function to run a test
test_case() {
    local name=$1
    local input=$2
    local expected=$3

    TESTS_RUN=$((TESTS_RUN + 1))

    echo "Test $TESTS_RUN: $name"

    local result=$(echo "$input" | "$BINARY_PATH" --json-api)
    local actual=$(echo "$result" | jq -r '.result' 2>/dev/null || echo "$result")

    if [ "$actual" = "$expected" ]; then
        echo -e "${GREEN}  ✓ PASSED${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}  ✗ FAILED${NC}"
        echo "    Expected: $expected"
        echo "    Actual:   $actual"
    fi
    echo ""
}

# Run tests
echo "Running basic verification tests..."
echo ""

test_case "Incomplete object" \
    '{"action": "complete", "input": "{\"name\": \"John\", \"age\":"}' \
    '{"name": "John", "age":null}'

test_case "Incomplete string" \
    '{"action": "complete", "input": "{\"message\": \"Hello wo"}' \
    '{"message": "Hello wo"}'

test_case "Incomplete array" \
    '{"action": "complete", "input": "[1, 2, 3"}' \
    '[1, 2, 3]'

test_case "Incomplete number" \
    '{"action": "complete", "input": "{\"value\": 2."}' \
    '{"value": 2.0}'

test_case "Incomplete keyword" \
    '{"action": "complete", "input": "{\"active\": tru"}' \
    '{"active": true}'

test_case "Nested structure" \
    '{"action": "complete", "input": "{\"user\": {\"name\": \"Alice\", \"posts\": [{\"id\": 1"}' \
    '{"user": {"name": "Alice", "posts": [{"id": 1}]}}'

test_case "Valid JSON (no changes)" \
    '{"action": "complete", "input": "{\"name\": \"John\"}"}' \
    '{"name": "John"}'

test_case "Empty string" \
    '{"action": "complete", "input": ""}' \
    ''

# Summary
echo "======================================"
echo "Test Results"
echo "======================================"
echo "Tests run:    $TESTS_RUN"
echo "Tests passed: $TESTS_PASSED"
echo "Tests failed: $((TESTS_RUN - TESTS_PASSED))"
echo ""

if [ $TESTS_PASSED -eq $TESTS_RUN ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    echo ""
    echo "The binary is working correctly."
    echo "You can now run the full integration tests:"
    echo "  ./run-all-tests.sh"
    exit 0
else
    echo -e "${RED}Some tests failed${NC}"
    exit 1
fi
