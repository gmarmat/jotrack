# Evidence Extraction Strategy - Careful Analysis
## Don't Break What's Working

---

## 🎯 The Goal

**Show evidence chips in Sources Modal for People Profiles**

Current State:
```
John Smith - Hiring Manager
[View Sources] → Shows generic source list
```

Desired State:
```
John Smith - Hiring Manager
[View Sources (3)] → Shows evidence chips with quotes
📊 LinkedIn · "Led teams through 10x growth"
💬 Reddit · "OBSESSED with metrics"
```

---

## ⚠️ Critical Constraints

1. **Don't touch working prompts** - Our prompts are proven and optimized
2. **Don't increase costs** - Token usage is already optimized
3. **Don't break existing analysis** - Everything works, don't regress
4. **Don't add latency** - 120s timeout is already tight

---

## 🔍 Current Data Flow Analysis

### **What We Have Now:**

**Step 1: User pastes LinkedIn profile**
```
User → Paste LinkedIn text
    ↓
API: /api/jobs/[id]/people/extract
    ↓
Prompt: people-extract.v1.md
    ↓
Output: Structured JSON (name, title, experiences, skills, etc.)
    ↓
Saved: people_profiles.summary (JSON)
```

**Step 2: People Profiles AI Analysis**
```
API: /api/ai/people-analysis
    ↓
Prompt: people.v1.md
    ↓
Input: jobDescription + peopleProfiles (from DB)
    ↓
Output: {
  profiles: [{ name, role, background, expertise, communicationStyle, whatThisMeans }],
  overallInsights: {...},
  sources: ["url1", "url2"]  ← Generic URLs only
}
    ↓
Saved: people_analyses.result_json
```

**Current Problem**: `sources` is just an array of URLs, no quotes/evidence

---

## 💡 Three Possible Approaches

### **Option A: Update AI Prompt to Extract Evidence** ⚠️ RISKY

**How**: Modify `people.v1.md` to return structured evidence

**Pros**:
- AI already has access to LinkedIn data
- Could extract quotes during analysis
- All evidence in one pass

**Cons**:
- ❌ Increases prompt complexity (more tokens)
- ❌ Risks breaking current analysis quality
- ❌ LinkedIn doesn't have "quotes" - it's the user's own profile
- ❌ No external validation (Glassdoor, Reddit, Blind)
- ❌ We'd be asking AI to fabricate "evidence" from LinkedIn

**Verdict**: ❌ **BAD IDEA** - LinkedIn is the user's own data, not external evidence

---

### **Option B: Add Separate Evidence Search** 💰 EXPENSIVE

**How**: Add new API call after people analysis

**Flow**:
```
1. People analysis (current) → Get insights
2. NEW: Evidence search → Search Glassdoor/Reddit/Blind for each person
3. Match quotes to insights
```

**Pros**:
- ✅ Real external validation
- ✅ Don't touch existing prompts
- ✅ Actual quotes from Glassdoor, Reddit, Blind

**Cons**:
- ❌ Additional API call per person (3 people = 3 Tavily searches)
- ❌ Costs: ~$0.01 per person for Tavily search
- ❌ Latency: +5-10 seconds per person
- ❌ May not find results for every person

**Verdict**: 💰 **EXPENSIVE** - Adds significant cost and latency

---

### **Option C: Leverage Interview Questions Search** ⭐ OPTIMAL

**How**: When searching for interview questions, ALSO extract interviewer mentions

**Current Flow**:
```
Interview Coach → Search Questions
    ↓
Tavily: "Fortive interview questions Glassdoor Reddit"
    ↓
Results: Questions + random mentions
    ↓
We extract: Questions only
    ↓
We discard: Everything else (including interviewer mentions!)
```

**Enhanced Flow**:
```
Interview Coach → Search Questions
    ↓
Tavily: "Fortive interview questions Glassdoor Reddit"
    ↓
Results: Questions + interviewer mentions + company culture
    ↓
We extract: 
  - Questions (for Interview Coach)
  - Interviewer quotes (for People Profiles) ← NEW!
  - Culture notes (for Company Intel) ← BONUS!
    ↓
Associate quotes with people by name matching
```

