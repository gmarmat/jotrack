# JoTrack - Token Optimization Audit & Strategy
**Date**: October 20, 2025  
**Goal**: Minimize AI API costs while maximizing data reuse and local intelligence

---

## 🎯 **Current Token Usage Analysis**

### AI API Calls Inventory

| Section | Endpoint | AI Provider | Tavily | Estimated Tokens | Cost | Cache TTL | Reuse Potential |
|---------|----------|-------------|--------|------------------|------|-----------|-----------------|
| **Refresh Data** | `/api/jobs/[id]/refresh-variants` | ✅ Claude | ❌ | ~8K (JD+Resume) | $0.02 | None | 🔴 **HIGH** - Extract once, reuse forever |
| **Company Ecosystem** | `/api/jobs/[id]/analyze-company-ecosystem` | ✅ Claude | ✅ Tavily | ~12K + 3 searches | $0.04 | 7 days | ✅ Good - cached per company |
| **Company Intelligence** | `/api/jobs/[id]/analyze-company` | ✅ Claude | ✅ Tavily | ~8K + 2 searches | $0.03 | None | 🟡 **MEDIUM** - should cache per company |
| **Match Score** | `/api/jobs/[id]/analyze-match-score` | ✅ Claude | ❌ | ~6K (JD+Resume) | $0.02 | None | 🟡 **MEDIUM** - same JD+Resume used 3x |
| **Match Matrix** | `/api/jobs/[id]/evaluate-signals` | ✅ Claude | ❌ | ~10K (30 signals) | $0.03 | None | 🟡 **MEDIUM** - same JD+Resume used 3x |
| **People Profiles (Extract)** | `/api/jobs/[id]/people/extract` | ✅ Claude | ❌ | ~4K per person | $0.01 | ✅ One-time | ✅ Good - cached after extract |
| **People Profiles (Analyze)** | `/api/ai/people-analysis` | ✅ Claude | ❌ | ~8K | $0.02 | None | 🟡 **MEDIUM** - same people used 2x |
| **Interview Questions (Search)** | `/api/jobs/[id]/interview-questions/search` | ❌ | ✅ Tavily | 0 + 3 searches | $0.03 | 90 days | ✅ Excellent - long cache |
| **Interview Questions (Generate)** | `/api/jobs/[id]/interview-questions/generate` | ✅ Claude (3x) | ❌ | ~15K (3 personas) | $0.05 | None | 🔴 **HIGH** - regenerates on every call |
| **Coach: Discovery** | `/api/coach/[jobId]/generate-questions` | ✅ Claude | ❌ | ~3K | $0.01 | ✅ One-time | ✅ Good - cached after generation |
| **Coach: Profile Analysis** | `/api/coach/[jobId]/analyze-profile` | ✅ Claude | ❌ | ~6K | $0.02 | None | 🟡 **MEDIUM** - same discovery used 2x |
| **Coach: Resume Optimization** | `/api/coach/[jobId]/optimize-resume` | ✅ Claude | ❌ | ~8K per iteration | $0.03 | None | 🔴 **HIGH** - multiple iterations |
| **Coach: Cover Letter** | `/api/coach/[jobId]/generate-cover-letter` | ✅ Claude | ❌ | ~6K | $0.02 | ✅ One-time | ✅ Good - cached |

**Total Per Job (Full Analysis)**: ~$0.30 - $0.40 (first run), ~$0.20 (with current caching)

---

## 🚨 **Critical Optimization Opportunities**

### 🔴 **Priority 1: Data Extraction Duplication (60% savings potential)**

**Problem**: We extract JD and Resume variants 3 times:
1. Initial upload → Refresh Data ($0.02)
2. Match Score analysis → Re-reads same variants
3. Match Matrix analysis → Re-reads same variants
4. Company analysis → Re-reads JD again

**Current Flow**:
```
Upload Resume → Extract 3 variants ($0.02)
Upload JD → Extract 3 variants ($0.02)
↓
Match Score → Fetch variants, send to AI ($0.02)
Match Matrix → Fetch variants, send to AI ($0.03)
Company Intelligence → Fetch JD variant, send to AI ($0.03)
Total: $0.12
```

