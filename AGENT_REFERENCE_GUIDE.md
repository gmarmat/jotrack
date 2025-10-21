# Agent Reference Guide - JoTrack Development

**Purpose**: Single source of truth for AI assistants working on this codebase  
**Last Updated**: October 21, 2025  
**Status**: Living document - update after major changes

---

## 🎯 Project Overview

**Name**: JoTrack (Job Application Tracking + AI Interview Coach)  
**Stack**: Next.js 14.2.33, React, TypeScript, SQLite, Tailwind CSS  
**AI Providers**: OpenAI (GPT-4o-mini, GPT-4o), Anthropic (Claude 3.5 Sonnet, Claude 3.5 Haiku)  
**Current Phase**: V2.7 - Production-ready with Interview Coach

---

## 📦 Dependencies & Versions

### Working Libraries (DO NOT CHANGE)
```json
{
  "mammoth": "^1.8.0",          // DOCX extraction - WORKS PERFECTLY
  "better-sqlite3": "^11.7.0",  // Database - STABLE
  "drizzle-orm": "^0.36.4",     // ORM - CURRENT
  "next": "14.2.33",            // Next.js - LOCKED (don't upgrade)
  "react": "^18.3.1",           // React - STABLE
  "tailwindcss": "^3.4.1",      // CSS - WORKING
  "lucide-react": "^0.263.1",   // Icons - USE THIS
  "vitest": "^1.6.0",           // Unit tests
  "playwright": "^1.48.2"       // E2E tests
}
```

### PDF Extraction (Special Case)
```json
{
  "pdf-parse": "^2.3.12"   // ✅ WORKS via child process (not direct import!)
}
```

**PDF Extraction Status**: ✅ **FULLY WORKING** (child process architecture)

**CRITICAL**: Never import pdf-parse directly in Next.js files!
- ❌ `import pdfParse from 'pdf-parse'` (breaks webpack)
- ✅ `spawn('node', ['scripts/extract-pdf-standalone.js'])` (works!)

See `PDF_EXTRACTION_SUCCESS_REPORT.md` for details.

---

## 🗄️ Database Schema (SQLite)

### Core Tables
```
jobs                  // Job applications
attachments           // Uploaded files (resume, JD, cover letter)
artifact_variants     // Extracted versions (raw, ai_optimized)
analysis_cache        // AI analysis results (all sections)
analysis_bundles      // Compressed data for staleness checks
job_notes            // User notes
interview_questions  // Generated questions
ats_signals          // 30 standard ATS signals
job_dynamic_signals  // Up to 30 dynamic signals per job
signal_evaluations   // Signal scores with evidence
```

### Key Columns to Always Use
- `id`: UUID (use `randomUUID()`)
- `created_at`: Unix timestamp (milliseconds)
- `updated_at`: Unix timestamp (milliseconds)
- `deleted_at`: Soft delete timestamp (NULL = active)
- `is_active`: Boolean (0/1) for current version

### CRITICAL: Attachment Versioning
```sql
-- Only ONE attachment per kind can be active
SELECT * FROM attachments 
WHERE job_id = ? 
  AND kind = 'resume'  -- or 'jd', 'cover_letter'
  AND is_active = 1    -- MUST filter by this!
  AND deleted_at IS NULL;
```

---

## 📁 File Structure (Key Locations)

### API Routes
```
/app/api/
  /jobs/
    route.ts                              // List/Create jobs
    /[id]/
      route.ts                            // Get/Update/Delete job
      /refresh-variants/route.ts          // Data Pipeline extraction
      /analyze-all/route.ts               // Trigger all analyses
      /analyze-match-score/route.ts       // Match Score section
      /analyze-company-intel/route.ts     // Company Intelligence
      /analyze-skills/route.ts            // Skills section
      /evaluate-signals/route.ts          // Signal evaluation
```

### Core Libraries
```
/lib/
  /extraction/
    textExtractor.ts        // DOCX/TXT extraction (PDF NOT SUPPORTED)
    extractionEngine.ts     // Orchestrates extraction
  /analysis/
    fingerprintCalculator.ts  // Staleness detection
  /coach/
    aiProvider.ts          // Central AI call handler
  matchSignals.ts          // Signal definitions (30 ATS + dynamic)
  evaluateSignals.ts       // Signal scoring logic
```

