# 🚀 JoTrack v2.3 - Remaining Work (Clear Roadmap)

**Current Status**: 75% Complete (6/8 phases done)  
**What's Left**: 25% (mostly polish and advanced features)

---

## 📋 PENDING ITEMS (Prioritized)

### 🔴 HIGH PRIORITY (Should Do Next)

These are high-value features that are partially complete or have UI ready but need wiring:

#### 1. Wire Company/People AI Analysis Buttons (2-3 hours)
**Status**: Buttons exist, API endpoints not connected  
**What's Needed**:
- Create `/api/ai/company-analysis/route.ts` endpoint
- Create `/api/ai/people-analysis/route.ts` endpoint
- Create `prompts/company.v1.md` prompt template
- Create `prompts/people.v1.md` prompt template
- Wire "Analyze" buttons in `CompanyIntelligenceCard.tsx` and `ProfileTable.tsx`
- Add loading/success states

**Files to Create**:
- `app/api/ai/company-analysis/route.ts`
- `app/api/ai/people-analysis/route.ts`
- `prompts/company.v1.md`
- `prompts/people.v1.md`

**Files to Update**:
- `app/components/ai/CompanyIntelligenceCard.tsx`
- `app/components/coach/tables/ProfileTable.tsx`

**Test**: Click "Analyze" button → See loading → Get results

---

#### 2. Add 3-Level Skill Bars to Main UI (1-2 hours)
**Status**: Component exists (`SkillThreeLevelChart.tsx`), not in main UI  
**What's Needed**:
- Add `SkillThreeLevelChart` to `AiShowcase.tsx`
- Replace or enhance current `SkillsMatchChart`
- Parse AI output to provide 3-level data (JD/Resume/Full Profile)
- Update AI prompts to return skill proficiency levels

**Files to Update**:
- `app/components/jobs/AiShowcase.tsx` (add component)
- `prompts/analyze.v1.md` (update to return 3-level skill data)

**Test**: Job page → AI Analysis → See 3-level skill bars with colors

---

#### 3. Match Matrix "Expand All" Button (1 hour)
**Status**: Structure ready, button not implemented  
**What's Needed**:
- Add "Expand All" / "Collapse All" button to FitTable header
- Implement accordion state for all categories at once
- Group 25 parameters into 3 categories visually
- Show category summary scores

**Files to Update**:
- `app/components/coach/tables/FitTable.tsx`

**Test**: Click "Expand All" → All categories expand → Click "Collapse All" → All collapse

---

### 🟡 MEDIUM PRIORITY (Nice to Have)

These improve UX but aren't critical:

#### 4. Loading Animations & Visual Polish (2-3 hours)
**Status**: Basic states exist, animations missing  
**What's Needed**:
- Add shimmer/skeleton loading states
- Add pulse animation for fresh analysis
- Add "stale data" badges (e.g., "Analyzed 2 days ago")
- Smooth transitions between states

**Files to Create**:
- `app/components/LoadingShimmer.tsx`
- `app/globals.css` (add animation keyframes)

**Files to Update**:
- `app/components/jobs/AiShowcase.tsx`
- `app/components/ai/CompanyIntelligenceCard.tsx`
- All AI cards

**Test**: Trigger analysis → See shimmer → See pulse when complete

---

#### 5. Hierarchical Context Passing (3-4 hours)
**Status**: Architecture designed, not implemented  
**What's Needed**:
- Create `lib/ai/contextBuilder.ts` utility
- Store analysis summaries in `ai_runs.meta_json.summary`
- Pass context to dependent analyses
- Token-optimize summaries (max 100 words)

**Flow**:
```
Company Analysis
    ↓ (summary)
People Profiles (uses company context)
    ↓ (summary)
Match Score (uses company + people context)
    ↓ (summary)
Skill Recommendations (uses all above)
```

**Files to Create**:
- `lib/ai/contextBuilder.ts`
- Database: `analysis_dependencies` table migration

**Files to Update**:
- All `/api/ai/*` routes to accept and use context

**Test**: Run Company → People → Match in sequence → Each uses previous context

---

### 🟢 LOW PRIORITY (Polish & Advanced)

These are optional enhancements:

#### 6. Prompt Editor UI (3-4 hours)
**Status**: Placeholder in Developer tab  
**What's Needed**:
- Create `/app/admin/prompts/[kind]/page.tsx`
- Monaco editor integration
- Version control (save/revert)
- Diff view from last saved version
- Auth guard (developer mode only)

**Files to Create**:
- `app/admin/prompts/[kind]/page.tsx`
- `app/api/admin/prompts/save/route.ts`

**Test**: Settings → Developer → Edit Prompts → See Monaco editor

---

#### 7. Expand "Why This Matters" Sections (30 minutes)
**Status**: Currently collapsed in some places  
**What's Needed**:
- Remove collapse/expand logic
- Always show content expanded
- Update all AI cards

