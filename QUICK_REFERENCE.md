# JoTrack Quick Reference - Developer Cheat Sheet

## 🎯 **Critical Facts (Always Remember)**

1. **Button is called "Refresh Data"** NOT "Extract Data"
2. **FitTable displays as "Match Matrix"** NOT "Fit Table"
3. **API keys stored in DATABASE** NOT `.env.local`
4. **Settings accessed via ⚙️ button** (top-right corner)
5. **3 variants per document**: raw, ai_optimized, detailed
6. **Ecosystem cached 7 days** (huge cost savings!)

---

## 🔄 **Common User Flows**

### Flow 1: First-Time Setup
```
1. Open app → Click ⚙️ Settings
2. Go to "AI & Privacy" tab
3. Enter OpenAI API key (from platform.openai.com)
4. Click "Save Settings"
5. Create a job
6. Upload resume + JD
7. Click "Refresh Data" (~$0.02)
8. Wait for variants to be created
9. Click "Analyze Ecosystem" (~$0.15)
10. See real company data!
```

### Flow 2: Analyze a Job
```
1. Upload documents (if not already)
2. Click "Refresh Data" (creates variants)
3. Scroll to sections below
4. Click "Analyze Ecosystem" → See companies
5. Click "Analyze Match Matrix" → See signals
6. Click "Analyze Company Intelligence" → See company profile
7. Review insights
```

### Flow 3: Update Resume & Re-analyze
```
1. Review Match Matrix gaps
2. Update resume based on recommendations
3. Upload new resume version
4. Click "Refresh Data" (see changelog)
5. Re-analyze sections
6. Compare scores (trend indicators 🔼🔽)
```

---

## 🔌 **API Quick Lookup**

### Variants & Staleness
```typescript
POST /api/jobs/[id]/refresh-variants
// Creates ai_optimized + detailed from raw
// Returns: { success, processedAttachments, changelog, totalCost }

GET /api/jobs/[id]/check-staleness
// Returns: { severity, message, variantsExist, lastRefresh }
// Severities: no_variants | variants_fresh | major | never_analyzed | fresh

GET /api/jobs/[id]/variant?attachmentId={id}&variantType={type}
// Returns: { variant: { content, ... } }
// Types: raw | ai_optimized | detailed
```

### Analysis (Section-Specific)
```typescript
POST /api/jobs/[id]/analyze-ecosystem
// ✅ EXISTS, caching enabled (7 days)
// Returns: { companies[], metadata: { cached, cacheAge } }

POST /api/jobs/[id]/evaluate-signals  
// ✅ EXISTS
// Returns: { signals[], overall, categoryBreakdown }

POST /api/jobs/[id]/analyze-match
// ❌ NEEDS CREATION
// Should return: { matchScore, highlights, gaps, recommendations }

POST /api/jobs/[id]/analyze-company
// ❌ NEEDS CREATION
// Should return: { company: { name, founded, ... } }

POST /api/jobs/[id]/analyze-profiles
// ❌ NEEDS CREATION
// Should return: { profiles[], overallInsights }
```

### Settings
```typescript
GET /api/ai/keyvault/get
// Returns: { networkEnabled, provider, model, hasApiKey }

POST /api/ai/keyvault/set
// Body: { networkEnabled, provider, model, apiKey }

GET /api/ai/keyvault/status
// Returns: { networkEnabled, provider, model, hasApiKey }
```

---

## 📦 **Data Structures**

### Job
```typescript
interface Job {
  id: string;              // UUID
  title: string;
  company: string;
  status: JobStatus;       // APPLIED, INTERVIEWING, etc.
  notes: string;
  createdAt: number;       // Unix timestamp
  updatedAt: number;
  isDeleted: boolean;
  deletedAt: number | null;
  isArchived: boolean;
  archivedAt: number | null;
}
```

### Attachment
```typescript
interface Attachment {
  id: string;
  jobId: string;
  filename: string;
  path: string;            // Relative to ATTACHMENTS_ROOT
  size: number;            // Bytes
  mimeType: string;
  kind: 'resume' | 'jd' | 'cover_letter' | 'other';
  version: number;         // 1, 2, 3...
  createdAt: number;
  isActive: boolean;
  deletedAt: number | null;
}
```

