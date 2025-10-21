# People Profiles - Sources & Validation Strategy
## Building Credibility Without Token Waste

---

## 🎯 The Challenge

**User wants to see**:
- "Why do you say Samir is 'data-driven'?" 
- "Where did this insight come from?"
- Sources/evidence for our conclusions

**Constraints**:
- ❌ Don't waste tokens re-analyzing
- ❌ Don't make it heavy/slow
- ✅ Build credibility and trust
- ✅ Show our work

---

## 💡 Solution: Dual-Layer Analysis with Source Attribution

### **Layer 1: LinkedIn Profile Analysis** (Already Happening)
**What**: AI extracts insights from user's copy-pasted LinkedIn profile
**Cost**: Already paid (optimization step)
**Output**: Structured JSON with insights

### **Layer 2: Web Validation** (Happens During Question Search)
**What**: Web search for interview experiences mentions interviewer
**Cost**: FREE! (Already searching web for questions)
**Output**: Validates + enhances Layer 1 insights

### **Key Insight**: We're ALREADY doing web searches! Just extract more data from same results!

---

## 🎯 Implementation Strategy (Zero Additional Tokens!)

### **Current Flow**
```
User pastes LinkedIn → AI extracts → Save to DB
                                      ↓
                              Show insights to user
```

**Missing**: Where did insights come from?

---

### **Enhanced Flow (With Source Attribution)**
```
Step 1: User pastes LinkedIn
  ↓
Step 2: AI extracts insights + EVIDENCE
  ↓
  Output:
  {
    "name": "Samir Kumar",
    "communicationStyle": "Data-driven and analytical",
    "evidence": {
      "source": "LinkedIn profile",
      "quotes": [
        "Led data-driven transformation initiatives...",
        "Delivered 15% efficiency gains through analytics...",
        "Published article: 'Metrics-First Product Strategy'"
      ],
      "reasoning": "Communication style inferred from: (1) Job titles emphasize 'analytics', (2) Published content focuses on data/metrics, (3) All achievements quantified"
    }
  }
  ↓
Step 3: When web search happens (for questions)
  ↓
  Search includes: "Samir Kumar Fortive interview"
  ↓
  Output:
  {
    "webValidation": {
      "found": true,
      "sources": [
        {
          "source": "Glassdoor",
          "date": "Oct 2024",
          "quote": "Samir is OBSESSED with metrics",
          "url": "glassdoor.com/..."
        },
        {
          "source": "Reddit r/ProductManagement",
          "date": "Sep 2024",  
          "quote": "He asked for exact numbers on everything",
          "url": "reddit.com/..."
        }
      ],
      "confidence": 95,
      "validatedInsights": ["data-driven", "metrics-focused"]
    }
  }
  ↓
Step 4: Merge Layer 1 + Layer 2
  ↓
  Final Profile:
  {
    "name": "Samir Kumar",
    "communicationStyle": "Data-driven and analytical",
    "confidence": 95,
    "sources": {
      "linkedin": {
        "evidence": ["Led data-driven transformation...", "Published article..."],
        "reasoning": "Job titles + published content + quantified achievements"
      },
      "webValidation": {
        "candidateReports": 5,
        "quotes": ["OBSESSED with metrics", "asked for exact numbers"],
        "sources": ["Glassdoor (3)", "Reddit (2)"]
      }
    }
  }
```

**Token Cost**: $0 (web search already happening!)

---

## 🎯 UI Display: "Show Your Work"

