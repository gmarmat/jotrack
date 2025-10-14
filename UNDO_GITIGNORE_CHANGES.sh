#!/bin/bash

# This script reverts the .gitignore changes and adds planning docs back to Git

echo "🔄 Reverting .gitignore changes..."

# 1. Check out the old .gitignore (before our changes)
git checkout HEAD~1 -- .gitignore

# 2. Add all planning docs back to Git
echo "📝 Adding planning docs back to Git..."
git add *_PLAN.md *_COMPLETE.md *_STATUS.md *_SUMMARY.md
git add *_PROGRESS.md *_GUIDE.md *_SESSION*.md
git add V*.md CSS_*.md COACH_*.md
git add START_HERE*.md READ_ME_FIRST.md
git add REMAINING_WORK.md FIXES_APPLIED.md
git add prompts/*.md

# 3. Commit
git commit -m "chore: revert - include planning docs in version control

Planning docs are now tracked in Git for:
- Backup across computers
- Version history
- Sync via GitHub

Note: Make repo private to keep these docs private!"

# 4. Instructions
echo ""
echo "✅ Done! Planning docs are now tracked in Git."
echo ""
echo "⚠️  IMPORTANT: Make your GitHub repo PRIVATE to keep docs private:"
echo "   1. Go to: https://github.com/gmarmat/jotrack/settings"
echo "   2. Scroll to 'Danger Zone'"
echo "   3. Click 'Change visibility' → 'Make private'"
echo ""
echo "Then push: git push origin main"

