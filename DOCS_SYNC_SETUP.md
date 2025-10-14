# Option B: Separate Private Docs Repository

## Setup (One-Time)

### 1. Create Private GitHub Repo
```bash
# On GitHub.com, create new repo:
Name: jotrack-docs-private
Visibility: Private
Description: Internal planning docs for JoTrack
```

### 2. Remove Planning Docs from .gitignore
Edit `.gitignore` and **remove** these lines:
```bash
# Remove from .gitignore:
*_PLAN.md
*_COMPLETE.md
*_STATUS.md
# ... etc (all the planning doc patterns)
```

### 3. Initialize Docs Repo Locally
```bash
# Create docs directory
mkdir ~/jotrack-docs
cd ~/jotrack-docs

# Initialize Git
git init
git branch -M main

# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/jotrack-docs-private.git

# Move all planning docs here
cd /path/to/jotrack
mv *_PLAN.md *_COMPLETE.md *_STATUS.md ~/jotrack-docs/
mv V*.md CSS_*.md COACH_*.md ~/jotrack-docs/

# Commit and push
cd ~/jotrack-docs
git add .
git commit -m "Initial commit: Planning docs"
git push -u origin main
```

### 4. Create Symlink (Optional)
Link docs back to main project for easy access:
```bash
cd /path/to/jotrack
ln -s ~/jotrack-docs _docs

# Now you can access docs via: /path/to/jotrack/_docs/
```

## Using on New Computer

```bash
# 1. Clone main project
git clone https://github.com/gmarmat/jotrack.git
cd jotrack
npm install

# 2. Clone docs (private)
cd ~
git clone https://github.com/gmarmat/jotrack-docs-private.git

# 3. Create symlink
cd ~/jotrack
ln -s ~/jotrack-docs-private _docs
```

## Pros & Cons

**Pros**:
- ✅ Main repo can stay public
- ✅ Docs are private
- ✅ Docs sync across computers
- ✅ Separate version control

**Cons**:
- ⚠️ Two repos to manage
- ⚠️ Manual sync required
- ⚠️ More complex setup

