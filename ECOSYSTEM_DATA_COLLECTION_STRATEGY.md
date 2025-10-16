# Company Ecosystem - Data Collection Strategy

**Critical Challenge**: How to actually GET all this rich data?

**Status**: Architecture decision needed

---

## 🚨 **The Reality Check**

### **What We're Asking For**:
- Company size, industry, location
- CEO name, background
- Growth/stability/retention scores (1-5)
- Recent news (60 days, positive/negative)
- Skills trending (current → future)
- Hiring trends, open roles count
- Glassdoor ratings
- Average tenure
- **For 10 companies!**

### **The Problem**:
- **Web scraping**: Slow, unreliable, breaks easily
- **APIs**: Require auth, rate limits, expensive
- **AI inference**: Can hallucinate, no real-time data
- **Manual entry**: Time-consuming

---

## 🎯 **Tiered Data Collection Strategy**

### **Tier 1: AI Inference (Fast, Cheap, Limited)**

**What AI Can Do Well**:
- ✅ Identify competitor companies (from JD + general knowledge)
- ✅ Categorize companies (direct/adjacent/etc.)
- ✅ Estimate company size (based on public knowledge)
- ✅ Industry classification
- ✅ CEO name (if well-known)
- ✅ General reputation/stability assessment
- ✅ Relevance scoring

**What AI CANNOT Do**:
- ❌ Recent news (past 60 days) - hallucination risk
- ❌ Current open roles count - needs live data
- ❌ Glassdoor ratings - needs API access
- ❌ Average tenure - needs internal data
- ❌ Real hiring trends - needs job board data

**Recommendation**: Use AI for **structure and baseline**, enrich with real data later.

---

### **Tier 2: User-Assisted Collection (Hybrid)**

**User Provides Data**:
User option to paste company data from their premium accounts:

```
┌─────────────────────────────────────────────────────┐
│ Want more accurate data?                            │
├─────────────────────────────────────────────────────┤
│ If you have LinkedIn Premium or Glassdoor access,  │
│ you can paste company data to improve accuracy.    │
│                                                     │
│ [📋 Paste LinkedIn Company Page]                   │
│ [📋 Paste Glassdoor Page]                          │
│                                                     │
│ We'll extract:                                      │
│ • Hiring trends (LinkedIn Premium shows this)      │
│ • Employee count (more accurate)                   │
│ • Recent posts/news                                │
│ • Ratings & reviews (Glassdoor)                    │
└─────────────────────────────────────────────────────┘
```

**Benefits**:
- ✅ User has the data already (premium accounts)
- ✅ More accurate than AI inference
- ✅ Real-time data
- ✅ User controls data quality

**Implementation**:
1. User clicks "Enhance with LinkedIn Data"
2. Modal opens: "Paste the company page HTML or text"
3. AI extracts structured data from paste
4. Merges with baseline AI data
5. Saves to cache

---

### **Tier 3: Public Data APIs (When Available)**

**Free/Low-Cost APIs**:

1. **Google News API** (Free tier)
   - Recent news articles
   - Company mentions
   - Sentiment analysis

2. **Company Website Scraping** (Free but fragile)
   - About page
   - Careers page (open roles count)
   - Leadership team page

3. **Job Board Aggregators** (Mixed)
   - Indeed: Public job listings
   - LinkedIn Jobs: Public postings (no auth needed)
   - Count open roles

**Implementation**:
- Background job: Fetch public data
- Cache for 7 days
- Fall back to AI if APIs fail

---

## 🎯 **Recommended MVP Approach**

### **Phase 1: AI Baseline (This Week)**

**What We Provide**:
```typescript
{
  name: "Notion",
  category: "direct",
  size: {
    employees: "1,000-5,000",  // AI estimate from knowledge
    sizeCategory: "scaleup"
  },
  industry: {
    broad: "Technology",
    specific: "SaaS"
  },
  location: {
    headquarters: "San Francisco, CA",  // AI knowledge
    region: "North America",
    isRemote: true  // AI inference from JD/company rep
  },
  leadership: {
    ceo: "Ivan Zhao",  // AI knowledge (if well-known)
    ceoBackground: "Ex-Inkling, Y Combinator"
  },
  careerMetrics: {
    growthScore: 4,  // AI estimate based on reputation
    stabilityScore: 4,  // AI estimate based on funding/age
    retentionScore: 3,  // AI estimate (conservative default)
    avgTenure: "~3 years (estimated)"  // Marked as estimate
  },
  recentNews: {
    positive: 0,  // NULL - need real data
    negative: 0,
    highlights: ["Recent data unavailable - click to enhance"]
  },
  skillsIntel: {
    currentHotSkills: ["React", "TypeScript"],  // AI from JD context
    futureSkills: ["AI/ML"],  // AI industry trend knowledge
    hiringTrend: "unknown",  // Need real data
    openRoles: null
  },
  confidence: {
    score: "medium",  // Medium because no real-time data
    percentage: 65
  }
}
```

