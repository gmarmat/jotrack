# JoTrack Navigation Map - Visual Guide

## 🗺️ **Quick Visual Reference**

Use this diagram to instantly know where to look for information!

---

## 📚 **Documentation Navigation Flow**

```
┌─────────────────────────────────────────────────────────────────┐
│                     START HERE                                   │
│                         ↓                                        │
│              CURRENT_STATE.md                                    │
│         (What works? What's next?)                              │
└─────────────────────────────────────────────────────────────────┘
                         ↓
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
   
┌──────────┐      ┌──────────┐      ┌──────────┐
│  BUILDING │      │  FIXING  │      │ PLANNING │
│    UI     │      │   BUGS   │      │  FEATURE │
└──────────┘      └──────────┘      └──────────┘
      ↓                 ↓                 ↓
      
UI_DESIGN_     KNOWN_ISSUES.md    QUICK_REFERENCE
SYSTEM.md      TERMINOLOGY_       .md
               GUIDE.md           ARCHITECTURE.md
```

---

## 🎯 **"I Want To..." Decision Tree**

```
I want to...

├─ Understand current project status?
│  └─> 📄 CURRENT_STATE.md
│      ├─ "What Works" section
│      ├─ "What Needs Work" section
│      └─ "Immediate Next Steps"
│
├─ Know what to call something?
│  └─> 📄 TERMINOLOGY_GUIDE.md
│      ├─ Button Labels table
│      ├─ Section Names table
│      └─ Common Mistakes section
│
├─ Find an API endpoint?
│  └─> 📄 QUICK_REFERENCE.md
│      └─ "API Quick Lookup" section
│
├─ Build a new component?
│  └─> 📄 UI_DESIGN_SYSTEM.md
│      ├─ Standard Section Structure
│      ├─ Color Palette
│      └─ Component Checklist
│
├─ Understand how something works?
│  └─> 📄 ARCHITECTURE.md
│      └─ System design diagrams
│
├─ See example code?
│  └─> 📄 UI_DESIGN_SYSTEM.md
│      └─ Reference Implementations
│
├─ Check if something is broken?
│  └─> 📄 KNOWN_ISSUES.md
│      └─ Active Issues list
│
├─ Wire an Analyze button?
│  └─> 📄 QUICK_REFERENCE.md
│      └─ "Where to Wire APIs" section
│
├─ Add a new feature?
│  └─> 📄 CURRENT_STATE.md (check status)
│      └─> 📄 UI_DESIGN_SYSTEM.md (follow patterns)
│      └─> 📄 CHANGELOG.md (document it)
│
└─ Onboard a new developer?
   └─> 📄 README.md
       └─> 📄 CURRENT_STATE.md
       └─> 📄 QUICK_REFERENCE.md
```

---

## 🏗️ **Project Architecture Map**