**Optimized Flow**:
```
Upload Resume → Extract 3 variants → Store in memory/cache ($0.02)
Upload JD → Extract 3 variants → Store in memory/cache ($0.02)
↓
[Create "Analysis Bundle" once]
↓
Match Score → Use cached bundle (free)
Match Matrix → Use cached bundle (free)
Company Intelligence → Use cached bundle (free)
Total: $0.04 (67% savings!)
```

**Implementation**:
- [ ] Create `job_analysis_bundles` table with `fingerprint` (hash of Resume+JD content)
- [ ] Store extracted variants as JSON blob
- [ ] Check fingerprint before any analysis → if unchanged, reuse bundle
- [ ] Invalidate bundle only when Resume or JD is re-uploaded

**Estimated Savings**: $0.08 per job × 50 jobs/year = **$4.00/year**

---

### 🟡 **Priority 2: Company Intelligence Caching (40% savings potential)**

**Problem**: Company Intelligence has NO caching, but Ecosystem does (7 days)

**Current**:
- Company Ecosystem: Cached for 7 days ✅
- Company Intelligence: No cache, re-analyzes every time ❌

**Solution**:
- [ ] Extend `company_ecosystem_cache` or create `company_intelligence_cache`
- [ ] Cache key: `SHA256(companyName + industry)`
- [ ] TTL: 30 days (company facts change slower than ecosystem news)
- [ ] Fields: culture, principles, recentNews, keywords

**Estimated Savings**: $0.03 per job × 50 jobs/year = **$1.50/year**

---

### 🟡 **Priority 3: Interview Questions Over-Generation (50% savings potential)**

**Problem**: We call AI 3 times (3 personas) even if user only needs 1

**Current Flow**:
```
User clicks "I Have Interview Scheduled"
→ Modal: "Recruiter / Hiring Manager / Peer / All"
→ Backend: Always generates all 3 ($0.05)
```

**Optimized Flow**:
```
User clicks "I Have Interview Scheduled"
→ Modal: "Recruiter / Hiring Manager / Peer / All"
→ Backend: Only generate selected persona ($0.015 - $0.05)
```

**Implementation**:
- [ ] Modify `/api/jobs/[id]/interview-questions/generate` to accept `persona` param
- [ ] Only call AI for requested persona
- [ ] Cache individual persona responses separately
- [ ] Allow incremental generation (Recruiter first, then HM later)

**Estimated Savings**: $0.03 per job (if only 1 persona needed) × 50 jobs/year = **$1.50/year**

---

### 🟡 **Priority 4: People Profiles Redundancy (30% savings potential)**

**Problem**: People analysis is called separately, but uses same JD context

**Current**:
```
People Extract → AI call per person ($0.01 × 3 people = $0.03)
People Analyze → AI call with all people + JD ($0.02)
Total: $0.05
```

**Optimized**:
```
People Extract → AI call per person ($0.01 × 3 people = $0.03)
People Analyze → Use cached JD from Analysis Bundle ($0.01)
Total: $0.04 (20% savings)
```

**Implementation**:
- [ ] Pass `analysisBundle` to people analysis endpoint
- [ ] Avoid re-sending full JD text, use pre-extracted key points

**Estimated Savings**: $0.01 per job × 50 jobs/year = **$0.50/year**

---

### 🔴 **Priority 5: Coach Mode Resume Iterations (80% savings potential)**

**Problem**: Every "Optimize Resume" call re-sends ENTIRE resume + profile + JD

**Current Flow**:
```
Iteration 1: Full resume + profile + JD → AI ($0.03)
Iteration 2: Full resume + profile + JD → AI ($0.03)
Iteration 3: Full resume + profile + JD → AI ($0.03)
Total: $0.09 for 3 iterations
```

**Optimized Flow**:
```
Iteration 1: Full resume + profile + JD → AI ($0.03)
Iteration 2: Only DIFF + previous feedback → AI ($0.01)
Iteration 3: Only DIFF + previous feedback → AI ($0.01)
Total: $0.05 for 3 iterations (44% savings)
```

**Implementation**:
- [ ] Store "optimization context" in session
- [ ] Send only deltas on subsequent iterations
- [ ] Use Claude's "continue conversation" feature (cache previous turns)

