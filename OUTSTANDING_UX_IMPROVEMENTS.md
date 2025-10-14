# Outstanding UX Improvements - Curated List

**Last Updated**: October 14, 2025  
**Status**: These features were requested but NOT YET implemented

---

## 🔴 **CRITICAL ISSUES (Fix First)**

### **1. Coach Mode: Resume/JD Not Loading** ❌
**Status**: NOT FIXED  
**Issue**: Coach Mode shows "No resume uploaded yet" even though attachments exist  
**Expected**: Auto-populate JD and Resume from existing job attachments  
**Job ID for testing**: `3957289b-30f5-4ab2-8006-3a08b6630beb`

**Related Code**:
- `app/components/coach/ResumeJdPreview.tsx` - Attachment loading logic
- `app/api/jobs/[id]/attachments/route.ts` - Attachments API

---

### **2. Database Migration Not Applied** ✅ JUST FIXED
**Status**: FIXED (ran `npm run db:migrate`)  
**Issue**: `coach_sessions` table missing  
**Fix**: Migration executed successfully

---

## 🎯 **SETTINGS NAVIGATION ISSUES**

### **3. No Global Settings Icon in Navigation** ❌
**Status**: NOT IMPLEMENTED  
**Requested**: Settings gear icon should be in top-level navigation (always visible)  
**Current**: Settings button only on individual pages  
**Expected**: Floating icon in header/nav that opens GlobalSettingsModal

**Affected Files**:
- Need to update: `app/layout.tsx` or create `app/components/AppHeader.tsx`
- Modal exists: `app/components/GlobalSettingsModal.tsx`

---

### **4. Duplicate Settings Pages** ❌
**Status**: NOT CONSOLIDATED  
**Issue**: Two separate settings pages:
  - `/settings/ai` - API key settings
  - `/settings` - General settings (no nav, user gets stuck)

**Expected**: Single unified settings modal with tabs:
- AI & API Keys
- Data Management (export/import)
- Preferences
- Developer (prompts)

**Related Files**:
- `app/settings/ai/page.tsx`
- `app/settings/page.tsx`
- `app/components/GlobalSettingsModal.tsx` (exists but not wired properly)

---

### **5. Settings Pages Missing Navigation** ❌
**Status**: NOT IMPLEMENTED  
**Issue**: User goes to `/settings` → No back button, gets stuck  
**Expected**: 
  - Breadcrumb navigation at top
  - Back button
  - Or use modal instead of pages

**Affected Files**:
- `app/settings/page.tsx`
- `app/settings/ai/page.tsx`

---

## 📋 **COACH MODE ENHANCEMENTS**

### **6. Auto-Save Indicator Not Showing** ❌
**Status**: IMPLEMENTED BUT NOT VISIBLE  
**Issue**: SaveStatusBanner exists but user doesn't see save status clearly  
**Expected**: 
  - Global save icon/banner
  - Shows "Saving...", "Saved ✓", "Save failed"
  - Timestamp of last save

**File**: `app/components/SaveStatusBanner.tsx` (exists)  
**Parent**: `app/coach/[jobId]/page.tsx` (wired up)

---

### **7. Resume/JD Pre-population** ❌
**Status**: PARTIALLY IMPLEMENTED  
**Issue**: Auto-population doesn't work (see Issue #1)  
**Expected**: 
  - Automatically pre-fill text from existing attachments
  - Show as read-only initially
  - "Edit" button to unlock
  - "Update Baseline" / "Revert" options

**File**: `app/components/coach/ResumeJdPreview.tsx` (exists but broken)

---

### **8. URL Fetch Test Button** ❌
**Status**: NOT IMPLEMENTED  
**Requested**: Button to test URL fetching with fallback to manual input  
**Expected**:
  - "Fetch from URL" button
  - If fetch succeeds → populate field
  - If fails → show manual textarea
  - Applies to: Recruiter, Peers, Skip-level, Company URLs

**Needs**: New component or enhancement to `URLInputField.tsx`

---

### **9. AI Setup Messaging** ⚠️ PARTIALLY DONE
**Status**: UPDATED BUT NEEDS POLISH  
**Current**: Shows "AI Powered" vs "Enable AI"  
**Issue**: Still shows "Enable AI" when key is configured  
**Expected**: 
  - "AI Powered" when configured
  - "Enable AI" when not configured
  - Contextual messaging

**File**: `app/components/coach/steps/GatherStep.tsx`

---

### **10. "Analyze All" Button Not Wired** ❌
**Status**: UI EXISTS, NOT FUNCTIONAL  
**Implemented**: Button renders in Coach Mode  
**Missing**: Actual functionality to trigger all AI analyses  
**Expected**: One click triggers:
  - Company analysis
  - People analysis
  - Match score
  - Skills analysis