```
┌─────────────────────────────────────────────────────────────────┐
│                        JOTRACK v2.7                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   FRONTEND      │  │    BACKEND      │  │   DATABASE      │
│   (UI/UX)       │  │  (API/Logic)    │  │   (SQLite)      │
└─────────────────┘  └─────────────────┘  └─────────────────┘
        ↓                     ↓                     ↓

┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND COMPONENTS                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Jobs Page (app/jobs/[id]/page.tsx)                            │
│  ├─ Data Pipeline Panel                                         │
│  │  └─ "Refresh Data" button → POST /refresh-variants          │
│  │                                                              │
│  └─ AI Analysis Sections (AiShowcase.tsx)                      │
│     ├─ Match Score (purple-blue gradient)                      │
│     ├─ Skill Match (amber-yellow gradient)                     │
│     ├─ Company Intelligence (indigo-blue)                      │
│     ├─ Company Ecosystem (emerald-green)                       │
│     │  ├─ Compact Table (5 columns)                           │
│     │  └─ Full Modal (3 tabs, 13 columns)                     │
│     ├─ Match Matrix (neutral)                                  │
│     │  └─ Expandable categories (4 groups)                    │
│     └─ People Profiles (cyan-blue)                            │
│        └─ Grid (2 cols, rotating colors)                      │
│                                                                  │
│  Settings Modal (GlobalSettingsModal.tsx)                      │
│  └─ AI & Privacy Tab → API Key Input                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ API ENDPOINTS                                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Variant Management:                                            │
│  ├─ POST /api/jobs/[id]/refresh-variants    ✅ Built           │
│  ├─ GET  /api/jobs/[id]/check-staleness     ✅ Built           │
│  └─ GET  /api/jobs/[id]/variant             ✅ Built           │
│                                                                  │
│  Analysis (Section-Specific):                                   │
│  ├─ POST /api/jobs/[id]/analyze-ecosystem   ✅ Built (cached!) │
│  ├─ POST /api/jobs/[id]/evaluate-signals    ✅ Built           │
│  ├─ POST /api/jobs/[id]/analyze-match       ❌ Needs creation  │
│  ├─ POST /api/jobs/[id]/analyze-company     ❌ Needs creation  │
│  └─ POST /api/jobs/[id]/analyze-profiles    ❌ Needs creation  │
│                                                                  │
│  Settings:                                                       │
│  ├─ GET  /api/ai/keyvault/get               ✅ Built           │
│  ├─ POST /api/ai/keyvault/set               ✅ Built           │
│  └─ GET  /api/ai/keyvault/status            ✅ Built           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ DATABASE SCHEMA                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Core Tables:                                                    │
│  ├─ jobs                          ✅ Working                    │
│  ├─ attachments                   ✅ Working                    │
│  ├─ artifact_variants             ✅ Working (raw only so far)  │
│  └─ app_settings                  ✅ Working (API keys!)        │
│                                                                  │
│  Analysis Tables:                                                │
│  ├─ ats_signals                   ✅ 30 signals seeded          │
│  ├─ job_dynamic_signals           ✅ Schema ready               │
│  ├─ signal_evaluations            ✅ Schema ready               │
│  └─ company_ecosystem_cache       ✅ Caching ready (7-day)      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 **UI Component Map**

```
┌─────────────────────────────────────────────────────────────────┐
│                   UI COMPONENT HIERARCHY                         │
└─────────────────────────────────────────────────────────────────┘

app/
├── jobs/[id]/page.tsx (Job Detail Page)
│   ├─ JobHeader
│   ├─ DataPipelinePanel ⭐ "Refresh Data" button here!
│   ├─ JobNotesCard
│   └─ AiShowcase (components/jobs/AiShowcase.tsx)
│       │
│       ├─ Match Score Section
│       │  └─ MatchScoreGauge
│       │
│       ├─ Skill Match Section
│       │  └─ SkillsMatchChart
│       │
│       ├─ Company Intelligence
│       │  └─ CompanyIntelligenceCard ⭐ Needs API
│       │
│       ├─ Company Ecosystem
│       │  ├─ CompanyEcosystemTableCompact ⭐ Needs wiring
│       │  └─ FullEcosystemModal (opens on click)
│       │
│       ├─ Match Matrix
│       │  └─ FitTable ⭐ Needs wiring
│       │
│       └─ People Profiles
│          └─ PeopleProfilesCard ⭐ Needs API
│
├── page.tsx (Homepage)
│   ├─ GlobalSettingsButton
│   │  └─ Opens GlobalSettingsModal
│   │     └─ AI & Privacy Tab ⭐ Add API key here!
│   │
│   └─ Jobs Table

components/
├── ai/ (Analysis components)
│   ├─ CompanyEcosystemTableCompact.tsx ⭐ Wire this!
│   ├─ FullEcosystemModal.tsx
│   ├─ CompanyIntelligenceCard.tsx ⭐ Create API
│   ├─ PeopleProfilesCard.tsx ⭐ Create API
│   ├─ AnalyzeButton.tsx (reusable)
│   └─ PromptViewer.tsx (reusable)
│
├── coach/tables/
│   └─ FitTable.tsx (Match Matrix) ⭐ Wire this!
│
└── ui/
    └─ AnalysisExplanation.tsx ⭐ Standard pattern
```

---

## 🔌 **Data Flow Visualization**

```
┌─────────────────────────────────────────────────────────────────┐
│                    JOTRACK DATA PIPELINE                         │
└─────────────────────────────────────────────────────────────────┘

USER ACTION                  SYSTEM PROCESS              RESULT
───────────────────────────────────────────────────────────────────