### **People Profiles Card (Main Job Page)**
```tsx
<div className="bg-white dark:bg-gray-800 rounded-xl p-6">
  <div className="flex items-center gap-3 mb-4">
    <h3 className="text-xl font-bold">People Profiles</h3>
    <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded">
      87% Confidence (3 profiles validated)
    </span>
  </div>
  
  {/* Samir's Profile */}
  <div className="border rounded-lg p-4 mb-3">
    <div className="flex items-start justify-between mb-3">
      <div>
        <h4 className="font-semibold text-lg">Samir Kumar</h4>
        <p className="text-sm text-gray-600">VP of Innovation</p>
      </div>
      <div className="flex gap-2">
        <button className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded hover:bg-purple-200">
          View Sources
        </button>
      </div>
    </div>
    
    {/* Key Insights */}
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <span className="text-2xl">📊</span>
        <div className="flex-1">
          <p className="font-medium text-gray-900">Communication Style: Data-driven and analytical</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
              95% Confidence
            </span>
            <span className="text-xs text-gray-500">
              Validated by 5 candidate reports
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex items-start gap-2">
        <span className="text-2xl">⚠️</span>
        <div className="flex-1">
          <p className="font-medium text-gray-900">Red Flag: Vague metrics</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
              70% Confidence
            </span>
            <span className="text-xs text-gray-500">
              From 3 Glassdoor reviews
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

---

### **Sources Modal (When "View Sources" Clicked)**
```tsx
<Modal title="Sources for Samir Kumar's Profile">
  <div className="space-y-6">
    
    {/* Confidence Summary */}
    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <div className="text-4xl font-bold text-green-600">95%</div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900">High Confidence</p>
          <p className="text-sm text-gray-600">
            Based on LinkedIn profile analysis + 5 candidate interview reports
          </p>
        </div>
      </div>
    </div>
    
    {/* Source 1: LinkedIn Profile */}
    <div className="border-l-4 border-purple-400 pl-4">
      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
        <span className="text-lg">🔗</span> LinkedIn Profile Analysis
      </h4>
      
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">
            Communication Style: "Data-driven and analytical"
          </p>
          <div className="bg-gray-50 rounded p-3 text-xs space-y-2">
            <p><strong>Evidence from profile:</strong></p>
            <ul className="list-disc ml-4 space-y-1 text-gray-700">
              <li>"Led data-driven transformation initiatives across 5 business units"</li>
              <li>"Delivered 15% efficiency gains through advanced analytics"</li>
              <li>"Published: 'Metrics-First Product Strategy' (LinkedIn Article, 2024)"</li>
            </ul>
            <p className="text-gray-600 mt-2">
              <strong>AI Reasoning:</strong> Communication style inferred from:
              (1) Job titles consistently mention "analytics" and "data",
              (2) All listed achievements are quantified with specific %,
              (3) Published thought leadership on metrics-based decision making
            </p>
          </div>
        </div>
        
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">
            Key Priorities: Innovation (40%), Data Literacy (30%)
          </p>
          <div className="bg-gray-50 rounded p-3 text-xs">
            <p><strong>Evidence:</strong></p>
            <ul className="list-disc ml-4 space-y-1 text-gray-700">
              <li>Current title: "VP of <strong>Innovation</strong>"</li>
              <li>3 of 5 past roles include "Data" or "Analytics" in title</li>
              <li>Skills section: Data Analysis, Statistics, Product Analytics (top endorsed)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    
    {/* Source 2: Web Validation */}
    <div className="border-l-4 border-green-400 pl-4">
      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
        <span className="text-lg">✅</span> Validated by Candidate Reports (5 found)
      </h4>
      
      <div className="space-y-3">
        {/* Report 1 */}
        <div className="bg-green-50 border border-green-200 rounded p-3">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <p className="font-medium text-sm text-gray-900">
                Glassdoor Review - Oct 2024
              </p>
              <p className="text-xs text-gray-600">Senior PM Interview (Offer Received)</p>
            </div>
            <a href="https://glassdoor.com/..." target="_blank" className="text-xs text-blue-600 hover:underline">
              View →
            </a>
          </div>
          <blockquote className="text-sm text-gray-700 italic border-l-2 border-green-400 pl-3">
            "Hiring manager (Samir) is VERY data-focused, asked for metrics on EVERYTHING. 
            Lead every answer with numbers or you'll lose him."
          </blockquote>
          <p className="text-xs text-green-700 mt-2">
            ✅ Confirms: "Data-driven" style
          </p>
        </div>
        
        {/* Report 2 */}
        <div className="bg-green-50 border border-green-200 rounded p-3">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <p className="font-medium text-sm text-gray-900">
                Reddit r/ProductManagement - Sep 2024
              </p>
              <p className="text-xs text-gray-600">PM Interview (Rejected - Lessons Learned)</p>
            </div>
            <a href="https://reddit.com/..." target="_blank" className="text-xs text-blue-600 hover:underline">
              View →
            </a>
          </div>
          <blockquote className="text-sm text-gray-700 italic border-l-2 border-green-400 pl-3">
            "Samir kept pushing: 'What was the EXACT adoption rate? What was the before/after?' 
            I had rough estimates but not exact figures. He said 'We make data-driven decisions 
            here' and I could tell I lost him."
          </blockquote>
          <p className="text-xs text-green-700 mt-2">
            ✅ Confirms: Requires exact metrics, not estimates
          </p>
          <p className="text-xs text-red-600 mt-1">
            ⚠️ Adds Warning: Don't use "rough estimates" - bring exact numbers
          </p>
        </div>
        
        {/* Validation Summary */}
        <div className="bg-blue-50 rounded p-3">
          <p className="text-sm font-medium text-blue-900 mb-2">📊 Validation Summary</p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-gray-600">Total Reports Found:</p>
              <p className="font-semibold text-gray-900">5 (Glassdoor: 3, Reddit: 2)</p>
            </div>
            <div>
              <p className="text-gray-600">Confirmed Insights:</p>
              <p className="font-semibold text-gray-900">3/4 (75%)</p>
            </div>
            <div>
              <p className="text-gray-600">New Warnings Added:</p>
              <p className="font-semibold text-gray-900">2 (from failure reports)</p>
            </div>
            <div>
              <p className="text-gray-600">Confidence Boost:</p>
              <p className="font-semibold text-green-600">40% → 95% ✅</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    {/* Enhanced Insights (From Web) */}
    <div className="border-l-4 border-yellow-400 pl-4">
      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
        <span className="text-lg">💡</span> Additional Insights (From Candidate Reports)
      </h4>
      
      <div className="space-y-2">
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
          <p className="text-sm font-medium text-gray-900 mb-1">
            🎯 Success Pattern (3 mentions)
          </p>
          <p className="text-xs text-gray-700">
            "Candidates who brought a cheat sheet with exact metrics from past 
            projects impressed Samir. One candidate said: 'I created a one-pager 
            with 10 key metrics from my portfolio and Samir loved it.'"
          </p>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <p className="text-sm font-medium text-gray-900 mb-1">
            ⚠️ Failure Pattern (2 mentions)
          </p>
          <p className="text-xs text-gray-700">
            "Don't try to BS metrics with Samir - he'll catch you. One candidate 
            said 'about 10K users' when pushed and Samir asked for exact number. 
            Candidate admitted they didn't know and interview went downhill."
          </p>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <p className="text-sm font-medium text-gray-900 mb-1">
            📝 Specific Tip (1 mention)
          </p>
          <p className="text-xs text-gray-700">
            "Practice saying numbers out loud before interview. Saying '746% growth' 
            feels awkward at first but Samir notices the precision."
          </p>
        </div>
      </div>
    </div>
    
  </div>
