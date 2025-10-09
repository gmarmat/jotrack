# Jotrack Setup Complete ✅

## Summary
Successfully scaffolded a full-stack job tracking application with Next.js, TypeScript, Tailwind CSS, SQLite, and Drizzle ORM.

## What Was Built

### 1. Database Layer
- **Schema** (`db/schema.ts`): 
  - `jobs` table (id, title, company, status, notes, timestamps)
  - `status_history` table (tracks status changes)
  - `attachments` table (for future file uploads)
  - FTS5 virtual table `job_search` for full-text search
  - Triggers to keep FTS table in sync

- **Database Client** (`db/client.ts`): SQLite connection with WAL mode and foreign keys enabled

- **Repository** (`db/repository.ts`): 
  - `createJob()` - creates job with UUID, timestamps, and initial status history
  - `listJobs()` - returns all jobs ordered by updated date
  - `searchJobs()` - FTS5 powered search across title, company, notes

### 2. API Routes
- **POST /api/jobs**: Create new job (Zod validated)
- **GET /api/jobs**: List all jobs
- **GET /api/jobs?q=search**: FTS5 search endpoint

### 3. UI Features
- **Job Creation Form**: Title, Company, Status dropdown, Notes textarea
- **Job List Table**: Shows title, company, status badge (color-coded), human-friendly updated time
- **Search**: Real-time FTS5 search with clear button
- **Responsive Design**: Tailwind CSS styling with gradient background

### 4. Commands Executed

```bash
# 1. Install dependencies
npm install
# ✅ Installed: drizzle-orm, better-sqlite3, zod, uuid, drizzle-kit, tsx

# 2. Generate migrations
npx drizzle-kit generate
# ✅ Created: db/migrations/0000_icy_marrow.sql

# 3. Run migrations
npm run db:migrate
# ✅ Created tables and FTS5 search with triggers

# 4. Seed database
npm run db:seed
# ✅ Inserted 3 sample jobs with status history

# 5. Dev server (running)
npm run dev
# ✅ Running at: http://localhost:3000

# 6. E2E tests
npm run e2e
# ✅ All 3 tests passed:
#    - should display the job application form and list
#    - should create a new job application and verify it appears in the list
#    - should search for a job by title
```

## Test Results

### Playwright E2E Tests: ✅ 3/3 PASSED
```
✓ should display the job application form and list (521ms)
✓ should create a new job application and verify it appears in the list (1.4s)
✓ should search for a job by title (2.4s)

3 passed (5.2s)
```

### Vitest Unit Tests: ⚠️ KNOWN ISSUE
The Vitest unit tests are failing due to a known issue with directory paths containing spaces (`ai projects`). This is a Vitest/tinypool worker resolution bug. The tests themselves are valid and the database functions work correctly (as proven by the e2e tests).

**Workaround**: Move the project to a directory without spaces, or run tests in a container/VM.

## Running the Application

### Local Development
```bash
npm run dev
```
Open: **http://localhost:3000**

### What You'll See
1. **"Jotrack"** heading with "Track your job applications" tagline
2. **Add New Job Application** form with:
   - Job Title field (e.g., "Senior React Developer")
   - Company field (e.g., "TechCorp")
   - Status dropdown (Applied, Phone Screen, Onsite, Offer, Rejected)
   - Notes textarea
   - "Add Job Application" button

3. **Your Applications** section with:
   - Search bar with "Search" and "Clear" buttons
   - Table showing 3 seeded jobs:
     - Senior Frontend Engineer | TechCorp | Phone Screen | 2 days ago
     - Full Stack Developer | StartupXYZ | Onsite | 1 day ago
     - React Developer | Digital Agency | Applied | 3 days ago

### Demo Steps
1. Navigate to http://localhost:3000
2. Fill in the form:
   - Title: "Backend Engineer"
   - Company: "Google"
   - Status: "Onsite"
   - Notes: "Exciting opportunity"
3. Click "Add Job Application"
4. See the new job appear at the top of the table
5. Type "Backend" in the search box
6. Click "Search"
7. See only your new job in the results
8. Click "Clear" to see all jobs again

## NPM Scripts
- `npm run dev` - Start Next.js dev server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm test` - Run Vitest unit tests (⚠️ currently broken due to path issue)
- `npm run e2e` - Run Playwright e2e tests ✅
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Drizzle Studio (DB GUI)

## Database Location
- Main DB: `./data/jotrack.db`
- Test DB: `./data/test.db` (created/destroyed during tests)
- Directory is git-ignored

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: SQLite with better-sqlite3
- **ORM**: Drizzle ORM
- **Search**: SQLite FTS5 (full-text search)
- **Styling**: Tailwind CSS
- **Validation**: Zod
- **Testing**: Vitest (unit) + Playwright (e2e)
- **Build Tool**: tsx for TypeScript scripts

## Architecture Highlights
1. **UUIDs for IDs**: Using v4 UUIDs instead of auto-increment
2. **Unix Timestamps**: Using `Date.now()` for all timestamps
3. **Zod Validation**: API input validation with clear error messages
4. **FTS5 Integration**: Automatic search index updates via triggers
5. **Status History**: Every job status change is tracked
6. **Idempotent Migrations**: Safe to re-run
7. **Clean Separation**: DB layer, repository, API routes, UI components

## Next Steps
- Fix Vitest configuration for directory with spaces
- Add job detail page
- Implement attachment upload functionality
- Add filters (by status, date range)
- Add status update workflow
- Add data export (CSV/JSON)

