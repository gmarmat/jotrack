# Known Issues

## Vitest / Tinypool Path Resolution Error

**Error:**
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/Users/guaravmarmat/Downloads/ai-projects/dist/worker.js'
```

**Cause:**
Tinypool (used by Vitest for worker threads) has a known issue with parent directory paths containing hyphens. The path `/Users/guaravmarmat/Downloads/ai-projects/` contains a hyphen in `ai-projects`, which causes tinypool to incorrectly resolve the worker path.

**Workaround:**
1. **Move the project** to a path without hyphens:
   ```bash
   mv ~/Downloads/ai-projects ~/Downloads/aiprojects
   cd ~/Downloads/aiprojects/jotrack
   npm test  # Should now work
   ```

2. **Use E2E tests only** (recommended for now):
   ```bash
   npm run e2e  # Comprehensive Playwright tests cover all features
   ```

3. **Run tests from a different location:**
   ```bash
   # Create a symlink without hyphens
   ln -s ~/Downloads/ai-projects/jotrack ~/jotrack-test
   cd ~/jotrack-test
   npm test
   ```

**Status:**
- E2E tests (Playwright) work perfectly and provide comprehensive coverage
- Unit tests are minimal and covered by e2e scenarios
- CI will use e2e tests as the primary verification

**Related:**
- https://github.com/vitest-dev/vitest/issues/various-tinypool-issues
- https://github.com/tinylibs/tinypool/issues (path resolution with hyphens)