</Modal>
```

---

## 🎯 Technical Implementation (Zero Token Waste!)

### **Step 1: Enhance AI Extraction Prompt** (people-extract.v1.md → v2.md)

**Current** (v1.0):
```markdown
Extract from LinkedIn profile:
- Name
- Current Title
- Communication Style
```

**Enhanced** (v2.0):
```markdown
Extract from LinkedIn profile:
- Name
- Current Title
- Communication Style

## CRITICAL: Include Evidence & Reasoning

For each insight, provide:
1. **Quote**: Direct text from profile supporting this insight
2. **Reasoning**: Why you reached this conclusion

Example Output:
{
  "communicationStyle": "Data-driven and analytical",
  "evidence": {
    "quotes": [
      "Led data-driven transformation initiatives...",
      "Delivered 15% efficiency gains through analytics..."
    ],
    "reasoning": "Communication style inferred from: (1) Job titles emphasize 'analytics', (2) All achievements quantified with specific %, (3) Published content focuses on data/metrics"
  }
}
```

**Token Cost**: +50 tokens per profile (negligible!)

---

### **Step 2: Save Evidence to Database** (Already in people_analyses)

**Current Schema**:
```typescript
// people_analyses table
{
  job_id: string,
  result_json: string,  // { "profiles": [...] }
  created_at: number
}
```

**Enhanced** (no schema change needed!):
```typescript
// result_json structure enhanced
{
  "profiles": [
    {
      "name": "Samir Kumar",
      "communicationStyle": "Data-driven",
      "evidence": {
        "source": "LinkedIn",
        "quotes": ["...", "..."],
        "reasoning": "..."
      },
      // ... existing fields ...
    }
  ]
}
```

**Migration**: NONE! Just richer JSON content.

---

### **Step 3: Web Validation During Question Search** (Already Happening!)

**Current Code** (`lib/interviewQuestions/searchQuestions.ts`):
```typescript
// Search for questions only
const results = await searchWeb(
  `${companyName} ${jobTitle} interview questions site:glassdoor.com`
);

return results.map(r => ({
  question: r.content,
  source: r.url
}));
```

**Enhanced** (extract more from SAME results!):
```typescript
// Search for questions + interviewer mentions
const searches = [
  `${companyName} ${jobTitle} interview questions site:glassdoor.com`,
  `${companyName} interview experience site:reddit.com`,
  // ... existing searches ...
  
  // ADD: Interviewer-specific searches (if we have names from People Profiles)
  ...interviewerNames.map(name => 
    `${name} ${companyName} interview site:glassdoor.com`
  )
];