### Artifact Variant
```typescript
interface ArtifactVariant {
  id: string;
  attachmentId: string;
  variantType: 'raw' | 'ai_optimized' | 'detailed';
  content: string;         // JSON string
  contentHash: string;     // SHA256
  wordCount: number;
  charCount: number;
  createdAt: number;
  metadata: string;        // JSON
}
```

### Ecosystem Company
```typescript
interface EcosystemCompany {
  name: string;
  category: 'direct' | 'adjacent' | 'upstream' | 'downstream' | 'complementary';
  size: { employees: string; sizeCategory: string };
  industry: { broad: string; specific: string };
  location: { headquarters: string; region: string; isRemote: boolean };
  leadership: { ceo: string | null; ceoBackground: string | null };
  careerMetrics: { growthScore: number; stabilityScore: number; retentionScore: number };
  recentNews: { positive: number; negative: number; highlights: string[] };
  skillsIntel: { currentHotSkills: string[]; hiringTrend: string; openRoles: number | null };
  relevanceScore: number;   // 0-100
  reason: string;
  insights: string;         // 2-3 sentences
  confidence: { score: 'high' | 'medium' | 'low'; percentage: number };
  sources: Array<{ name: string; url: string; category: string }>;
}
```

---

## 🎨 **Component Props Quick Lookup**

### CompanyEcosystemTableCompact
```typescript
{
  companies: EcosystemCompany[];
  isAiPowered: boolean;
  onRefresh?: () => void;              // ⚠️ Currently not wired to API
  refreshing?: boolean;
  onViewFull?: () => void;
  cacheMetadata?: { cached: boolean; cacheAge: string; cacheExpiresIn: string };
}
```

### AnalysisExplanation
```typescript
{
  children: ReactNode;        // Explanation content
  defaultExpanded?: boolean;  // Default: false
}
```

### AnalyzeButton
```typescript
{
  onAnalyze: () => Promise<void>;
  isAnalyzing: boolean;
  label: string;              // e.g., "Analyze Ecosystem"
}
```

---

## 🔑 **Function Signatures (Most Used)**

### AI Provider
```typescript
// Get settings from database
getAiSettings(): Promise<AiSettings>

// Save settings to database (encrypted)
saveAiSettings(settings: AiSettings): Promise<void>

// Call AI with prompt
callAiProvider(config: {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<string>
```

### Variant Management
```typescript
// Get variant
getVariant(
  jobId: string,
  kind: 'resume' | 'jd' | 'cover_letter',
  variantType: 'raw' | 'ai_optimized' | 'detailed'
): Promise<ArtifactVariant | null>

// Save variant
saveVariant(data: {
  attachmentId: string;
  variantType: string;
  content: any;
  metadata?: any;
}): Promise<string>  // Returns variant ID
```

### Signal Repository
```typescript
// Get all 30 ATS signals
getAllAtsSignals(): Promise<AtsSignal[]>

// Get job-specific dynamic signals
getJobDynamicSignals(jobId: string): Promise<DynamicSignal[]>

// Save signal evaluation
saveSignalEvaluation(data: {
  jobId: string;
  signalId: string;
  score: number;
  evidence: string;
  reasoning: string;
}): Promise<void>
```

---

## 🎯 **Where to Wire APIs**

### Company Ecosystem
**File**: `app/components/ai/CompanyEcosystemTableCompact.tsx`
**Prop**: `onRefresh`
**Current**: Undefined (not connected)
**Fix**:
```typescript
// In AiShowcase.tsx, pass:
onRefresh={async () => {
  const res = await fetch(`/api/jobs/${jobId}/analyze-ecosystem`, { method: 'POST' });
  const data = await res.json();
  // Update state with data.companies
}}
```

### Match Matrix
**File**: `app/components/coach/tables/FitTable.tsx`
**Prop**: `onRefresh`
**Current**: Passed from AiShowcase but not calling API
**Fix**: Similar to ecosystem, call `/api/jobs/[id]/evaluate-signals`

---

## 💰 **Cost Estimates (Always Show)**

