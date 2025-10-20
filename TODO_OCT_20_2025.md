# JoTrack - To-Do List for October 20, 2025
**Session Goal**: Token optimization + Feature completion + Testing  
**Focus**: Fix bugs, optimize costs, complete coach mode features

---

## 🚨 **PRIORITY 0: Critical Bugs (Fix First!)**

### Bug 1: Document Status Display Issue
- [ ] Debug why Resume/JD status shows "Not uploaded" when files exist
- [ ] Check browser console for attachments API response
- [ ] Verify `attachmentsList` is correctly populated
- [ ] Test with actual uploaded files
- [ ] **Estimated Time**: 30 min
- [ ] **Blocker**: YES - breaks main UX

### Bug 2: Interview Questions Generation Error
- [ ] Debug "generation failed: no such table: job_interview_questions"
- [ ] Verify migration 012 ran successfully
- [ ] Check if table exists in database
- [ ] Re-run migration if needed
- [ ] Test full interview questions flow
- [ ] **Estimated Time**: 45 min
- [ ] **Blocker**: YES - feature broken

---

## 💰 **PRIORITY 1: Token Optimization (Quick Wins)**

### Task 1.1: Company Intelligence Caching
- [ ] Extend `company_ecosystem_cache` table or create new one
- [ ] Add cache check in `/api/jobs/[id]/analyze-company`
- [ ] Set TTL to 30 days (company facts change slowly)
- [ ] Cache key: `SHA256(companyName + industry)`
- [ ] Test cache hit/miss scenarios
- [ ] **Estimated Time**: 2 hours
- [ ] **Savings**: $1.50/year (50 jobs)
- [ ] **Impact**: Medium

### Task 1.2: Interview Questions Persona-Specific Generation
- [ ] Modify `/api/jobs/[id]/interview-questions/generate` to accept `persona` param
- [ ] Update modal to pass selected persona
- [ ] Only generate selected persona (not all 3)
- [ ] Cache individual persona responses separately
- [ ] Allow incremental generation (Recruiter first, then HM later)
- [ ] **Estimated Time**: 3 hours
- [ ] **Savings**: $1.50/year (if only 1 persona needed)
- [ ] **Impact**: Medium

### Task 1.3: FTS5 Skill Matching (No AI!)
- [ ] Extract skills from JD using regex + FTS5 tokenization
- [ ] Extract skills from Resume using same method
- [ ] Calculate match % locally (no AI call)
- [ ] Display in existing Skill Match section
- [ ] Add "AI-Enhanced" toggle for optional semantic matching
- [ ] **Estimated Time**: 4 hours
- [ ] **Savings**: $1.00/year (avoid AI call completely)
- [ ] **Impact**: High (70% cost reduction for this feature)

**Total Phase 1 Savings**: $4.00/year (50 jobs) or **17% cost reduction**

---

## 🏗️ **PRIORITY 2: Core Architecture (Analysis Bundle System)**

### Task 2.1: Create Analysis Bundle Schema
- [ ] Create migration: `db/migrations/013_analysis_bundles.sql`
- [ ] Add `job_analysis_bundles` table:
  ```sql
  CREATE TABLE job_analysis_bundles (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL UNIQUE,
    fingerprint TEXT NOT NULL, -- SHA256(resume_content + jd_content)
    
    -- Cached variants
    resume_raw TEXT,
    resume_ai_optimized TEXT,
    resume_detailed TEXT,
    jd_raw TEXT,
    jd_ai_optimized TEXT,
    jd_detailed TEXT,
    
    -- Metadata
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    expires_at INTEGER, -- Optional TTL
    
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
  );
  ```
- [ ] Run migration
- [ ] **Estimated Time**: 30 min

### Task 2.2: Implement Bundle Creation
- [ ] Create `lib/analysis/bundleManager.ts`
- [ ] Add `createAnalysisBundle(jobId)` function
- [ ] Calculate fingerprint from Resume + JD content
- [ ] Check if bundle exists with same fingerprint
- [ ] If exists, return cached bundle
- [ ] If not, extract variants once and save
- [ ] **Estimated Time**: 2 hours

### Task 2.3: Refactor Analysis Endpoints to Use Bundles
- [ ] Update `/api/jobs/[id]/analyze-match-score` to use bundle
- [ ] Update `/api/jobs/[id]/evaluate-signals` to use bundle
- [ ] Update `/api/jobs/[id]/analyze-company` to use bundle
- [ ] Update `/api/ai/people-analysis` to use bundle
- [ ] Remove redundant variant fetching
- [ ] **Estimated Time**: 3 hours

### Task 2.4: Add Bundle Invalidation Logic
- [ ] Invalidate bundle when Resume re-uploaded
- [ ] Invalidate bundle when JD re-uploaded
- [ ] Show "Analysis bundle updated" toast
- [ ] **Estimated Time**: 1 hour

**Total Phase 2 Savings**: $4.00/year (50 jobs) or **43% cumulative cost reduction**

---

## 🎯 **PRIORITY 3: Complete Coach Mode Features**

