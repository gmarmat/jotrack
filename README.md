[![CI](https://github.com/gmarmat/jotrack/actions/workflows/ci.yml/badge.svg)](https://github.com/gmarmat/jotrack/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/gmarmat/jotrack?sort=semver&display_name=release)](https://github.com/gmarmat/jotrack/releases)

# JoTrack - AI-Powered Job Application Coach

**Smart job tracking + AI-powered interview prep in one beautiful app.**

Local-first, privacy-friendly. Your data never leaves your machine. Runs at `http://localhost:3000`.

> **v2.7 highlights**: AI Analysis (Match Matrix, Company Ecosystem, People Profiles), Document Variants (ai_optimized for cost savings), 7-Day Caching, Beautiful Dark Mode with Gradients, Settings UI for BYOK (Bring Your Own Key).

## ✨ Features

### 🎯 Core Job Tracking
- ⚡ **Local-first** SQLite (Drizzle + better-sqlite3), FTS5 full-text search
- 📝 **Jobs CRUD** with 9 status stages (Applied → Offer/Rejected)
- 📎 **Smart Attachments** (PDF/DOCX): upload, preview, version management
- 📊 **Status History** timeline with append-only tracking
- 🔍 **Instant Search** across all jobs (company, title, notes)
- 💾 **Backup/Restore** with duplicate detection and merge strategies
- 🌙 **Beautiful Dark Mode** with section-specific gradients
- 🔔 **Toast Notifications** for all user actions

### 🤖 AI-Powered Analysis (v2.7)

**📋 Match Matrix** - ATS Signal Evaluation
- Analyzes resume against 30 standard ATS signals + up to 30 job-specific signals
- Evidence-based scoring (JD vs Resume comparison)
- Category breakdown with weights
- Trend tracking (🔼🔽 for v1 vs v2 comparisons)
- Icons: ⚙️ (ATS), ✨ (Dynamic), ⚙️✨ (Both - extra important!)

**🏢 Company Intelligence** - Target Company Research
- Company profile (founded, size, funding, revenue)
- Culture & values analysis
- Leadership backgrounds
- Key competitors
- Recent news and milestones

**📈 Company Ecosystem** - Competitive Landscape
- 10 companies analyzed (5 direct, 3 adjacent, 2 complementary)
- 15+ data points per company (size, CEO, news, hiring trends)
- Market relevance scores (0-100%)
- Interview prep insights
- **7-day caching** (95% cost savings!)
- Full modal with 3 tabs (Intelligence, Sources, Insights)

**👥 People Profiles** - Interview Prep
- LinkedIn profile analysis (recruiters, hiring managers, peers)
- Communication style detection
- Background & expertise mapping
- "What this means for you" insights
- Team dynamics and cultural fit analysis

**📊 Match Score** - Quick Overview
- Overall match percentage
- Highlights (✓ strengths)
- Gaps (△ areas to improve)
- Top 3 recommendations

### 💾 Smart Data Management

**Document Variant System** (95% token savings!):
- **`raw`** - Original text (local extraction, $0)
- **`ai_optimized`** - Structured for AI ($0.01 per doc)
- **`detailed`** - Enriched with metadata ($0.01 per doc)
- Create once, reuse for all analyses

**Intelligent Refresh Detection**:
- Detects "significant changes" vs minor edits
- Smart banners guide user through data pipeline
- 4 states: No Variants 🟣, Ready 🔵, Stale 🟠, Fresh 🟢

**3-Column Variant Viewer**:
- Side-by-side comparison of all 3 variants
- See how AI optimized your documents
- Understand what's sent to AI for analysis

### 🔐 Privacy & Security

- **BYOK (Bring Your Own Key)**: Use YOUR OpenAI/Anthropic API key
- **Encrypted Storage**: Keys stored in SQLite with AES-256-CBC
- **Local-First**: All data stays on your machine
- **No Tracking**: Zero telemetry, zero external API calls (except AI when you click)
- **Open Source**: Full transparency, audit the code yourself

## ⚡ Quick Start

### 1. Install & Run

```bash
git clone https://github.com/gmarmat/jotrack.git
cd jotrack
npm install
npm run db:migrate    # Set up database
npm run db:seed       # (Optional) Add 3 sample jobs
npm run dev           # Start dev server
```

Visit `http://localhost:3000` 🎉

### 2. Set Up AI Features (Optional but Recommended)

**To enable AI analysis:**

1. Get an OpenAI API key: https://platform.openai.com/api-keys
2. Click **⚙️ Settings** (top-right corner)
3. Go to **"AI & Privacy"** tab
4. Enter your API key
5. Click **"Save Settings"**
6. Done! AI features now work ✅

**Cost**: ~$0.22 per full job analysis with `gpt-4o-mini` (recommended model)

**Without AI key**: App works perfectly for job tracking, you just won't get AI insights.

### 3. Analyze Your First Job

1. **Create a job** (+ New Job button)
2. **Upload documents** (Resume + Job Description)
3. **Click "Refresh Data"** (~$0.02 - creates AI-optimized variants)
4. **Click "Analyze Ecosystem"** (~$0.15 - research 10 companies)
5. **Review insights** in the beautiful gradient sections!
6. **Update resume** based on Match Matrix gaps
7. **Re-upload → Re-analyze** to see improvements 🔼

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

## 📁 Project Structure

```
jotrack/
├── app/
│   ├── api/                              # API routes
│   │   ├── jobs/                         # Jobs CRUD + analysis
│   │   │   ├── [id]/
│   │   │   │   ├── refresh-variants/    # Create AI variants (~$0.02)
│   │   │   │   ├── analyze-ecosystem/   # Company research (~$0.15)
│   │   │   │   ├── evaluate-signals/    # Match Matrix (~$0.05)
│   │   │   │   ├── check-staleness/     # Detect changes
│   │   │   │   └── attachments/         # File uploads
│   │   ├── ai/
│   │   │   ├── keyvault/                # API key management (encrypted)
│   │   │   └── prompts/                 # Prompt viewer
│   │   ├── backup/                      # ZIP backups
│   │   └── restore/                     # Restore with dedup
│   ├── components/
│   │   ├── ai/                          # AI analysis components
│   │   │   ├── CompanyEcosystemTableCompact.tsx
│   │   │   ├── FullEcosystemModal.tsx
│   │   │   ├── CompanyIntelligenceCard.tsx
│   │   │   ├── PeopleProfilesCard.tsx
│   │   │   └── PromptViewer.tsx
│   │   ├── coach/tables/
│   │   │   └── FitTable.tsx            # Match Matrix
│   │   ├── ui/
│   │   │   └── AnalysisExplanation.tsx # Standard pattern
│   │   ├── jobs/
│   │   │   └── AiShowcase.tsx          # Main analysis container
│   │   └── GlobalSettingsModal.tsx      # ⚙️ Settings UI
│   ├── jobs/[id]/                       # Job detail page
│   └── page.tsx                         # Homepage
├── core/ai/
│   ├── prompts/                         # AI prompt templates
│   │   ├── ecosystem.v1.md
│   │   ├── company.v1.md
│   │   └── people.v1.md
│   └── promptLoader.ts                  # Template engine
├── lib/
│   ├── coach/
│   │   └── aiProvider.ts                # AI integration (BYOK)
│   ├── extraction/
│   │   └── extractionEngine.ts          # Variant creation
│   └── matchSignals.ts                  # 30 ATS signals
├── db/
│   ├── schema.ts                        # 12 tables
│   ├── migrations/                      # SQL migrations
│   ├── signalRepository.ts              # Signal CRUD
│   └── companyEcosystemCacheRepository.ts  # 7-day cache
├── e2e/                                 # Playwright tests
└── data/                                # Local data (gitignored)
    ├── jotrack.db                       # SQLite database
    ├── attachments/                     # Uploaded files
    └── backups/                         # Backup ZIPs
```

## 💰 Costs & Pricing

**JoTrack is free** - you only pay for AI API usage (your own OpenAI key):

| Operation | Cost | Frequency |
|-----------|------|-----------|
| Refresh Data | ~$0.02 | Once per doc upload |
| Analyze Match Matrix | ~$0.05 | Per analysis |
| Analyze Company | ~$0.05 | Per analysis |
| Analyze Ecosystem | ~$0.15 | Once per week (cached!) |
| Analyze People | ~$0.05 | Per analysis |
| **Full Job Analysis** | **~$0.22** | Per job |

**Monthly estimates** (with gpt-4o-mini):
- Light use (10 jobs): ~$2/month
- Moderate use (50 jobs): ~$11/month
- Heavy use (100 jobs): ~$22/month

**Cost savings built-in:**
- 95% token reduction (variant reuse)
- 7-day caching (Ecosystem)
- Pay only for what you use

## 📚 Documentation

- **[CURRENT_STATE.md](CURRENT_STATE.md)** - What works, what's in progress
- **[UI_DESIGN_SYSTEM.md](UI_DESIGN_SYSTEM.md)** - Component patterns
- **[TERMINOLOGY_GUIDE.md](TERMINOLOGY_GUIDE.md)** - Naming conventions
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - API endpoints, data structures
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System design
- **[SIGNAL_LEGEND.md](SIGNAL_LEGEND.md)** - ATS signal system
- **[KNOWN_ISSUES.md](KNOWN_ISSUES.md)** - Bugs & workarounds

## 🐛 Known Issues

See [KNOWN_ISSUES.md](KNOWN_ISSUES.md) for full list. Key items:

- **Vitest unit tests** not running (directory path issue)
- **AI analysis** showing sample data (APIs need wiring)
- **Some analyze buttons** not functional yet

**Status**: UI complete ✅, API integration in progress ⚠️

## 🤝 Contributing

PRs welcome! Please:
1. Follow [UI_DESIGN_SYSTEM.md](UI_DESIGN_SYSTEM.md) for new components
2. Check [TERMINOLOGY_GUIDE.md](TERMINOLOGY_GUIDE.md) for naming
3. Write tests (Playwright for E2E)
4. Run `npm run lint` before committing
5. Update [CHANGELOG.md](CHANGELOG.md) for notable changes

## 📄 License

© 2024-2025 Guarav Marmat. MIT License.

**Privacy First:** All data stays local in `./data/`. AI calls only when YOU click. No tracking, no telemetry, no cloud sync. Your job search is private.

---

**Questions?** Check [QUICK_REFERENCE.md](QUICK_REFERENCE.md) or open an issue on GitHub!