### Database
```
/db/
  /migrations/           // SQL migration files (numbered 001-008)
  schema.ts             // Drizzle schema definitions
  index.ts              // Database connection
  signalRepository.ts   // Signal data access
  seedAtsSignals.ts     // Seed 30 ATS signals
```

### Prompts
```
/prompts/
  match-score.v1.md               // Match Score analysis
  company-intelligence.v1.md      // Company intel
  skills-analysis.v1.md           // Skills extraction
  interview-questions-*.v1.md     // Interview prep (multiple roles)
  signal-*.v1.md                  // Signal evaluation prompts
```

---

## 🎨 UI/UX Standards

### Colors & Themes
```typescript
// Status Colors
'ON_RADAR'    → gray-500  (Thinking about it)
'APPLIED'     → blue-500  (In progress)
'INTERVIEWING'→ purple-500 (Active)
'OFFER'       → green-500 (Success!)
'REJECTED'    → red-500   (Closed)
'WITHDRAWN'   → gray-400  (User closed)

// Section Colors
Data Pipeline    → blue-600
Match Score      → purple-600
Company Intel    → emerald-600
Skills           → amber-600
Interview Coach  → indigo-600

// Analysis States
Analyzing     → blue spinner + "Analyzing..."
Success       → green checkmark + "Analyzed X ago"
Error         → red X + error message
Stale         → orange/yellow banner + "Re-analysis recommended"
```

### Icons (lucide-react)
```typescript
import { 
  Sparkles,      // AI/Magic (✨)
  Zap,           // Fast/AI-Optimized (⚡)
  FileText,      // Raw text (📄)
  Settings,      // ATS signals (⚙️)
  Eye,           // View/Preview (👁️)
  CheckCircle,   // Active/Success (✓)
  AlertTriangle, // Warning (⚠️)
  TrendingUp,    // Improvement (📈)
  TrendingDown,  // Decline (📉)
  Minus          // No change (—)
} from 'lucide-react';
```

### Button Standards
```typescript
// AI Analysis Buttons (Consistent across all sections)
<button
  onMouseEnter={() => setIsHovered(true)}
  onMouseLeave={() => setIsHovered(false)}
  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
>
  <Sparkles size={18} />
  <span>{isHovered ? `Analyze (~$${cost})` : 'Analyze'}</span>
</button>

// Cost display on hover
// Last analyzed: "Analyzed X minutes/hours/days ago"
```

### Badge Standards
```typescript
// Active Version Badge (Attachments)
<span className="flex items-center gap-1 px-2 py-0.5 text-xs font-semibold 
  bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
  <CheckCircle size={12} />
  ACTIVE
</span>

// Version Badge
<span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 rounded">
  v2
</span>
```

---

## 🤖 AI Integration

### Current Model Usage (as of Oct 21, 2025)

**Primary Model**: Claude 3.5 Sonnet (claude-3-5-sonnet-20241022)  
**Fallback**: GPT-4o-mini (gpt-4-turbo-2024-04-09)

**Cost per 1M tokens**:
- Claude 3.5 Sonnet: $3 input / $15 output
- Claude 3.5 Haiku: $0.25 input / $1.25 output  
- GPT-4o: $2.50 input / $10 output
- GPT-4o-mini: $0.15 input / $0.60 output

### When to Use Which Model

**Claude 3.5 Sonnet** (Default for ALL features):
```typescript
// Use for:
- Match Score analysis (complex reasoning)
- Company Intelligence (research quality)
- Skills analysis (nuanced extraction)
- Interview questions (creative + strategic)
- Signal evaluation (evidence-based scoring)
- Variant creation (text cleaning)

// Cost: ~$0.01-0.05 per analysis
// Quality: Excellent (best available)
```

**GPT-4o-mini** (NOT CURRENTLY USED):
```typescript
// Could use for:
- Simple text extraction (if we ever need it)
- Basic data formatting
- Quick validations

// Cost: ~$0.001-0.005 per task
// Quality: Good for simple tasks
```

### AI Provider Configuration

**File**: `lib/coach/aiProvider.ts`

```typescript
// Model selection logic
const MODEL_CONFIG = {
  'analyze_match_score': 'claude-3-5-sonnet-20241022',
  'analyze_company_intel': 'claude-3-5-sonnet-20241022',
  'analyze_skills': 'claude-3-5-sonnet-20241022',
  'generate_interview_questions': 'claude-3-5-sonnet-20241022',
  'evaluate_signal': 'claude-3-5-sonnet-20241022',
  'create_normalized_variant': 'claude-3-5-sonnet-20241022',
  // ... all use Sonnet
};
```