### Task 3.1: User Writing Style Evaluation
- [ ] Create prompt: `prompts/writing-style-evaluation.v1.md`
- [ ] Create endpoint: `/api/coach/[jobId]/evaluate-writing-style`
- [ ] Analyze discovery responses + resume for:
  - Vocabulary level (formal, casual, technical)
  - Sentence structure (simple, complex, compound)
  - Tone (confident, humble, enthusiastic)
  - Common phrases/patterns
  - Industry jargon usage
- [ ] Store in `coach_sessions` as `writingStyleProfile` (JSON)
- [ ] **Estimated Time**: 3 hours

### Task 3.2: STAR Talk Track Generation (3 Personas)
- [ ] Create prompts:
  - `prompts/talk-track-recruiter.v1.md`
  - `prompts/talk-track-hiring-manager.v1.md`
  - `prompts/talk-track-peer.v1.md`
- [ ] Create endpoint: `/api/coach/[jobId]/generate-talk-tracks`
- [ ] Input: Interview question + user writing style + job context
- [ ] Output: 
  - Long-form answer (2-3 paragraphs, STAR format)
  - Cheat sheet (bullet points)
  - Key points to emphasize
  - Things to avoid mentioning
- [ ] Generate for each persona separately (token optimization!)
- [ ] Cache generated talk tracks
- [ ] **Estimated Time**: 4 hours

### Task 3.3: Talk Tracks Display UI
- [ ] Create component: `app/components/coach/TalkTracksDisplay.tsx`
- [ ] Show generated responses per question
- [ ] Toggle between long-form and cheat sheet
- [ ] Edit/refine functionality (re-generate with feedback)
- [ ] Practice mode: Hide answers, reveal on click
- [ ] Export to PDF/Print view
- [ ] **Estimated Time**: 5 hours

### Task 3.4: Recommendations Engine
- [ ] Create prompt: `prompts/recommendations.v1.md`
- [ ] Create endpoint: `/api/coach/[jobId]/generate-recommendations`
- [ ] Analyze Match Matrix gaps
- [ ] Suggest:
  - Relevant courses (Coursera, Udemy, YouTube)
  - Side projects to build
  - LinkedIn profile improvements
  - Skills to highlight in interviews
  - Certifications to pursue
- [ ] Display in "Recommendations" tab in Coach Mode
- [ ] **Estimated Time**: 4 hours

### Task 3.5: LinkedIn Profile Optimization
- [ ] Create prompt: `prompts/linkedin-optimization.v1.md`
- [ ] Create endpoint: `/api/coach/[jobId]/optimize-linkedin`
- [ ] Analyze current profile (from People Profiles if user added themselves)
- [ ] Suggest:
  - Headline improvements
  - About section rewrites
  - Keyword optimization for ATS
  - Skills to add/prioritize
  - Experience descriptions (STAR format)
- [ ] Show side-by-side comparison
- [ ] **Estimated Time**: 3 hours

### Task 3.6: User Profile Modal
- [ ] Create component: `app/components/UserProfileModal.tsx`
- [ ] Accessible from Profile button (top-right)
- [ ] Show:
  - Aggregated stats across all jobs
  - Writing style analysis
  - Most common interview questions faced
  - Success rate by job status
  - Total AI cost spent
  - Edit user preferences
- [ ] **Estimated Time**: 4 hours

**Total Coach Mode Features**: 23 hours (3 days of work)

---

## 🧪 **PRIORITY 4: Testing & Documentation**

### Task 4.1: Vitest Unit Tests for Coach Logic
- [ ] `tests/coach/discovery.test.ts` - Discovery question generation
- [ ] `tests/coach/scoring.test.ts` - Profile scoring algorithm
- [ ] `tests/coach/resume-diff.test.ts` - Resume optimization diff logic
- [ ] `tests/coach/cover-letter.test.ts` - Cover letter generation
- [ ] `tests/coach/writing-style.test.ts` - Writing style evaluation
- [ ] `tests/coach/talk-tracks.test.ts` - Talk track generation
- [ ] **Estimated Time**: 6 hours

### Task 4.2: Playwright E2E Test for Complete Flow
- [ ] `e2e/coach-mode-complete-flow.spec.ts`
- [ ] Test journey:
  1. Create job
  2. Upload Resume + JD
  3. Enter Coach Mode
  4. Complete discovery
  5. Optimize resume
  6. Generate cover letter
  7. Mark as applied
  8. Generate interview questions
  9. Generate talk tracks
  10. View recommendations
- [ ] **Estimated Time**: 4 hours

### Task 4.3: Documentation Updates
- [ ] Update `UI_DESIGN_SYSTEM.md` with coach mode patterns
- [ ] Update `ARCHITECTURE.md` with coach mode flow diagrams
- [ ] Create `COACH_MODE_USER_GUIDE.md`
- [ ] Update `TOKEN_OPTIMIZATION_AUDIT.md` with implementation results
- [ ] **Estimated Time**: 3 hours

**Total Testing & Docs**: 13 hours (1.5 days of work)

---

## 🎨 **PRIORITY 5: Polish & UX Improvements**