1. Upload PDF/DOCX   →   Local extraction      →   RAW variant
                          (mammoth/pdf-parse)        ($0, instant)
                                 ↓
                         Saved to database
                         (artifact_variants)
                                 ↓
──────────────────────────────────────────────────────────────────

2. Click "Refresh    →   AI extraction         →   AI_OPTIMIZED
   Data"                  (~2500 tokens in)          + DETAILED
   ($0.02)                (~500 tokens out)          variants
                                 ↓
                         Semantic comparison
                         (detect changes)
                                 ↓
                         Show changelog
                         (Added 3 skills...)
                                 ↓
                         Saved to database
                                 ↓
──────────────────────────────────────────────────────────────────

3. Click "Analyze    →   Check cache (7-day)   →   Real company
   Ecosystem"              ↓                         data
   ($0.15)          Cache hit? Return cached
                         ↓
                    Cache miss? Call AI
                    (~2000 tokens in)
                    (~2500 tokens out)
                         ↓
                    Save to cache
                    (expires in 7 days)
                         ↓
                    Return 10 companies
                    (15+ data points each)
                         ↓
──────────────────────────────────────────────────────────────────

4. View in UI       →   Display in sections    →   User sees
                         - Compact table             beautiful
                         - Full modal               analysis!
                         - Gradients
                         - Dark mode
                                 ↓
──────────────────────────────────────────────────────────────────

COST SAVINGS:
- Variants: Create once ($0.02), reuse forever (95% savings)
- Ecosystem: Cache 7 days ($0.15 → $0.00 on cache hit)
- Total: ~$0.22 → ~$0.07 for repeat analyses
```

---

## 🎯 **Feature Status Map**

```
┌─────────────────────────────────────────────────────────────────┐
│                    FEATURE COMPLETENESS                          │
└─────────────────────────────────────────────────────────────────┘

CORE FEATURES (100% Complete)
├─ ✅ Job CRUD
├─ ✅ Search (FTS5)
├─ ✅ Attachments (upload/download)
├─ ✅ Status tracking
├─ ✅ Backup/Restore
└─ ✅ Dark mode

UI/UX (100% Complete)
├─ ✅ Gradient backgrounds (5 unique)
├─ ✅ AnalysisExplanation (all sections)
├─ ✅ Modal scrolling
├─ ✅ Variant viewer (3-column)
├─ ✅ Settings modal
└─ ✅ Data pipeline panel

DATA PIPELINE (80% Complete)
├─ ✅ Local extraction (raw variant)
├─ ✅ API for AI extraction (refresh-variants)
├─ ⚠️ "Refresh Data" button (needs testing with API key)
├─ ✅ Staleness detection
├─ ✅ Changelog display
└─ ✅ Variant storage (DB)

AI ANALYSIS (30% Complete)
├─ Match Score
│  ├─ ✅ UI complete
│  └─ ❌ API not created
│
├─ Skill Match
│  ├─ ✅ UI complete
│  └─ ❌ API not created (part of Match Score?)
│
├─ Company Intelligence
│  ├─ ✅ UI complete
│  └─ ❌ API not created
│
├─ Company Ecosystem
│  ├─ ✅ UI complete
│  ├─ ✅ API built (with caching!)
│  └─ ❌ Not wired to UI ⚠️ QUICK WIN!
│
├─ Match Matrix
│  ├─ ✅ UI complete
│  ├─ ✅ API built (evaluate-signals)
│  └─ ❌ Not wired to UI ⚠️ QUICK WIN!
│
└─ People Profiles
   ├─ ✅ UI complete
   └─ ❌ API not created

⚠️ = Quick wins (API exists, just wire UI)
❌ = Needs more work (API creation)
```

---

## 📂 **File Location Map**

```
┌─────────────────────────────────────────────────────────────────┐
│               WHERE TO FIND THINGS                               │
└─────────────────────────────────────────────────────────────────┘

🎨 UI COMPONENTS
────────────────────────────────────────────────────────────
Task: "I want to update [Component]"

