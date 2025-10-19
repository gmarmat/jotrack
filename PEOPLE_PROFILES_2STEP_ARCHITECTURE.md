# People Profiles: 2-Step Architecture

**Date**: October 19, 2025  
**Status**: ✅ **IMMEDIATE BUG FIXED** | 🎯 **ARCHITECTURE PLAN** (for next session)

---

## 🐛 **IMMEDIATE BUG - FIXED** (3 min)

### **Root Cause**
`buildPromptVariables()` had **NO case for 'people'**:
- Fell through to `default`
- Used wrong variables (jobTitle, jdText, resumeText)
- Claude returned MATCH SCORE format instead of PEOPLE format

### **Fix Applied**
1. **`lib/coach/aiProvider.ts`** (lines 721-729): Added `case 'people'`
2. **`prompts/people.v1.md`** (lines 6-12): Updated to expect `peopleProfiles` text

### **Test Now**
Click "Analyze People Profiles" → Should work! ✅

---

## 🎯 **YOUR EXCELLENT ARCHITECTURE PROPOSAL**

### **Current Flow** (Suboptimal)
```
User pastes LinkedIn text
         ↓
Save raw paste to DB
         ↓
Click "Analyze" → Send messy text to AI
         ↓
AI tries to extract AND analyze (too much in one step)
         ↓
Sometimes fails due to formatting
```

### **Proposed Flow** (Smart!)
```
User pastes LinkedIn text (messy)
         ↓
STEP 1: Extract Clean Fields
  • Use AI to clean/structure data
  • NO summarization
  • Extract: Name, Title, About, Experience, Education, Skills, etc.
  • Save as "Raw Version" (structured JSON)
         ↓
Display raw profiles on page
         ↓
STEP 2: AI Analysis for Insights
  • Use cleaned data from Step 1
  • Extract: Communication style, expertise, interview tips
  • Save as "Analyzed Version"
         ↓
Display detailed profile cards
```

---

## 📋 **STEP 1: EXTRACTION FIELDS** (No Summarization)

### **What to Extract from LinkedIn Paste**

```typescript
interface RawProfileExtraction {
  // Basic Info
  name: string;
  currentTitle: string;
  currentCompany: string;
  location?: string;
  
  // About Section
  aboutMe: string; // Full text, no summary
  
  // Work Experience
  workExperiences: Array<{
    title: string;
    company: string;
    duration: string; // e.g., "Jan 2020 - Present (4 years)"
    description: string; // Full text, no summary
  }>;
  
  // Education
  education: Array<{
    school: string;
    degree: string;
    fieldOfStudy?: string;
    year?: string;
  }>;
  
  // Skills
  skills: string[]; // As listed, no filtering
  
  // Following (Companies/People)
  following?: {
    companies?: string[];
    people?: string[];
  };
  
  // Recommendations
  recommendations?: Array<{
    from: string;
    text: string;
  }>;
  
  // Metadata
  linkedinUrl?: string;
  extractedAt: number;
}
```

---

## 🔧 **IMPLEMENTATION PLAN** (For Next Session)

### **Phase 1: Create Extraction Endpoint** (10 min)

**New File**: `app/api/jobs/[id]/people/extract/route.ts`

```typescript
export async function POST(request: NextRequest) {
  const { personId, pastedText } = await request.json();
  
  // Call AI with extraction-only prompt
  const extracted = await callAiProvider('people-extract', {
    pastedText,
    instructions: 'Extract all fields without summarization'
  });
  
  // Save to peopleProfiles.summary as JSON
  await updatePerson(personId, { 
    summary: JSON.stringify(extracted),
    rawText: pastedText 
  });
  
  return NextResponse.json({ success: true, extracted });
}
```

**Estimated Cost**: $0.001 per profile (10x cheaper than full analysis)

---

### **Phase 2: Create Extraction Prompt** (15 min)

**New File**: `prompts/people-extract.v1.md`

```markdown
# LinkedIn Profile Data Extraction v1.0

## Your Task
Extract structured data from a pasted LinkedIn profile. DO NOT summarize anything. 
Return all text exactly as provided.

## Input Data
**Pasted LinkedIn Text**: {{pastedText}}

## Required Output Format
Return JSON matching this schema:

```json
{
  "name": "string",
  "currentTitle": "string",
  "currentCompany": "string",
  "location": "string or null",
  "aboutMe": "full text, no summary",
  "workExperiences": [
    {
      "title": "string",
      "company": "string",
      "duration": "string",
      "description": "full text, no summary"
    }
  ],
  "education": [
    {
      "school": "string",
      "degree": "string",
      "fieldOfStudy": "string or null",
      "year": "string or null"
    }
  ],
  "skills": ["skill1", "skill2", ...],
  "following": {
    "companies": ["company1", "company2", ...],
    "people": ["person1", "person2", ...]
  },
  "recommendations": [
    {
      "from": "string",
      "text": "full text"
    }
  ]
}
```

## Guidelines
1. Extract ALL data - do not filter or summarize
2. If a field is missing, use null or []
3. Keep all original text verbatim
4. Parse dates/durations as-is (don't calculate)
5. Return valid JSON only
```

---

### **Phase 3: Update ManagePeopleModal** (10 min)

**Flow Change**:
```typescript
async function handleSave() {
  // 1. Save person to DB (basic fields)
  const personId = await savePersonAndLink(...);
  
  // 2. If manualText provided, extract immediately
  if (person.manualText) {
    setExtracting(true);
    const extracted = await fetch('/api/jobs/${jobId}/people/extract', {
      method: 'POST',
      body: JSON.stringify({ 
        personId, 
        pastedText: person.manualText 
      })
    });
    setExtracting(false);
    
    // Show success: "Profile extracted! ✅"
  }
  
  // 3. Refresh people list
  onSave();
}
```

