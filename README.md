# Jotrack

Local-first, privacy-friendly job tracker. Runs at `http://localhost:3000`.

> **v0.2 highlights**: Attachments (upload/preview/delete), Status History, full Backup/Restore (UI + CLI), Duplicates Preview, toasts, e2e tests.

## Features

- ⚡ **Local-first** SQLite (Drizzle + better-sqlite3), FTS5 search
- 📝 **Jobs CRUD** + Status updates with append-only history
- 📎 **Attachments**: upload/list/preview/download/delete (per job)
- 💾 **Backup/Restore**:
  - Backup UI button → ZIP (DB + attachments), streams + saves to `./data/backups/`
  - Restore UI (stage → dedup → apply) with autosave + duplicate-aware merge
  - CLI apply (atomic DB replacement) for full restores when server is stopped
- 🔎 **Duplicates Preview**: fingerprint = `normalize(company)|normalize(title)|normalizeUrl(url host+path)`
- 🔔 **Toast notifications**: clear UX feedback for all operations
- ✅ **Tests**: Playwright e2e, Vitest unit tests

## Quick Start

```bash
npm install
npm run db:migrate
npm run db:seed      # (optional) add sample data
npm run dev
# Visit http://localhost:3000
```

## Backup & Restore

### Backup (UI)

1. Click **"Backup (ZIP)"** on the homepage
2. A ZIP downloads to your browser
3. A copy is automatically saved to `./data/backups/jotrack-backup-<timestamp>.zip`

**What's included:**
- SQLite database files (`jotrack.db`, `jotrack.db-wal`, `jotrack.db-shm`)
- Complete `attachments/` directory with all job attachments

### Restore (UI — recommended, server can stay running)

1. Click **"Restore…"** on the homepage
2. Upload a backup ZIP → **staging happens** (no live changes yet)
3. **Duplicates Preview** appears showing:
   - Duplicates within current DB
   - Duplicates within staged ZIP
   - Overlap (jobs that exist in both)
4. Choose your import settings:
   - **Import strategy**: 
     - `Skip duplicates` (default, safer) - Uses fingerprinting to avoid dupes
     - `Import all` - May create duplicates
   - **Attachments**: 
     - `Merge` (default) - Adds new files, keeps existing
     - `Replace` (dangerous) - Deletes existing attachments first
5. Click **"Apply Restore"**
   - Autosave backup created automatically
   - Rows inserted transactionally
   - Attachments copied/merged
   - Success toast with inserted/skipped counts

### Restore (CLI — full replacement, stop server first)

**Use when:** You want complete DB replacement (dev/staging environments)

```bash
# 1. Stop the dev server (Ctrl+C or kill it)

# 2. Dry run (no changes, shows what would happen)
npm run restore:apply -- --staging <STAGING_ID> --dry-run

# 3. Apply for real (merge attachments by default)
npm run restore:apply -- --staging <STAGING_ID>

# 4. Replace attachments entirely (optional)
npm run restore:apply -- --staging <STAGING_ID> --clean-attachments

# 5. Restart dev server
npm run dev
```

**CLI Flags:**
- `--staging <ID>` - Required: staging folder ID from UI
- `--dry-run` - Test without making changes
- `--clean-attachments` - Replace attachments instead of merging
- `--force` - Skip safety checks

## Safety Features

### Autosave Backups
- Created automatically before **every** restore apply (UI and CLI)
- Saved to `./data/backups/jotrack-autosave-before-*.zip`
- Provides rollback option if restore goes wrong

### Duplicate Detection
- **Fingerprint algorithm**: `normalize(company) | normalize(title) | normalizeUrl(url)`
- **URL normalization**: Strips query strings and fragments, keeps host + path
- **Text normalization**: Lowercase, trim, collapse whitespace
- **Default behavior**: Skip duplicates to prevent data pollution

### Atomic Operations
- **UI apply**: Transaction-based INSERT (all-or-nothing)
- **CLI apply**: Atomic file copy (write to temp, rename over destination)
- Both approaches ensure data consistency

## Duplicates — How We Detect

**Fingerprint formula:**
```
normalize(company) | normalize(title) | normalizeUrl(url host+path)
```

