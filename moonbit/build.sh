#!/bin/bash

# Build Moonbit to JavaScript
echo "Building Moonbit project to JavaScript..."

# Clean previous build
rm -rf target

# Build for JS target
moon build --target js

# Check if the build was successful
if [ $? -eq 0 ]; then
    echo "Build successful!"
    
    # Try to find the output JavaScript file
    echo "Looking for generated JavaScript files..."
    find target -name "*.js" -o -name "*.mjs" | while read file; do
        echo "Found: $file"
    done
    
    # Check for core files
    if [ -f "target/js/release/build/hacknslash.core" ]; then
        echo "Core file found at: target/js/release/build/hacknslash.core"
    fi
else
    echo "Build failed!"
    exit 1
fi