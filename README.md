# jotrack

Local-first job application tracking web app built with Next.js + SQLite.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up database
npm run db:migrate
npm run db:seed

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- ✅ Create and track job applications
- ✅ Full-text search (SQLite FTS5)
- ✅ Status tracking (Applied → Phone Screen → Onsite → Offer/Rejected)
- ✅ Status history timeline
- ✅ Beautiful, responsive UI with Tailwind CSS
- ✅ Type-safe API with Zod validation
- ✅ E2E tested with Playwright

## Scripts

- `npm run dev` – Start Next.js dev server at http://localhost:3000
- `npm run build` – Build for production
- `npm run start` – Start production server
- `npm test` – Run unit tests (Vitest)
- `npm run e2e` – Run end-to-end tests (Playwright)
- `npm run db:migrate` – Run database migrations
- `npm run db:seed` – Seed database with sample data
- `npm run db:studio` – Open Drizzle Studio (database GUI)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: SQLite + Drizzle ORM
- **Search**: SQLite FTS5 (full-text search)
- **Styling**: Tailwind CSS
- **Validation**: Zod
- **Testing**: Vitest + Playwright

## Project Structure

```
jotrack/
├── app/
│   ├── api/jobs/route.ts    # Job API endpoints
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Homepage with form & list
│   └── globals.css           # Global styles
├── db/
│   ├── schema.ts             # Drizzle schema
│   ├── client.ts             # Database client
│   ├── repository.ts         # Database operations
│   ├── migrate.ts            # Migration runner
│   ├── seed.ts               # Seed script
│   └── migrations/           # SQL migrations
├── e2e/                      # Playwright tests
├── __tests__/                # Vitest unit tests
├── data/                     # SQLite database files (gitignored)
└── scripts/                  # Setup scripts

```

## Bootstrap (macOS)

For first-time setup on macOS:

```bash
chmod +x scripts/bootstrap-macos.sh
./scripts/bootstrap-macos.sh
```

This installs Homebrew, Node 20, SQLite, and other prerequisites.

## Database

The SQLite database is stored at `./data/jotrack.db` with:

- **jobs**: Job applications with title, company, status, notes
- **status_history**: Timeline of status changes
- **attachments**: File attachments (schema ready, feature coming)
- **job_search**: FTS5 virtual table for full-text search

Search automatically indexes title, company, and notes fields.

