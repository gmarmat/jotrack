# Documentation Cleanup Plan - Oct 16, 2024

## 📋 Purpose

Clean up internal planning/progress documentation before making repo public. Keep only user-facing documentation.

---

## ✅ **KEEP (Public-Facing Documentation)**

These files provide value to end users and should remain:

```
README.md                   - Main project documentation
CHANGELOG.md                - Version history
ARCHITECTURE.md             - System architecture
UI_DESIGN_SYSTEM.md         - Component design patterns (NEW!)
TERMINOLOGY_GUIDE.md        - Naming conventions (NEW!)
CURRENT_STATE.md            - Project status (NEW!)
PREVIEW_SYSTEM_GUIDE.md     - Feature documentation
KNOWN_ISSUES.md             - Bug tracking
SIGNAL_LEGEND.md            - Signal system guide
RELEASE_NOTES*.md           - Version release notes
```

**Total to keep**: ~10 files

---

## 🗑️ **REMOVE (Internal Planning Docs)**

### Pattern Matches (Auto-delete)

Files matching these patterns are internal planning docs:

```bash
*_PLAN.md
*_COMPLETE.md
*_STATUS.md
*_SUMMARY.md
*_PROGRESS.md
*_GUIDE.md (except TERMINOLOGY_GUIDE, PREVIEW_SYSTEM_GUIDE)
*_IMPLEMENTATION*.md
*_SESSION*.md
V[0-9]*.md (V1.1, V2.3, V2.6, etc.)
CSS_*.md
COACH_*.md (except if becomes public feature doc)
START_HERE*.md
ALL_*.md
AUDIT_*.md
BUILD_*.md
DEMO_*.md
EXECUTION_*.md
FINAL_*.md
FIXES_*.md
HARDENING_*.md
OUTSTANDING_*.md
QUALITY_*.md
RATE_*.md
READY_*.md
REMAINING_*.md
SETUP_*.md
SIMPLE_*.md
TEST_*.md (except if test documentation)
TASKS.md
CURRENT_STATUS.md (replaced by CURRENT_STATE.md)
```

### Specific Files to Remove (Sample)

```
ALL_DONE_V2.4_SESSION1.md
AUDIT_COMPLETE_SUMMARY.md
AUDIT_FINDINGS.md
BUILD_AND_TEST_VERIFICATION.md
COACH_MODE_DEMO_STEPS.md
COACH_MODE_HARDENING_STATUS.md
COACH_MODE_IMPLEMENTATION_SUMMARY.md
COACH_V1.1_COMPLETE.md
COACH_V1.1_FINAL_SUMMARY.md
COACH_V1.1_IMPLEMENTATION_GUIDE.md
COACH_V1.1_READY.md
COACH_V1.1_STATUS.md
COACH_V1.2_COMPLETE.md
COACH_V1.3.1_COMPLETE.md
COMPLETE_UX_OVERHAUL_STATUS.md
CSS_FIX_NOTE.md
CSS_FIX_SUMMARY.md
CSS_TROUBLESHOOTING.md
CURRENT_STATUS.md
DEMO_STEPS.md
DEMO_STEPS_STATUS.md
EXECUTION_LOG.md
FINAL_STATUS_v2.3.md
FINAL_STATUS_v2.5.md
FIXES_APPLIED.md
... (50+ more files)
```

**Estimated count**: 50-60 files

---

## 🧹 **Cleanup Strategy**

### Phase 1: Create Backup (Safety)
```bash
# Create backup before deletion
tar -czf docs_backup_$(date +%Y%m%d).tar.gz *.md
mv docs_backup_*.tar.gz ~/Downloads/
```

### Phase 2: Remove Planning Docs
```bash
# Remove files matching patterns (safe, one by one)
rm -f *_PLAN.md
rm -f *_COMPLETE.md
rm -f *_STATUS.md
# ... etc
```

### Phase 3: Verify
```bash
# List remaining .md files
ls -1 *.md

# Should only see ~10 public-facing docs
```

### Phase 4: Update README
```bash
# Update README.md with current state
# Remove outdated setup instructions
# Add links to new docs (UI_DESIGN_SYSTEM, etc.)
```

---

## 📊 **Before & After**

### Before Cleanup
```
Total .md files: ~60
Public docs: ~10
Planning docs: ~50
Ratio: 17% public, 83% clutter
```

### After Cleanup
```
Total .md files: ~10
Public docs: ~10
Planning docs: 0
Ratio: 100% public, 0% clutter
```

---

## ✅ **Verification Checklist**

After cleanup, verify:
- [ ] README.md exists and updated
- [ ] CHANGELOG.md exists
- [ ] ARCHITECTURE.md exists
- [ ] UI_DESIGN_SYSTEM.md exists
- [ ] TERMINOLOGY_GUIDE.md exists
- [ ] CURRENT_STATE.md exists
- [ ] KNOWN_ISSUES.md exists
- [ ] SIGNAL_LEGEND.md exists
- [ ] PREVIEW_SYSTEM_GUIDE.md exists
- [ ] No *_PLAN.md files
- [ ] No *_COMPLETE.md files
- [ ] No V[0-9]*.md files
- [ ] All links in docs still work

---

## 🎯 **New Documentation Structure**

### For Users
```
README.md               - Start here (setup, features, quick start)
CHANGELOG.md            - What's new in each version
KNOWN_ISSUES.md         - Current bugs and workarounds
```

### For Developers
```
ARCHITECTURE.md         - System design, data flow
UI_DESIGN_SYSTEM.md     - How to build components
TERMINOLOGY_GUIDE.md    - Naming conventions
CURRENT_STATE.md        - What works, what doesn't
```

### For Features
```
SIGNAL_LEGEND.md        - Signal system explained
PREVIEW_SYSTEM_GUIDE.md - Preview/variant system
```

---

## 🚨 **Important Notes**

1. **Create backup first!** Don't delete without safety net.
2. **Review each file** before deleting (some might have valuable notes).
3. **Update README** to reflect current state.
4. **Git history cleanup** needed later (BFG Repo-Cleaner).
5. **This cleanup doc itself** should be removed before public!

---

**Status**: Planning phase  
**Execution**: Pending user approval  
**Risk**: Low (backup created first)