**File**: `app/components/coach/steps/GatherStep.tsx` (button exists with TODO)

---

### **11. URL Scraping/Auto-Fetch** ❌
**Status**: NOT IMPLEMENTED  
**Requested**: Crawl URLs (LinkedIn, company pages) and extract info  
**Expected**:
  - Button: "Auto-fetch from URL"
  - Extracts: Title, description, Open Graph data
  - Fallback to manual if fails

**Needs**: 
- API endpoint (partially exists: `/api/scrape/route.ts`)
- Integration in Coach Mode forms

---

### **12. Live Save for All Fields** ⚠️ PARTIALLY DONE
**Status**: IMPLEMENTED FOR SOME FIELDS  
**Working**: Auto-save triggers on text changes  
**Missing**: Visual confirmation for each field type  
**Expected**: Real-time save status per section

**File**: `app/coach/[jobId]/page.tsx` (has auto-save logic)

---

### **13. Add/Remove Controls for Multi-Entry** ❌
**Status**: NOT IMPLEMENTED  
**Requested**: UI for managing multiple entries  
**Expected**:
  - "+" button to add more
  - "×" button to remove
  - Applies to: Team members, Peers, Skip-level, Companies

**Needs**: New component or update `MultiEntryField.tsx`

---

### **14. Data Sync Between Coach & Main Job Page** ❌
**Status**: NOT IMPLEMENTED  
**Issue**: Data entered in Coach Mode doesn't flow to main job view  
**Expected**: 
  - All Coach data stored in `coach_sessions` (✅ table exists)
  - Main job page reads from `coach_sessions`
  - Unified data strategy

**Needs**: API endpoint to fetch Coach data for display

---

### **15. Exit Coach Mode Controls** ❌
**Status**: NOT IMPLEMENTED  
**Missing**: 
  - Back button to job page
  - "Save & Exit" button
  - Confirmation dialog if unsaved changes

**File**: `app/coach/[jobId]/page.tsx`

---

## 🎨 **JOB PAGE ENHANCEMENTS**

### **16. AI Analysis Branding** ⚠️ PARTIALLY DONE
**Status**: UPDATED BUT INCONSISTENT  
**Current**: Some places say "AI Powered", others don't  
**Expected**: Consistent "AI Powered" / "Non-AI Powered" labels  
**Files**: 
  - `app/components/jobs/AiShowcase.tsx` (updated)
  - `app/components/ai/CompanyIntelligenceCard.tsx`
  - `app/components/ai/PeopleProfilesCard.tsx`

---

### **17. Match Score Content** ❌
**Status**: NOT IMPLEMENTED  
**Requested**: Initial content should be preliminary local assessment  
**Expected**:
  - Show basic analysis on page load
  - Animate when AI refresh completes
  - Clear before/after distinction

**File**: `app/components/jobs/AiShowcase.tsx`

---

### **18. Skill Match Section Expansion** ❌
**Status**: NOT IMPLEMENTED  
**Requested**: More parameters, better visualization  
**Expected**:
  - Single horizontal bar with 3 colors
  - JD (blue), Resume (green), Full Profile (purple)
  - Shows proficiency levels
  - Highlights gaps

**File**: `app/components/ai/SkillsMatchChart.tsx` or create new

---

### **19. Match Matrix Expandable Categories** ❌
**Status**: NOT IMPLEMENTED  
**Requested**: 
  - 3 categories, 25 parameters total
  - Click category to expand
  - "Expand All" button
  - Renamed from "Fit Matrix" to "Match Matrix" (✅ done)

**File**: `app/components/coach/tables/FitTable.tsx`

---

### **20. "Why This Matters" Always Expanded** ✅ DONE
**Status**: COMPLETED  
**Implemented**: Removed collapsible `<details>` tags  
**File**: `app/components/coach/tables/FitTable.tsx`

---

### **21. People Insights Separation** ❌
**Status**: NOT IMPLEMENTED  
**Requested**: Separate company and people profiles  
**Expected**:
  - Company section: Standalone card
  - People section: List individuals with analysis
  - "What this means for you" for each person

**Files**:
  - `app/components/ai/CompanyIntelligenceCard.tsx` (exists)
  - `app/components/ai/PeopleProfilesCard.tsx` (exists)

---

### **22. Modular AI Analysis Buttons** ⚠️ PARTIALLY DONE
**Status**: BUTTONS EXIST, NOT FULLY FUNCTIONAL  
**Current**: Each section has "Analyze" button  
**Missing**: Visual feedback, status per section  
**Expected**: 
  - Loading state per section
  - Success/error per section
  - Don't block other sections