**UI Indicators**:
- Mark estimated fields: "~3 years (estimated)"
- Show which fields need enhancement
- Offer "Enhance with your data" option

---

### **Phase 2: User Enhancement (Next Week)**

**UI Flow**:
```
User sees: "Growth: ●●●●○ 4/5 (estimated)"
          [📋 Enhance with LinkedIn Data]
            ↓
User pastes LinkedIn company page
            ↓
AI extracts:
  • Employee count (exact)
  • Recent posts/news
  • Hiring trend graph data
  • Skills from job postings
            ↓
Updates cache with real data
            ↓
Badge changes: "Growth: ●●●●● 5/5 ✓ verified"
```

---

### **Phase 3: Automated Collection (Future)**

**When budget allows**:
- LinkedIn API ($$$)
- Glassdoor API ($$$)
- Job board APIs
- News aggregation
- Fully automated, no user input

---

## 📊 **Confidence Score Breakdown**

### **How We Calculate Confidence**:

```
Confidence = Σ (Field Weight × Data Quality)

Field Weights:
- Company basics (name, industry, size): 30%
- Leadership (CEO, background): 10%
- Career metrics (growth, stability, retention): 20%
- News & events (recent 60 days): 15%
- Skills & hiring trends: 15%
- Sources attribution: 10%

Data Quality per Field:
- AI knowledge (well-known companies): 80%
- AI inference (estimates): 50%
- User-provided data: 100%
- API data (fresh): 95%
- Web scraped (fragile): 70%

Example - Notion (AI only):
- Basics: 30% × 80% = 24
- Leadership: 10% × 80% = 8
- Career metrics: 20% × 50% = 10  (estimated)
- News: 15% × 0% = 0  (missing)
- Skills: 15% × 60% = 9  (inferred from JD)
- Sources: 10% × 40% = 4  (no real sources)
Total: 55% → MEDIUM confidence

Example - Notion (with user data):
- Basics: 30% × 100% = 30  (LinkedIn paste)
- Leadership: 10% × 100% = 10  (LinkedIn paste)
- Career metrics: 20% × 90% = 18  (Glassdoor paste)
- News: 15% × 100% = 15  (LinkedIn posts)
- Skills: 15% × 95% = 14.25  (Job listings)
- Sources: 10% × 100% = 10  (URLs provided)
Total: 97% → HIGH confidence
```

---

## 🎯 **Key Insights Column - Redesign**

### **Problem**:
Current "Key Insights" shows:
- Match: 95% (redundant with relevance)
- Career: HIGH (redundant with career opportunity)
- Reason text (clips at 2 lines)

### **Solution**: Show **Actionable Intelligence**

**New "Key Insights" Column**:
```
Line 1: [Icon] Interview Prep: Very likely competitor discussion
Line 2: [Icon] Action: Apply now • 47 open roles ↗
```

Or:

```
Line 1: 🎯 Top skill match: React, TypeScript
Line 2: 💼 Apply now (95% match, hiring actively)
```

Or even simpler:

```
Interview: Very likely - main competitor
Apply: Now (47 roles, high growth)
```

**Criteria**:
- ✅ Actionable (what to DO)
- ✅ Non-redundant (not shown elsewhere)
- ✅ Fits in 2-3 lines max
- ✅ Color-coded for quick scan

---

## 🔍 **Where Full Insights Live**

**Option A**: Full Modal Tab 3 (Already implemented!)
- Click "View Full Analysis" → Tab 3: Insights
- Full paragraph per company
- No text clipping

**Option B**: Expandable Row
- Click row → Expands to show full insights
- Inline, no modal needed

**Option C**: Hover Tooltip
- Hover over insights cell → Full text in tooltip
- Quick, no click needed

**Recommendation**: Use **Tab 3 in modal** (already built!) + hover tooltip for quick preview

---

## 📝 **MVP Data Collection Decision Matrix**

