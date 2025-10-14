# 🤖 AI Analysis Data Requirements Strategy

**Last Updated**: October 14, 2025  
**Version**: 1.0

---

## 📋 **Overview**

This document defines the data requirements for each AI analysis section, ensuring users know what information is needed before running analysis and preventing token waste on incomplete data.

---

## 🎯 **Data Requirements by Section**

### **1. Match Score Analysis**

**Required Data**:
- ✅ **Job Description** (from attachment or manual input)
- ✅ **Resume** (from attachment or manual input)
- ✅ **Job Title** (from job details)
- ✅ **Company Name** (from job details)

**Optional Data**:
- 📋 **Job Notes** (additional context)
- 📋 **Posting URL** (job posting link)

**Validation**:
```typescript
if (!jobDescription || !resume) {
  return {
    canAnalyze: false,
    message: 'Upload both Job Description and Resume to analyze match score',
    missingItems: [
      !jobDescription ? 'Job Description' : null,
      !resume ? 'Resume' : null
    ].filter(Boolean)
  };
}
```

**Location**: `lib/ai/promptDataStrategy.ts` (lines 21-29)

---

### **2. Skills Match Analysis**

**Required Data**:
- ✅ **Job Description** (to extract required skills)
- ✅ **Resume** (to extract candidate skills)

**Optional Data**:
- 📋 **Portfolio** (additional skill evidence)
- 📋 **LinkedIn Profile** (extended profile data)

**Dependencies**:
- 🔗 **Match Score** (optional, for context)

**Validation**:
```typescript
if (!jobDescription || !resume) {
  return {
    canAnalyze: false,
    message: 'Upload JD and Resume to analyze skill match',
    suggestion: 'Go to Attachments → Upload JD and Resume'
  };
}
```

**Location**: `lib/ai/promptDataStrategy.ts` (lines 31-39)

---

### **3. Company Intelligence Analysis**

**Required Data**:
- ✅ **Job Description** (to understand role context)
- ✅ **Company Name** (to search for information)

**Optional Data**:
- 📋 **Company URLs** (website, LinkedIn, news)
- 📋 **Additional Context** (user-provided notes)

**Dependencies**: None

**Validation**:
```typescript
if (!jobDescription) {
  return {
    canAnalyze: false,
    message: 'Job Description required',
    action: 'Upload JD attachment or add in Coach Mode'
  };
}

if (!companyName) {
  return {
    canAnalyze: false,
    message: 'Company name required',
    action: 'Add company name to job details'
  };
}
```

**Location**: `lib/ai/promptDataStrategy.ts` (lines 41-49)
**Implemented in**: `app/components/ai/CompanyIntelligenceCard.tsx` (lines 71-79)

---

### **4. People Profiles Analysis**

**Required Data**:
- ✅ **Job Description** (to understand interview context)

**Optional Data**:
- 📋 **Recruiter URL** (LinkedIn profile)
- 📋 **Peer URLs** (team member profiles)
- 📋 **Skip-level URLs** (manager profiles)

**Dependencies**:
- 🔗 **Company Intelligence** (optional, for context)

**Validation**:
```typescript
if (!jobDescription) {
  return {
    canAnalyze: false,
    message: 'Job Description required for people analysis',
    action: 'Upload JD attachment or add in Coach Mode'
  };
}

// Optional but recommended
if (!recruiterUrl && peerUrls.length === 0) {
  return {
    canAnalyze: true,
    warning: 'Add LinkedIn URLs for better insights',
    quality: 'LIMITED'
  };
}
```

**Location**: `lib/ai/promptDataStrategy.ts` (lines 61-69)
**Implemented in**: `app/components/ai/PeopleProfilesCard.tsx` (lines 121-124)

---

### **5. Company Ecosystem Analysis**

**Required Data**:
- ✅ **Job Description** (to understand industry)
- ✅ **Company Name** (to find competitors)

**Optional Data**:
- 📋 **Company URLs** (for better context)

**Dependencies**:
- 🔗 **Company Intelligence** (recommended)

**Validation**:
```typescript
if (!jobDescription || !companyName) {
  return {
    canAnalyze: false,
    message: 'Job Description and Company Name required',
    missingItems: [
      !jobDescription ? 'JD' : null,
      !companyName ? 'Company' : null
    ].filter(Boolean)
  };
}
```

**Location**: `lib/ai/promptDataStrategy.ts` (lines 51-59)

---

### **6. Match Matrix (50 Signals)**

**Required Data**:
- ✅ **Job Description** (for signal extraction)
- ✅ **Resume** (for candidate assessment)

