#!/bin/bash
# Documentation Cleanup Script
# Removes internal planning docs, keeps public-facing docs

echo "🧹 JoTrack Documentation Cleanup"
echo "================================"
echo ""

# Files to KEEP (public-facing)
KEEP_FILES=(
  "README.md"
  "CHANGELOG.md"
  "ARCHITECTURE.md"
  "UI_DESIGN_SYSTEM.md"
  "TERMINOLOGY_GUIDE.md"
  "CURRENT_STATE.md"
  "DOCUMENTATION_CLEANUP.md"
  "PREVIEW_SYSTEM_GUIDE.md"
  "KNOWN_ISSUES.md"
  "SIGNAL_LEGEND.md"
  "RELEASE_NOTES*.md"
  "UI_DESIGN_SPEC.md"
)

# Patterns to REMOVE
REMOVE_PATTERNS=(
  "*_PLAN.md"
  "*_COMPLETE.md"
  "*_STATUS.md"
  "*_SUMMARY.md"
  "*_PROGRESS.md"
  "*_IMPLEMENTATION*.md"
  "*_SESSION*.md"
  "V[0-9]*.md"
  "CSS_*.md"
  "COACH_*.md"
  "START_*.md"
  "ALL_*.md"
  "AUDIT_*.md"
  "BUILD_*.md"
  "DEMO_*.md"
  "EXECUTION_*.md"
  "FINAL_*.md"
  "FIXES_*.md"
  "HARDENING_*.md"
  "OUTSTANDING_*.md"
  "QUALITY_*.md"
  "RATE_*.md"
  "READY_*.md"
  "REMAINING_*.md"
  "SETUP_*.md"
  "SIMPLE_*.md"
  "TEST_*.md"
  "TASKS.md"
  "CURRENT_STATUS.md"
  "PRIVACY_*.md"
  "DETAILED_*.md"
  "ECOSYSTEM_*.md"
  "GITHUB_*.md"
  "VIEWER_*.md"
  "DATA_*.md"
  "DOCS_*.md"
  "PROMPT_*.md"
  "SIGNAL_EVALUATION_*.md"
  "SIGNAL_SYSTEM_*.md"
  "STATUS_*.md"
  "MODEL_*.md"
)

# Count files to remove
total_count=0
for pattern in "${REMOVE_PATTERNS[@]}"; do
  count=$(ls -1 $pattern 2>/dev/null | wc -l)
  total_count=$((total_count + count))
done

echo "📊 Found $total_count planning docs to remove"
echo ""

# Show files that will be kept
echo "✅ PUBLIC DOCS (keeping):"
for file in "${KEEP_FILES[@]}"; do
  if ls $file 1>/dev/null 2>&1; then
    echo "   $file"
  fi
done
echo ""

# List files to be removed (first 20)
echo "🗑️  PLANNING DOCS (removing first 20 of $total_count):"
all_files=()
for pattern in "${REMOVE_PATTERNS[@]}"; do
  while IFS= read -r file; do
    all_files+=("$file")
  done < <(ls -1 $pattern 2>/dev/null || true)
done

count=0
for file in "${all_files[@]}"; do
  if [ $count -lt 20 ]; then
    echo "   $file"
    count=$((count + 1))
  fi
done

if [ $total_count -gt 20 ]; then
  echo "   ... and $((total_count - 20)) more"
fi

echo ""
echo "⚠️  This script is ready but NOT executed yet."
echo "📝 Review the list above, then run: bash cleanup_planning_docs.sh execute"