| Data Field | AI Inference | User Paste | Public API | Recommendation |
|------------|--------------|------------|------------|----------------|
| **Company name** | ✅ Excellent | - | - | AI |
| **Category** | ✅ Excellent | - | - | AI |
| **Size** | ⚠️ Estimate | ✅ Exact | ✅ LinkedIn API | AI (mark as ~) |
| **Industry** | ✅ Good | ✅ Better | ✅ LinkedIn API | AI |
| **Location** | ✅ Good | ✅ Better | ✅ LinkedIn API | AI |
| **CEO** | ✅ Good | ✅ Better | ✅ LinkedIn API | AI |
| **Growth score** | ⚠️ Rough | ✅ Accurate | ❌ Not available | AI (mark as ~) |
| **Stability** | ⚠️ Rough | ✅ Accurate | ❌ Not available | AI (mark as ~) |
| **Retention** | ❌ Unknown | ✅ Glassdoor | ❌ Not available | NULL |
| **News (60d)** | ❌ Stale | ✅ Current | ✅ News API | User paste or API |
| **Skills** | ✅ From JD | ✅ From jobs | ✅ Job APIs | AI + context |
| **Hiring trend** | ❌ Unknown | ✅ LinkedIn | ✅ Job APIs | NULL or user paste |
| **Open roles** | ❌ Unknown | ✅ LinkedIn | ✅ Job APIs | NULL or API |
| **Confidence** | Auto-calculated | - | - | Formula |

---

## ✅ **Recommended MVP Implementation**

### **For This Week**:

**What AI Provides** (no user input needed):
```json
{
  "name": "Notion",
  "category": "direct",
  "size": { "employees": "~1,000-5,000", "sizeCategory": "scaleup" },
  "industry": { "broad": "Technology", "specific": "SaaS" },
  "location": { "headquarters": "San Francisco, CA", "region": "North America", "isRemote": true },
  "leadership": { "ceo": "Ivan Zhao", "ceoBackground": "Ex-Inkling, Y Combinator" },
  
  // Estimated scores (marked with ~)
  "careerMetrics": {
    "growthScore": 4,
    "stabilityScore": 4,
    "retentionScore": null,  // Unknown
    "avgTenure": null
  },
  
  // Missing real-time data
  "recentNews": {
    "positive": 0,
    "negative": 0,
    "highlights": []  // Empty - not available
  },
  
  // Inferred from JD context
  "skillsIntel": {
    "currentHotSkills": ["React", "TypeScript", "PostgreSQL"],
    "futureSkills": ["AI/ML", "Real-time Collaboration"],
    "hiringTrend": "unknown",
    "openRoles": null
  },
  
  "relevanceScore": 95,
  "reason": "Direct competitor with similar product features and tech stack",
  "careerOpportunity": "high",  // Based on company reputation + growth stage
  "interviewRelevance": "Very likely - main competitor will be discussed",
  
  "confidence": {
    "score": "medium",
    "percentage": 65  // Lower because missing real-time data
  },
  
  "keyInsights": "🎯 Very likely interview topic (prepare competitor comparison). 💼 High career opportunity based on scaleup stage and product-market fit. Skills match: React, TypeScript align with role.",
  
  "sources": []  // No real sources for AI inference
}
```

**UI Shows**:
- Regular fields as normal
- Estimated fields marked: "~1,000-5,000" or "4/5 (est.)"
- Missing fields: "-" or "N/A"
- Lower confidence: MEDIUM (65%)
- Optional enhancement banner: "Want more accurate data? [Enhance]"

---

### **Enhancement Flow** (User-Assisted):

```
User clicks [Enhance with Real Data] on any company
  ↓
Modal opens with options:
┌─────────────────────────────────────────────────────┐
│ Enhance Data for Notion                             │
├─────────────────────────────────────────────────────┤
│ We have baseline data from AI. You can enhance     │
│ with real-time data from your sources.             │
│                                                     │
│ [📋 Paste LinkedIn Company Page]                   │
│    We'll extract: Size, hiring trends, recent news │
│                                                     │
│ [📋 Paste Glassdoor Page]                          │
│    We'll extract: Ratings, reviews, avg tenure     │
│                                                     │
│ [🔗 Provide Company Website URL]                   │
│    We'll scrape: About, leadership, careers        │
│                                                     │
│ [Skip - Use AI Estimates]                          │
└─────────────────────────────────────────────────────┘

User pastes data
  ↓
AI extracts structured info from paste
  ↓
Merges with baseline data
  ↓
Updates cache
  ↓
Confidence increases: MEDIUM (65%) → HIGH (92%)
  ↓
Badge shows: ✓ Enhanced with LinkedIn data
```

---

## 📊 **Key Insights Column - Redesign**

### **Current** (Redundant):
```
Match: 95% • Career: HIGH
Direct competitor in collaborative workspace...
```

### **Proposed** (Actionable):
```
🎯 Interview: Very likely competitor topic
💼 Action: Apply now (47 roles, hiring ↗)
```

Or more compact:

```
Interview prep: Main competitor comparison
Apply: Now • 47 roles • High growth
```