**Files**: Multiple AI card components

---

### **23. Hierarchical Context Passing** ❌
**Status**: NOT IMPLEMENTED  
**Requested**: Dependency chain for AI analyses  
**Expected**:
  - Company → People → Match Score → Skills
  - Pass token-optimized summaries (max 100 words)
  - Each analysis uses previous results as context

**Needs**: Major refactor of AI analysis flow

---

### **24. Company Section Enhancements** ⚠️ PARTIALLY DONE
**Status**: COMPONENT EXISTS, NOT FULLY FEATURED  
**Exists**: `CompanyIntelligenceCard.tsx`, `CompanyEcosystemMatrix.tsx`  
**Missing**: 
  - TL;DR card with key facts
  - Top 20 competitors matrix
  - Relevance/fit scores

**Files**: 
  - `app/components/ai/CompanyIntelligenceCard.tsx`
  - `app/components/ai/CompanyEcosystemMatrix.tsx`

---

## 🔧 **TECHNICAL IMPROVEMENTS**

### **25. Analysis Cooldown** ❌
**Status**: NOT IMPLEMENTED  
**Requested**: Prevent excessive token burn  
**Expected**:
  - Detect if content changed since last run
  - Show cooldown timer (e.g., "Please wait 2 minutes")
  - Cache results for 24h if unchanged

**Needs**: New utility `lib/coach/analysisGuardrails.ts` (exists but not wired)

---

### **26. Token Optimizer** ✅ DONE
**Status**: COMPLETED  
**Implemented**: Component and API endpoint  
**Files**: 
  - `app/components/coach/TokenOptimizer.tsx`
  - `app/api/ai/optimize-tokens/route.ts`

---

### **27. Prompt Viewer** ✅ DONE
**Status**: COMPLETED  
**Implemented**: View prompts next to Analyze buttons  
**Files**:
  - `app/components/ai/PromptViewer.tsx`
  - `app/api/ai/prompts/view/route.ts`

---

### **28. Live Prompt Editor** ❌
**Status**: NOT IMPLEMENTED  
**Requested**: Edit prompts with Monaco editor  
**Expected**:
  - Developer tab in settings
  - Edit button next to each prompt
  - Version tracking
  - Rollback functionality

**Needs**: New admin page + Monaco integration

---

### **29. 3-Level Skills Visualization** ❌
**Status**: NOT IMPLEMENTED  
**Requested**: Show JD, Resume, Full Profile skill levels  
**Expected**: Visual chart on main job page  
**File**: `app/components/ai/SkillThreeLevelChart.tsx` (created but not integrated)

---

### **30. Loading Animations** ❌
**Status**: NOT IMPLEMENTED  
**Requested**: Shimmer/pulse for loading states  
**Expected**: Better visual feedback during AI analysis

---

## 📊 **SUMMARY**

| Category | Total | Completed | Partial | Not Done |
|----------|-------|-----------|---------|----------|
| **Critical Issues** | 2 | 1 | 0 | 1 |
| **Settings** | 3 | 0 | 0 | 3 |
| **Coach Mode** | 10 | 0 | 3 | 7 |
| **Job Page** | 9 | 1 | 3 | 5 |
| **Technical** | 6 | 2 | 0 | 4 |
| **TOTAL** | **30** | **4** | **6** | **20** |

---

## 🎯 **PRIORITY ORDER** (User's Request)

### **Immediate (Session 2)**
1. ✅ Fix CSS loading (DONE)
2. ❌ Fix Coach Mode Resume/JD loading
3. ❌ Add global settings icon
4. ❌ Consolidate settings pages
5. ❌ Wire "Analyze All" button

### **High Priority (Session 3)**
1. ❌ 3-Level Skills visualization
2. ❌ Analysis cooldown/guardrails
3. ❌ URL auto-fetch
4. ❌ Multi-entry add/remove controls
5. ❌ Exit Coach Mode controls

### **Medium Priority (Session 4)**
1. ❌ Modular AI analysis (per-section status)
2. ❌ Hierarchical context passing
3. ❌ Company section enhancements
4. ❌ Match Matrix expandable categories
5. ❌ Skill Match visualization

### **Low Priority (Future)**
1. ❌ Live prompt editor
2. ❌ Loading animations
3. ❌ Advanced analytics

---

## 📝 **NOTES**

- Most features have groundwork laid (components exist)
- Main issues: Wiring, integration, data flow
- Need focused session on each category
- Some features blocked by others (dependencies)

---

**Next Step**: Fix critical issues (#1, #3, #4) first, then continue building features in priority order.