### API Timeout Settings

**File**: `lib/analysis/promptExecutor.ts`

**CRITICAL**: Timeout is **120 seconds** (not 60!)

```typescript
// ✅ CORRECT timeout for complex prompts
const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 seconds

// Why 120s?
// - Company Ecosystem: JD + web search + 10 companies analysis (~90-120s)
// - Match Score: Resume + JD + skills extraction (~30-60s)
// - Interview Questions: Resume + JD + questions generation (~40-80s)
```

**When to Increase Timeout**:
- ❌ DON'T increase without testing
- ✅ Monitor actual completion times in logs
- ✅ If seeing timeout errors consistently → increase by 30s
- ✅ Max recommended: 180s (3 minutes)

**Debugging Timeouts**:
```bash
# Check server logs for timing
tail -f /tmp/server-startup.log | grep "ecosystem\|timeout"

# Look for:
# ✅ "Analysis complete: X tokens, $Y" = Success
# ❌ "timed out after 120 seconds" = Need more time
```

### Prompt System

**Structure**:
```
/prompts/
  {feature}-{variant}.v{version}.md

Examples:
  match-score.v1.md
  interview-questions-recruiter.v1.md
  signal-technical-skills.v1.md
```

**Prompt Template Variables**:
```typescript
{
  resume_text: string,        // AI-optimized resume variant
  jd_text: string,           // AI-optimized JD variant
  company_name: string,
  job_title: string,
  context: object,           // Additional data
  previous_analysis: object  // For iterative improvements
}
```

**Capability Mapping** (in aiProvider.ts):
```typescript
const CAPABILITY_TO_PROMPT = {
  'analyze_match_score': 'match-score',
  'analyze_company_intel': 'company-intelligence',
  'analyze_skills': 'skills-analysis',
  'generate_interview_questions_recruiter': 'interview-questions-recruiter',
  'evaluate_signal': 'signal-{category}',
  'create_normalized_variant': 'inline-prompt',  // Special case
};
```

---

## 🔄 Data Pipeline (Artifact Variants System)

### The 2-Variant System

**Why 2 variants?**
- Cost optimization: 50% savings vs 3-variant system
- Quality maintained: AI-optimized preserves all facts
- Simple: Raw (free) + AI-Optimized (paid)

**Variants**:
```typescript
1. Raw (raw)
   - Source: Local UTF-8 extraction (mammoth for DOCX, fs.readFile for TXT)
   - Cost: FREE
   - Purpose: Source of truth, backup
   - Token count: 100% (original)
   
2. AI-Optimized (ai_optimized)
   - Source: AI cleaning of raw variant
   - Cost: ~$0.01 per document
   - Purpose: Efficient for downstream AI analysis
   - Token count: 30% (70% reduction)
   - Quality: 100% fact preservation, removes artifacts
```

### CRITICAL: Variant Data Structure

**Database Schema**:
```sql
CREATE TABLE artifact_variants (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,           -- attachment.id or job.id
  source_type TEXT NOT NULL,         -- 'attachment' or 'job_description'
  variant_type TEXT NOT NULL,        -- 'raw' or 'ai_optimized'
  variant TEXT NOT NULL,             -- DEPRECATED (use content.variant)
  content TEXT NOT NULL,             -- JSON: { text, wordCount, variant }
  token_count INTEGER,
  created_at INTEGER NOT NULL,
  is_active INTEGER DEFAULT 1
);
```

**Content Format** (NEW format as of Oct 21, 2025):
```json
{
  "text": "The actual text content...",
  "wordCount": 287,
  "variant": "ai_optimized"
}
```

**OLD Format (migrate on read)**:
```json
{
  "extractedBy": "ai",
  "model": "claude-3-5-sonnet",
  "sections": [...],
  "formatted": "text..."
}
```

### Extraction Flow

**User Action** → Click "Refresh Data" (Data Pipeline section)

**API Call**: `POST /api/jobs/[id]/refresh-variants`