### Task 5.1: Settings Enhancements
- [ ] Add "ATS Signals Management" tab
- [ ] Allow user to customize which signals matter most
- [ ] Weight adjustments (0-100%)
- [ ] Save custom signal weights per user
- [ ] **Estimated Time**: 4 hours

### Task 5.2: Cost Tracking Dashboard
- [ ] Create component: `app/components/CostTrackingDashboard.tsx`
- [ ] Show in Settings modal
- [ ] Display:
  - Total tokens used (lifetime)
  - Total cost (lifetime)
  - Cost per job (average)
  - Cache hit rate (%)
  - Cost breakdown by section
  - Top 5 most expensive operations
  - Monthly cost trend graph
- [ ] **Estimated Time**: 5 hours

### Task 5.3: Global Company Knowledge Base
- [ ] Create migration: `db/migrations/014_companies.sql`
- [ ] Add `companies` table with shared intelligence
- [ ] Link multiple jobs to same company
- [ ] Reuse: CEO, funding, culture, competitors
- [ ] Only fetch: New news (if > 7 days old)
- [ ] Show "Using cached company data" badge
- [ ] **Estimated Time**: 6 hours

### Task 5.4: Field-Level Cache Expiration
- [ ] Implement smart TTL per data type:
  - CEO info: 180 days
  - Funding: 90 days
  - News: 7 days
  - Ecosystem: 30 days
- [ ] Add `cache_metadata` JSON column to track field-level expiration
- [ ] Show "Partially stale" warning if some fields expired
- [ ] Allow selective refresh (e.g., "Refresh news only")
- [ ] **Estimated Time**: 4 hours

**Total Polish**: 19 hours (2.5 days of work)

---

## 📊 **Summary: Time Estimates**

| Priority | Tasks | Estimated Time | Impact |
|----------|-------|----------------|--------|
| **P0: Critical Bugs** | 2 tasks | 1.5 hours | 🔴 **BLOCKER** |
| **P1: Token Optimization (Quick Wins)** | 3 tasks | 9 hours | 💰 $4/year saved |
| **P2: Analysis Bundle System** | 4 tasks | 6.5 hours | 💰 $4/year saved |
| **P3: Coach Mode Features** | 6 tasks | 23 hours | 🚀 Core value |
| **P4: Testing & Docs** | 3 tasks | 13 hours | ✅ Quality |
| **P5: Polish & UX** | 4 tasks | 19 hours | 🎨 Nice-to-have |
| **TOTAL** | 22 tasks | **72 hours** | ~9 days |

---

## 🎯 **Recommended Execution Order (Today)**

### Session 1 (Morning, 4 hours)
1. ✅ Fix document status display bug (30 min)
2. ✅ Fix interview questions generation error (45 min)
3. 🏗️ Company Intelligence caching (2 hours)
4. 🏗️ FTS5 Skill Matching (45 min - start)

### Session 2 (Afternoon, 4 hours)
1. 🏗️ FTS5 Skill Matching (3.25 hours - finish)
2. 🏗️ Interview Questions persona split (45 min - start)

### Session 3 (Evening, 2 hours)
1. 🏗️ Interview Questions persona split (2 hours - finish)

**Today's Goal**: Complete P0 bugs + P1 token optimization (13% cost reduction)

---

## 📈 **Success Metrics (End of Today)**

- [x] No critical bugs blocking user workflow
- [ ] Company Intelligence cached (30 day TTL)
- [ ] Interview Questions generate per persona (not all 3)
- [ ] Skill Matching uses FTS5 (no AI call)
- [ ] Cost per job reduced from $0.30 to ~$0.26 (13% savings)
- [ ] All changes tested and committed to GitHub

---

## 🗓️ **This Week's Roadmap**

| Day | Focus | Expected Outcome |
|-----|-------|------------------|
| **Mon (Today)** | P0 Bugs + P1 Token Optimization | 13% cost reduction |
| **Tue** | P2 Analysis Bundle System | 43% cumulative cost reduction |
| **Wed** | P3 Coach Mode: Writing Style + Talk Tracks | Core features ready |
| **Thu** | P3 Coach Mode: Recommendations + LinkedIn | Complete coach mode |
| **Fri** | P4 Testing + Documentation | Production ready |

---

## 💡 **Key Technical Decisions**

1. **Token Optimization First**: Maximize savings before adding new features
2. **Incremental Persona Generation**: User picks persona, we generate only that
3. **FTS5 for Skill Matching**: Local processing, no AI needed
4. **Analysis Bundle System**: Extract once, reuse everywhere
5. **Global Company Table**: Share intelligence across jobs
6. **Field-Level TTL**: Smart expiration based on data volatility

---

## 🎉 **Expected Outcomes (End of Week)**

- ✅ All critical bugs fixed
- ✅ Token cost reduced by 70% ($0.30 → $0.09 per job)
- ✅ Coach mode feature-complete
- ✅ Full E2E test coverage
- ✅ Production-ready for public launch

---

**Created**: October 20, 2025, 11:45 PM PST  
**Status**: Ready to Execute  
**Next Action**: Fix document status bug, check console logs