**Estimated Savings**: $0.04 per job × 50 jobs/year = **$2.00/year**

---

## 🧠 **Smart Local Intelligence (Avoid AI Calls)**

### Opportunity 1: **Skill Matching with FTS5** (100% savings)

**Problem**: We might be planning to use AI for skill matching

**Solution**: Use SQLite FTS5 for keyword extraction
- [ ] Extract skills from JD using regex + FTS5 tokenization
- [ ] Extract skills from Resume using same method
- [ ] Calculate match % locally (no AI needed)
- [ ] Only use AI for semantic understanding (optional)

**Savings**: $0.02 per job × 50 jobs/year = **$1.00/year**

---

### Opportunity 2: **Company Data Aggregation** (50% savings)

**Problem**: If user applies to same company twice, we re-analyze everything

**Solution**: Global Company Knowledge Base
- [ ] Create `companies` table with shared intelligence
- [ ] Link multiple jobs to same company
- [ ] Reuse: CEO, funding, culture, competitors
- [ ] Only fetch: New news (if > 7 days old)

**Implementation**:
```sql
CREATE TABLE companies (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  industry TEXT,
  
  -- Cached intelligence (long TTL)
  ceo TEXT,
  founded_year INTEGER,
  funding_stage TEXT,
  funding_total_usd INTEGER,
  employee_count INTEGER,
  headquarters TEXT,
  
  -- Semi-permanent data
  culture_keywords TEXT, -- JSON array
  core_principles TEXT, -- JSON array
  competitors TEXT, -- JSON array
  
  -- Short TTL data
  recent_news TEXT, -- JSON, updated weekly
  last_news_fetch INTEGER,
  
  -- Metadata
  created_at INTEGER,
  updated_at INTEGER,
  last_analyzed_at INTEGER
);
```

**Savings**: $0.04 per duplicate company × 10 duplicates/year = **$0.40/year**

---

### Opportunity 3: **Local ATS Signal Evaluation** (70% savings)

**Problem**: Match Matrix calls AI for 30 signals, but many are keyword matches

**Current**: AI evaluates all 30 signals ($0.03)

**Optimized**: Split into local + AI
- **Local checks (15 signals)**: Regex, keyword matching, years of experience
  - Required Skills Match → FTS5
  - Years of Experience → Regex parse
  - Education Requirements → String match
  - Location Match → String match
  - Certifications → Keyword match
  
- **AI checks (15 signals)**: Semantic understanding
  - Cultural Fit → AI
  - Leadership Style → AI
  - Problem-Solving Approach → AI
  - Communication Style → AI

**Savings**: $0.02 per job × 50 jobs/year = **$1.00/year**

---

## 📊 **Recommended Caching Strategy**

### Field-Level TTL Table

| Data Type | Example | TTL | Rationale |
|-----------|---------|-----|-----------|
| **Company Facts** | CEO, Founded Year, HQ | 180 days | Rarely changes |
| **Funding Data** | Total Raised, Last Round | 90 days | Quarterly updates |
| **Company Ecosystem** | Competitors, Partners | 30 days | Stable relationships |
| **Company News** | Recent Launches, Hiring | 7 days | Fast-moving |
| **Interview Questions** | Common Q's per company | 90 days | Stable patterns |
| **Job Description** | JD variants | ∞ (permanent) | Never changes after upload |
| **Resume Variants** | Raw, AI-Optimized, Detailed | ∞ (permanent) | Never changes after upload |
| **People Profiles** | LinkedIn extracts | ∞ (permanent) | Never changes after extract |
| **Discovery Responses** | User answers | ∞ (permanent) | Never changes |
| **ATS Signals** | Match scores | 7 days | Recalculate on Resume update |

---

## 🏗️ **Implementation Roadmap**

### Phase 1: Quick Wins (1-2 days)
1. ✅ Company Ecosystem caching (DONE)
2. [ ] Add Company Intelligence caching (same schema)
3. [ ] Add Interview Questions persona-specific generation
4. [ ] Add skill matching with FTS5 (no AI)

**Expected Savings**: $0.05 per job → **$2.50/year** (50 jobs)

---