**Optional Data**:
- 📋 **Cover Letter** (additional evidence)
- 📋 **Portfolio** (for technical roles)

**Dependencies**:
- 🔗 **Match Score** (recommended, for baseline)
- 🔗 **Skills Match** (recommended, for skill signals)

**Validation**:
```typescript
if (!jobDescription || !resume) {
  return {
    canAnalyze: false,
    message: 'Both JD and Resume required for 50-signal analysis',
    estimatedTokens: 10000,
    estimatedCost: '$0.02'
  };
}
```

**Location**: `lib/ai/promptDataStrategy.ts` (lines 71-79)

---

## 🔄 **Data Flow**

### **Attachment to Analysis Pipeline**

```
1. User uploads document
   ↓
2. Document stored in /data/attachments/
   ↓
3. Kind assigned (resume, jd, cover_letter)
   ↓
4. Version tracked (v1, v2, v3...)
   ↓
5. Active version marked (is_active = 1)
   ↓
6. Text extracted on-demand (/api/files/extract)
   ↓
7. Text passed to AI analysis
   ↓
8. Results cached in DB
```

### **Current vs Active Attachments**

**Current Implementation**:
- ✅ Upload dropzones by kind (Resume, JD, Cover Letter)
- ✅ Version management (v1, v2, v3...)
- ✅ Active version toggle (only one active per kind)
- ✅ Delete (soft + permanent)
- ✅ Preview (PDF, DOCX, TXT, RTF)

**Location**: `app/components/attachments/AttachmentsSection.tsx`

**Status**: **NOW INTEGRATED** into Job Detail page

---

## 💰 **Token Optimization Strategy**

### **Decision: Extract Text vs Send Files**

**Chosen Approach**: **Extract Text** (Option B)

**Rationale**:
1. ✅ **Smaller footprint** - Text uses 4x fewer tokens than base64
2. ✅ **Works for all docs** - PDF, DOCX, TXT, RTF all extractable
3. ✅ **Faster processing** - LLM parses text faster than files
4. ✅ **Better for analysis** - Direct text access
5. ❌ **Loses formatting** - Acceptable tradeoff for job docs

**Implementation**:
```typescript
// Extract text from active attachment
const jdAttachment = attachments.find(a => a.kind === 'jd' && a.isActive);
const extractRes = await fetch('/api/files/extract', {
  method: 'POST',
  body: JSON.stringify({ path: jdAttachment.path })
});
const { text } = await extractRes.json();

// Pass text to AI (not file)
const aiRes = await fetch('/api/ai/match-score', {
  body: JSON.stringify({
    jobDescription: text, // Extracted text, ~500-2000 tokens
    resume: resumeText,    // Extracted text, ~1000-3000 tokens
    ...
  })
});
```

**Token Savings**:
- Resume DOCX file: ~8000 tokens (base64)
- Resume extracted text: ~2000 tokens (text)
- **Savings**: 75% reduction

---

## 🎯 **UI Requirements Indicators**

### **Visual Indicators**

**Missing Data**:
```tsx
{!jobDescription && (
  <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-md">
    <p className="text-sm text-amber-800 dark:text-amber-300">
      <strong>Job Description required</strong> - Upload JD attachment or add in Coach Mode
    </p>
    <button 
      onClick={() => router.push(`/coach/${jobId}`)}
      className="mt-2 text-xs text-amber-700 dark:text-amber-400 underline"
    >
      Go to Coach Mode →
    </button>
  </div>
)}
```

**Partial Data**:
```tsx
{jobDescription && !resume && (
  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md">
    <p className="text-sm text-blue-800 dark:text-blue-300">
      <strong>Limited analysis</strong> - Upload Resume for full match score
    </p>
  </div>
)}
```

**Complete Data**:
```tsx
{jobDescription && resume && (
  <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-md flex items-center gap-2">
    <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
    <p className="text-sm text-green-800 dark:text-green-300">
      All required data available • Ready to analyze
    </p>
  </div>
)}
```

---

## 📊 **Data Availability Matrix**

| Section | JD | Resume | Company | Recruiter | Peers | Skip-Level |
|---------|-----|--------|---------|-----------|-------|------------|
| Match Score | ✅ Required | ✅ Required | ✅ Required | ❌ | ❌ | ❌ |
| Skills Match | ✅ Required | ✅ Required | ❌ | ❌ | ❌ | ❌ |
| Company Intel | ✅ Required | ❌ | ✅ Required | ❌ | ❌ | ❌ |
| People Profiles | ✅ Required | ❌ | ❌ | 📋 Optional | 📋 Optional | 📋 Optional |
| Ecosystem | ✅ Required | ❌ | ✅ Required | ❌ | ❌ | ❌ |
| Match Matrix | ✅ Required | ✅ Required | ❌ | ❌ | ❌ | ❌ |

