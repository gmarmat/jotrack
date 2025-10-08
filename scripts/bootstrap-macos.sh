#!/usr/bin/env bash
set -euo pipefail

echo "== Pre-flight check for jotrack =="

green() { printf "\033[32m%s\033[0m\n" "$1"; }
yellow() { printf "\033[33m%s\033[0m\n" "$1"; }
red() { printf "\033[31m%s\033[0m\n" "$1"; }

# 1) Apple Command Line Tools
if xcode-select -p >/dev/null 2>&1; then
  green "✅ Apple Command Line Tools present"
else
  yellow "⚠️  Apple Command Line Tools not found — installing (GUI prompt)..."
  xcode-select --install || true
  echo "After CLTs finish installing, re-run this script."
fi

# 2) Homebrew
if command -v brew >/dev/null 2>&1; then
  green "✅ Homebrew present: $(brew --version | head -n1)"
else
  yellow "⚠️  Homebrew not found — installing..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> "$HOME/.zprofile"
  eval "$(/opt/homebrew/bin/brew shellenv)"
fi

# 3) Use Brewfile to ensure tools
if [ -f Brewfile ]; then
  brew bundle || true
else
  red "❌ Brewfile missing; expected at project root"; exit 1
fi

# 4) Verify git
if command -v git >/dev/null 2>&1; then
  green "✅ git: $(git --version)"
else
  red "❌ git missing (Homebrew should have installed it)."; exit 1
fi

# 5) Verify Node 20
if command -v node >/dev/null 2>&1; then
  NODE_V=$(node -v)
  echo "Node version: $NODE_V"
  if [[ "$NODE_V" == v20.* ]]; then
    green "✅ Node 20 detected"
  else
    yellow "⚠️  Non-20 Node; installing Node 20 via brew..."
    brew install node@20
    brew link --overwrite --force node@20
  fi
else
  yellow "⚠️  Node not found; installing Node 20..."
  brew install node@20
  brew link --overwrite --force node@20
fi

# 6) Verify npm
if command -v npm >/dev/null 2>&1; then
  green "✅ npm: $(npm -v)"
else
  red "❌ npm missing even after Node install."; exit 1
fi

# 7) SQLite
if command -v sqlite3 >/dev/null 2>&1; then
  green "✅ sqlite3: $(sqlite3 --version)"
else
  yellow "⚠️  sqlite3 not found; installing..."
  brew install sqlite
fi

# 8) Optional: GitHub CLI
if command -v gh >/dev/null 2>&1; then
  green "✅ gh present"
else
  yellow "ℹ️  GitHub CLI not installed. If you want easy GitHub setup later, run: brew install gh"
fi

green "🎉 Pre-flight complete."


# Fallback explicit installs (idempotent)
brew list git >/dev/null 2>&1 || brew install git
brew list node@20 >/dev/null 2>&1 || brew install node@20
brew link --overwrite --force node@20 || true
brew list sqlite >/dev/null 2>&1 || brew install sqlite