Match Score          → app/components/jobs/AiShowcase.tsx (lines 258-343)
Skill Match          → app/components/ai/SkillsMatchChart.tsx
Company Intelligence → app/components/ai/CompanyIntelligenceCard.tsx
Company Ecosystem    → app/components/ai/CompanyEcosystemTableCompact.tsx
Ecosystem Modal      → app/components/ai/FullEcosystemModal.tsx
Match Matrix         → app/components/coach/tables/FitTable.tsx
People Profiles      → app/components/ai/PeopleProfilesCard.tsx
Settings Modal       → app/components/GlobalSettingsModal.tsx
Data Pipeline Panel  → app/jobs/[id]/page.tsx (lines 400-500)

🔌 API ENDPOINTS
────────────────────────────────────────────────────────────
Task: "I want to check/create API for [Feature]"

Refresh Data         → app/api/jobs/[id]/refresh-variants/route.ts ✅
Staleness Check      → app/api/jobs/[id]/check-staleness/route.ts ✅
Analyze Ecosystem    → app/api/jobs/[id]/analyze-ecosystem/route.ts ✅
Evaluate Signals     → app/api/jobs/[id]/evaluate-signals/route.ts ✅
Analyze Match        → app/api/jobs/[id]/analyze-match/route.ts ❌ (create)
Analyze Company      → app/api/jobs/[id]/analyze-company/route.ts ❌ (create)
Analyze Profiles     → app/api/jobs/[id]/analyze-profiles/route.ts ❌ (create)
Get Settings         → app/api/ai/keyvault/get/route.ts ✅
Save Settings        → app/api/ai/keyvault/set/route.ts ✅
View Prompts         → app/api/ai/prompts/view/route.ts ✅

🧠 CORE LOGIC
────────────────────────────────────────────────────────────
Task: "How does [System] work?"

AI Provider          → lib/coach/aiProvider.ts
  ├─ getAiSettings() - Load API key from database
  ├─ saveAiSettings() - Save API key (encrypted)
  └─ callAiProvider() - Execute AI calls

