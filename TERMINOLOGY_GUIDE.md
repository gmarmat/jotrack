# JoTrack Terminology Guide - Correct Names & Labels

## 🚨 **USE THESE EXACT TERMS** (Updated Oct 16, 2024)

This guide ensures consistency across documentation, code, and conversations.

---

## 🔘 Button Labels

### Data Pipeline Panel

| ❌ WRONG | ✅ CORRECT | Location |
|----------|-----------|----------|
| Extract Data | **Refresh Data** | Data Pipeline Panel button |
| Analyze All | **Refresh Data** | Data Pipeline Panel (creates variants) |
| - | **Analyze [Section]** | Individual section buttons (e.g., "Analyze Ecosystem") |

**Critical**: The main button is called **"Refresh Data"** NOT "Extract Data"!

### Section-Specific Analyze Buttons

```
✅ "Analyze Match Score"
✅ "Analyze Skills Match"  
✅ "Analyze Company Intelligence"
✅ "Analyze Ecosystem"
✅ "Analyze Match Matrix"
✅ "Analyze People Profiles"
```

---

## 📊 Section Names (Official)

| Component File | ✅ Display Name | Icon | Gradient Colors |
|---------------|----------------|------|-----------------|
| `FitTable.tsx` | **Match Matrix** | 📊 TrendingUp | Neutral (white/gray) |
| Match Score (in AiShowcase) | **Match Score** | 🎯 Target | Purple-blue |
| SkillsMatchChart | **Skill Match** | 💡 Lightbulb | Amber-yellow |
| CompanyIntelligenceCard | **Company Intelligence** | 🏢 Building2 | Indigo-blue |
| CompanyEcosystemTableCompact | **Company Ecosystem** | 📈 TrendingUp | Emerald-green |
| PeopleProfilesCard | **People Profiles** | 👥 Users | Cyan-blue |

**Note**: 
- ❌ DON'T call FitTable "Fit Table" or "Signals Table"
- ✅ DO call it "Match Matrix"

---

## 🗃️ Data Concepts

### Document Variants (3 Types)

| Variant | Purpose | Created By | Cost |
|---------|---------|------------|------|
| **`raw`** | Original text extracted locally | Local (mammoth/pdf-parse) | $0 |
| **`ai_optimized`** | Structured, cleaned for AI consumption | AI (via Refresh Data) | ~$0.01 |
| **`detailed`** | Enriched with metadata, context | AI (via Refresh Data) | ~$0.01 |

**Total cost to create variants**: ~$0.02 per document

### Staleness States (5 Types)

| State | Meaning | Banner Color | User Action |
|-------|---------|--------------|-------------|
| `no_variants` | No AI variants created | 🟣 Purple | Click "Refresh Data" |
| `variants_fresh` | Variants ready, not analyzed | 🔵 Blue | Click section "Analyze" buttons |
| `major` | Documents changed significantly | 🟠 Orange | Click "Refresh Data" first |
| `never_analyzed` | No docs uploaded | ⚪ White | Upload documents |
| `fresh` | Everything current | 🟢 Green | No action needed |

---

## 🎨 UI Component Names

### Standard Components

```tsx
// ❌ WRONG names:
ExplanationSection
AnalysisExplainer  
HowWeAnalyze

// ✅ CORRECT:
AnalysisExplanation  // The standard component
```

### Section Wrapper Pattern

```tsx
// Every section follows this structure:
<div className="bg-gradient-to-br from-{color}-50 to-{color2}-50...">
  {/* Header */}
  {/* Content */}
  <AnalysisExplanation>...</AnalysisExplanation>  // 2nd last
  {/* Why This Matters */}  // Last
</div>
```

---

## 🔌 API Endpoints

