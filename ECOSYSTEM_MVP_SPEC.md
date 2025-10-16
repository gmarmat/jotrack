# Company Ecosystem MVP - UX Specification

**Goal**: Show 10 companies with rich intel without horizontal scroll nightmare

**Status**: Ready to implement

---

## 🎯 **Two-Tier UX Strategy**

### **Tier 1: Compact In-Page Table**
- Shows on job detail page
- 6-8 key columns (no horizontal scroll)
- "View Full Analysis" button → Opens Tier 2

### **Tier 2: Full-Screen Modal**
- Modal takes 90% viewport (like Gmail compose)
- Shows ALL 15+ columns
- Tabs for Sources, Insights, Raw Data
- Download as CSV option

---

## 📊 **Column Design (Tier 1 - Compact View)**

**Columns to Show** (8 total, fits without scroll on 1920px):

| # | Column | Width | Content | Example |
|---|--------|-------|---------|---------|
| 1 | Company | 15% | Name + logo | **Notion** |
| 2 | Category | 10% | Icon + label | 🔴 Direct |
| 3 | Size/Industry | 12% | 2 lines | 1K-5K employees<br/>SaaS |
| 4 | Growth | 8% | Stars + score | ●●●●● 5/5 |
| 5 | News Signals | 10% | +ve/-ve count | 3⬆ 1⬇ |
| 6 | Hiring | 8% | Trend + count | ↗ 47 roles |
| 7 | Confidence | 8% | Badge | 🟢 HIGH |
| 8 | Actions | 10% | Buttons | [View Full] |

**Summary Row Below Table**:
- "10 companies analyzed • Avg confidence: HIGH • Last updated: 2 hours ago"
- "📊 View Full Analysis" button → Opens modal

---

## 📊 **Column Design (Tier 2 - Full Modal View)**

**Tab 1: Company Intelligence** (Main view)

| Column | Type | Content | Example |
|--------|------|---------|---------|
| Company | Raw | Name + Category | Notion (Direct Competitor) |
| Size | Raw | Employees + Category | 1,000-5,000 (Scaleup) |
| Industry | Raw | Broad → Specific | Technology → SaaS |
| Location | Raw | HQ + Region | San Francisco, CA (Remote OK) |
| Revenue | Raw | ARR or Public | $100M+ ARR |
| CEO | Raw | Name + Background | Ivan Zhao (Ex-Inkling, YC) |
| Culture | Summary | Glassdoor + Principles | 4.5★ • Innovation-first, Remote |
| News (60d) | Summary Stats | +ve/-ve count + highlights | **3⬆ 2⬇**<br/>• Series C $275M ⬆<br/>• Layoffs rumor ⬇ |
| Skills Demand | Summary | Current + Future | React, TS → AI/ML |
| Hiring Trend | Summary Stats | Trend + count | ↗ Growing (47 open roles) |
| Growth Score | Score (1-5) | Stars + label | ●●●●● 5/5 (Rapid) |
| Stability Score | Score (1-5) | Stars + label | ●●●●○ 4/5 (Well-funded) |
| Retention Score | Score (1-5) | Stars + label | ●●●●○ 4/5 (3.2yr avg) |
| Career Fit | Badge | HIGH/MED/LOW | 🟢 HIGH |
| Confidence | Badge + % | Quality score | 🟢 HIGH (92%) |
| Insights | Summary | 3-4 sentences | *"Strong growth with..."* |

**Tab 2: Sources & Research**

Organized by data category:

```
┌─────────────────────────────────────────┐
│ Sources by Category                     │
├─────────────────────────────────────────┤
│ [Company Profile] [News] [Hiring] [Ratings] [Skills] │
├─────────────────────────────────────────┤
│ Company Profile Sources:                │
│ ✅ LinkedIn (Primary - High confidence) │
│    • Employees: 1,000-5,000             │
│    • Last updated: Oct 15, 2024         │
│                                         │
│ ✅ Company Website (Primary)            │
│    • About page, CEO bio                │
│    • Verified: Oct 16, 2024             │
│                                         │
│ News Sources (60 days):                 │
│ ✅ TechCrunch (High confidence)         │
│    • Series C announcement              │
│    • Date: Oct 10, 2024                 │
│                                         │
│ ⚠️ Reddit r/notion (Medium confidence)  │
│    • Layoffs discussion (unverified)    │
│    • Date: Sept 20, 2024                │
└─────────────────────────────────────────┘
```

**Tab 3: Insights Summary**

- Full detailed analysis (the 3-4 sentence summary expanded)
- Actionable recommendations
- Interview prep tips

---

## 🎯 **News Signals Column - Smart Design**

### **Compact View** (Tier 1):
```
3⬆ 1⬇
```
- Hover tooltip: "3 positive, 1 negative news items (60 days)"

### **Full Modal** (Tier 2):
```
Recent News (60 days): 3⬆ 1⬇

Positive Signals:
⬆ Series C funding ($275M) - TechCrunch, Oct 10
⬆ 10M users milestone - Company blog, Sept 5
⬆ Acquired Cron (calendar) - VentureBeat, Aug 22

Negative Signals:
⬇ Layoffs rumor (unverified) - Reddit, Sept 20
```

### **Sources Tab**:
Shows all 4 sources with confidence ratings

---

## 🎯 **Confidence Score Calculation**

### **Source Weighting**:

| Source Type | Weight | Confidence Impact |
|-------------|--------|-------------------|
| Company official (website, LinkedIn) | 40% | High |
| Major news outlets (TechCrunch, WSJ) | 30% | High |
| Job boards (LinkedIn Jobs, Indeed) | 15% | Medium |
| Review sites (Glassdoor, Blind) | 10% | Medium |
| Social media (Reddit, Twitter) | 5% | Low |