**Legend**:
- ✅ **Required** - Must have or analysis fails
- 📋 **Optional** - Enhances analysis quality
- ❌ **Not needed** - Ignored even if provided

---

## 🔍 **Implementation Status**

### **✅ Already Implemented**
1. ✅ **Data requirements mapping** (`promptDataStrategy.ts`)
2. ✅ **Validation functions** (`canAnalyzeSection()`)
3. ✅ **Token estimation** (`estimateTokens()`)
4. ✅ **Data gathering** (`gatherSectionData()`)
5. ✅ **Text extraction** (`/api/files/extract`)
6. ✅ **Error messages** in components

### **🚧 Needs Implementation**
1. ❌ **UI indicators** for missing data (visual warnings)
2. ❌ **Quick actions** (upload buttons in warnings)
3. ❌ **Progress indicators** (data availability %)
4. ❌ **Cost estimation** shown to user
5. ❌ **Dependency chain** visualization

---

## 📝 **Usage Example**

### **In Component**

```typescript
import { canAnalyzeSection, getSectionRequirements } from '@/lib/ai/promptDataStrategy';

function MatchScoreSection({ jobId, jobDescription, resume }: Props) {
  const requirements = getSectionRequirements('matchScore');
  
  const validation = canAnalyzeSection('matchScore', {
    attachments: {
      jd: !!jobDescription,
      resume: !!resume
    },
    fields: {
      jobTitle: job.title,
      companyName: job.company
    },
    previousAnalysis: []
  });

  return (
    <div>
      {!validation.canAnalyze && (
        <Alert variant="warning">
          <p>Missing: {validation.missingData.join(', ')}</p>
          <p>Upload attachments to enable analysis</p>
        </Alert>
      )}
      
      {validation.canAnalyze && (
        <>
          <p className="text-xs text-gray-600">
            Estimated cost: {validation.estimatedCost.tokens} tokens 
            (${validation.estimatedCost.usd.toFixed(3)})
          </p>
          <AnalyzeButton onClick={handleAnalyze} />
        </>
      )}
    </div>
  );
}
```

---

## 🎨 **UI Mockups**

### **Missing Data State**
```
┌─────────────────────────────────────┐
│ ⚠️  Match Score Analysis            │
├─────────────────────────────────────┤
│                                     │
│ Missing Required Data:              │
│ • Job Description                   │
│ • Resume                            │
│                                     │
│ [Upload JD] [Upload Resume]         │
│                                     │
│ or                                  │
│                                     │
│ [Go to Coach Mode →]                │
│                                     │
└─────────────────────────────────────┘
```

### **Partial Data State**
```
┌─────────────────────────────────────┐
│ ℹ️  Match Score Analysis            │
├─────────────────────────────────────┤
│                                     │
│ Limited Analysis Available:         │
│ ✅ Job Description                  │
│ ❌ Resume                            │
│                                     │
│ [Upload Resume for Full Analysis]   │
│                                     │
│ Quality: 60% (without resume)       │
│                                     │
└─────────────────────────────────────┘
```

### **Ready State**
```
┌─────────────────────────────────────┐
│ ✅ Match Score Analysis             │
├─────────────────────────────────────┤
│                                     │
│ All Required Data Available         │
│ ✅ Job Description                  │
│ ✅ Resume                            │
│ ✅ Job Title                         │
│ ✅ Company Name                      │
│                                     │
│ Estimated: 8,000 tokens (~$0.016)   │
│                                     │
│ [🌟 Analyze with AI]                │
│                                     │
└─────────────────────────────────────┘
```

---

## 🔗 **Integration Points**

### **Current Integration**

**Validation Added To**:
1. ✅ `CompanyIntelligenceCard.tsx` (lines 71-79)
2. ✅ `PeopleProfilesCard.tsx` (lines 121-124)

**Still Needs**:
3. ❌ `AiShowcase.tsx` - Match Score section
4. ❌ `AiShowcase.tsx` - Skills Match section
5. ❌ `FitTable.tsx` - Match Matrix section
6. ❌ `CompanyEcosystemMatrix.tsx` - Ecosystem section

### **How Auto-Load Works**

**Coach Mode** (`app/coach/[jobId]/page.tsx`):
```typescript
// Auto-loads JD and Resume from attachments
useEffect(() => {
  const loadFromAttachments = async () => {
    const jd = attachments.find(a => a.kind === 'jd' && a.isActive);
    const resume = attachments.find(a => a.kind === 'resume' && a.isActive);
    
    if (jd) {
      const text = await extractFileContent(jd.path);
      setJobDescription(text);
    }
    
    if (resume) {
      const text = await extractFileContent(resume.path);
      setResume(text);
    }
  };
  
  loadFromAttachments();
}, [jobId]);
```