### Variant Management

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/jobs/[id]/refresh-variants` | POST | Create ai_optimized + detailed variants | ✅ Built |
| `/api/jobs/[id]/check-staleness` | GET | Check if variants need refresh | ✅ Built |

### Analysis Endpoints

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/jobs/[id]/analyze-ecosystem` | POST | Generate company ecosystem | ✅ Built (with caching) |
| `/api/jobs/[id]/evaluate-signals` | POST | Evaluate ATS signals | ✅ Built |
| `/api/jobs/[id]/analyze-company` | POST | Company intelligence | ❌ Needs creation |
| `/api/jobs/[id]/analyze-match` | POST | Match score analysis | ❌ Needs creation |
| `/api/jobs/[id]/analyze-profiles` | POST | People profiles | ❌ Needs creation |

### Settings/Config

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/ai/keyvault/get` | GET | Load AI settings | ✅ Works |
| `/api/ai/keyvault/set` | POST | Save AI settings | ✅ Works |
| `/api/ai/keyvault/status` | GET | Check if key exists | ✅ Works |

---

## 💾 Database Tables

### Core Tables

```
jobs - Job applications
attachments - Uploaded files (PDF, DOCX)
artifact_variants - 3 variants per document (raw, ai_optimized, detailed)
app_settings - Stores encrypted API keys
```

### Analysis Tables

```
ats_signals - 30 standard ATS signals
job_dynamic_signals - Job-specific signals (up to 30)
signal_evaluations - Score history for signals
company_ecosystem_cache - 7-day cache for ecosystem data
```

---

## 🎯 Signal System

### Signal Types

| Icon | Name | Count | Source |
|------|------|-------|--------|
| ⚙️ | **ATS Standard** | 30 | Database (`ats_signals` table) |
| ✨ | **Dynamic** | Up to 30 | AI-generated per job |
| ⚙️✨ | **Dual** | Variable | ATS signal also in JD |

**Total possible signals**: Up to 60 (30 + 30)

### Signal Categories (4 Groups)

1. **Technical Skills & Expertise** (10 signals)
2. **Experience & Background** (10 signals)
3. **Soft Skills & Culture Fit** (10 signals)
4. **Dynamic** (Up to 30 job-specific)

---

## 📝 Feature Names

### Coach Mode vs Jobs Page

| ❌ Confusing | ✅ Clear |
|-------------|---------|
| "Analysis" | Be specific: "Match Score Analysis" or "Ecosystem Analysis" |
| "AI Section" | Use exact section name: "Company Ecosystem" |
| "Table" | Use exact name: "Match Matrix" or "Compact Table" |

### Modal Names

```
✅ AttachmentViewerModal - Shows single document
✅ VariantViewerModal - Shows 3-column variant comparison  
✅ FullEcosystemModal - Shows detailed ecosystem with tabs
✅ GlobalSettingsModal - App settings (AI keys, etc.)
✅ SourcesModal - Shows data sources for analysis
```

---

## 🔑 Settings & Configuration

### How API Keys Work

**User Flow:**
1. Click ⚙️ Settings button (top-right corner)
2. Go to "AI & Privacy" tab (first tab)
3. Enter OpenAI API key
4. Click "Test Connection" (optional)
5. Click "Save Settings"
6. Key saved to database (encrypted)

**Technical Flow:**
- Keys stored in `app_settings` table
- Encrypted with AES-256-CBC
- Retrieved via `getAiSettings()` function
- Used by `callAiProvider()` for all AI calls

**No `.env.local` needed!** Everything is database-driven.

---

## 💰 Cost Terminology

### Operation Costs (Always Display)

```
✅ "~$0.02" - Refresh Data button
✅ "~$0.05" - Per section analysis
✅ "~$0.15" - Ecosystem analysis (cached 7 days)
✅ "~$0.22" - Full job analysis
```

### Cache Terminology

```
✅ "Cached (3 days ago)" - Show age
✅ "💰 Cached" - Indicates cost savings
✅ "7-day cache" - Explain cache duration
❌ "Stale cache" - Confusing, say "cached X days ago"
```

---

## 🎨 UI Color Patterns

### Section Gradients (Established)

```tsx
// Match Score
from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20

// Skill Match
from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20

// Company Intelligence
from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20

// Company Ecosystem
from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20