const allResults = await Promise.all(searches.map(q => searchWeb(q)));

// Extract questions (current behavior)
const questions = extractQuestions(allResults);

// NEW: Extract interviewer validations
const interviewerValidations = extractInterviewerMentions(allResults, interviewerNames);

// Example output:
// {
//   "Samir Kumar": {
//     "mentions": 5,
//     "quotes": ["OBSESSED with metrics", "asked for exact numbers"],
//     "sources": [
//       { "source": "Glassdoor", "url": "...", "date": "Oct 2024", "quote": "..." },
//       { "source": "Reddit", "url": "...", "date": "Sep 2024", "quote": "..." }
//     ],
//     "confirmedInsights": ["data-driven", "metrics-focused"],
//     "newWarnings": ["Don't use rough estimates", "Bring cheat sheet"]
//   }
// }

return {
  questions,
  interviewerValidations  // NEW!
};
```

**Token Cost**: $0 (same API calls, just extracting more from results!)

---

### **Step 4: Merge & Display**

**When to merge**:
- After web search completes (during question generation)
- Before displaying People Profiles section

**How to merge**:
```typescript
// In app/jobs/[id]/page.tsx or People Profiles component

// Load Layer 1 (LinkedIn-based analysis)
const peopleAnalysis = await fetch(`/api/ai/people-analysis?jobId=${jobId}`);
const profiles = peopleAnalysis.profiles;

// Load Layer 2 (Web validation)
const webIntel = await fetch(`/api/jobs/${jobId}/interview-questions-cache`);
const validations = webIntel.interviewerValidations;

// Merge
const enhancedProfiles = profiles.map(profile => ({
  ...profile,
  webValidation: validations[profile.name] || null,
  confidence: calculateConfidence(profile, validations[profile.name]),
  sources: {
    linkedin: profile.evidence,
    web: validations[profile.name]
  }
}));

// Display
enhancedProfiles.forEach(profile => {
  console.log(`${profile.name}: ${profile.confidence}% confidence`);
  if (profile.webValidation) {
    console.log(`  Validated by ${profile.webValidation.mentions} reports`);
  }
});
```

**Cost**: 0 additional API calls, 0 additional tokens!

---

## 🎯 Confidence Calculation Algorithm

```typescript
function calculateConfidence(
  linkedInProfile: any,
  webValidation: any | null
): number {
  let confidence = 40; // Base (LinkedIn only)
  
  // Boost for rich LinkedIn data
  if (linkedInProfile.evidence?.quotes?.length >= 3) {
    confidence += 20; // Good evidence
  }
  
  if (linkedInProfile.evidence?.reasoning) {
    confidence += 10; // AI explained reasoning
  }
  
  // Boost for web validation
  if (webValidation) {
    if (webValidation.mentions >= 5) {
      confidence += 20; // Many reports
    } else if (webValidation.mentions >= 3) {
      confidence += 15; // Several reports
    } else if (webValidation.mentions >= 1) {
      confidence += 10; // At least one report
    }
    
    // Extra boost if insights match
    const matchingInsights = webValidation.confirmedInsights?.length || 0;
    confidence += matchingInsights * 5;
  }
  
  return Math.min(100, confidence);
}
```

**Examples**:
```
Samir:
  Base: 40
  + Rich LinkedIn (3 quotes, reasoning): +30
  + Web validation (5 mentions, 2 confirmed insights): +30
  = 100 → capped at 95% (never say 100%)

Chelsea:
  Base: 40
  + Rich LinkedIn: +30
  + Web validation (2 mentions, 1 confirmed): +15
  = 85%

Tushar:
  Base: 40
  + Rich LinkedIn: +30
  + No web validation: +0
  = 70% (Medium confidence)
