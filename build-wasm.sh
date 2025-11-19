#!/bin/bash
# Build WASM module and copy to website

set -e

echo "Building WASM module..."
cd rust/json_completer
wasm-pack build --target web --features wasm

echo "Copying WASM files to website..."
mkdir -p ../../apps/website/public/wasm
cp pkg/* ../../apps/website/public/wasm/

echo "WASM build complete!"
echo "Bundle size: $(du -h pkg/json_completer_bg.wasm | cut -f1)"