// People Profiles
from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20
```

### Text Colors (Universal)

```
Headers: text-gray-900 dark:text-gray-100
Body: text-gray-700 dark:text-gray-300  
Muted: text-gray-600 dark:text-gray-400
```

---

## 📂 File Organization

### Where Things Live

```
/app/components/ai/          - AI analysis components
/app/components/coach/       - Coach Mode specific
/app/components/ui/          - Reusable UI (AnalysisExplanation)
/app/jobs/[id]/             - Job detail page
/app/api/jobs/[id]/         - Job-specific API routes
/app/api/ai/                - AI-related APIs (keyvault, prompts)
/lib/coach/                 - Coach Mode utilities
/core/ai/                   - AI core (promptLoader, etc.)
/db/                        - Database (schema, migrations, repos)
/prompts/                   - OLD location (being phased out)
/core/ai/prompts/           - NEW location for prompts
```

---

## 🚫 Common Mistakes to Avoid

### 1. Button Labels
❌ "Extract Data" → ✅ "Refresh Data"
❌ "Analyze All" → ✅ "Refresh Data" (for variants)
❌ "Run Analysis" → ✅ "Analyze [Section Name]"

### 2. Component Names
❌ "FitTable" → ✅ "Match Matrix"
❌ "Signals Table" → ✅ "Match Matrix"
❌ "Fit Score" → ✅ "Match Score" (different concept!)

### 3. Data States
❌ "No data extracted" → ✅ "No variants created"
❌ "Analysis stale" → ✅ "Variants need refresh" or "Significant changes detected"
❌ "Cache expired" → ✅ "Cached X days ago" (cache hasn't "expired", just old)

### 4. File Paths
❌ `prompts/companyEcosystem.v1.md` → ✅ `core/ai/prompts/ecosystem.v1.md`
❌ Reference deleted docs → ✅ Check if file exists first

---

## 📋 Quick Reference: User Journey

### First-Time Setup
```
1. Open JoTrack
2. Click ⚙️ Settings (top-right)
3. Enter OpenAI API key
4. Click Save
5. Create a job
6. Upload resume + JD
7. Click "Refresh Data" (~$0.02)
8. Click "Analyze Ecosystem" (~$0.15)
9. See real company data!
```

### Regular Use
```
1. Upload documents
2. Click "Refresh Data" if needed
3. Click individual "Analyze" buttons per section
4. Review analysis results
5. Update resume based on insights
6. Re-upload → Refresh → Re-analyze to see improvements
```

---

## 🔄 Data Flow (Simplified)

```
UPLOAD → LOCAL EXTRACT → RAW VARIANT
                            ↓
                    [Click "Refresh Data"]
                            ↓
                    AI EXTRACTION (~$0.02)
                            ↓
                    AI_OPTIMIZED + DETAILED VARIANTS
                            ↓
                    [Click "Analyze Ecosystem"]
                            ↓
                    AI ANALYSIS (~$0.15)
                            ↓
                    REAL COMPANY DATA (cached 7 days)