Prompt System        → core/ai/promptLoader.ts
  ├─ loadPrompt(kind, version)
  ├─ renderTemplate(template, variables)
  └─ Prompts: core/ai/prompts/*.v1.md

Extraction Engine    → lib/extraction/extractionEngine.ts
  ├─ extractText() - Local PDF/DOCX parsing
  ├─ saveRawVariant() - Store raw text
  └─ getVariant() - Retrieve any variant

Signal Repository    → db/signalRepository.ts
  ├─ getAllAtsSignals() - 30 standard signals
  ├─ getJobDynamicSignals() - Job-specific signals
  └─ saveSignalEvaluation() - Store scores

Cache Repository     → db/companyEcosystemCacheRepository.ts
  ├─ getCachedEcosystemData() - Check cache (7-day)
  └─ saveEcosystemToCache() - Store results

💾 DATABASE
────────────────────────────────────────────────────────────
Task: "Where is [Data] stored?"

Jobs                 → db/schema.ts (jobs table)
Attachments          → db/schema.ts (attachments table)
Variants             → db/schema.ts (artifact_variants table)
API Settings         → db/schema.ts (app_settings table, encrypted)
ATS Signals          → db/schema.ts (ats_signals table, 30 seeded)
Signal Evaluations   → db/schema.ts (signal_evaluations table)
Ecosystem Cache      → db/schema.ts (company_ecosystem_cache, 7-day)

Migrations           → db/migrations/ (000-012 applied)
Seed Data            → db/seedAtsSignals.ts (30 signals)

📝 PROMPTS
────────────────────────────────────────────────────────────
Task: "Where is the prompt for [Feature]?"

Ecosystem Analysis   → core/ai/prompts/ecosystem.v1.md ✅
Company Intelligence → core/ai/prompts/company.v1.md ✅
People Profiles      → core/ai/prompts/people.v1.md ✅
Match Signals        → core/ai/prompts/match-signals.v1.md ❌ (needs creation)
Resume Extraction    → (inline in refresh-variants/route.ts)
JD Extraction        → (inline in refresh-variants/route.ts)
```

---

## 🚦 **Status Light System**

Use this visual to quickly understand status:

```
✅ GREEN  = Complete, tested, production-ready
⚠️ YELLOW = Built but not wired/tested
❌ RED    = Doesn't exist yet, needs creation
🔵 BLUE   = In progress
⚪ WHITE  = Not started
```

**Apply to any feature:**
- UI: ✅ (all complete)
- APIs: ⚠️ (some exist, not wired)
- Testing: ❌ (needs work)
- Documentation: ✅ (complete!)

---

## 🎯 **Quick Wins Map**

```
EASY WINS (< 1 hour each):
┌────────────────────────────────────────┐
│ 1. Wire Company Ecosystem              │
│    File: CompanyEcosystemTableCompact  │
│    API: Already exists! ✅             │
│    Effort: 15 min                      │
│    Impact: See real companies!         │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ 2. Wire Match Matrix                   │
│    File: FitTable.tsx                  │
│    API: Already exists! ✅             │
│    Effort: 15 min                      │
│    Impact: See real signals!           │
└────────────────────────────────────────┘

MEDIUM TASKS (1-2 hours each):
┌────────────────────────────────────────┐
│ 3. Create Match Score API              │
│    Template: analyze-ecosystem as ref  │
│    Effort: 1 hour                      │
│    Impact: Real match percentage       │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ 4. Create Company Intelligence API     │
│    Template: analyze-ecosystem as ref  │
│    Effort: 1 hour                      │
│    Impact: Real company data           │
└────────────────────────────────────────┘
```

---

## 📖 **Documentation Usage Guide**

### **Before Starting Work:**

```
Step 1: Read CURRENT_STATE.md (5 min)
   ↓
Step 2: Check TERMINOLOGY_GUIDE.md for names (1 min)
   ↓
Step 3: Review QUICK_REFERENCE.md for APIs/patterns (2 min)
   ↓
Step 4: Start work with correct context! ✅
```

### **During Development:**

```
Question: "What's this called?"
Answer: TERMINOLOGY_GUIDE.md

Question: "Where is [API/Component]?"
Answer: QUICK_REFERENCE.md → File Location Map

Question: "How do I build [UI element]?"
Answer: UI_DESIGN_SYSTEM.md → Standard patterns

Question: "Does [API] exist?"
Answer: CURRENT_STATE.md → API Endpoints table
```

### **After Completing Work:**

```
Step 1: Update CURRENT_STATE.md (status changes)
   ↓
Step 2: Update CHANGELOG.md (if user-facing)
   ↓
Step 3: Update KNOWN_ISSUES.md (if bugs fixed)
   ↓
Step 4: Commit with clear message ✅
```

---

## 🎓 **Cheat Sheet for User**

### **Starting a New Session:**

```markdown
📋 COPY THIS PROMPT:

"Hi! Continuing JoTrack development.

Read these first:
- CURRENT_STATE.md (project status)
- TERMINOLOGY_GUIDE.md (correct names)

Today's goal: [Your goal here]

Key facts:
- Button: "Refresh Data" (NOT Extract Data)
- Component: "Match Matrix" (NOT FitTable)
- API keys: Settings UI (NOT .env.local)

Check CURRENT_STATE for API status before suggesting work!"
```

### **Asking for Help:**

```markdown
❌ Vague: "The ecosystem thing isn't working"

✅ Clear: "Company Ecosystem showing sample data. Per CURRENT_STATE.md, 
API exists but not wired. Can you wire CompanyEcosystemTableCompact 
onRefresh prop to /api/jobs/[id]/analyze-ecosystem?"
```

### **Requesting Documentation:**

```markdown
❌ "Update the docs"

✅ "Update CURRENT_STATE.md: Mark Company Ecosystem as '✅ Wired' 
in the AI Analysis section"
```

---

## 🗺️ **Mental Model: The Repo**

```
Think of JoTrack as 3 layers:

┌─────────────────────────────────────┐
│   Layer 1: UI (React Components)    │ ← Beautiful, 100% done ✅
│   All gradient sections built       │
└─────────────────────────────────────┘
               ↓ (wire these!)
┌─────────────────────────────────────┐
│   Layer 2: APIs (Next.js routes)    │ ← 40% done ⚠️
│   Some exist, some need creation    │   
└─────────────────────────────────────┘
               ↓
┌─────────────────────────────────────┐
│   Layer 3: Data (SQLite + AI)       │ ← 80% done ⚠️
│   Database ready, AI needs keys     │
└─────────────────────────────────────┘

Current bottleneck: Layer 1 ↔ Layer 2 connection (wiring)
```

---

**Last Updated**: Oct 16, 2024  
**Purpose**: Visual navigation and quick reference  
**Print this**: Keep it handy during development!

