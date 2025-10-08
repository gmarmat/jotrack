#!/usr/bin/env bash
set -euo pipefail

echo "### STATUS @ $(date)"
echo "pwd: $(pwd)"
echo

echo "## Node & NPM"
which node || true
node -v || true
npm -v || true
echo

echo "## Next.js (package.json)"
node -e "const p=require('./package.json'); console.log({name:p.name, next:p.dependencies?.next||p.devDependencies?.next, scripts:p.scripts})" || true
echo

echo "## Dev server check"
( curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000 || true )
echo

echo "## Key files"
ls -la | egrep '(^d|package.json|next\.config|tsconfig\.json|tailwind|\.editorconfig|\.gitignore|\.cursorrules|README|Brewfile|scripts|app|pages|e2e|__tests__)' || true
echo
[ -f vitest.config.ts ] && echo "vitest.config.ts exists" || echo "vitest.config.ts MISSING"
[ -f playwright.config.ts ] && echo "playwright.config.ts exists" || echo "playwright.config.ts MISSING"
echo

echo "## Git"
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Inside a git repo: YES"
  git --version || true
  echo
  echo "branch + short status:"
  git status -b --porcelain=v1 || true
  echo
  echo "remotes:"
  git remote -v || true
else
  echo "Inside a git repo: NO"
fi

echo
echo "### END STATUS"
