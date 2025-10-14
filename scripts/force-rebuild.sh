#!/bin/bash

# Force Rebuild Script - Fixes CSS loading issues
# Run this whenever CSS doesn't load properly

echo "🔄 Force rebuilding JoTrack..."
echo ""

# Stop any running dev servers
echo "1️⃣ Stopping any running dev servers..."
pkill -f "next dev" || echo "   No dev servers running"
sleep 1

# Clean all caches
echo "2️⃣ Cleaning caches..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .turbo
echo "   ✅ Caches cleared"

# Rebuild
echo "3️⃣ Starting fresh dev server..."
npm run dev

echo ""
echo "✅ Done! If CSS still doesn't load, try hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)"

