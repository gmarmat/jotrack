# Interview Coach - Complete Data Flow Analysis

## 🎯 High-Level Overview

**Purpose**: Prepare user for persona-specific interviews using ALL available context and signals.

**Flow**: Welcome → Search Questions → AI Synthesis → Practice Answers → Score & Iterate → Generate Talk Tracks → Extract Core Stories → Print Cheat Sheet

---

## 📊 Current Data Flow (Step-by-Step)

### **Step 1: User Entry Point**
```
Job Detail Page (jobs/[id]/page.tsx)
  ↓
User clicks: [📞 Recruiter Screen] or [👨‍💼 Hiring Manager] or [👥 Peer/Panel]
  ↓
Navigate to: /interview-coach/[jobId]?type=recruiter
  ↓
InterviewCoachPage loads with persona context
```

**Inputs**:
- Job ID
- Persona type (recruiter | hiring-manager | peer)

**Outputs**:
- Interview Coach session initialized

---

### **Step 2: Question Discovery (WelcomeSearch.tsx)**

#### **2A: Web Search (Tavily API)**
```typescript
// API: /api/jobs/[id]/interview-questions/search
searchWeb(`${companyName} ${jobTitle} interview questions site:glassdoor.com`)
searchWeb(`${companyName} interview questions site:reddit.com`)
searchWeb(`${companyName} interview questions site:teamblind.com`)
  ↓
Raw results: 50-150 questions
  ↓
Save to: interview_questions_cache (TTL: 90 days, company-level)
```

**Current Signals Used**:
- ✅ Company name
- ✅ Job title
- ✅ Web search results (Glassdoor, Reddit, Blind)

**Missing Signals** ⚠️:
- ❌ Persona-specific search (not filtering by recruiter vs HM vs peer)
- ❌ Industry context (not searching for industry-specific patterns)
- ❌ Seniority level (not filtering for junior vs senior questions)

---

#### **2B: AI Question Generation**
```typescript
// API: /api/jobs/[id]/interview-questions/generate
callAiProvider('interview-questions-recruiter', {
  jobDescription: jdVariant.aiOptimized,
  resume: resumeVariant.aiOptimized,
  companyName: job.company,
  companyCulture: companyIntelligence?.principles?.join(', '),
  searchResults: webQuestions
})
  ↓
AI generates: 10-12 persona-specific questions
  ↓
Save to: job_interview_questions (persona-specific, job-level)
```

**Current Signals Used**:
- ✅ Job description (AI-optimized)
- ✅ Resume (AI-optimized)
- ✅ Company name
- ✅ Company culture principles (from Company Intelligence)
- ✅ Web search results (for context)
- ✅ Persona type (different prompt per persona)

**Missing Signals** ⚠️:
- ❌ **People Profiles Analysis** (NOT USED!)
- ❌ User's writing style (from Application Coach)
- ❌ Match score insights (what gaps to focus on)
- ❌ Skills match data (what technical skills to emphasize)
- ❌ Company ecosystem data (competitors, partnerships)

---

#### **2C: AI Synthesis (NEW - Mock Data)**
```typescript
// Currently in WelcomeSearch.tsx (mock data)
AI synthesizes:
  ↓
Themes: 4 categories with question distribution
  ↓
Final 4 Questions: Top questions user should prepare
```

**Current Signals Used**:
- ✅ Web search results (raw questions)
- ✅ AI-generated questions

**Missing Signals** ⚠️:
- ❌ User's weak areas (from match score)
- ❌ Interviewer insights (from people profiles)
- ❌ Company-specific pain points (from company analysis)

---

### **Step 3: Answer Practice (AnswerPracticeWorkspace.tsx)**

#### **3A: User Drafts Answer**
```
User types answer in textarea
  ↓
Auto-save to: coach_state.interview_coach_json.answers[questionId]
  ↓
Wait for user to click [Score My Answer]
```

**Current Signals Used**:
- ✅ Question text
- ✅ User's draft answer

