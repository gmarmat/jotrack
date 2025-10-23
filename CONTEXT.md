# JoTrack Repository Context Digest

**Generated**: 2025-10-23  
**Read-only Analysis**: Repository structure, routing, types, TODOs, and lint status.

---

## Git Status

### Current Branch
```
* main (ahead 77, behind 28)
  - 77 commits ahead of origin/main
  - 28 commits behind origin/main
```

### Last 15 Commits (oneline)
```
621f100 fix: Resolve critical syntax error in AnswerPracticeWorkspace.tsx
08c7280 feat: Implement comprehensive E2E test suite with existing data reuse
eaa3d71 fix: Resolve critical build errors and syntax issues
935e415 fix: Resolve Interview Coach function naming and update documentation
5dbc790 fix: Resolve Interview Coach restart error and JD variant display issue
ba4717a fix: Add Interview Coach restart functionality and fix syntax error
240df53 feat: Complete Interview Coach enhancements and E2E testing
6354d87 feat: COMPLETE Interview Coach optimization suite
117e103 fix: CRITICAL - Resolve React object rendering error in practice section
b9e1371 debug: Enhanced debugging for practice section data flow
7932b83 debug: Add debugging and fallbacks to AnswerPracticeWorkspace
1b269d6 docs: Update Agent Reference Guide with comprehensive Interview Coach fixes
5fbe6b7 fix: COMPREHENSIVE Interview Coach blank screen fix
68fec19 fix: CRITICAL - Resolve React Hooks order violation in Interview Coach
2309737 debug: Add loading states and logging to Interview Coach
```

### Diff vs origin/main (Summary)
- **Modified**: ~50 files (core API routes, components, config, migrations)
- **Added**: ~40 files (documentation, e2e tests, scripts, migrations, test fixtures)
- **Deleted**: ~5 files (old scripts, documentation)
- **Total Changes**: 95 files

**Key Added Files**:
- Comprehensive documentation (AGENT_REFERENCE_GUIDE.md, MODEL_SELECTION_ANALYSIS.md, etc.)
- E2E test suite (comprehensive-flow.spec.ts, data-pipeline.spec.ts, interview-coach-full-flow.spec.ts)
- Database migration (009_headhunter_support.sql)
- Test fixtures and data files

---

## API Routes Inventory

### Total Routes: 106

**Breakdown by Domain**:

#### Admin (1)
- `POST /api/admin/prompts` - Admin prompt management

#### AI Services (25)
- `POST /api/ai/analyze` - Analyze user input
- `POST /api/ai/analyze-all` - Batch analysis
- `POST /api/ai/claude/models` - List Claude models
- `POST /api/ai/company-analysis` - Company intelligence
- `POST /api/ai/dry-run` - Test AI calls
- `POST /api/ai/insights` - Extract insights
- `GET /api/ai/keyvault/{get,set,status}` - AI configuration
- `POST /api/ai/optimize-tokens` - Token optimization
- `POST /api/ai/people-analysis` - People profile analysis
- `GET /api/ai/prompts/{view,save,test,versions}` - Prompt management
- `POST /api/ai/rate-limit/reset` - Rate limit control
- `GET /api/ai/runs` - List analysis runs
- `POST /api/ai/runs/{compare,label,pin,revert}` - Run management
- `POST /api/ai/{session/{start,finish},test-connection,usage}` - Session/health

#### Interview Coach (4)
- `POST /api/interview-coach/[jobId]/score-answer` - Score user answers
- `POST /api/interview-coach/[jobId]/suggest-answer` - AI answer suggestions
- `POST /api/interview-coach/[jobId]/suggest-follow-up` - Discovery questions
- `POST /api/interview-coach/[jobId]/extract-core-stories` - Story extraction

#### Jobs (43)
- `GET /api/jobs` - List jobs
- `POST /api/jobs` - Create job
- `GET /api/jobs/[id]` - Job details
- `POST /api/jobs/[id]/{analyze-all,archive,delete,restore,purge}` - Job lifecycle
- **Analysis**:
  - `/api/jobs/[id]/analysis-data` - Cached analysis results
  - `/api/jobs/[id]/analyze-{company,ecosystem,match-score,user-profile}` - Domain-specific analysis
- **Attachments**:
  - `/api/jobs/[id]/attachments` - Manage job attachments
  - `/api/jobs/[id]/attachments/{versions,trash/{route,purge}}`
  - `/api/jobs/[id]/attachments/versions/make-active` - Version control
- **Coach**:
  - `/api/jobs/[id]/coach/{analyze-profile,generate-{cover-letter,discovery,questions,resume,talk-tracks},mark-applied,optimize-resume,recalculate-score}`