### Phase 2: Core Architecture (3-4 days)
1. [ ] Create `job_analysis_bundles` table
2. [ ] Implement fingerprint-based caching
3. [ ] Refactor all analysis endpoints to use bundles
4. [ ] Add bundle invalidation logic

**Expected Savings**: $0.08 per job → **$4.00/year** (50 jobs)

---

### Phase 3: Advanced Intelligence (5-7 days)
1. [ ] Create global `companies` table
2. [ ] Implement cross-job data sharing
3. [ ] Add field-level TTL expiration
4. [ ] Build company dashboard (show cached vs fresh data)

**Expected Savings**: $0.06 per job → **$3.00/year** (50 jobs)

---

### Phase 4: Local Signal Evaluation (2-3 days)
1. [ ] Split Match Matrix into local + AI checks
2. [ ] Implement FTS5 skill matching
3. [ ] Add regex-based experience parsing
4. [ ] Build keyword matching for certifications

**Expected Savings**: $0.02 per job → **$1.00/year** (50 jobs)

---

## 💰 **Total Savings Potential**

| Phase | Implementation Time | Savings per Job | Annual Savings (50 jobs) | ROI |
|-------|---------------------|-----------------|--------------------------|-----|
| Current | - | $0.30 | $15.00 | - |
| Phase 1 | 2 days | $0.25 | $12.50 | $2.50 saved |
| Phase 2 | 4 days | $0.17 | $8.50 | $6.50 saved |
| Phase 3 | 7 days | $0.11 | $5.50 | $9.50 saved |
| Phase 4 | 3 days | $0.09 | $4.50 | $10.50 saved |

**Total Potential Savings**: **70% reduction** ($0.30 → $0.09 per job)

**Annual Impact** (50 jobs/year): **$10.50 saved** (from $15 to $4.50)

**Enterprise Impact** (500 jobs/year): **$105 saved** (from $150 to $45)

---

## 🎯 **Recommended Priority Order**

### This Week (High ROI, Low Effort)
1. **Company Intelligence Caching** (2 hours, $1.50/year saved)
2. **Interview Questions Persona Split** (3 hours, $1.50/year saved)
3. **FTS5 Skill Matching** (4 hours, $1.00/year saved)

### Next Week (Medium Effort, High Impact)
4. **Analysis Bundle System** (2 days, $4.00/year saved)
5. **People Profiles Bundle Reuse** (1 day, $0.50/year saved)

### Later (Long-term Infrastructure)
6. **Global Companies Table** (3 days, $3.00/year saved)
7. **Local ATS Signal Checks** (2 days, $1.00/year saved)
8. **Coach Mode Iteration Optimization** (2 days, $2.00/year saved)

---

## 📈 **Monitoring & Metrics**

### Add to Settings Dashboard
- [ ] Total tokens used (lifetime)
- [ ] Total cost (lifetime)
- [ ] Cost per job (average)
- [ ] Cache hit rate (%)
- [ ] Cost breakdown by section
- [ ] Top 5 most expensive operations

### Add to Job Detail Page
- [ ] "Cost to analyze this job: $0.12"
- [ ] "Tokens used: 8,542"
- [ ] "Cache hits: 3/7 sections (43%)"
- [ ] "Last analyzed: 2 hours ago"

---

## 🔬 **Testing Strategy**

### Before Optimization
```bash
# Baseline test
npm run test:cost-baseline
# Should output: ~$0.30 per job
```

### After Each Phase
```bash
npm run test:cost-phase-1
# Should output: ~$0.25 per job (17% savings)

npm run test:cost-phase-2
# Should output: ~$0.17 per job (43% savings)

npm run test:cost-phase-3
# Should output: ~$0.11 per job (63% savings)

npm run test:cost-phase-4
# Should output: ~$0.09 per job (70% savings)
```

---

## 🎉 **Success Criteria**

- [ ] Cost per job reduced by 50% (Phase 1-2)
- [ ] Cache hit rate > 60%
- [ ] Average analysis time < 10 seconds
- [ ] No duplicate AI calls for same data
- [ ] Global company data reused across jobs
- [ ] User can see cost breakdown per section
- [ ] Settings show total savings from caching

---

**Last Updated**: October 20, 2025  
**Status**: Audit Complete, Ready for Implementation  
**Next Action**: Create implementation to-do list based on priorities