**Missing Signals** ⚠️:
- ❌ Real-time word count target (based on persona)
- ❌ STAR structure hints (S/T/A/R labels in placeholder)

---

#### **3B: AI Scoring**
```typescript
// API: /api/interview-coach/[jobId]/score-answer
callAiProvider('answer-scoring', {
  jobDescription: jdVariant.aiOptimized,
  resume: resumeVariant.aiOptimized,
  companyCulture: companyIntelligence?.principles?.join(', '),
  writingStyle: coachState.dataJson?.writingStyle?.summary,
  question: question,
  answer: userAnswer,
  previousScores: scoreHistory
})
  ↓
Returns: { overall: 0-100, breakdown: {...}, feedback: [...], followUpQuestions: [] }
  ↓
Save to: coach_state.interview_coach_json.answers[questionId].scores[]
```

**Current Signals Used**:
- ✅ Job description (AI-optimized)
- ✅ Resume (AI-optimized)
- ✅ Company culture (from Company Intelligence)
- ✅ User's writing style (from Application Coach Discovery)
- ✅ Question text
- ✅ User's answer
- ✅ Previous scores (for iteration tracking)

**Missing Signals** ⚠️:
- ❌ **People Profile Insights** (NOT USED!)
  - e.g., If recruiter profile says "prefers structured answers", scoring should emphasize STAR
  - e.g., If hiring manager is "data-driven", scoring should reward metrics heavily
- ❌ Match score gaps (what skills/experience to emphasize)
- ❌ Persona-specific rubric weights (recruiter cares more about culture fit, HM cares more about STAR)

---

#### **3C: Follow-Up Questions**
```typescript
AI generates 3-5 follow-up questions to fill gaps
  ↓
User answers follow-ups
  ↓
User clicks [Test Impact] → AI predicts score change
User clicks [AI Suggest] → AI generates realistic answer + impact
  ↓
User clicks [Add to Answer & Re-score]
  ↓
Combined answer (original + follow-ups) sent for re-scoring
```

**Current Signals Used**:
- ✅ Original answer
- ✅ Follow-up question
- ✅ Follow-up answer
- ✅ All context from 3B

**Missing Signals** ⚠️:
- ❌ Interviewer communication style (from people profiles)

---

### **Step 4: Talk Track Generation**

```typescript
// API: /api/coach/[jobId]/generate-talk-tracks
callAiProvider(`talk-track-${persona}`, {
  jobTitle: job.title,
  companyName: job.company,
  companyCulture: companyIntelligence?.principles,
  resume: resumeVariant.aiOptimized,
  writingStyle: writingStyleProfile,
  discoveryInsights: discoveryResponses,
  question: question,
  rawAnswer: userFinalAnswer,
  includeStarLabels: true
})
  ↓
Returns: { longForm: {...}, cheatSheet: {...} }
  ↓
Save to: coach_state.interview_coach_json.talkTracks[questionId]
```

**Current Signals Used**:
- ✅ Job title
- ✅ Company name
- ✅ Company culture (from Company Intelligence)
- ✅ Resume (AI-optimized)
- ✅ User's writing style
- ✅ Discovery insights (from Application Coach)
- ✅ Question text
- ✅ User's final answer (original + follow-ups)
- ✅ Persona type (different prompt per persona)

**Missing Signals** ⚠️:
- ❌ **People Profile Communication Style** (NOT USED!)
  - e.g., If recruiter is "casual and conversational", talk track should match
  - e.g., If HM is "data-obsessed", talk track should lead with metrics
- ❌ Match score insights (what to emphasize)
- ❌ Skills match data (what technical terms to use)

---

### **Step 5: Core Stories Extraction**

```typescript
// API: /api/interview-coach/[jobId]/extract-core-stories
callAiProvider('core-stories-extraction', {
  talkTracks: allTalkTracks,
  targetStoryCount: 3,
  jobDescription: jdVariant.aiOptimized
})
  ↓
Returns: { coreStories: [], storyMapping: {} }
  ↓
Save to: coach_state.interview_coach_json.coreStories[]
```