**Process**:
```
1. Get active attachments (isActive=1, deletedAt=NULL)
2. For each attachment:
   a. Extract raw text (mammoth for DOCX, fs.readFile for TXT)
   b. Save as 'raw' variant (FREE, local)
   c. Send raw text to AI for cleaning
   d. Save as 'ai_optimized' variant (~$0.01)
   e. Compare with previous variant (detect changes)
3. Return summary (cost, changes, errors)
```

**Error Handling**:
```typescript
// PDF files
if (ext === '.pdf') {
  return {
    success: false,
    error: '🖼️ Cannot extract text from this PDF. Convert to .docx or .txt'
  };
}

// Empty files
if (!text || text.trim().length === 0) {
  return {
    success: false,
    error: 'File is empty or contains no readable text'
  };
}

// AI extraction fails
catch (error) {
  // Still save raw variant (it's free and works)
  // Just skip ai_optimized variant
  return { extracted: true, aiOptimized: false, error: error.message };
}
```

---

## 🎯 Feature Implementation Patterns

### Pattern 1: AI Analysis Section (Match Score, Skills, etc.)

**Components**:
```typescript
1. Card component (e.g., MatchScoreCard.tsx)
2. API route (e.g., /api/jobs/[id]/analyze-match-score/route.ts)
3. Prompt file (e.g., prompts/match-score.v1.md)
4. Cache storage (in analysis_cache table)
```

**Typical Component Structure**:
```typescript
export function MatchScoreCard({ jobId }: { jobId: string }) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchAnalysis = async () => {
    // Check cache first
    const response = await fetch(`/api/jobs/${jobId}/analyze-match-score`);
    const data = await response.json();
    setAnalysis(data.analysis);
  };
  
  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}/analyze-match-score`, {
        method: 'POST'  // POST = force re-analyze
      });
      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };
  
  useEffect(() => { fetchAnalysis(); }, [jobId]);
  
  return (
    <div className="card">
      <header>
        <h3>Match Score</h3>
        <AnalyzeButton onClick={runAnalysis} loading={analyzing} />
      </header>
      {analysis && <ResultDisplay data={analysis} />}
      {error && <ErrorMessage message={error} />}
    </div>
  );
}
```

**API Route Pattern**:
```typescript
export async function GET(request: Request, { params }: { params: { id: string } }) {
  // Return cached analysis
  const cached = await db.select()
    .from(analysisCache)
    .where(eq(analysisCache.jobId, params.id))
    .where(eq(analysisCache.sectionName, 'match_score'))
    .orderBy(desc(analysisCache.analyzedAt))
    .limit(1);
    
  if (cached.length > 0) {
    return NextResponse.json({ 
      analysis: JSON.parse(cached[0].result),
      analyzedAt: cached[0].analyzedAt,
      fromCache: true
    });
  }
  
  return NextResponse.json({ analysis: null });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  // Force re-analysis
  const variants = await getAiOptimizedVariants(params.id);
  
  if (!variants.resume || !variants.jd) {
    return NextResponse.json({ 
      error: 'AI-optimized variants not found. Click "Refresh Data" first.' 
    }, { status: 400 });
  }
  
  const result = await callAiProvider('analyze_match_score', {
    resume_text: variants.resume.content.text,
    jd_text: variants.jd.content.text,
    job_title: job.title,
    company_name: job.company
  });
  
  // Cache result
  await db.insert(analysisCache).values({
    id: randomUUID(),
    jobId: params.id,
    sectionName: 'match_score',
    result: JSON.stringify(result),
    analyzedAt: Date.now()
  });
  
  return NextResponse.json({ analysis: result, fromCache: false });
}
```

---

## 🔍 Staleness Detection

**Purpose**: Tell user when to re-run analysis (documents changed)

**Logic Location**: `lib/analysis/fingerprintCalculator.ts`

**How It Works**:
```typescript
// Calculate fingerprint of current state
const fingerprint = {
  resumeHash: hashContent(activeResume.text),
  jdHash: hashContent(activeJd.text),
  coverLetterHash: hashContent(activeCoverLetter?.text),
  timestamp: Date.now()
};

// Compare with last analysis bundle
const lastBundle = await getLastAnalysisBundle(jobId);

if (!lastBundle) {
  return { severity: 'never_analyzed', message: 'No analysis yet' };
}

// Compare hashes
const resumeChanged = fingerprint.resumeHash !== lastBundle.resumeHash;
const jdChanged = fingerprint.jdHash !== lastBundle.jdHash;