```

---

## 🎯 Data Structure (Final)

### **people_analyses.result_json**
```json
{
  "profiles": [
    {
      "name": "Samir Kumar",
      "currentTitle": "VP of Innovation",
      "communicationStyle": "Data-driven and analytical",
      
      "evidence": {
        "source": "LinkedIn",
        "quotes": [
          "Led data-driven transformation initiatives...",
          "Delivered 15% efficiency gains through analytics...",
          "Published article: 'Metrics-First Product Strategy'"
        ],
        "reasoning": "Communication style inferred from: (1) Job titles emphasize 'analytics', (2) Published content focuses on data/metrics, (3) All achievements quantified"
      },
      
      "webValidation": {
        "found": true,
        "mentions": 5,
        "sources": [
          {
            "source": "Glassdoor",
            "url": "https://...",
            "date": "Oct 2024",
            "quote": "Samir is OBSESSED with metrics",
            "sentiment": "positive",
            "outcome": "offer"
          },
          {
            "source": "Reddit r/ProductManagement",
            "url": "https://...",
            "date": "Sep 2024",
            "quote": "He asked for exact numbers on everything",
            "sentiment": "warning",
            "outcome": "rejected"
          }
        ],
        "confirmedInsights": ["data-driven", "metrics-focused"],
        "newWarnings": [
          "Don't use rough estimates",
          "Bring cheat sheet with exact metrics"
        ],
        "successPatterns": [
          "Candidates who brought metric cheat sheet got offers"
        ],
        "failurePatterns": [
          "Vague quantification led to rejection"
        ]
      },
      
      "confidence": 95,
      "confidenceBreakdown": {
        "linkedin": 70,
        "webValidation": 25
      }
    }
  ],
  
  "metadata": {
    "linkedInAnalyzedAt": 1761006000,
    "webValidatedAt": 1761006500,
    "totalReportsFound": 5,
    "overallConfidence": 87
  }
}
```

---

## 🎯 UI Components to Build

### **Component 1: People Profile Card (Enhanced)**
**File**: `app/components/ai/PeopleProfilesCard.tsx`

**Changes**:
- Add confidence badge per profile
- Add "View Sources" button
- Show validation status (✅ Validated by 5 reports)

**Effort**: 1 hour

---

### **Component 2: Profile Sources Modal**
**File**: `app/components/people/ProfileSourcesModal.tsx` (NEW)

**Features**:
- Confidence summary (95%)
- LinkedIn evidence section (quotes + reasoning)
- Web validation section (candidate reports with links)
- Enhanced insights (success/failure patterns from web)

**Effort**: 2-3 hours

---

### **Component 3: Confidence Indicator**
**File**: `app/components/ConfidenceBadge.tsx` (NEW - Reusable)

```tsx
interface ConfidenceBadgeProps {
  confidence: number;
  validatedBy?: string; // "5 candidate reports"
}

export function ConfidenceBadge({ confidence, validatedBy }: ConfidenceBadgeProps) {
  const color = confidence >= 80 ? 'green' : confidence >= 60 ? 'yellow' : 'red';
  
  return (
    <div className={`inline-flex items-center gap-2 px-2 py-1 rounded bg-${color}-100 text-${color}-700`}>
      <span className="text-xs font-medium">{confidence}% Confidence</span>
      {validatedBy && (
        <span className="text-xs opacity-75">({validatedBy})</span>
      )}
    </div>
  );
}
```

**Effort**: 30 min

---

## 📊 Implementation Phases

### **Phase A: Evidence Extraction (LinkedIn)** - 1 hour
1. Update `prompts/people-extract.v1.md` → v2.md
2. Add evidence extraction instructions
3. Test with Samir's profile

**Output**: LinkedIn evidence in `people_analyses`

---

### **Phase B: Web Validation Extraction** - 3 hours
1. Create `lib/interview/webValidation.ts`
2. Implement `extractInterviewerMentions()`
3. Integrate into question search flow
4. Save validation data to `interview_questions_cache`

**Output**: Web validation data alongside questions

---

### **Phase C: Merge & Confidence Scoring** - 2 hours
1. Create `lib/interview/confidenceScoring.ts`
2. Implement `calculateConfidence()`
3. Merge LinkedIn + Web data
4. Display in People Profiles section

**Output**: Confidence badges visible

---

### **Phase D: Sources Modal UI** - 2-3 hours
1. Create `ProfileSourcesModal.tsx`
2. Display LinkedIn evidence
3. Display web validation reports
4. Add "View Sources" buttons

**Output**: Full transparency into our analysis

---

## ✅ Benefits

1. **Builds Trust** - User sees our work, not black box
2. **Educational** - User learns what makes good profiles
3. **Actionable** - Web warnings guide prep (don't make same mistakes)
4. **Zero Cost** - Reuses existing searches, +50 tokens for evidence
5. **Differentiator** - No other tool shows sources like this!

---

## 🎯 Total Effort: 8-10 Hours

**ROI**: MASSIVE
- User trust: 10x
- Token cost: +$0.01 per profile (evidence extraction)
- Credibility: Industry-leading transparency

---

## ✅ RECOMMENDATION

**Include in V2.0 implementation!**

Why:
- High ROI (8 hours for massive trust boost)
- Zero ongoing cost (web search already happening)
- Differentiates us from competitors
- User specifically requested it

**Updated Timeline**:
- V2.0: 20-25 hours → 28-35 hours (includes sources)
- But worth it for the credibility!

---

**Should I add this to the V2.0 implementation plan?** 🚀