**Files to Update**:
- `app/components/coach/tables/FitTable.tsx`
- `app/components/coach/tables/ProfileTable.tsx`
- `app/components/ai/CompanyIntelligenceCard.tsx`
- `app/components/ai/CompanyEcosystemMatrix.tsx`

**Test**: All "Why this matters" sections visible by default

---

#### 8. Enhanced Auto-Save Features (1-2 hours)
**Status**: Basic auto-save works, could add more features  
**What's Needed**:
- "Unsaved changes" warning when navigating away
- Manual "Save Now" button
- "Last saved by [User]" if multi-user in future
- Save history/versions

**Files to Update**:
- `app/components/SaveStatusBanner.tsx`
- `app/coach/[jobId]/page.tsx`

**Test**: Make changes → Navigate away → See warning

---

#### 9. URL Fetch Test Button (1 hour)
**Status**: `/api/scrape` exists, UI button not added  
**What's Needed**:
- Add "Test Fetch" button next to URL inputs
- Show preview of extracted data
- Visual feedback (green checkmark / red X)
- Expand manual input on failure

**Files to Update**:
- `app/components/coach/steps/GatherStep.tsx`
- `app/components/coach/URLInputField.tsx` (if exists)

**Test**: Enter LinkedIn URL → Click "Test Fetch" → See preview

---

#### 10. Database Tables for Company/People (1 hour)
**Status**: Not created yet (currently using sample data)  
**What's Needed**:
- Create `company_analyses` table migration
- Create `analysis_dependencies` table migration
- Store Company/People analysis results
- Retrieve for display

**Files to Create**:
- `db/migrations/0021_company_analyses.sql`
- `db/migrations/0022_analysis_dependencies.sql`

**Test**: Run migration → Tables exist → Data persists

---

## 📊 COMPLETION SUMMARY

| Priority | Items | Est. Time | Status |
|----------|-------|-----------|--------|
| HIGH | 3 items | 4-6 hours | 🔴 Not Started |
| MEDIUM | 2 items | 5-7 hours | 🟡 Partial |
| LOW | 5 items | 7-9 hours | 🟢 Optional |
| **TOTAL** | **10 items** | **16-22 hours** | **~3 days** |

---

## 🎯 RECOMMENDED BUILD ORDER

### Session 1 (Next 2-3 hours): High-Value Features
1. ✅ Wire Company/People AI Analysis Buttons
2. ✅ Add 3-Level Skill Bars to Main UI
3. ✅ Match Matrix "Expand All" Button

**Why**: These are the most visible user-facing features that are already 50-75% complete.

---

### Session 2 (Next 2-3 hours): Polish
4. ✅ Loading Animations & Visual Polish
5. ✅ Expand "Why This Matters" Sections
6. ✅ URL Fetch Test Button

**Why**: Quick wins that improve UX significantly with minimal effort.

---

### Session 3 (Next 3-4 hours): Advanced Features
7. ✅ Hierarchical Context Passing
8. ✅ Database Tables for Company/People
9. ✅ Enhanced Auto-Save Features

**Why**: More complex features that can be added after core functionality is solid.

---

### Session 4 (Optional, 3-4 hours): Developer Tools
10. ✅ Prompt Editor UI

**Why**: Nice to have but not user-facing. Can be added later based on feedback.

---

## 🚫 NOT BUILDING (Explicitly Out of Scope)

These were in the original plan but we're intentionally skipping:

1. ❌ **Prompt Version Control** - Too complex, low ROI
2. ❌ **JobDataProvider** - Over-engineering, current approach works
3. ❌ **Sync Coach Mode with Job Repository** - Auto-save is sufficient
4. ❌ **Delete Old Settings Pages** - They're still useful for direct access
5. ❌ **Multi-user Features** - Not in scope for local-first app

---

## 💡 MY RECOMMENDATION

**Start with Session 1 (High Priority)**:
1. Wire Company/People AI buttons (biggest impact)
2. Add 3-level skill bars (visual wow factor)
3. Match Matrix expand-all (UX improvement)

**Then**: Get your feedback before continuing

**Why**: These 3 items will give you ~85% completion with the most visible improvements. Better to test these before adding more complexity.

---

## 📝 NOTES

**What Works Now**:
- ✅ All core features (auto-save, pre-fill, settings, branding)
- ✅ All new sections render with sample data
- ✅ All components exist and are styled
- ✅ Database is migrated
- ✅ CSS is working

**What Needs Wiring**:
- 🔌 Company/People analyze buttons → real AI
- 🔌 3-level skills → real data
- 🔌 Some animations and polish

**Status**: App is 75% done and fully functional. Remaining 25% is enhancement and polish.

---

**🎯 Ready to continue! Shall I start with Session 1 (High Priority items)?**

