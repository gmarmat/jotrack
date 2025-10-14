# ⚠️ CHECKLIST: Before Making This Repo Public

**IMPORTANT**: Run through this checklist before changing repo visibility to public!

---

## 🔒 **1. Remove Internal Planning Docs**

### **Step 1: Revert .gitignore Changes**
```bash
# We removed the .gitignore patterns earlier
# Add them back before going public:
git checkout e070359 -- .gitignore  # The commit where we added privacy patterns
```

### **Step 2: Remove Files from Current State**
```bash
# Delete all planning docs
rm -f *_PLAN.md *_COMPLETE.md *_STATUS.md *_SUMMARY.md
rm -f *_PROGRESS.md *_GUIDE.md *_IMPLEMENTATION*.md
rm -f *_SESSION*.md *_EXECUTION*.md *_FIXES*.md *_NOTE*.md
rm -f V[0-9]*.md CSS_*.md COACH_*.md
rm -f START_HERE*.md READ_ME_FIRST.md READY_TO_TEST*.md
rm -f TEST_RESULTS*.md BUILD_AND_TEST*.md
rm -f HARDENING*.md FINAL_STATUS*.md SIMPLE_TEST_GUIDE*.md
rm -f REMAINING_WORK.md FIXES_APPLIED.md RATE_LIMIT_FIX.md
rm -f ALL_DONE*.md PRIVACY_CLEANUP_COMPLETE.md
rm -f DOCS_*.md UNDO_GITIGNORE_CHANGES.sh BEFORE_GOING_PUBLIC.md

# Keep these public docs:
# - README.md
# - CHANGELOG.md
# - ARCHITECTURE.md
# - PREVIEW_SYSTEM_GUIDE.md
# - UI_DESIGN_SPEC.md
# - KNOWN_ISSUES.md
# - RELEASE_NOTES*.md
```

### **Step 3: Commit**
```bash
git add .
git commit -m "chore: remove internal planning docs before public release"
```

---

## 🧹 **2. Clean Git History** ⚠️ CRITICAL

**WHY**: Even after deleting files, they're still in Git history. People can `git checkout` old commits and see them!

### **Option A: BFG Repo-Cleaner** (Recommended)

```bash
# 1. Install BFG
brew install bfg  # Mac
# or download from: https://rtyley.github.io/bfg-repo-cleaner/

# 2. Create fresh clone
cd ~/
git clone --mirror https://github.com/gmarmat/jotrack.git jotrack-mirror
cd jotrack-mirror

# 3. Remove files from ALL history
bfg --delete-files "*_PLAN.md"
bfg --delete-files "*_COMPLETE.md"
bfg --delete-files "*_STATUS.md"
bfg --delete-files "*_SUMMARY.md"
bfg --delete-files "*_PROGRESS.md"
bfg --delete-files "*_GUIDE.md"
bfg --delete-files "*_SESSION*.md"
bfg --delete-files "V[0-9]*.md"
bfg --delete-files "CSS_*.md"
bfg --delete-files "COACH_*.md"
# ... etc for all patterns

# 4. Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 5. Force push (DESTRUCTIVE!)
git push --force
```

### **Option B: git filter-repo** (Alternative)

```bash
# 1. Install
pip install git-filter-repo

# 2. In your repo
cd /path/to/jotrack

# 3. Remove files from history
git filter-repo --path-glob '*_PLAN.md' --invert-paths
git filter-repo --path-glob '*_COMPLETE.md' --invert-paths
git filter-repo --path-glob '*_STATUS.md' --invert-paths
# ... etc for all patterns

# 4. Force push (DESTRUCTIVE!)
git push --force
```

---

## 🔍 **3. Verify Clean History**

```bash
# Search entire Git history for sensitive files
git log --all --full-history --oneline -- "*_PLAN.md"

# Should return nothing if successfully removed
```

---

## 🛡️ **4. Security Checklist**

- [ ] All planning docs removed from current state
- [ ] .gitignore updated to prevent future commits
- [ ] Git history cleaned (BFG or filter-repo)
- [ ] Force pushed to GitHub
- [ ] Verified no sensitive files in history
- [ ] API keys/secrets not in code (check .env)
- [ ] Database files in .gitignore (*.db, *.db-shm, *.db-wal)
- [ ] Attachment data ignored (data/attachments/)

---

## 📋 **5. Update Public-Facing Docs**

Before going public, ensure these are polished:

- [ ] **README.md** - Clear project description, setup instructions, screenshots
- [ ] **CHANGELOG.md** - Up-to-date release notes
- [ ] **ARCHITECTURE.md** - High-level design (remove sensitive details)
- [ ] **LICENSE** - Add open source license (MIT, Apache, etc.)
- [ ] **CONTRIBUTING.md** - If accepting contributions
- [ ] Remove or update any "WIP" or "TODO" comments

---

## 🎯 **6. Make Repo Public**

Only after completing steps 1-5:

1. Go to: https://github.com/gmarmat/jotrack/settings
2. Scroll to "Danger Zone"
3. Click "Change repository visibility"
4. Select "Make public"
5. Confirm

---

## ⚠️ **WARNING: Git History is Forever**

**Important**: If you skip Step 2 (cleaning Git history), anyone can:

```bash
# Clone your repo
git clone https://github.com/gmarmat/jotrack.git

# See all commits
git log --all --oneline

# Checkout old commit
git checkout <old-commit-hash>

# See your planning docs!
ls *_PLAN.md
```

**So cleaning history is CRITICAL before going public!**

---

## 💡 **Alternative: Fresh Public Repo**

If cleaning history seems too risky:

1. Create new empty public repo: `jotrack-public`
2. Copy only code files (no .git directory)
3. Initialize fresh Git history
4. Push to new repo
5. Archive old private repo

**Pros**:
- ✅ Clean slate, no history concerns
- ✅ Can curate what goes public

**Cons**:
- ⚠️ Lose commit history
- ⚠️ Contributors lose credit

---

## 📝 **Reminder Set**

This checklist is saved in:
1. ✅ This file: `BEFORE_GOING_PUBLIC.md`
2. ✅ AI Memory: Permanent reminder for future sessions
3. ✅ Will warn you before going public

---

**Don't skip Step 2 (cleaning Git history)!** 🔒