```

---

## 🎓 Context for AI Assistant

### What's Real vs Sample Data

**Currently Real (Works Today)**:
- ✅ Upload/download attachments
- ✅ Local text extraction (raw variant)
- ✅ Settings modal (API key storage)
- ✅ Database encryption
- ✅ Variant storage in DB

**Currently Sample Data (Needs Wiring)**:
- ❌ Match Score (shows fake 72%)
- ❌ Skills Match (shows fake keywords)
- ❌ Company Intelligence (shows fake company)
- ❌ Company Ecosystem (shows 10 fake companies)
- ❌ People Profiles (shows fake profiles)
- ❌ Match Matrix (shows 3 fake signals)

**APIs Ready But Not Wired**:
- ✅ `/api/jobs/[id]/refresh-variants` - Creates variants
- ✅ `/api/jobs/[id]/analyze-ecosystem` - Ecosystem analysis
- ✅ `/api/jobs/[id]/evaluate-signals` - Signal evaluation
- ⚠️ Others need to be created

---

## 🏗️ Architecture Decisions

### Why Database for API Keys (Not .env.local)

1. **Multi-user ready**: Each user has their own key
2. **No server restart**: Changes take effect immediately
3. **Encrypted storage**: AES-256-CBC encryption
4. **Settings UI**: User-friendly, no file editing
5. **Portable**: Works on any deployment

### Why 3 Variants (raw, ai_optimized, detailed)

1. **`raw`**: Fallback if AI fails, debugging
2. **`ai_optimized`**: Optimized for AI analysis (reduce tokens)
3. **`detailed`**: Human-readable with metadata

**Cost savings**: Create once, reuse for all analyses (~95% token reduction)

### Why 7-Day Ecosystem Cache

1. **Cost**: Company research is expensive (~$0.15)
2. **Stability**: Companies don't change daily
3. **UX**: Instant results on cache hit
4. **Savings**: ~95% cost reduction for repeat analyses

---

## 📱 UI State Indicators

### Provider Badges

```
✅ "AI Powered" (green) - Using real API
✅ "Non-AI Powered" (gray) - Using sample data  
✅ "Sample Data" (gray) - No real analysis yet
```

### Data Status Icons

```
🟣 Purple - No variants (need Refresh Data)
🔵 Blue - Variants ready (ready to analyze)
🟠 Orange - Significant changes (need Refresh Data)
🟢 Green - All fresh (no action needed)
⚪ White - No documents (need upload)
```

---

## 🔧 Technical Terms

### Correct Function Names

```tsx
// ❌ Wrong:
getAiKey()
extractData()
analyzeAll()

// ✅ Correct:
getAiSettings()
refreshVariants()
analyzeSection()
```

### Database Functions

```tsx
// Variant management
getVariant(jobId, kind, variantType)
saveRawVariant(...)
saveAiOptimizedVariant(...)

// Settings
getAiSettings()
saveAiSettings(settings)

// Signals
getAllAtsSignals()
getJobDynamicSignals(jobId)
```

---

## 📖 Documentation Files (What to Keep/Remove)

### ✅ KEEP (Public-Facing)

```
README.md - Main readme
CHANGELOG.md - Version history
ARCHITECTURE.md - System design
UI_DESIGN_SYSTEM.md - Component guide
PREVIEW_SYSTEM_GUIDE.md - Feature guide
KNOWN_ISSUES.md - Bug tracking
SIGNAL_LEGEND.md - Signal system guide
```

### ❌ REMOVE BEFORE PUBLIC (Planning Docs)

```
*_PLAN.md
*_COMPLETE.md
*_STATUS.md
*_SUMMARY.md
*_PROGRESS.md
*_GUIDE.md
*_IMPLEMENTATION*.md
*_SESSION*.md
V[0-9]*.md
CSS_*.md
COACH_*.md
START_HERE*.md
ALL_DONE*.md
AUDIT_*.md
BUILD_*.md
DEMO_*.md
EXECUTION_*.md
FINAL_*.md
FIXES_*.md
HARDENING_*.md
OUTSTANDING_*.md
QUALITY_*.md
RATE_*.md
READY_*.md
REMAINING_*.md
SETUP_*.md
SIMPLE_*.md
TASKS.md
TEST_*.md
```

**Reason**: These are internal planning/progress docs, not user documentation.

---

## 💡 Quick Answers to Common Questions

**Q: Where are prompts stored?**  
A: `core/ai/prompts/*.v1.md` (NEW location)

**Q: How do I add a new analysis section?**  
A: Follow `UI_DESIGN_SYSTEM.md` template

**Q: Why isn't "Refresh Data" calling AI?**  
A: Check Settings → AI & Privacy → Is API key saved?

**Q: Why is everything showing sample data?**  
A: Either no API key, or section not wired to API yet

**Q: What's the difference between "Refresh Data" and "Analyze"?**  
A: "Refresh Data" creates variants (~$0.02), "Analyze" runs analysis (~$0.05-0.15 per section)

**Q: How does caching work?**  
A: Ecosystem analysis cached 7 days. Click "Refresh Research" to bypass.

**Q: Where is the Settings button?**  
A: Top-right corner of homepage, looks like ⚙️

---

**Last Updated**: Oct 16, 2024  
**Status**: ✅ Active Reference Document  
**Keep Updated**: Yes, update whenever terminology changes!