**Example:**
- Job 1: company="TechCorp", title="Senior Engineer", url="https://techcorp.com/jobs/123?ref=linkedin"
- Job 2: company="TECHCORP", title="senior engineer", url="https://techcorp.com/jobs/123"
- **Fingerprint**: Both → `techcorp|senior engineer|techcorp.com/jobs/123`
- **Result**: Detected as duplicates ✅

**In the UI:**
- Duplicates Preview shows counts before you apply
- Default import strategy skips duplicates automatically
- Change to "Import all" if you want to keep duplicates

## Attachments

**Per job, you can:**
- Upload files (pdf, png, jpg, jpeg, webp, txt) up to 10MB
- View list (newest first) with file sizes and relative times
- Preview images inline (PNG/JPG/WEBP)
- Download any file
- Delete with confirmation (optimistic UI)

**Storage:** `./data/attachments/<jobId>/<filename>`

**Features:**
- Smart filename conflict resolution (adds `(1)`, `(2)`, etc.)
- Optimistic UI for upload and delete
- File type validation and size limits
- Sanitized filenames for security

## Status History

**Track job application progress:**
- Update status via dropdown (Applied → Phone Screen → Onsite → Offer → Rejected)
- View complete history timeline with relative timestamps
- Append-only history (never loses data)

**Endpoints:**
- `PATCH /api/jobs/:id/status` - Update status
- `GET /api/jobs/:id/history` - View timeline

## Tests

```bash
# E2E tests (Playwright) - Primary test suite
npm run e2e

# Specific test suites
npm run e2e -- attachments.spec.ts
npm run e2e -- backup_restore_ui.spec.ts
npm run e2e -- homepage.spec.ts
```

**Coverage:**
- ✅ Status updates and history (4 tests)
- ✅ Attachments upload/preview/delete (4 tests)
- ✅ Backup download (1 test)
- ✅ Restore staging + dedup + apply (1 comprehensive test)
- ✅ Toast notifications (integrated assertions)

**Note:** Unit tests (Vitest) are currently skipped due to a tinypool path resolution issue with hyphens in the project path. E2E tests provide comprehensive coverage. See `KNOWN_ISSUES.md` for details and workarounds.

## Development

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed sample data
npm run db:studio    # Open Drizzle Studio (DB GUI)
```

## Troubleshooting

### "Restore apply failed"
- Check toast messages for specific error
- Try again with "Skip duplicates" strategy
- For full replacement, stop server and use CLI

### "Download didn't start"
- Check browser pop-up blocker settings
- Some browsers require user interaction before download

### "Upload error: File too large"
- Attachments limited to 10MB
- Compress images or split into multiple files

### "SQLITE_ERROR" or database locked
- Stop dev server before using CLI restore
- UI restore works with server running (uses INSERT, not file replacement)

## Project Structure

```
jotrack/
├── app/
│   ├── api/                    # API routes
│   │   ├── jobs/               # Jobs CRUD + status/history/attachments
│   │   ├── backup/             # ZIP backup endpoint
│   │   └── restore/            # Staging, dedup, apply endpoints
│   ├── components/             # React components
│   │   ├── StatusSelect.tsx
│   │   ├── HistoryModal.tsx
│   │   ├── AttachmentsModal.tsx
│   │   ├── BackupRestorePanel.tsx
│   │   ├── RestoreModal.tsx
│   │   └── ToastProvider.tsx
│   └── page.tsx                # Homepage
├── db/
│   ├── schema.ts               # Drizzle schema
│   ├── migrations/             # SQL migrations
│   └── repository.ts           # Data access layer
├── lib/
│   ├── attachments.ts          # File handling helpers
│   ├── backup.ts               # ZIP creation
│   ├── restore.ts              # ZIP extraction & planning
│   └── dedup.ts                # Duplicate detection
├── e2e/                        # Playwright tests
├── scripts/
│   └── apply-restore.mjs       # CLI restore tool
└── data/                       # Local data (gitignored)
    ├── jotrack.db              # SQLite database
    ├── attachments/            # Job attachments
    └── backups/                # Backup ZIPs
```

## License & Privacy

© 2025. MIT License.

**Privacy:** All data stays local in `./data/`. Nothing is sent to external servers. Your job search data is yours alone.

## Contributing

PRs welcome! Please:
1. Write tests for new features (Playwright for e2e, Vitest for units)
2. Run `npm run lint` before committing
3. Update CHANGELOG.md for notable changes

---

**Need help?** Open an issue on GitHub or check the existing e2e tests for usage examples.