if (resumeChanged || jdChanged) {
  return { 
    severity: 'major', 
    message: 'Key documents changed - re-analysis strongly recommended',
    changedArtifacts: ['resume', 'jd'].filter(changed)
  };
}

return { severity: 'fresh', message: 'Analysis is up to date' };
```

**States**:
```typescript
'no_variants'      // Documents uploaded but not extracted
'variants_fresh'   // Variants exist, no analysis yet
'never_analyzed'   // No analysis run yet
'fresh'           // Analysis up to date
'minor'           // Small changes (typos)
'major'           // Significant changes (new skills, experience)
```

---

## 📊 Signal Systems: Match Matrix vs Interview Coach

### CRITICAL DISTINCTION (READ THIS!)

**Match Matrix Signals** (60 total):
- **Type**: Discrete skill measurements
- **Purpose**: Measure job fit (skill-by-skill scoring)
- **Structure**: 30 ATS Standard + 30 Dynamic (job-specific)
- **Output**: Match Score (0-100%)
- **Used for**: Application decision, resume optimization
- **Example**: "Python Programming" = 75/100 (JD: 95, Resume: 75, Gap: 20)

**Interview Coach Context Inputs** (8 layers, NOT "signals"):
- **Type**: Holistic context layers
- **Purpose**: Generate personalized interview prep
- **Structure**: 8 interconnected data sources
- **Output**: Tailored questions + optimized answers
- **Used for**: Interview success + career relationship building
- **Example**: Match Score (78%) + Company Culture + Recruiter Profile → Questions

**Connection**:
```
Match Matrix (60 signals)
    ↓ Aggregates to
Match Score (78%) + Strong Skills + Weak Skills
    ↓ FEEDS INTO