**UI Update**:
```tsx
{extracting && (
  <div className="text-sm text-cyan-600">
    <Loader className="animate-spin inline" /> 
    Extracting profile data...
  </div>
)}
```

---

### **Phase 4: Update PeopleProfilesCard** (15 min)

**Show Extracted Data Before AI Analysis**:

```tsx
{/* Raw Profiles (after extraction) */}
{rawPeople.length > 0 && !aiAnalyzed && (
  <div className="space-y-3">
    {rawPeople.map(person => {
      const extracted = person.summary ? JSON.parse(person.summary) : null;
      
      return (
        <div className="p-4 border rounded-lg">
          <h4>{extracted?.name || person.name}</h4>
          <p className="text-sm">{extracted?.currentTitle}</p>
          <p className="text-xs text-gray-500">
            {extracted?.workExperiences?.length || 0} roles • 
            {extracted?.education?.length || 0} degrees • 
            {extracted?.skills?.length || 0} skills
          </p>
          
          {/* Expand to see details */}
          <button onClick={() => setExpanded(person.id)}>
            View extracted data
          </button>
        </div>
      );
    })}
    
    <p className="text-xs">
      ✅ Profiles extracted! Click "Analyze" for insights.
    </p>
  </div>
)}
```

---

### **Phase 5: Update Analysis Endpoint** (10 min)

**`app/api/ai/people-analysis/route.ts`**:

```typescript
// Build context from EXTRACTED data, not raw paste
peopleContext = people.map((p, idx) => {
  const extracted = p.summary ? JSON.parse(p.summary) : null;
  
  if (!extracted) {
    return `Person ${idx + 1}: ${p.name} (No extracted data)`;
  }
  
  return `Person ${idx + 1}:
Name: ${extracted.name}
Title: ${extracted.currentTitle} at ${extracted.currentCompany}
About: ${extracted.aboutMe}

Work Experience:
${extracted.workExperiences.map(exp => 
  `- ${exp.title} at ${exp.company} (${exp.duration})\n  ${exp.description}`
).join('\n')}

Education:
${extracted.education.map(edu => 
  `- ${edu.degree} from ${edu.school}`
).join('\n')}

Skills: ${extracted.skills.join(', ')}
---`;
}).join('\n\n');
```

**Result**: Clean, structured input → Better AI analysis

---

## 📊 **BENEFITS**

### **Reliability**
- ✅ 2-step process more robust
- ✅ Extraction handles messy LinkedIn paste
- ✅ Analysis works with clean data

### **Performance**
- ✅ Extraction is cheap ($0.001)
- ✅ Only pay for full analysis when needed
- ✅ Can re-analyze without re-extracting

### **User Experience**
- ✅ Immediate feedback after paste ("Extracting...")
- ✅ See extracted data before analysis
- ✅ Verify extraction is correct
- ✅ Clear progress indication

### **Data Quality**
- ✅ Structured storage (JSON)
- ✅ No information loss
- ✅ Easy to query/search later
- ✅ Can add more fields without breaking

---

## 🎯 **IMPLEMENTATION TIME ESTIMATE**

| Phase | Task | Time | Priority |
|-------|------|------|----------|
| 1 | Extraction endpoint | 10 min | P0 |
| 2 | Extraction prompt | 15 min | P0 |
| 3 | Modal flow update | 10 min | P0 |
| 4 | Display extracted data | 15 min | P1 |
| 5 | Analysis using extracted | 10 min | P0 |
| **Total** | | **60 min** | |

**Watchdog**: 10-15 min per phase

---

## 🔮 **FUTURE ENHANCEMENTS**

### **Phase 2** (Later)
- Store extraction + analysis as separate columns
- Track extraction confidence scores
- Allow manual editing of extracted fields
- Diff detection (profile updated on LinkedIn)

### **Phase 3** (Much Later)
- Auto-fetch from LinkedIn (if/when API available)
- OCR for profile screenshots
- Bulk import (CSV with profile data)

---

## 📝 **DECISION LOG**

### **Why 2 Steps Instead of 1?**
**Pros**:
- Cleaner separation of concerns
- Better error handling
- Cheaper to re-analyze
- Data is reusable

**Cons**:
- Slightly more complex
- Two API calls instead of one

**Decision**: 2 steps - better long-term architecture ✅

### **Why AI for Extraction?**
**Alternatives Considered**:
1. **Regex/Manual Parsing**: Too brittle, LinkedIn format varies
2. **No Extraction**: Send raw paste to analysis - current approach, error-prone
3. **AI Extraction**: Flexible, handles variations, still cheap

**Decision**: AI extraction - best balance ✅

### **Why JSON Storage?**
**Alternatives**:
1. **Separate columns**: Too many columns, not flexible
2. **Plain text**: Hard to query, can't structure
3. **JSON in summary field**: Flexible, easy to extend, queryable

**Decision**: JSON in `summary` field ✅

---

## ✅ **CURRENT STATUS**

### **Completed Today**
- [x] Fixed immediate bug (wrong prompt variables)
- [x] Updated people.v1.md prompt
- [x] Documented 2-step architecture

### **Ready for Next Session**
- [ ] Implement Phase 1: Extraction endpoint
- [ ] Implement Phase 2: Extraction prompt
- [ ] Implement Phase 3: Modal flow
- [ ] Implement Phase 4: Display extracted
- [ ] Implement Phase 5: Analysis update

**Total Time**: ~60 minutes with watchdogs

---

**Test the immediate fix now! Then we'll implement the 2-step flow in the next session.** 🚀