- **Interview Questions**:
  - `/api/jobs/[id]/interview-questions/{generate,search}`
  - `/api/jobs/[id]/interviewer-evidence` - Evidence collection
- **Signals & Metadata**:
  - `/api/jobs/[id]/evaluate-signals` - ATS signal evaluation
  - `/api/jobs/[id]/check-staleness` - Data freshness check
  - `/api/jobs/[id]/status{,-details,-events}` - Status tracking
  - `/api/jobs/[id]/history` - Job history
  - `/api/jobs/[id]/notes/all` - Job notes
  - `/api/jobs/[id]/summarize-notes` - Note summarization
  - `/api/jobs/[id]/meta` - Job metadata
  - `/api/jobs/[id]/match-skills-local` - Local skill matching
- **People Management**:
  - `/api/jobs/[id]/people/{extract,manage,update,update-role}` - People profiles
- **Bulk Operations**:
  - `/api/jobs/{archived,bulk-delete,bulk-status,duplicate,search,trash}`

#### Attachments (3)
- `DELETE /api/attachments/[id]/delete` - Soft delete
- `POST /api/attachments/[id]/purge` - Hard delete
- `POST /api/attachments/[id]/restore` - Restore deleted
- `GET /api/attachments/[id]/variants` - Version history

#### Files & Conversion (5)
- `POST /api/files/extract` - Extract text from files
- `GET /api/files/preview` - File preview
- `GET /api/files/stream` - Stream file content
- `POST /api/convert/to-pdf` - Convert to PDF
- `POST /api/convert/rtf-html` - Convert RTF to HTML

#### Knowledge Base (4)
- `GET /api/knowledge/company` - Company knowledge
- `POST /api/knowledge/people/batch` - People knowledge batch
- `GET /api/knowledge/role` - Role knowledge
- `POST /api/knowledge/skills/normalize` - Skill normalization

#### System (7)
- `GET /api/health` - Health check
- `POST /api/backup` - Database backup
- `POST /api/db/reconnect` - Reconnect database
- `POST /api/restore` - Database restore
- `POST /api/restore/apply-ui` - Apply restore UI
- `POST /api/restore/dedup` - Deduplication
- `POST /api/export/{csv,job-zip/[id]}` - Export data
- `POST /api/scrape` - Web scraping
- `POST /api/settings/stale-threshold` - Settings
- `GET /api/user/profile` - User profile

#### Analyze (1)
- `POST /api/analyze/example` - Example analysis

---

## Pages & Layouts

### App Pages (8)
```
/                        → Home page
/app/layout.tsx          → Root layout
/admin/prompts/[kind]    → Admin prompt editor
/coach/[jobId]           → Application Coach
/interview-coach/[jobId] → Interview Coach
/jobs/[id]               → Job detail page
/profile                 → User profile
/playground              → Playground/testing
```

---

## Exported Types & Interfaces (Key Selection)

### Core Types
- `JobStatus` - "ON_RADAR" | "APPLIED" | "PHONE_SCREEN" | "ONSITE" | "OFFER" | "REJECTED"
- `AttachmentKind` - "resume" | "jd" | "cover_letter" | "other"
- `HasKind` - "resume" | "jd" | "cover_letter" | "notes"
- `MatchScoreCategory` - "poor" | "good" | "excellent"
- `SearchParams` - URL query parameters

### Analysis & AI
- `AnalysisState` - Analysis workflow state
- `AnalysisBundle` - Complete analysis context
- `AnalysisResult` - Analysis output
- `PromptExecutionParams` / `PromptExecutionResult` - Prompt execution
- `AiSettings` / `AiProviderConfig` / `AiError` - AI configuration
- `ModelPricing` - Model cost data

### Matching & Scoring
- `MatchScoreOutput` - Match scoring results
- `SkillMatch` / `SkillsMatchOutput` - Skill matching
- `ParameterScore` - Individual parameter scores
- `Signal` / `SignalConfidence` / `OverallConfidence` - Signal data

### Interview & Career
- `SearchedQuestion` - Interview question data
- `CareerTrajectoryAnalysis` - Career progression
- `RoleLevelAnalysis` - Role level assessment
- `ScopeAnalysis` - Scope metrics
- `CompetitiveContextAnalysis` - Competitive advantages
- `InterviewerValidation` - Interviewer profiles
- `WeaknessFraming` - Weakness guidance frames

### Web Intelligence
- `WebIntelligence` / `TavilyResponse` - Web search results
- `CompanyEcosystemOutput` - Company ecosystem analysis
- `SalaryData` / `SuccessPrediction` - Market data

### Utility
- `VersionRec` - Attachment version record
- `TimeDelta` - Time measurements
- `Source` - Data source tracking

---

## Feature Flags & Environment Variables

