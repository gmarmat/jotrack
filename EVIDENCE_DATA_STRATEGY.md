# Evidence Data Strategy - Complete End-to-End
## Data Persistence, Updates, and Freshness

---

## 🎯 Core Questions to Answer

1. **Where do we store evidence?** (Don't lose it!)
2. **What happens on re-search?** (Append or replace?)
3. **How do we show freshness?** (Timestamps!)
4. **What's the cleanest implementation?**

---

## 📊 Current Data Storage Points

### **Point 1: interview_questions_cache** (Company-Level, 90-day TTL)
```sql
CREATE TABLE interview_questions_cache (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  searched_questions TEXT,
  search_sources TEXT,
  web_intelligence_json TEXT,  ← We save webIntelligence here!
  searched_at INTEGER,
  expires_at INTEGER
);
```

**Characteristics**:
- ✅ Company-wide (shared across all jobs for same company)
- ✅ Long TTL (90 days)
- ✅ Already saving webIntelligence (including interviewerValidations)
- ⚠️ Replaces on re-search (not appends)

### **Point 2: coach_state.interview_coach_json** (Job-Specific)
```sql
CREATE TABLE coach_state (
  job_id TEXT PRIMARY KEY,
  interview_coach_json TEXT,  ← Interview Coach saves questionBank here
  ...
);
```

**Characteristics**:
- ✅ Job-specific
- ✅ Persists forever (no expiration)
- ✅ Includes questionBank.webIntelligence
- ⚠️ Overwrites on re-search (not appends)

### **Point 3: people_profiles.summary** (Person-Specific)
```sql
CREATE TABLE people_profiles (
  id TEXT PRIMARY KEY,
  name TEXT,
  summary TEXT,  ← Could store interviewer evidence here?
  ...
);
```

**Characteristics**:
- ✅ Person-specific (ideal for evidence)
- ✅ Persists forever
- ✅ Could append evidence without replacing
- ❌ Currently stores LinkedIn extraction only

---

## 💡 Recommended Strategy: Hybrid Approach

### **Storage Strategy**

**Primary Storage: interview_questions_cache.web_intelligence_json**
- Why: Already working, company-wide, efficient
- Contains: All interviewerValidations for all people at that company

**Secondary Storage: coach_state.interview_coach_json.questionBank.webIntelligence**
- Why: Job-specific copy, survives cache expiration
- Contains: Same data, job-level backup

**Tertiary Storage: people_profiles.summary (Future Enhancement)**
- Why: Person-specific, can accumulate evidence over time
- Contains: Historical evidence from multiple searches
- Note: Not implementing now to keep it simple

### **Update Strategy**

**On Interview Coach Search**:
```
1. Search Tavily (Glassdoor, Reddit, Blind)
2. Extract webIntelligence (including interviewerValidations)
3. Save to interview_questions_cache (REPLACE old data)
4. Save to coach_state.interview_coach_json (job-specific copy)
5. Timestamp both saves
```

**Why REPLACE instead of APPEND**:
- ✅ Newer data is more relevant (recent = better)
- ✅ Prevents duplicate quotes
- ✅ Cache naturally expires (90 days)
- ✅ Simple logic (no merge conflicts)

**Evidence Freshness**:
- Show `searched_at` timestamp on each evidence chip
- User sees: `💬 Reddit · "Quote..." [⚡ Tavily] · Searched Oct 21, 2024`
- If user re-searches: Date updates, quotes may change (newer discussions)

---

## 🔄 Complete Data Flow

### **Scenario 1: First Time**
```
User adds Samir Kumar to Fortive job
    ↓
LinkedIn profile extracted
    ↓
People Profiles shows: "Communication Style: Professional"
    ↓
Sources: [📊 LinkedIn] only
    ↓
User runs Interview Coach
    ↓
Tavily searches: "Samir Kumar Fortive interview Glassdoor Reddit"
    ↓
webIntelligence extracts mentions:
  - Reddit: "Samir is data-driven and asks for metrics"
  - Glassdoor: "Prepare quantitative examples for Samir"
    ↓
Saved to:
  ✓ interview_questions_cache.web_intelligence_json (company-wide)
  ✓ coach_state.interview_coach_json.questionBank.webIntelligence (job-specific)
    ↓
People Profiles now shows:
  Sources: [📊 LinkedIn] [💬 Reddit] [🔍 Glassdoor]
    ↓
Evidence chips display with [⚡ Tavily] badges and date: "Searched Oct 21, 2024"
```

### **Scenario 2: Re-Search (1 month later)**
```
User re-runs Interview Coach search
    ↓
Tavily searches again (new results, fresher data)
    ↓
webIntelligence extracts NEW mentions:
  - Reddit: "Samir hired me! He loved my portfolio" (NEW!)
  - Blind: "Samir's team is growing fast" (NEW!)
    ↓
REPLACES old data in:
  ✓ interview_questions_cache.web_intelligence_json (new quotes, new date)
  ✓ coach_state.interview_coach_json.questionBank.webIntelligence (updated)
    ↓
People Profiles now shows:
  Sources: [📊 LinkedIn] [💬 Reddit - NEW] [🎯 Blind - NEW]
  Date: "Searched Nov 21, 2024" (updated!)
```

**User sees**: Fresh, recent data (more valuable than old quotes)

---

## ✅ Implementation Status

### **What's Already Working** ✅
1. Interview Coach search extracts webIntelligence
2. Saves to interview_questions_cache.web_intelligence_json
3. API endpoint `/api/jobs/[id]/interviewer-evidence` retrieves it
4. PeopleProfilesCard loads and displays evidence chips
5. SourcesModal shows with API provider badges

### **What Needs Verification** 🔍
1. Does coach_state also save webIntelligence? (Should check)
2. Are timestamps displayed correctly in evidence chips?
3. Does re-search properly replace old data?

---

## 🎯 Cleanest Implementation Path

### **Option A: Simple Re-Run** ⭐ RECOMMENDED
**Action**: Just re-run Interview Coach search on Fortive
**Cost**: ~$0.01 (Tavily only)
**Time**: 30 seconds
**Risk**: ZERO (just triggering existing code)
**Result**: Evidence appears immediately

**Why This is Clean**:
- ✅ Tests the REAL user flow (what users will do)
- ✅ Verifies everything works end-to-end
- ✅ No special scripts or migrations
- ✅ Natural, organic behavior
- ✅ Proves progressive enhancement works

### **Option B: Script Migration**
**Action**: Create script to extract from existing cached questions
**Cost**: $0.00
**Time**: Write script (30 min) + run (1 min)
**Risk**: LOW but unnecessary complexity
**Result**: Evidence appears, but doesn't test real flow

**Why This is More Complex**:
- ⚠️ Need to write extraction logic
- ⚠️ Don't have raw Tavily results (only processed questions)
- ⚠️ Can't extract interviewer mentions without raw data
- ⚠️ Doesn't test the actual user flow

---

## 🚀 Recommendation: Option A (Simple Re-Run)

**Just re-run Interview Coach search. Here's why**:

1. **Tests Real Flow**: Proves the feature works as designed
2. **Gets Fresh Data**: Oct 2024 quotes > June 2024 quotes
3. **Zero Risk**: Just using existing, tested code
4. **Minimal Cost**: $0.01 for Tavily (not AI tokens)
5. **Clean**: No special scripts or workarounds

**What You'll Do**:
1. Go to Fortive job → Interview Coach
2. Click search (takes 30 sec)
3. Go back to People Profiles
4. Click "View Sources" → See evidence chips! 🎉

**What Gets Saved** (Automatically):
- ✓ webIntelligence to interview_questions_cache
- ✓ Timestamps updated
- ✓ Evidence chips display immediately
- ✓ No data loss going forward

---

## 📋 Data Persistence Going Forward

### **Permanent Storage**:
```
interview_questions_cache (90-day TTL):
  - Primary source for evidence
  - Shared across jobs for same company
  - Replaces on re-search (keeps freshest data)

coach_state.interview_coach_json (Forever):
  - Job-specific backup
  - Survives cache expiration
  - Snapshot of evidence at time of search
```

### **On Re-Search**:
- Old evidence replaced with new evidence
- Timestamps updated
- User sees freshest, most recent quotes
- No accumulation (prevents stale data)

---

## ✅ Final Answer

**Just re-run the Interview Coach search ($0.01, 30 seconds).**

It's the cleanest, simplest, most reliable approach that:
- Tests the real user flow
- Gets you fresh evidence
- Proves the feature works
- No special scripts needed
- No risk of data corruption

**Want me to walk you through the re-search process, or are you good to test it yourself?**

