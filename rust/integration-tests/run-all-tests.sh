#!/bin/bash

# Integration Test Runner for json_completer
# This script runs all integration tests for Nest.js and Next.js

set -e  # Exit on any error

echo "======================================"
echo "json_completer Integration Test Runner"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
RUST_DIR="$SCRIPT_DIR/.."
BINARY_PATH="$RUST_DIR/target/release/json_completer"

# Check if binary exists
if [ ! -f "$BINARY_PATH" ]; then
    echo -e "${YELLOW}Warning: Rust binary not found at $BINARY_PATH${NC}"
    echo "Building Rust binary..."
    cd "$RUST_DIR"
    cargo build --release
    echo -e "${GREEN}✓ Rust binary built successfully${NC}"
    echo ""
else
    echo -e "${GREEN}✓ Rust binary found${NC}"
    echo ""
fi

# Function to run tests in a directory
run_tests() {
    local test_dir=$1
    local test_name=$2

    echo "======================================"
    echo "Running $test_name Tests"
    echo "======================================"
    cd "$SCRIPT_DIR/$test_dir"

    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo "Installing dependencies for $test_name..."
        npm install
        echo ""
    fi

    # Run tests
    echo "Executing tests..."
    if npm test; then
        echo -e "${GREEN}✓ $test_name tests PASSED${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}✗ $test_name tests FAILED${NC}"
        echo ""
        return 1
    fi
}

# Track results
NEST_RESULT=0
NEXT_RESULT=0

# Run Nest.js tests
if run_tests "nestjs" "Nest.js"; then
    NEST_RESULT=0
else
    NEST_RESULT=1
fi

# Run Next.js tests
if run_tests "nextjs" "Next.js"; then
    NEXT_RESULT=0
else
    NEXT_RESULT=1
fi

# Summary
echo "======================================"
echo "Test Summary"
echo "======================================"

if [ $NEST_RESULT -eq 0 ]; then
    echo -e "Nest.js:  ${GREEN}✓ PASSED${NC}"
else
    echo -e "Nest.js:  ${RED}✗ FAILED${NC}"
fi

if [ $NEXT_RESULT -eq 0 ]; then
    echo -e "Next.js:  ${GREEN}✓ PASSED${NC}"
else
    echo -e "Next.js:  ${RED}✗ FAILED${NC}"
fi

echo ""

# Exit with appropriate code
if [ $NEST_RESULT -eq 0 ] && [ $NEXT_RESULT -eq 0 ]; then
    echo -e "${GREEN}All integration tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some integration tests failed${NC}"
    exit 1
fi