### Environment Variables Used
```
process.env.AI_ENCRYPTION_KEY        # AI settings encryption key
process.env.JOTRACK_ENABLE_CONVERTER # Enable PDF/RTF conversion (must = "1")
process.env.JOTRACK_MAX_FILE_MB      # Max file size in MB
process.env.JOTRACK_MAX_GLOBAL_MB    # Max global storage in MB
process.env.JOTRACK_MAX_PER_JOB_MB   # Max per-job storage in MB
process.env.NODE_ENV                 # Node environment
```

### Feature Flags Found
**None explicit ENABLE_/EXPERIMENT_/FEATURE_/FLAG_ constants defined**  
(Feature control primarily through environment variables above)

---

## TODO/FIXME/HACK Comments (40 Found)

### Interview Coach (0)
*None - interview coach features well-implemented*

### Coach Mode (3)
- `app/coach/[jobId]/page.tsx:212` - TODO: Save finalized resume as new attachment
- `app/components/interview-coach/FinalCheatSheet.tsx:51` - TODO: Implement email functionality
- `app/components/interview/InterviewQuestionsCard.tsx:66` - TODO: Load cached data from analysis-data endpoint

### AI & Analysis (13)
- `app/components/ai/UnifiedAiPanel.tsx:87` - TODO: Extract from attachments
- `app/components/ai/CompanyIntelligenceCard.tsx:127` - TODO: Implement API call to company-search
- `app/components/ai/CompanyIntelligenceCard.tsx:146` - TODO: Process with AI to summarize
- `app/api/ai/people-analysis/route.ts:60` - TODO: Use people data instead of URLs
- `app/api/ai/analyze-all/route.ts:110` - TODO: Implement skills-specific endpoint
- `app/api/jobs/[id]/interview-questions/generate/route.ts:175-205` - TODO: Extract careerLevel, industryTenure, stabilityScore from Tier 3 (×3)
- `app/api/jobs/[id]/analyze-user-profile/route.ts:47,50,76-77` - TODO: Fetch profiles, merge data (×4)
- `app/api/jobs/[id]/analyze-ecosystem/route.ts:44,54,127,131` - TODO: Extract industry/seniority, calculate confidence (×4)

### Interview Questions (2)
- `app/api/jobs/[id]/evaluate-signals/route.ts:24` - TODO: Replace with real AI call
- `app/jobs/[id]/page.tsx:346` - TODO: Get signal weight from ats_signals table

### Signal Extraction (4)
- `lib/interview/signalExtraction.ts:64` - TODO: Implement prestige scoring
- `lib/interview/signalExtraction.ts:71` - TODO: Implement pivot detection
- `lib/interview/signalExtraction.ts:105,109` - TODO: Extract company/industry (×2)

### Data Extraction & Processing (5)
- `lib/interview/redFlagFraming.ts:93` - TODO: Pass JD text to detectLevelJump
- `lib/ai/analysisOrchestrator.ts:156,168` - TODO: Save/load from database (×2)
- `lib/extraction/extractors/resumeExtractor.ts:7,45` - TODO: Replace with AI extraction (×2)
- `lib/fileContent.ts:107` - TODO: Install pdf-parse for PDF analysis

### UI (1)
- `app/components/timeline/HeaderMeta.tsx:116` - TODO: Navigate to user profile or open modal

**Priority Assessment**:
- **High**: AI-driven extraction (PDF, resume), database persistence
- **Medium**: Ecosystem enrichment, prestige scoring
- **Low**: UI navigation, email functionality

---

## Lint Status

### Total Warnings/Errors: ~40+

#### Error Categories

**Unescaped HTML Entities** (6 errors):
- Files: `app/coach/[jobId]/page.tsx`, `app/components/AllVariantsViewerModal.tsx`
- Issue: `'` and `"` in JSX not escaped (use `&apos;`, `&quot;`)

**Image Optimization** (5 warnings):
- Files: `AttachmentViewerModal.tsx`, `AttachmentsModal.tsx`, `AttachmentsPanel.tsx`, `FileViewer.tsx`
- Issue: Using `<img>` instead of Next.js `<Image />` (performance)

**React Hooks Dependencies** (13+ warnings):
- Files: Multiple pages and components
- Issue: Missing dependencies in `useEffect` hooks
- Top offenders:
  - `[kind]/page.tsx` - `loadPrompt`
  - `coach/[jobId]/page.tsx` - `loadCoachState`
  - `AllVariantsViewerModal.tsx` - `fetchAllVariants`
  - `VariantViewerModal.tsx` - `fetchVariants`

**Ref Value Instability** (2 warnings):
- `AttachmentsPanel.tsx` - Refs changed during cleanup

---

## Build & Test Scripts