### **Calculation**:
```
Confidence = Σ (Source Weight × Data Quality)

Example for Notion:
- Company profile: 40% × 100% = 40
- News (4 articles): 30% × 80% = 24
- Job boards: 15% × 100% = 15
- Glassdoor: 10% × 90% = 9
- Reddit: 5% × 50% = 2.5
Total: 90.5% → HIGH

Thresholds:
- HIGH: 80-100%
- MEDIUM: 60-79%
- LOW: 0-59%
```

### **Tooltip on Hover**:
```
Confidence: HIGH (92%)

Based on source quality:
✅ Company LinkedIn verified
✅ 4 news articles from major outlets
✅ Glassdoor data (500+ reviews)
⚠️ Some data from unverified sources

Click to see all sources →
```

---

## 📝 **Explanation Section**

**Location**: Top of compact table (collapsible)

```
┌─────────────────────────────────────────────────────┐
│ [ℹ️] How We Analyze the Ecosystem    [Collapse ▲]  │
├─────────────────────────────────────────────────────┤
│ We analyze companies across 15+ dimensions to help  │
│ you understand the competitive landscape, identify  │
│ career opportunities, and prepare for interviews.   │
│                                                     │
│ Our Analysis Methodology:                           │
│ • 10 Companies: 5 direct competitors, 3 adjacent   │
│   markets, 2 complementary products                │
│ • 8 Data Sources: Company profiles, news, hiring   │
│   trends, reviews, and more                         │
│ • 15+ Signals: Size, growth, stability, culture,   │
│   news, skills demand, hiring trends               │
│ • Confidence Score: Based on source quality and    │
│   data freshness (updated every 7 days)            │
│                                                     │
│ What Each Column Means:                             │
│ • News Signals: Positive/negative events (60 days) │
│ • Growth Score: Company expansion rate (1-5)       │
│ • Hiring Trend: Open roles + direction (↗↘)       │
│ • Confidence: Data quality (sources + freshness)   │
│                                                     │
│ Note: Analysis based on public data. We show       │
│ sources so you can verify our research.            │
│ [View All Sources] [Download Analysis]             │
└─────────────────────────────────────────────────────┘
```

---

## 🎨 **Full Modal UX**

### **Modal Structure**:

```
╔═══════════════════════════════════════════════════╗
║ Company Ecosystem - Full Analysis      [✕ Close] ║
╠═══════════════════════════════════════════════════╣
║ [Intelligence] [Sources] [Insights] [Export]      ║
╠═══════════════════════════════════════════════════╣
║                                                   ║
║ 10 companies • Last updated: 2h ago • Next: 5d   ║
║ Confidence: 🟢 HIGH (8/10) 🟡 MED (2/10)         ║
║                                                   ║
║ [Search companies...]              [Download CSV] ║
║                                                   ║
║ ┌─────────────────────────────────────────────┐ ║
║ │ Full table with 15+ columns (scrollable)    │ ║
║ │ ...                                         │ ║
║ └─────────────────────────────────────────────┘ ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
```

---

## 🎯 **Smart Column Width Strategy**

### **Tier 1 (Compact - No Scroll)**:
Total width: 100% (fits 1920px, scales down gracefully)

```
|← 15% →|← 10% →|← 12% →|← 8% →|← 10% →|← 8% →|← 8% →|← 10% →|
| Name  | Type  | Size  | Grow | News  | Hire | Conf | Action |
```

### **Tier 2 (Full Modal - Horizontal Scroll OK)**:
Total width: 150-200% (user expects to scroll in modal)

```
|← All 15+ columns →|
```

---

## 🎯 **Implementation Checklist**

### **Phase 1A: Data Model** (30 min)
- [ ] Create enhanced TypeScript interface
- [ ] Add all 15+ fields (with optional markers)
- [ ] Add confidence calculation types
- [ ] Add source attribution types

### **Phase 1B: Prompt** (30 min)
- [ ] Update ecosystem prompt
- [ ] Request all fields
- [ ] Request sources per field
- [ ] Request confidence justification

### **Phase 1C: Compact Table** (1 hour)
- [ ] Update existing table component
- [ ] 8 columns (no horizontal scroll)
- [ ] "View Full Analysis" button
- [ ] Explanation section (collapsible)

### **Phase 1D: Full Modal** (1.5 hours)
- [ ] Create new FullEcosystemModal component
- [ ] Tab 1: Intelligence (15+ columns)
- [ ] Tab 2: Sources (by category)
- [ ] Tab 3: Insights (detailed)
- [ ] Export CSV functionality

### **Phase 1E: Confidence Score** (30 min)
- [ ] Implement source weighting logic
- [ ] Calculate confidence percentage
- [ ] Add tooltip with breakdown
- [ ] Badge component (HIGH/MED/LOW)

**Total Time: ~4 hours**

---

## 🎯 **Future: Extend to 30 Companies**

**Note for Later**:
```
TODO: Extend ecosystem analysis to 30 companies
- Current: 10 companies (5 direct + 3 adjacent + 2 complementary)
- Target: 30 companies (10 direct + 10 adjacent + 5 upstream + 5 downstream)
- Cost impact: $0.15 → $0.35 per analysis
- UI impact: Pagination or virtual scrolling in modal
- Consideration: Tiered analysis (10 deep + 20 lighter)
```

---

## ✅ **Ready to Build**

This spec balances:
✅ Rich data (15+ signals)  
✅ Clean UX (no scroll nightmare)  
✅ Transparency (sources visible)  
✅ Confidence (quality scoring)  
✅ Actionability (insights + recommendations)  

**Proceed with implementation?**

