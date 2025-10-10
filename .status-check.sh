#!/bin/bash
# Quick status check script

echo "=========================================="
echo "JOTRACK PROJECT STATUS"
echo "=========================================="
echo ""
echo "📍 Branch: $(git branch --show-current)"
echo "📦 Commits ahead: $(git rev-list --count @{u}.. 2>/dev/null || echo '0')"
echo "🏷️  Latest tag: $(git tag --list --sort=-creatordate | head -1)"
echo "📝 Last commit: $(git log --oneline -1)"
echo ""
echo "🔍 TypeScript check..."
npx tsc --noEmit && echo "   ✅ PASS" || echo "   ❌ FAIL"
echo ""
echo "🧪 Filter E2E test..."
npm run e2e -- --reporter=line --grep "filter" 2>&1 | tail -1
echo ""
echo "=========================================="