```typescript
const COSTS = {
  REFRESH_DATA: 0.02,           // Per job (all docs)
  ANALYZE_MATCH: 0.05,          // Match score + skills
  ANALYZE_COMPANY: 0.05,        // Company intel
  ANALYZE_ECOSYSTEM: 0.15,      // 10 companies (cached!)
  ANALYZE_PROFILES: 0.05,       // People profiles
  ANALYZE_SIGNALS: 0.05,        // Match Matrix
  FULL_ANALYSIS: 0.22,          // All of the above
};

// Display format:
`~$${COSTS.REFRESH_DATA.toFixed(2)}`  // "~$0.02"
```

---

## 🎨 **Standard Color Codes**

### Section Gradients (Copy-Paste)
```typescript
// Match Score
'bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800'

// Skill Match
'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-800'

// Company Intelligence
'bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border border-indigo-200 dark:border-indigo-800'

// Company Ecosystem
'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200 dark:border-emerald-800'

// People Profiles
'bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border border-cyan-200 dark:border-cyan-800'
```

### Text Colors (Universal)
```typescript
'text-gray-900 dark:text-gray-100'  // Headers (h1-h5)
'text-gray-700 dark:text-gray-300'  // Body text
'text-gray-600 dark:text-gray-400'  // Muted/secondary
'text-gray-500 dark:text-gray-400'  // Disabled/placeholder
```

---

## 🐛 **Common Pitfalls**

### Mistake 1: Calling Wrong Button Name
```
❌ "Click Extract Data"
✅ "Click Refresh Data"
```

### Mistake 2: Wrong Component Name
```
❌ FitTable
✅ Match Matrix
```

### Mistake 3: Expecting .env.local
```
❌ "Add key to .env.local"
✅ "Add key in Settings → AI & Privacy"
```

### Mistake 4: Wrong API Endpoint
```
❌ POST /api/analyze-ecosystem
✅ POST /api/jobs/[id]/analyze-ecosystem
```

### Mistake 5: Forgetting Dark Mode
```
❌ className="bg-white text-gray-900"
✅ className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
```

---

## 🧪 **Testing Checklist**

### Before Pushing Code
- [ ] Tested in light mode
- [ ] Tested in dark mode
- [ ] Checked terminal for errors
- [ ] Verified no linter errors
- [ ] Checked all text is readable
- [ ] Tested responsive breakpoints
- [ ] Verified API calls work
- [ ] Checked cost calculations
- [ ] Tested error states
- [ ] Verified loading states

---

## 📱 **Where Things Are in the UI**

```
Homepage (/)
├── ⚙️ Settings (top-right)
│   ├── AI & Privacy (add API key here!)
│   ├── Data Management
│   ├── Preferences
│   └── Developer
├── + New Job
├── Search bar
├── Status filter tabs
└── Jobs table

Job Detail (/jobs/[id])
├── Job Header
│   ├── Title, Company, Status
│   ├── Notes (collapsible)
│   ├── 📎 Attachments button
│   └── Status Events
├── Data Pipeline Panel (collapsible)
│   ├── Status banner (🟣🔵🟠🟢)
│   ├── "Refresh Data" button
│   └── Document list with "View Variants"
├── AI Analysis Sections
│   ├── Match Score (purple gradient)
│   ├── Skill Match (amber gradient)
│   ├── Company Intelligence (indigo gradient)
│   ├── Company Ecosystem (emerald gradient)
│   ├── Match Matrix (neutral)
│   └── People Profiles (cyan gradient)
```

---

## 🔧 **Common Tasks**

### Add a New Analysis Section
```
1. Copy template from UI_DESIGN_SYSTEM.md
2. Pick unique gradient colors
3. Create component in app/components/ai/
4. Add to AiShowcase.tsx
5. Create API endpoint in app/api/jobs/[id]/
6. Create prompt in core/ai/prompts/
7. Add AnalysisExplanation section
8. Test in both themes
9. Update CURRENT_STATE.md
```

### Fix a Dark Mode Issue
```
1. Find the element with bright background
2. Add dark: variant to className
3. Follow UI_DESIGN_SYSTEM.md color patterns
4. Test toggle dark mode
5. Verify readability (contrast ≥ 4.5:1)
```

### Wire an Analyze Button
```
1. Find the component (e.g., CompanyEcosystemTableCompact)
2. Look for onRefresh prop
3. Trace back to AiShowcase.tsx
4. Add API call in handler
5. Update state with response
6. Test with real API key
```

---

## 📊 **Database Quick Queries**