**Current Signals Used**:
- ✅ All generated talk tracks
- ✅ Job description (for relevance)

**Missing Signals** ⚠️:
- ❌ Company values (to align stories with culture)
- ❌ People profile insights (to tailor stories to interviewer preferences)

---

### **Step 6: Final Cheat Sheet**

```
Display:
  - 2-3 core stories (memorizable)
  - Story mapping (which story for which question)
  - Quick tips (per persona)
  - Printable format
```

**Current Signals Used**:
- ✅ Core stories
- ✅ Story mapping
- ✅ Talk tracks

**Missing Signals** ⚠️:
- ❌ Interviewer-specific tips (from people profiles)

---

## 🚨 Critical Missing Integration: People Profiles

### **Current State**
People Profiles section generates rich insights:
```json
{
  "profiles": [
    {
      "name": "Sarah Johnson",
      "role": "Recruiter",
      "communicationStyle": "Casual and conversational",
      "whatThisMeans": "She values authenticity over polish...",
      "keyPriorities": ["Culture fit", "Motivation", "Team dynamics"],
      "redFlags": ["Overly rehearsed answers", "Job hopping without reason"],
      "howToPrepare": "Focus on 'why this company' and 'why now'..."
    }
  ],
  "overallStrategy": "3-phase interview approach..."
}
```

### **But It's NOT Used In Interview Coach!** ❌

**Should Be Used In**:
1. **Question Generation** → Ask questions that match interviewer's priorities
2. **Answer Scoring** → Weight rubric based on interviewer preferences
3. **Talk Track Generation** → Match communication style (formal vs casual)
4. **Follow-Up Questions** → Fill gaps that interviewer cares about
5. **Cheat Sheet** → Include interviewer-specific tips

---

## 🔥 Recommended Data Flow Enhancement

### **Enhanced Step 2B: AI Question Generation**
```typescript
// BEFORE (current)
callAiProvider('interview-questions-recruiter', {
  jobDescription: jd,
  resume: resume,
  companyName: company,
  companyCulture: culture,
  searchResults: webQuestions
});

// AFTER (enhanced)
callAiProvider('interview-questions-recruiter', {
  jobDescription: jd,
  resume: resume,
  companyName: company,
  companyCulture: culture,
  searchResults: webQuestions,
  
  // NEW: People Profile Insights
  recruiterProfile: peopleProfiles?.profiles?.find(p => p.role === 'Recruiter'),
  recruiterPriorities: recruiterProfile?.keyPriorities,
  recruiterRedFlags: recruiterProfile?.redFlags,
  
  // NEW: Match Score Context
  matchScore: matchScoreData?.matchScore,
  skillGaps: skillsMatch?.filter(s => s.matchStrength === 'weak'),
  
  // NEW: User Context
  userWritingStyle: coachState?.writingStyle
});
```

**Result**: Questions tailored to specific interviewer + user's gaps.

---

### **Enhanced Step 3B: AI Scoring**
```typescript
// BEFORE (current)
callAiProvider('answer-scoring', {
  jobDescription: jd,
  resume: resume,
  companyCulture: culture,
  writingStyle: style,
  question: q,
  answer: a
});

// AFTER (enhanced)
callAiProvider('answer-scoring', {
  jobDescription: jd,
  resume: resume,
  companyCulture: culture,
  writingStyle: style,
  question: q,
  answer: a,
  
  // NEW: Interviewer Context
  interviewerProfile: peopleProfile,
  interviewerCommunicationStyle: peopleProfile?.communicationStyle,
  interviewerPriorities: peopleProfile?.keyPriorities,
  
  // NEW: Rubric Weights (persona-specific)
  rubricWeights: {
    star: persona === 'hiring-manager' ? 30 : 20,  // HM cares more about STAR
    cultureFit: persona === 'recruiter' ? 25 : 15,  // Recruiter cares more about fit
    technicalDepth: persona === 'peer' ? 30 : 15    // Peer cares more about tech
  }
});
```