Or ultra-compact with icons:

```
🎯 Very likely  💼 Apply now  🚀 47 roles
Skills: React, TS (strong match)
```

### **Design Principle**:
- **Line 1**: Interview relevance (action-oriented)
- **Line 2**: Application timing + hiring status
- **Optional Line 3**: Top skill match or unique insight

**Always 2-3 lines max**, use `line-clamp-3` to prevent overflow.

---

## 🎯 **Match vs Career Clarification**

### **Match Score** (Relevance):
- **What**: How similar is this company to target company?
- **Range**: 0-100%
- **Example**: Notion vs Asana = 95% (almost identical product)
- **Use**: Identifies best competitor comparisons for interviews

### **Career Opportunity**:
- **What**: Should user apply to this company?
- **Range**: HIGH / MEDIUM / LOW
- **Factors**:
  - Growth score (expanding = more opportunities)
  - Hiring trend (actively hiring = easier to get in)
  - Stability score (won't collapse)
  - Skills match (user's skills align)
- **Example**: HIGH = "Yes, apply here! They're hiring and it's a good fit"

**These ARE useful metrics** - but need to explain them better!

---

## 💡 **Proposed Solution**

### **1. Update Key Insights Column**:

```typescript
// Generate smart insights based on available data
function generateKeyInsights(company: EcosystemCompany): string {
  const lines: string[] = [];
  
  // Line 1: Interview relevance
  if (company.interviewRelevance) {
    const relevanceLevel = company.interviewRelevance.toLowerCase().includes('very likely') ? '🎯 Very likely' :
                          company.interviewRelevance.toLowerCase().includes('likely') ? '🎯 Likely' :
                          '🎯 Possible';
    lines.push(`${relevanceLevel} interview topic`);
  }
  
  // Line 2: Application timing
  const hiring = company.skillsIntel?.openRoles 
    ? `${company.skillsIntel.openRoles} roles`
    : 'hiring status unknown';
  const action = company.careerOpportunity === 'high' ? 'Apply now' :
                 company.careerOpportunity === 'medium' ? 'Consider applying' :
                 'Monitor for future';
  lines.push(`💼 ${action} • ${hiring}`);
  
  // Line 3: Top differentiator (if space)
  if (company.skillsIntel?.currentHotSkills && company.skillsIntel.currentHotSkills.length > 0) {
    const topSkills = company.skillsIntel.currentHotSkills.slice(0, 2).join(', ');
    lines.push(`Skills: ${topSkills}`);
  }
  
  return lines.join('\n');
}
```

**Result**:
```
🎯 Very likely interview topic
💼 Apply now • 47 roles
Skills: React, TypeScript
```

---

### **2. Add Tooltips**:

Hover over "Match: 95%" shows:
```
Relevance Score: 95%

How similar this company is to your target.
Used for interview comparisons.

95% = Near-identical product/market
```

Hover over "Career: HIGH" shows:
```
Career Opportunity: HIGH

Should you apply here?

Based on:
• Growth: 5/5 (expanding rapidly)
• Hiring: ↗ 47 open roles
• Stability: 4/5 (well-funded)
• Skills match: React, TS align
```

---

### **3. Full Text in Modal**:

The full paragraph insights live in:
- **Tab 3: Insights** (already built!)
- No clipping, full detail

---

## ✅ **Action Plan**

### **Immediate** (Next 30 min):
1. Redesign Key Insights column to be actionable
2. Remove redundant Match/Career (or add tooltips)
3. Use line-clamp-3 to prevent overflow
4. Test with sample data

### **This Week**:
5. Update prompt to generate baseline AI data
6. Mark estimated fields clearly
7. Add "Enhance with your data" option
8. Build paste→extract flow

### **Next Week**:
9. Integrate Google News API (free tier)
10. Add job board scraping (public data)
11. Build automated enrichment
12. Cache forever (company data changes slowly)

---

## 💭 **Your Questions Answered**

**Q: How do we compute Match and Career?**
- **Match**: AI assesses product/market similarity (0-100%)
- **Career**: AI evaluates hiring+growth+stability → HIGH/MED/LOW

**Q: How to avoid text clipping?**
- Use `line-clamp-3` CSS
- Full text in modal Tab 3
- Hover tooltip for quick preview

**Q: How to get real data?**
- Phase 1: AI baseline (mark as estimates)
- Phase 2: User paste (LinkedIn, Glassdoor)
- Phase 3: Automated APIs (when budget allows)

**Q: Will this work?**
- Yes! Start with AI baseline, enhance progressively
- User can opt-in to provide better data
- Transparent about what's estimated vs verified

---

**Ready to implement the redesigned Key Insights column?**