```bash
# Check if API key exists
sqlite3 data/jotrack.db "SELECT key, length(value) as enc_length FROM app_settings WHERE key='ai_settings';"

# Check variants for a job
sqlite3 data/jotrack.db "SELECT a.filename, av.variant_type, length(av.content) as size 
FROM artifact_variants av 
JOIN attachments a ON av.attachment_id = a.id 
WHERE a.job_id = 'YOUR-JOB-ID';"

# Check ATS signals
sqlite3 data/jotrack.db "SELECT category, COUNT(*) FROM ats_signals GROUP BY category;"

# Check ecosystem cache
sqlite3 data/jotrack.db "SELECT company_name, datetime(created_at, 'unixepoch') as created, 
datetime(expires_at, 'unixepoch') as expires FROM company_ecosystem_cache;"
```

---

## 🎯 **Priority Order (For AI Assistant)**

When working on tasks, follow this priority:

1. **Fix critical bugs** (app won't load)
2. **Complete user-requested features** (current session task)
3. **Wire existing APIs** (quick wins)
4. **Create missing APIs** (enable features)
5. **Add tests** (prevent regressions)
6. **Polish UI** (already done! ✅)
7. **Optimize performance** (backlog)
8. **Add nice-to-haves** (backlog)

---

## 🚨 **Red Flags (Stop and Check)**

### When You See These, Investigate:

```
⚠️ "showing sample data" → Check if API wired
⚠️ "bright background in dark mode" → Add dark: variant
⚠️ "FitTable" → Should be "Match Matrix"
⚠️ "Extract Data" → Should be "Refresh Data"
⚠️ ".env.local" → Should be Settings modal
⚠️ "no API key" → Check database, not files
⚠️ "400 error on prompt" → Check PromptKind allowlist
⚠️ "cache expired" → Don't say expired, say "X days old"
```

---

## 💡 **Quick Wins (Easy Tasks)**

### If User is Away
1. ✅ Create documentation (CURRENT_STATE, TERMINOLOGY, etc.)
2. ✅ Clean up old planning docs
3. ✅ Update README with current state
4. ⚠️ Review prompts for quality
5. ⚠️ Add missing TypeScript types
6. ⚠️ Improve error messages
7. ⚠️ Add more test coverage

### If User is Available
1. ⚠️ Wire Company Ecosystem API
2. ⚠️ Create Match Score API
3. ⚠️ Test Refresh Data flow
4. ⚠️ Test one full analysis workflow

---

## 🎓 **Learning from Mistakes**

### Recent Corrections by User

1. **"Extract Data" → "Refresh Data"**
   - I kept saying wrong button name
   - Correct name is in Data Pipeline panel
   - Now documented in TERMINOLOGY_GUIDE.md

2. **Forgot about Settings Modal**
   - Suggested creating .env.local
   - Settings UI already existed!
   - Now documented in QUICK_REFERENCE.md

3. **FitTable vs Match Matrix**
   - Component file is FitTable.tsx
   - Display name is "Match Matrix"
   - Need to remember this distinction

---

## 📚 **Where to Find Information**

| Question | Document |
|----------|----------|
| What button labels to use? | TERMINOLOGY_GUIDE.md |
| How to build a new section? | UI_DESIGN_SYSTEM.md |
| What's the current status? | CURRENT_STATE.md |
| How does X work? | ARCHITECTURE.md |
| What are the features? | PREVIEW_SYSTEM_GUIDE.md |
| What's broken? | KNOWN_ISSUES.md |
| Quick API lookup? | QUICK_REFERENCE.md (this file) |

---

## 🔄 **Refresh Cycle**

### When to Update Documentation

**After each session:**
- Update CURRENT_STATE.md (what changed)
- Update CHANGELOG.md (if feature complete)
- Update KNOWN_ISSUES.md (bugs fixed/added)

**When adding features:**
- Update TERMINOLOGY_GUIDE.md (new terms)
- Update UI_DESIGN_SYSTEM.md (new patterns)
- Update ARCHITECTURE.md (design decisions)

**Before going public:**
- Run cleanup script (remove planning docs)
- Update README.md (polish)
- Review all public docs for accuracy

---

**Last Updated**: Oct 16, 2024  
**Purpose**: Prevent mistakes, speed up development  
**Update Frequency**: After each major session