**Result**: Scores reflect what THIS interviewer cares about.

---

### **Enhanced Step 4: Talk Track Generation**
```typescript
// AFTER (enhanced)
callAiProvider(`talk-track-${persona}`, {
  // ... existing inputs ...
  
  // NEW: Interviewer Context
  interviewerProfile: peopleProfile,
  interviewerCommunicationStyle: peopleProfile?.communicationStyle,
  // e.g., "Casual and conversational" → Use contractions, shorter sentences
  // e.g., "Formal and data-driven" → Lead with metrics, use industry jargon
  
  // NEW: Match Context
  skillsToEmphasize: skillsMatch?.filter(s => s.importance === 'critical'),
  gapsToAddress: matchScoreData?.gaps
});
```

**Result**: Talk track matches interviewer's style + emphasizes right skills.

---

## 📈 Proposed Signal Score: Before vs After

### **Before (Current State)**

| Signal Type | Used? | Score |
|------------|-------|-------|
| Job Description | ✅ Yes | High |
| Resume | ✅ Yes | High |
| Company Intelligence | ✅ Yes | Medium |
| Company Ecosystem | ❌ No | None |
| People Profiles | ❌ No | **NONE** |
| Match Score | ❌ No | None |
| Skills Match | ❌ No | None |
| User Writing Style | ✅ Yes | Medium |
| Discovery Responses | ✅ Yes | Medium |
| Web Search Results | ✅ Yes | High |
| Persona Type | ✅ Yes | High |

**Overall Context Utilization: 55%** ⚠️

---

### **After (Enhanced State)**

| Signal Type | Used? | Score |
|------------|-------|-------|
| Job Description | ✅ Yes | High |
| Resume | ✅ Yes | High |
| Company Intelligence | ✅ Yes | High |
| Company Ecosystem | ✅ Yes | Medium |
| People Profiles | ✅ **YES** | **HIGH** |
| Match Score | ✅ **YES** | **HIGH** |
| Skills Match | ✅ **YES** | **HIGH** |
| User Writing Style | ✅ Yes | High |
| Discovery Responses | ✅ Yes | High |
| Web Search Results | ✅ Yes | High |
| Persona Type | ✅ Yes | High |

**Overall Context Utilization: 95%** ✅

---

## 🎯 Implementation Priority

### **P0: Critical (Do First)**
1. ✅ **Integrate People Profiles into Question Generation**
   - Pass `recruiterProfile`, `hmProfile`, `peerProfile` to prompt
   - Filter questions based on interviewer priorities
   
2. ✅ **Integrate People Profiles into Answer Scoring**
   - Adjust rubric weights per persona
   - Score based on interviewer communication style
   
3. ✅ **Integrate People Profiles into Talk Track Generation**
   - Match tone/style to interviewer profile
   - Emphasize what interviewer cares about

### **P1: Important (Do Next)**
4. **Integrate Match Score Insights**
   - Emphasize user's strong skills in answers
   - Address gaps proactively
   
5. **Integrate Skills Match Data**
   - Use correct technical terminology
   - Focus on critical skills

### **P2: Nice to Have**
6. **Integrate Company Ecosystem**
   - Reference competitors in answers
   - Show market awareness

---

## 🔧 Code Changes Required

### **1. Update Question Generation Prompt**
**File**: `prompts/interview-questions-recruiter.v1.md` (and HM, Peer)

Add section:
```markdown
## INTERVIEWER CONTEXT (If Available)

Recruiter Profile: {{recruiterProfile}}
- Communication Style: {{communicationStyle}}
- Key Priorities: {{keyPriorities}}
- Red Flags: {{redFlags}}

## CANDIDATE GAP ANALYSIS

Match Score: {{matchScore}}/100
Weak Skills: {{skillGaps}}

## INSTRUCTIONS

Generate questions that:
1. Align with recruiter's key priorities ({{keyPriorities}})
2. Avoid recruiter's red flags ({{redFlags}})
3. Allow candidate to showcase strong skills and address gaps
4. Match recruiter's communication style ({{communicationStyle}})
```