**Status**: ✅ **IMPLEMENTED** (lines 112-173)

---

## 📦 **Data Availability Checking**

### **Helper Function**

```typescript
// lib/ai/dataAvailability.ts (NEW FILE NEEDED)

export function getDataAvailability(jobId: string): {
  jd: { available: boolean; source: string; version: number };
  resume: { available: boolean; source: string; version: number };
  companyName: { available: boolean; value: string };
  recruiterUrl: { available: boolean; value: string };
  // ... etc
} {
  // Check attachments
  const attachments = getActiveAttachments(jobId);
  const jd = attachments.find(a => a.kind === 'jd');
  const resume = attachments.find(a => a.kind === 'resume');
  
  // Check job details
  const job = getJob(jobId);
  
  return {
    jd: {
      available: !!jd,
      source: jd ? 'attachment' : 'missing',
      version: jd?.version || 0
    },
    resume: {
      available: !!resume,
      source: resume ? 'attachment' : 'missing',
      version: resume?.version || 0
    },
    companyName: {
      available: !!job.company,
      value: job.company || ''
    },
    // ... etc
  };
}
```

---

## 🚨 **Error Messages**

### **User-Friendly Messages**

| Scenario | Message | Action |
|----------|---------|--------|
| No JD | "Upload Job Description to enable AI analysis" | [Upload JD] button |
| No Resume | "Upload Resume to get personalized insights" | [Upload Resume] button |
| No Company | "Add company name to job details" | Edit job form |
| Missing URLs | "Add LinkedIn URLs for interviewer insights" | Go to Coach Mode |
| Old Cache | "Data changed - click to refresh analysis" | [Refresh] button |

### **Technical Error Messages**

| Error Code | User Message | Technical Details |
|-----------|--------------|-------------------|
| 400 | "Missing required data" | `jobDescription is required` |
| 429 | "Too many requests - wait 60s" | Rate limit exceeded |
| 500 | "Analysis failed - try again" | AI API error |
| 503 | "AI service unavailable" | Provider down |

---

## 🔐 **Security Considerations**

### **Input Sanitization**

All user-provided data is sanitized before sending to AI:

```typescript
// lib/ai/securityGuardrails.ts
const sanitized = sanitizeUserInput(jobDescription);
// Removes: script tags, SQL injection attempts, prompt injection patterns
```

### **Token Limits**

Maximum tokens per section (prevents cost overruns):

| Section | Max Tokens | Approx Cost |
|---------|-----------|-------------|
| Match Score | 8,000 | $0.016 |
| Skills Match | 6,000 | $0.012 |
| Company Intel | 10,000 | $0.020 |
| People Profiles | 8,000 | $0.016 |
| Ecosystem | 5,000 | $0.010 |
| Match Matrix | 10,000 | $0.020 |

**Total for full analysis**: ~47,000 tokens (~$0.094)

---

## 📚 **References**

### **Key Files**

1. **`lib/ai/promptDataStrategy.ts`** - Data requirements map
2. **`lib/ai/promptBuilder.ts`** - 5-section prompt structure
3. **`lib/ai/securityGuardrails.ts`** - Input sanitization
4. **`lib/ai/schemaRegistry.ts`** - Output formats
5. **`lib/fileContent.ts`** - Text extraction
6. **`app/api/files/extract/route.ts`** - Extraction endpoint

### **Integration Examples**

1. **Coach Mode Auto-Load**: `app/coach/[jobId]/page.tsx` (lines 112-173)
2. **Company Intel Validation**: `app/components/ai/CompanyIntelligenceCard.tsx` (lines 71-79)
3. **People Profiles Validation**: `app/components/ai/PeopleProfilesCard.tsx` (lines 121-124)

---

## ✅ **Checklist: Before Running AI Analysis**

For each section, verify:

- [ ] Required attachments uploaded (JD, Resume)
- [ ] Active version selected (is_active = 1)
- [ ] Required fields filled (Job Title, Company)
- [ ] Dependencies met (previous analyses if needed)
- [ ] Token budget available (rate limits)
- [ ] User confirmed (estimated cost shown)

---

**Status**: 📋 **DOCUMENTED**  
**Implementation**: 🟡 **PARTIAL** (validation added, UI indicators pending)  
**Next Steps**: Add visual data availability indicators to all AI sections

---

*This document should be referenced when implementing new AI analysis features or debugging data-related issues.*

