# Company Ecosystem - Data Caching Strategy

**Problem**: Company ecosystem research is expensive (~$0.15-0.35 per job)  
**Solution**: Cache research data similar to resume/JD variant pattern  
**Status**: Design approved, ready to implement

---

## 🎯 **Key Insight**

**Company data changes SLOWLY** (unlike resumes which users edit frequently)

- Company size changes: Quarterly
- Leadership changes: Annually
- Funding news: Occasionally
- Hiring trends: Weekly/monthly
- Glassdoor reviews: Continuously

**Strategy**: Do expensive research ONCE, cache for 7 days, reuse across analyses

---

## 📊 **Parallel Pattern: Resume/JD Variants**

### **Current Pattern** (Resume/JD):
```
Upload document (FREE)
  ↓
Auto extract raw text (FREE)
  ↓
"Extract Data" button → AI creates variants (~$0.02)
  ├─ raw: 2,500 tokens (full text)
  ├─ ai_optimized: 500 tokens (structured, cleaned)
  └─ detailed: 1,500 tokens (enriched, analyzed)
  ↓
Saved to artifact_variants table
  ↓
Analysis sections use ai_optimized (not raw)
  ↓
Cost savings: 77%! ($0.35 vs $1.50)
```

---

## 🏢 **Proposed Pattern: Company Ecosystem**

### **New Pattern** (Ecosystem):
```
Job created (FREE)
  ↓
Company name extracted from JD (FREE)
  ↓
"Analyze Ecosystem" button → AI researches companies (~$0.15-0.35)
  ├─ research: Full web search + data gathering (3,000-5,000 tokens)
  ├─ structured: Organized JSON with all 15+ fields (1,500 tokens)
  └─ insights: Summary + actionable recommendations (500 tokens)
  ↓
Saved to company_ecosystem_cache table
  ↓
Future analyses use cached data (FREE for 7 days)
  ↓
Cost savings: Unlimited reuse! ($0.35 once vs $0.35 × N jobs)
```

---

## 🗄️ **Database Schema**

### **New Table**: `company_ecosystem_cache`

```sql
CREATE TABLE company_ecosystem_cache (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,        -- "TechCorp Inc"
  industry TEXT,                      -- "Technology"
  
  -- Research Data (Full JSON)
  research_data TEXT NOT NULL,       -- Complete 10 company dataset (JSON)
  
  -- Metadata
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,       -- created_at + 7 days
  
  -- Fingerprint (detect if JD context changed)
  context_fingerprint TEXT,          -- Hash of job industry/role
  
  -- Stats
  company_count INTEGER DEFAULT 10,
  avg_confidence TEXT DEFAULT 'medium',
  
  -- Source Attribution
  sources TEXT,                       -- JSON array of sources used
  
  -- Cost Tracking
  tokens_used INTEGER,
  cost_usd REAL,
  
  UNIQUE(company_name, industry)
);

CREATE INDEX idx_company_cache_expires ON company_ecosystem_cache(expires_at);
CREATE INDEX idx_company_cache_company ON company_ecosystem_cache(company_name);
```

---

## 🔄 **Data Flow**

### **First Time (Per Company)**:

```
User clicks "Analyze Ecosystem"
  ↓
Check cache: SELECT * FROM company_ecosystem_cache 
             WHERE company_name = ? AND expires_at > NOW()
  ↓
Cache MISS → Do expensive research
  ├─ Web search (5 searches × $0.02 = $0.10)
  ├─ AI analysis (5,000 tokens × $0.000005 = $0.025)
  ├─ Structure data (1,500 tokens × $0.000005 = $0.0075)
  └─ Total: ~$0.15
  ↓
Save to company_ecosystem_cache
  ├─ research_data: Full JSON
  ├─ expires_at: NOW() + 7 days
  └─ sources: All URLs used
  ↓
Display results
```

### **Subsequent Uses (Same Company, Within 7 Days)**:

```
User (same or different job) clicks "Analyze Ecosystem"
  ↓
Check cache: Cache HIT! ✅
  ↓
Load from company_ecosystem_cache
  ↓
Cost: $0.00 (FREE!) 🎉
  ↓
Display results (instant)
```

---

## ⏰ **Cache Expiration Strategy**

### **Option A: Time-Based** (Recommended)
- **Duration**: 7 days
- **Rationale**: Company data changes slowly
- **Refresh**: Automatic after 7 days OR manual refresh button

### **Option B: Event-Based**
- **Trigger**: Company news detected (funding, acquisition)
- **Rationale**: Fresher data when significant events happen
- **Challenge**: Need event detection system

### **Option C: Hybrid**
- **Default**: 7 days
- **Override**: User can click "Refresh Research" to force update
- **Smart**: System suggests refresh if major news detected

**Recommendation**: Start with Option A, evolve to Option C

---

## 🎯 **Integration with "Extract Data" Button**

### **Current "Extract Data" Flow**:
```
1. Extract raw text from uploaded docs (Resume, JD)
2. AI creates ai_optimized variants
3. AI creates detailed variants
4. Semantic comparison (if re-analyzing)
5. Show changelog
```

### **Enhanced "Extract Data" Flow** (With Ecosystem):
```
1. Extract raw text from uploaded docs (Resume, JD)
2. AI creates ai_optimized variants
3. AI creates detailed variants
4. Extract company name from JD
5. Check company_ecosystem_cache
   ├─ If MISS → Queue for later (don't block)
   └─ If HIT → Load cached data
6. Semantic comparison (if re-analyzing)
7. Show changelog
```