### Available Commands
```bash
npm run dev              # Start dev server (port 3000)
npm run dev:network     # Dev on 0.0.0.0 (network accessible)
npm run dev:clean       # Clean cache + dev
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # ESLint check (106+ routes, current errors above)
npm run clean           # Clear build artifacts
npm run test            # Unit tests (currently skipped due to tinypool issue)
npm run test:vitest     # Vitest runner
npm run test:watch      # Vitest watch mode
npm run e2e             # Playwright E2E tests
npm run e2e:ui          # Playwright UI mode
npm run e2e:headed      # Headed browser
npm run e2e:debug       # Debug mode
npm run e2e:report      # Show last report
npm run db:migrate      # Database migrations
npm run db:seed         # Seed database
npm run db:studio       # Drizzle Studio
npm run eval:prompts    # Evaluate prompts
npm run release:tag     # Tag release v0.2
```

### Test Status
- **Unit Tests**: Skipped (tinypool path resolution issue)
- **E2E Tests**: Comprehensive suite available (3 main specs: comprehensive-flow, data-pipeline, interview-coach-full-flow)
- **Lint**: 1 error exit code (multiple warnings, 6 errors reported above)

---

## Database Schema Highlights

### Key Tables
- `jobs` - Job postings (with status, coaching, match scores)
- `coach_state` - Interview Coach state (data_json, interview_coach_json)
- `attachments` - File attachments (resume, JD, cover letter) with versioning
- `people_analyses` - Interviewer profiles
- `interview_questions_cache` - Web intelligence cache
- `ats_signals` - ATS signal evaluation results
- `migrations` - Schema version tracking

### Recent Migrations
```
009_headhunter_support.sql - Headhunter feature support (added Oct 2025)
```

---

## Architecture Insights

### Core Domains
1. **Jobs Management** - Job posting CRUD, status tracking, notes
2. **Analysis Engine** - 8-layer context analysis (writing style, JD, resume, match, ecosystem, people, signals, web intel)
3. **Interview Coach** - Answer scoring, discovery questions, talk track generation
4. **Attachments** - File upload, preview, versioning with soft-delete
5. **AI Integration** - Multi-model support (Claude, GPT), cost tracking, prompt management
6. **Knowledge Base** - Companies, roles, skills, people profiles

### Key Features
- Interview Coach with discovery questions & score impact testing
- Talent ecosystem analysis (companies, competitors, people)
- Writing style analysis & resume optimization
- Multi-file attachment versioning
- AI model switching (Claude/GPT with configurable settings)
- Web intelligence integration (Tavily search)
- PII redaction before AI calls

### Critical Paths
- Analysis (refresh variants) → Job analysis → Interview questions
- Interview Coach → Answer scoring → Discovery questions → Re-scoring
- Job detail → Attachments → Versions → Analysis refresh

---

## Known Issues & Priorities

### Lint Errors (Fix Needed)
- HTML entity escaping in JSX (6 errors)
- Image optimization (5 warnings) - Performance impact

### Hook Dependency Warnings (Address Soon)
- Multiple pages missing dependencies in useEffect
- Risk: Stale closures, memory leaks

### TODOs (By Priority)
- **Critical**: PDF extraction, database persistence for analysis
- **High**: Company prestige scoring, ecosystem enrichment
- **Medium**: Skills extraction enhancements
- **Low**: UI polish, email integration

---

## File Statistics

### Source Files
- **TypeScript**: ~80 files (app/, lib/, db/)
- **React Components**: ~50+ TSX files
- **API Routes**: 106 route.ts files
- **Documentation**: 40+ MD files
- **Tests**: 3 main E2E specs + fixtures

### Key Component Organization
```
app/
├── api/              # 106 API routes
├── components/       # React components (modular by domain)
│   ├── interview-coach/
│   ├── coach/
│   ├── ai/
│   ├── attachments/
│   └── ...
├── [jobId]/page.tsx
├── interview-coach/[jobId]/page.tsx
└── ...

lib/
├── analysis/         # Analysis engine
├── coach/           # Interview Coach logic
├── interview/       # Signal extraction, framing
├── extraction/      # Text extraction
└── ai/              # AI orchestration

db/
├── schema.ts        # Database schema
├── migrations/      # Schema migrations
└── *.ts             # Data access

e2e/
└── *.spec.ts        # Playwright tests
```

---

## Deployment Notes

- **Node Version**: Requires Node 18+
- **Database**: SQLite (better-sqlite3)
- **Next.js**: 14.2.33+
- **Auth**: Not visible in current scope (user context assumed)
- **Payments**: Via AI model usage (Claude, GPT pricing)
- **Storage**: Local file attachments + database

---

**End of Context Digest**