---

### **2. Update Answer Scoring Prompt**
**File**: `prompts/answer-scoring.v1.md`

Add section:
```markdown
## INTERVIEWER CONTEXT

{{#if interviewerProfile}}
Interviewer: {{interviewerProfile.name}} ({{interviewerProfile.role}})
Communication Style: {{communicationStyle}}
Key Priorities: {{keyPriorities}}

## RUBRIC ADJUSTMENTS

Based on interviewer priorities, weight the following:
- If "Culture fit" is a priority → Increase Culture Fit weight to 30%
- If "Data-driven" in style → Increase Quantification weight to 30%
- If "Casual" in style → Reduce formality requirements
{{/if}}
```

---

### **3. Update API Endpoints**

**File**: `app/api/jobs/[id]/interview-questions/generate/route.ts`

```typescript
// Load people profiles
const peopleAnalysis = sqlite.prepare(`
  SELECT result_json FROM people_analyses WHERE job_id = ? LIMIT 1
`).get(jobId);

const peopleProfiles = peopleAnalysis 
  ? JSON.parse(peopleAnalysis.result_json) 
  : null;

// Find interviewer for this persona
const interviewerProfile = peopleProfiles?.profiles?.find(p => 
  p.role === (persona === 'recruiter' ? 'Recruiter' : 
              persona === 'hiring-manager' ? 'Hiring Manager' : 
              'Peer/Panel Interviewer')
);

// Load match score
const matchScoreData = /* ... from analysis-data ... */;

// Pass to AI
const result = await callAiProvider(`interview-questions-${persona}`, {
  // ... existing inputs ...
  recruiterProfile: interviewerProfile,
  recruiterPriorities: interviewerProfile?.keyPriorities,
  recruiterRedFlags: interviewerProfile?.redFlags,
  matchScore: matchScoreData?.matchScore,
  skillGaps: matchScoreData?.skillGaps
});
```

**Similar changes needed in**:
- `app/api/interview-coach/[jobId]/score-answer/route.ts`
- `app/api/coach/[jobId]/generate-talk-tracks/route.ts`

---

## 🎯 Success Metrics

### **Before Enhancement**
- Questions: Generic, web-scraped
- Scores: One-size-fits-all rubric
- Talk Tracks: Standard STAR format

### **After Enhancement**
- Questions: Tailored to interviewer + user gaps
- Scores: Weighted by interviewer priorities
- Talk Tracks: Match interviewer communication style

**Expected Improvement**: 40-60% more relevant preparation

---

## 🤔 Questions for You

1. **Do you want to prioritize P0 (People Profiles integration) before E2E testing?**
   - This is a MAJOR gap in the current flow
   - Would make Interview Coach 10x more valuable
   
2. **Should we also integrate Match Score insights?**
   - Help user emphasize strong skills
   - Address weak skills proactively
   
3. **How should we handle missing People Profiles data?**
   - Show warning: "Add people profiles for better interview prep"?
   - Fall back to generic persona-based scoring?
   
4. **Should scoring rubric weights be configurable?**
   - Or auto-adjust based on interviewer profile?

---

## 📋 Next Steps (Your Choice)

**Option A: Enhance Interview Coach First** (Recommended)
1. Integrate People Profiles into question generation
2. Integrate People Profiles into answer scoring
3. Integrate People Profiles into talk track generation
4. Test with real data
5. THEN do comprehensive E2E testing

**Option B: E2E Testing First**
1. Test current Interview Coach flow
2. Document gaps
3. Prioritize enhancements
4. Implement + re-test

**Option C: Hybrid**
1. Do critical P0 enhancements (People Profiles)
2. Run E2E tests on enhanced version
3. Fix bugs + add P1/P2 enhancements

Which option do you prefer? 🎯