**Pros**:
- ✅ **ZERO additional cost** - We're already doing the search!
- ✅ **ZERO additional latency** - Same API call
- ✅ **Don't touch existing prompts** - Post-processing only
- ✅ **Real external validation** - Actual Glassdoor/Reddit quotes
- ✅ **Bonus data** - Can enhance Company Intel too

**Cons**:
- ⚠️ May not find quotes for every person (only mentioned ones)
- ⚠️ Requires name matching logic (fuzzy matching)
- ⚠️ Only works if Interview Coach has been used

**Verdict**: ⭐ **OPTIMAL** - Free, fast, real data

---

## 🎯 Recommended Approach: Option C + Smart Fallback

### **Implementation Plan:**

**Phase 1: Enhance Interview Questions Search** (When it runs)
```typescript
// In interview question search results processing:
const searchResults = await tavilySearch(...);

// CURRENT: Extract questions only
const questions = extractQuestions(searchResults);

// NEW: Also extract interviewer mentions
const interviewerMentions = extractInterviewerMentions(searchResults);
// Returns: [
//   { name: "John Smith", quote: "...", source: "glassdoor", url: "...", date: "..." },
//   { name: "Samir Kumar", quote: "...", source: "reddit", url: "...", date: "..." }
// ]

// Save to people_profiles or cache for later display
```

**Phase 2: Display Logic** (Smart Fallback)
```typescript
// In PeopleProfilesCard:
const personSources = [
  // Try to find evidence from interview search
  ...findInterviewerMentions(person.name),
  
  // Fallback: LinkedIn profile as source
  {
    platform: 'linkedin',
    quote: person.background[0], // Use first background bullet
    fullQuote: person.rawText, // Full LinkedIn profile
    url: person.linkedInUrl,
    provider: 'manual'
  }
];
```

**Phase 3: Progressive Enhancement**
- Initially: Show LinkedIn data as "evidence" (manual source)
- After Interview Coach runs: Show real Glassdoor/Reddit quotes (Tavily source)
- User sees improvement over time!

---

## 📊 Cost & Latency Comparison

| Approach | Additional Cost | Additional Latency | Data Quality |
|----------|----------------|-------------------|--------------|
| A (Prompt) | +$0.05-0.10 | +10-20s | ❌ Fabricated |
| B (Separate Search) | +$0.03 per person | +30s total | ✅ Real |
| **C (Leverage Existing)** | **$0.00** | **0s** | ✅ Real |

---

## 🚀 Recommended Implementation

### **Phase 1: Quick Win (Now)**
Show LinkedIn profile data as "evidence":
```
Evidence:
📊 LinkedIn · "Led engineering teams through 10x growth" [User Input]
```

**Why**: 
- Zero cost, zero latency
- Shows the UI works
- Builds from data we already have
- User sees their own LinkedIn data reflected back

### **Phase 2: Real Validation (When Interview Coach Runs)**
Extract interviewer mentions from Tavily search:
```
Evidence:
📊 LinkedIn · "Led engineering teams..." [User Input]
💬 Reddit · "John is OBSESSED with metrics" [⚡ Tavily]
🎯 Blind · "Bring your A-game" [⚡ Tavily]
```

**Why**:
- Free (piggyback on existing search)
- Real external validation
- Progressive enhancement (gets better over time)

---

## 💡 Key Insight

**We don't need evidence for EVERY person on FIRST view.**

**Journey**:
1. User adds John Smith (LinkedIn)
2. See basic profile with LinkedIn "evidence"
3. User runs Interview Coach (Tavily search happens)
4. Tavily finds mentions of John Smith
5. Evidence chips now include Glassdoor/Reddit/Blind quotes
6. Profile gets richer over time!

---

## ✅ Decision: Start with Phase 1

**Let's implement the quick win**:
1. Use existing LinkedIn data as "evidence"
2. Show in evidence chips with [User Input] provider
3. Prove the UI works
4. THEN enhance with Tavily data when Interview Coach runs

**No prompt changes, no cost, no risk, immediate value.**

**Should I implement Phase 1?**