**Key Decision**: **DON'T do ecosystem research in "Extract Data"**  
**Rationale**: Too slow, not critical for variants

---

## 🔘 **Separate "Analyze Ecosystem" Button**

### **Why Separate?**
1. ✅ User control (only research when needed)
2. ✅ Faster Extract Data (don't block)
3. ✅ Clear cost attribution
4. ✅ Can show progress (web searching...)

### **Where?**
- Option A: In Data Pipeline Status panel (next to "Extract Data")
- Option B: In Ecosystem section header ("Analyze Ecosystem")
- Option C: Both (panel shows global status, section shows action)

**Recommendation**: Option B (section-specific button) ← Already implemented!

---

## 📋 **Growth Score Calculation**

**Definition**: **Internal career growth opportunity** (NOT company revenue growth)

### **Data Sources**:
1. **Glassdoor** (Primary - 40% weight)
   - Career Opportunities rating (1-5)
   - Promotion-related reviews
   - "Career Development" mentions

2. **LinkedIn** (Secondary - 30% weight)
   - Employee tenure distribution
   - Job level changes (promotions visible)
   - Skills growth patterns

3. **Job Boards** (Tertiary - 20% weight)
   - Internal promotion postings
   - "Senior" vs "Junior" role ratio
   - Career ladder visibility

4. **Company Reviews** (Tertiary - 10% weight)
   - Blind, Indeed reviews
   - "Growth" keyword frequency
   - Promotion timeline mentions

### **Calculation**:
```
Growth Score = (
  Glassdoor_Career_Opp × 0.40 +
  Avg_Tenure_Score × 0.30 +
  Promotion_Rate_Score × 0.20 +
  Review_Sentiment × 0.10
)

Where:
- Glassdoor_Career_Opp: 1-5 (from Glassdoor API)
- Avg_Tenure_Score: 
    < 2 years = 2/5 (high turnover)
    2-3 years = 3/5 (moderate)
    3-4 years = 4/5 (good retention)
    4+ years = 5/5 (excellent retention)
- Promotion_Rate_Score:
    % of employees promoted in 2 years
    < 20% = 2/5
    20-40% = 3/5
    40-60% = 4/5
    60%+ = 5/5
- Review_Sentiment:
    Analyze reviews for "promotion", "growth", "career"
    Positive mentions = higher score
```

### **Output**:
- **5/5 (●●●●●)**: Excellent growth opportunities (Google, Meta, top startups)
- **4/5 (●●●●○)**: Strong growth (well-managed scaleups)
- **3/5 (●●●○○)**: Moderate growth (stable companies)
- **2/5 (●●○○○)**: Limited growth (bureaucratic, slow-moving)
- **1/5 (●○○○○)**: Poor growth (high turnover, stagnant)

---

## 🧪 **Fallback Strategy**

**Problem**: Some companies don't have Glassdoor reviews or public data

### **Fallback Logic**:
```
IF Glassdoor data available:
  Use full calculation above
ELSE IF LinkedIn data available:
  Use tenure + hiring trend
ELSE IF Company age < 2 years:
  Default to 4/5 (startups = high growth potential)
ELSE:
  Default to 3/5 (unknown)
  Mark as "Estimated" in tooltip
```

---

## 💰 **Cost Analysis**

### **Scenario 1: No Caching** (Current)
```
User applies to 20 similar jobs (same industry):
- 20 jobs × $0.15 = $3.00
- Data largely duplicated
- Wasteful! ❌
```

### **Scenario 2: With Caching** (Proposed)
```
User applies to 20 similar jobs:
- First job: $0.15 (research)
- Next 19 jobs: $0.00 (cached)
- Total: $0.15
- Savings: 95%! ✅
```

### **Scenario 3: Multiple Users** (Future SaaS)
```
100 users apply to jobs at TechCorp:
- First user: $0.15 (research TechCorp)
- Next 99 users: $0.00 (shared cache)
- Total: $0.15 (not $15.00)
- Savings: 99%! 🎉
```

---

## 🎯 **Implementation Phases**

### **Phase 1: MVP** (This Week)
- [x] Define data model
- [ ] Create company_ecosystem_cache table
- [ ] Update analyze-ecosystem endpoint to check cache
- [ ] Save research results to cache
- [ ] Add 7-day expiration logic

### **Phase 2: Optimization** (Next Week)
- [ ] Add cache hit/miss metrics
- [ ] Show "Cached data (5 days old)" indicator
- [ ] Add manual "Refresh Research" button
- [ ] Optimize cache key (company + industry)

### **Phase 3: Intelligence** (Future)
- [ ] Detect major company news events
- [ ] Auto-invalidate cache on news
- [ ] Cross-job cache sharing
- [ ] Multi-user cache sharing (SaaS)

---

## ✅ **Decision: Approved Strategy**

**Approach**:
1. ✅ Separate "Analyze Ecosystem" button (already done!)
2. ✅ Cache results for 7 days in new table
3. ✅ Growth Score = internal career growth (documented above)
4. ✅ Use Glassdoor + LinkedIn + job boards
5. ✅ Show cache age + manual refresh option
6. ✅ Start with time-based (7 days), evolve to smart invalidation

**Next Steps**:
1. Create migration for company_ecosystem_cache table
2. Update analyze-ecosystem API to check/save cache
3. Add cache metadata to UI ("Last updated: 5 days ago")
4. Document Growth Score calculation in prompt

---

**Status**: ✅ Strategy defined and approved  
**Ready to implement**: Phase 1 (MVP)