Interview Coach (as Input Layer #1)
    ↓ Combined with 7 other input layers
Hyper-Personalized Interview Prep
```

---

## 🎯 Interview Coach Algorithm (97/100 → 100/100)

**Files**:
- `INTERVIEW_COACH_COMPLETE_ALGORITHM.md` (1,470 lines - DEFINITIVE)
- `INTERVIEW_COACH_SIGNALS_BREAKDOWN.md` (complete input system)
- `UNIFIED_INTERVIEW_ALGORITHM_V3.md` (1,928 lines - implementation)

### 8 Input Layers (Context System)

**Layer 1: Match Score Data** (From Match Matrix)
```typescript
{
  matchScore: 78,
  strongSkills: ["Product Management", "Data Analysis", "Team Leadership"],
  weakSkills: ["Python Programming", "Machine Learning"],
  skillGaps: [/* 60 signals aggregated */]
}
// Used for: Question targeting (70% showcase strong, 30% address weak)
```

**Layer 2: Company Intelligence** (From Company Analysis)
```typescript
{
  culture: { values: ["Innovation", "Sustainability"], principles: [...] },
  recentNews: ["Partnership with SK ecoplant", "Q3 earnings beat"],
  challenges: ["Scaling production", "Battery storage competition"]
}
// Used for: Cultural questions, talk track integration
```

**Layer 3: People Profiles** (Interviewer Intelligence)
```typescript
{
  recruiter: {
    name: "Sarah Johnson",
    communicationStyle: "Professional",
    keyPriorities: ["Technical depth", "Culture fit"],
    redFlags: ["Job hopping", "Vague answers"],
    recruiterType: "company" | "headhunter"  // NEW!
  }
}
// Used for: Question style, red flag prep, communication matching
```

**Layer 4: JD Requirements** (From Job Analysis)
```typescript
{
  keyResponsibilities: ["Drive partnership strategy", "Lead 20+ team"],
  requiredSkills: ["Partnership strategy", "M&A experience"],
  niceToHaves: ["Clean energy experience"]
}
// Used for: Question relevance, answer scoring
```

**Layer 5: Career Context** (From Resume + Discovery)
```typescript
{
  careerLevel: "Director",
  targetLevel: "Senior Director",
  industryTenure: 8,
  stabilityScore: 85,
  achievements: ["Led $90M budget", "Built 15+ partnerships"]
}
// Used for: Question difficulty, answer depth expectations
```

**Layer 6: Ecosystem** (From Company Ecosystem Analysis)
```typescript
{
  competitors: [{ name: "Bloom Energy", relevance: 98 }],
  marketPosition: "Leader in carbonate fuel cells"
}
// Used for: Strategic questions, market awareness
```

**Layer 7: Writing Style** (From Application Coach)
```typescript
{
  tone: "professional_approachable",
  sentenceLength: "medium",
  vocabulary: "data-driven",
  voice: "active"
}
// Used for: Talk track generation (sounds like you, not AI)
```

**Layer 8: Headhunter Context** (NEW! - Oct 21, 2025)
```typescript
{
  recruiterType: "headhunter",
  searchFirm: { name: "Korn Ferry", tier: "tier_1" },
  specialtyMatch: 0.92,  // Recruiter's specialty vs your background
  dualLensWeights: { jobFit: 0.6, relationship: 0.4 }
}
// Used for: Question distribution, dual-objective optimization
```

---

## 🔄 How Layers Flow Through Algorithm

### Phase 1: Question Generation
```
Inputs: Layers 1-8 (all)
Process:
  - Layer 1 (Match): Target strong skills (70%), address gaps (30%)
  - Layer 2 (Company): Integrate culture values
  - Layer 3 (People): Match recruiter style
  - Layer 4 (JD): Ensure relevance to role
  - Layer 5 (Career): Appropriate difficulty for level
  - Layer 6 (Ecosystem): Add strategic context
  - Layer 8 (Headhunter): Adjust distribution (60/40 if applicable)
Output: 30-40 tailored questions
```

### Phase 2-4: Answer Scoring & Iteration
```
Inputs: Layers 1, 3, 4, 7, 8
Process:
  - Score on 5-7 dimensions (depends on question type)
  - If headhunter + relationship question: Add marketability + relationship scoring
  - Match writing style (Layer 7)
  - Check skill relevance (Layer 1)
Output: Score (0-100) + Feedback + Follow-up questions
```

### Phase 5: Talk Track Generation
```
Inputs: All layers (1-8)
Process:
  - Convert to STAR format
  - Match writing style (Layer 7)
  - Integrate company culture (Layer 2)
  - Match recruiter communication (Layer 3)
  - If headhunter: Add relationship framing (Layer 8)
Output: Long-form + Cheat sheet + Opening/Closing lines
```

### Phase 6: Success Probability
```
Inputs: Layers 1, 3, 5, 8
Process:
  - If company recruiter: Role fit (70%) + Culture (20%) + Comm (10%)
  - If headhunter: Role fit (50%) + Marketability (25%) + Relationship (15%) + Comm (10%)
  - Adjust for specialty match (Layer 8)
  - Adjust for career level (Layer 5)
Output: Success probability (0-100%)
```

---

## 🎯 Headhunter Enhancement Impact

**Algorithm Score**:
- Before: 97/100 (missing recruiter motivation context)
- After: 100/100 (complete multi-objective optimization)

**Question Quality**:
- Before: Optimized for THIS role only
- After: Optimized for THIS role + CAREER (relationship building)

**Strategic Value**:
- Before: Tactical (ace this interview)
- After: Strategic (ace this interview + access hidden market)

**Unique Differentiator**:
- Before: 7-layer personalization
- After: 8-layer + multi-objective optimization

---

## 💡 Key Takeaways for Future Development

**When adding Interview Coach features**:
1. ✅ Think in "input layers" (not discrete signals)
2. ✅ Signals from Match Matrix feed IN (aggregated, not discrete)
3. ✅ Each layer serves specific purpose (company culture ≠ match score)
4. ✅ Layers combine holistically (not mathematically like signals)
5. ✅ Different phases use different layer subsets

**When NOT to add signals to Match Matrix**:
- ❌ If measuring person fit (not job fit)
- ❌ If optimizing relationship (not skill match)
- ❌ If context-specific (not universal job requirement)

**When TO add context to Interview Coach**:
- ✅ If changes interview strategy
- ✅ If affects question generation
- ✅ If impacts success probability
- ✅ If optimizes for additional objective

**Headhunter context = Interview Coach layer (NOT Match Matrix signal)** ✅

---

**Quality Metrics** (Enhanced):
- Algorithm score: 97/100 → 100/100 (with headhunter support)
- Input layers: 7 → 8 (headhunter context added)
- Optimization objectives: 1 → 2 (job success + career relationships)
- Evidence-based: Every recommendation has JD/Resume citations

---

## 🧪 Testing Standards

### Test Requirements (Per Repo Rules)

**Every feature MUST have**:
1. Unit tests (Vitest) - logic/functions
2. E2E tests (Playwright) - user workflows
3. Passing tests before commit
4. Test data seeds (for E2E)

**Test Locations**:
```
/__tests__/          // Unit tests (Vitest)
/e2e/               // E2E tests (Playwright)
/e2e/fixtures/      // Test data
```

**Running Tests**:
```bash
npm test            # Unit tests (Vitest)
npm run test:e2e    # E2E tests (Playwright)
npm run test:all    # Both
```

**Definition of Done** (from repo rules):
```
1. Code + migration + seed
2. Unit tests passing
3. Playwright e2e for the user story
4. Demo steps user can click through
```

---

## 🚨 Common Pitfalls & Solutions

### Pitfall 1: Using Wrong Variant Format
```typescript
// ❌ WRONG (old format)
const text = variant.content.formatted || variant.content.sections[0].text;

// ✅ CORRECT (new format)
const text = variant.content.text;

// ✅ SAFE (handles both)
const text = variant.content?.text || 
             (typeof variant.content === 'string' ? JSON.parse(variant.content).text : null);
```

### Pitfall 2: Fetching All Attachments (Not Just Active)
```typescript
// ❌ WRONG
const attachments = await db.select()
  .from(attachments)
  .where(eq(attachments.jobId, jobId));

// ✅ CORRECT
const attachments = await db.select()
  .from(attachments)
  .where(and(
    eq(attachments.jobId, jobId),
    eq(attachments.isActive, true),  // CRITICAL!
    isNull(attachments.deletedAt)
  ));
```

### Pitfall 3: Not Checking for AI-Optimized Variants
```typescript
// ❌ WRONG (uses raw, costs 3x more tokens)
const resume = await getVariant(attachmentId, 'raw');
await callAI({ resume_text: resume.content.text });

// ✅ CORRECT (uses ai_optimized)
const resume = await getVariant(attachmentId, 'ai_optimized');
if (!resume) {
  return { error: 'Click "Refresh Data" to create AI-optimized variants' };
}
await callAI({ resume_text: resume.content.text });
```

### Pitfall 4: Hardcoding Model Names
```typescript
// ❌ WRONG
const result = await openai.chat.completions.create({
  model: 'gpt-4o',  // Hardcoded!
  messages: [...]
});

// ✅ CORRECT (use aiProvider)
const result = await callAiProvider('analyze_match_score', {
  resume_text, jd_text, job_title, company_name
  // Model selection handled centrally
});
```

### Pitfall 5: PDF Extraction (Use Child Process)
```typescript
// ❌ WRONG (will break Next.js webpack)
import pdfParse from 'pdf-parse';
const data = await pdfParse(buffer);

// ✅ CORRECT (use child process)
import { spawn } from 'child_process';

const scriptPath = path.join(process.cwd(), 'scripts', 'extract-pdf-standalone.js');
const child = spawn('node', [scriptPath, filePath]);

// Or use the textExtractor.ts function:
import { extractFromPdf } from '@/lib/extraction/textExtractor';
const result = await extractFromPdf(filePath);  // ✅ Handles child process internally
```

### Pitfall 6: AI Timeout Too Short (120s Required!)
```typescript
// ❌ WRONG - 60 seconds is TOO SHORT
const timeoutId = setTimeout(() => controller.abort(), 60000);

// ✅ CORRECT - 120 seconds for complex prompts
const timeoutId = setTimeout(() => controller.abort(), 120000);

// Why this matters:
// - Company Ecosystem analysis: ~90-120 seconds (JD + web search + 10 companies)
// - Match Score with large resumes: ~40-60 seconds
// - Interview Questions generation: ~50-80 seconds
```

**Symptoms of Timeout Too Short**:
- Page reloads but shows dummy/stale data
- Error: "Claude API call timed out after X seconds"
- Terminal logs show analysis starting but never completing

**Fix**:
- File: `lib/analysis/promptExecutor.ts`
- Search for: `setTimeout(() => controller.abort()`
- Verify: Uses 120000 (not 60000)
- If still timing out: Increase by 30s increments (max 180s)

---

## 📝 Code Style & Conventions

### TypeScript
```typescript
// Use explicit types
interface AnalysisResult {
  score: number;
  reasoning: string;
  evidence: Evidence[];
}

// Prefer async/await over promises
async function fetchData() {
  const result = await db.query();
  return result;
}

// Use optional chaining
const score = analysis?.matchScore ?? 0;
```

### React Components
```typescript
// Use functional components
export function ComponentName({ prop1, prop2 }: Props) {
  // Hooks at top
  const [state, setState] = useState<Type>(initial);
  const router = useRouter();
  
  // Functions
  const handleClick = async () => { };
  
  // Effects
  useEffect(() => { }, [deps]);
  
  // Render
  return <div>...</div>;
}
```

### Naming Conventions
```typescript
// Files: kebab-case
match-score-card.tsx
analyze-company-intel.ts

// Components: PascalCase
MatchScoreCard
AnalyzeButton

// Functions: camelCase
analyzeMatchScore()
getActiveAttachments()

// Constants: UPPER_SNAKE_CASE
const MAX_SIGNALS = 60;
const DEFAULT_MODEL = 'claude-3-5-sonnet-20241022';

// Database tables: snake_case
analysis_cache
artifact_variants
```

---

## 🔑 Key Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-...           # OpenAI API
ANTHROPIC_API_KEY=sk-ant-...    # Claude API
TAVILY_API_KEY=tvly-...         # Web search (Company Intel)

# Optional
DATABASE_URL=./data/jotrack.db  # SQLite path
NODE_ENV=development            # Environment
PORT=3000                       # Server port
```

---

## 📚 Key Documentation Files

**Read These First**:
1. `README.md` - Project overview, setup
2. `ARCHITECTURE.md` - System design
3. `AGENT_REFERENCE_GUIDE.md` - This file!
4. `UI_DESIGN_SPEC.md` - Design system

**Algorithm Documentation**:
1. `INTERVIEW_COACH_COMPLETE_ALGORITHM.md` - Interview prep logic (DEFINITIVE)
2. `UNIFIED_INTERVIEW_ALGORITHM_V3.md` - Implementation details
3. `SIGNAL_LEGEND.md` - Signal system explained

**Feature Guides**:
1. `PREVIEW_SYSTEM_GUIDE.md` - Attachment viewing
2. `PEOPLE_PROFILES_SOURCES_STRATEGY.md` - People analysis
3. `PDF_EXTRACTION_ROOT_CAUSE_AND_SOLUTION.md` - PDF limitation explained

**Testing**:
1. `EXHAUSTIVE_E2E_TEST_SUITE.md` - Test strategy
2. `TEST_EXECUTION_REPORT.md` - Test results

---

## 🎓 Learning Resources

### When You Need To...

**Add a new AI analysis section**:
1. Read: Existing section (e.g., `MatchScoreCard.tsx`)
2. Copy pattern: Component + API + Prompt
3. Follow: Pattern 1 in this guide

**Modify database schema**:
1. Create migration: `db/migrations/009_your_change.sql`
2. Update schema: `db/schema.ts`
3. Test: `npm run db:push`

**Add new prompts**:
1. Create: `prompts/your-feature.v1.md`
2. Add capability: `aiProvider.ts` CAPABILITY_TO_PROMPT map
3. Test: Call via `callAiProvider('your_feature', inputs)`

**Debug AI issues**:
1. Check: `aiProvider.ts` for capability mapping
2. Verify: Prompt variables match input
3. Test: Standalone prompt with sample data

---

## ✅ Pre-Flight Checklist (Before Making Changes)

- [ ] Read relevant sections of this guide
- [ ] Check if similar code exists (use grep/search)
- [ ] Verify dependencies are in "Working" list
- [ ] Plan tests (unit + E2E)
- [ ] Check naming conventions
- [ ] Review common pitfalls section

---

## 🆘 When Things Go Wrong

### Server won't start
```bash
# Kill all node processes
pkill -9 node

# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules && npm install

# Start fresh
npm run dev
```

### Database issues
```bash
# Check schema
sqlite3 data/jotrack.db ".schema"

# Reset database (DANGER: loses data!)
rm data/jotrack.db
npm run db:push
npm run db:seed
```

### Tests failing
```bash
# Run specific test
npm test -- match-score

# E2E with UI
npm run test:e2e -- --ui

# Debug mode
npm test -- --inspect-brk
```

---

**Last Updated**: October 21, 2025  
**Maintainer**: Review after major features or breaking changes  
**Questions?**: Check ARCHITECTURE.md or specific feature documentation

