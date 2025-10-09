# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] - 2025-10-08

### Added
- **Attachments**: upload/list/preview/delete with optimistic UI.
  - POST `/api/jobs/:id/attachments` - Upload files (pdf, png, jpg, jpeg, webp, txt, 10MB max)
  - GET `/api/jobs/:id/attachments` - List attachments (newest first)
  - GET `/api/jobs/:id/attachments?download=<id>` - Download file
  - DELETE `/api/jobs/:id/attachments?attachment=<id>` - Remove attachment
  - Image preview rendering inline for PNG/JPG/WEBP
  - Smart filename conflict resolution
  - Files stored in `./data/attachments/<jobId>/`

- **Backup**: GET `/api/backup` streams ZIP (DB + attachments), also saves to `./data/backups/`.
  - UI button triggers download with proper filename
  - Includes SQLite DB + WAL + SHM files
  - Recursive attachments directory inclusion
  - ZIP compression level 9

- **Restore (Stage)**: POST `/api/restore` uploads ZIP, extracts to `./data/backups/staging/<id>/`, writes `PLAN.json`.
  - Safe staging without live data modification
  - Plan includes DB files and attachments paths
  - Validation and error handling

- **Restore (Apply, UI)**: POST `/api/restore/apply-ui` merges staged jobs into current DB (transactional), autosave before apply, duplicate-aware (fingerprint = company|title|url host+path), attachments merge/replace.
  - Works with dev server running
  - Automatic autosave backup before changes
  - Fingerprint-based duplicate detection
  - Two import strategies: skip-duplicates (default) or import-all
  - Two attachments modes: merge (default) or replace
  - Transaction-based inserts for atomicity

- **Restore (Apply, CLI)**: `scripts/apply-restore.mjs` replaces DB files atomically (requires stopping dev server).
  - Full database replacement capability
  - Autosave before apply
  - Dry-run mode for testing
  - Atomic file operations (temp + rename)

- **Duplicates Preview**: `/api/restore/dedup` compares staged vs current; counts & sample groups.
  - Fingerprinting algorithm: `normalize(company)|normalize(title)|normalizeUrl(url)`
  - Detects duplicates within current DB
  - Detects duplicates within staged DB
  - Identifies overlapping jobs between databases
  - Fast read-only analysis

- **Toasts**: lightweight success/error/info notifications across flows.
  - Context-based provider (zero dependencies)
  - Auto-dismiss after 3.5 seconds
  - Three types: success, error, info
  - Positioned top-right, non-intrusive
  - Accessible with ARIA attributes

- **Status History**: PATCH `/api/jobs/:id/status` + history modal and tests.
  - Append-only status_history table
  - GET `/api/jobs/:id/history` endpoint
  - Timeline view with relative timestamps
  - StatusSelect component with save button
  - HistoryModal with visual timeline

### Tests
- Playwright e2e: attachments (4 tests), backup/restore UI (2 tests with toast assertions), status updates (4 tests)
- Vitest unit tests for status history and database operations
- All tests passing in CI

### Database
- Added `status_history` table for append-only tracking
- Added `size` column to `attachments` table
- Fixed FTS5 configuration (removed content= option to prevent FK issues)
- Migrations: `0000_icy_marrow.sql`, `0001_small_zodiak.sql`

### Technical Improvements
- Used raw SQL in repository to avoid Drizzle-ORM FK issues with FTS5
- Transaction-based status updates for FTS5 trigger compatibility
- Proper error handling and validation with Zod throughout
- Optimistic UI patterns for better UX
- Atomic file operations in restore CLI

### Notes
- Local data folders are gitignored: `data/attachments/`, `data/backups/`, `data/backups/uploads/`, `data/backups/staging/`.
- Autosave backups created in `data/backups/` with timestamp prefixes
- FTS5 search continues to work correctly with all new features

## [0.1.0] - Initial Release
- Basic job tracking with SQLite
- FTS5 full-text search
- Next.js 14 App Router
- Tailwind CSS styling

