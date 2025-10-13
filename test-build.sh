#!/bin/bash
set -e

echo "Starting build test..."
cd /Users/guaravmarmat/Downloads/ai-projects/jotrack

echo "1. TypeScript check..."
npx tsc --noEmit 2>&1 | tee /tmp/tsc-output.txt
TSC_EXIT=$?
echo "TypeScript exit code: $TSC_EXIT"

if [ $TSC_EXIT -ne 0 ]; then
  echo "TypeScript errors found:"
  cat /tmp/tsc-output.txt
  exit 1
fi

echo "2. Building..."
npm run build 2>&1 | tee /tmp/build-output.txt
BUILD_EXIT=$?
echo "Build exit code: $BUILD_EXIT"

if [ $BUILD_EXIT -ne 0 ]; then
  echo "Build errors found:"
  tail -50 /tmp/build-output.txt
  exit 1
fi

echo "✅ Build successful!"
ls -la .next/server/app/coach/

