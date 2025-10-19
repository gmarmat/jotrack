# Interview Questions Feature - Design Standards & Implementation Guide

## 📋 Overview

This document consolidates all design standards and patterns to follow when implementing the Interview Questions feature.

---

## 🎨 Design System Standards

### **Section Card Structure**

Based on existing AI sections (Company Intelligence, People Profiles, Match Matrix):

```tsx
<div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
  {/* Header */}
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
      <Icon size={18} className="text-indigo-600" />
      Interview Questions
    </h3>
    
    <div className="flex items-center gap-2">
      {/* STANDARD ORDER: Analyzed Badge -> Analyze Button -> View Prompt -> View Sources */}
      
      {/* 1. Analyzed Badge (if data exists) */}
      {analyzedAt && (
        <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
          Analyzed {formatAnalyzedTime(analyzedAt)}
        </span>
      )}
      
      {/* 2. Analyze Button */}
      <AnalyzeButton ... />
      
      {/* 3. View Prompt Button */}
      <PromptViewer ... />
      
      {/* 4. View Sources Button */}
      <button className="...">
        <AlertCircle size={14} />
      </button>
    </div>
  </div>
  
  {/* Content */}
</div>
```

### **Button Order Standard**

**CRITICAL**: All AI analysis sections MUST follow this order:

1. **Analyzed Badge** - `text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded`
2. **Analyze Button** - Uses `AnalyzeButton` component with cost/time estimates
3. **View Prompt Button** - Uses `PromptViewer` component
4. **View Sources Button** - Icon button with `AlertCircle` icon

**Example from Company Intelligence:**
```tsx
{/* Standard button order: Analyze -> Prompt -> Sources */}

{/* AI Analysis - Position 1 */}
<AnalyzeButton
  onAnalyze={handleAnalyze}
  isAnalyzing={isAnalyzing}
  label="Analyze Company Intelligence"
  estimatedCost={0.045}
  estimatedSeconds={35}
/>

{/* View Prompt - Position 2 */}
<PromptViewer 
  promptKind="company" 
  version="v1"
  buttonLabel=""
  className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
/>

{/* View Sources - Position 3 */}
<button
  onClick={() => setShowSourcesModal(true)}
  className="flex items-center gap-1.5 px-2 py-1.5 border border-blue-300 dark:border-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-400"
  title="View Sources"
>
  <AlertCircle size={14} />
</button>
```

---

## 🎯 Coach Mode Design Patterns

### **Gradient Backgrounds**

Use purple/blue gradients for prominent sections:

```css
/* Light background (for cards) */
bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20

/* Border matching */
border-2 border-purple-200 dark:border-purple-800

/* Icon container */
p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl
```

### **Status Badges**

```css
/* Success state */
bg-green-600 text-white px-2 py-1 rounded-full text-xs font-semibold

/* Warning state */
bg-amber-600 text-white px-2 py-1 rounded-full text-xs font-semibold

/* Info state */
bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-semibold
```

### **Question Cards**

For displaying individual questions:

```tsx
<div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
  <p className="text-sm text-gray-900 dark:text-gray-100 font-medium mb-2">
    {question.question}
  </p>
  
  {/* Metadata badges */}
  <div className="flex items-center gap-2 mt-2">
    <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
      {question.category}
    </span>
    <span className={`text-xs px-2 py-0.5 rounded ${
      question.difficulty === 'Easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
      question.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
    }`}>
      {question.difficulty}
    </span>
  </div>
  
  {/* Tip */}
  {question.tip && (
    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
      💡 <strong>Tip:</strong> {question.tip}
    </p>
  )}
</div>
```

---

## 🗂️ Expandable Sections (Persona-based)

For organizing questions by interviewer type:

```tsx
<div className="border border-gray-200 dark:border-gray-700 rounded-lg">
  {/* Header (clickable) */}
  <button
    onClick={() => toggleExpanded()}
    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
  >
    <div className="flex items-center gap-2">
      <span>👔</span> {/* Persona icon */}
      <span className="font-semibold text-gray-900 dark:text-gray-100">
        Recruiter Questions
      </span>
      <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded">
        {questions.length} questions
      </span>
    </div>
    {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
  </button>
  
  {/* Content (when expanded) */}
  {expanded && (
    <div className="p-4 pt-0 space-y-3">
      {questions.map((q, idx) => (
        <QuestionCard key={idx} question={q} />
      ))}
    </div>
  )}
</div>
```

### **Persona Icons**

- **Recruiter**: 👔
- **Hiring Manager**: 👨‍💼
- **Peer/Panel**: 👥

---

## 📊 Data Persistence Pattern

### **Database Fields (jobs table)**

```sql
interview_questions_searched_at INTEGER  -- Timestamp for web search
interview_questions_generated_at INTEGER -- Timestamp for AI generation
```

### **Cache Tables**

**1. Company-wide cache (90 days):**
```sql
CREATE TABLE interview_questions_cache (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  role_category TEXT,
  searched_questions TEXT,  -- JSON array
  search_sources TEXT,       -- JSON array of URLs
  searched_at INTEGER,
  expires_at INTEGER,        -- 90 days TTL
  created_at INTEGER
);
```

**2. Job-specific AI questions:**
```sql
CREATE TABLE job_interview_questions (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  recruiter_questions TEXT,      -- JSON array
  hiring_manager_questions TEXT, -- JSON array
  peer_questions TEXT,           -- JSON array
  generated_at INTEGER,
  created_at INTEGER
);
```

### **API Response Pattern**

Follow existing pattern from people-analysis:

```typescript
// Save to cache table
sqlite.prepare(`
  INSERT OR REPLACE INTO job_interview_questions (...)
  VALUES (...)
`).run(...);

// Update jobs table with timestamp
sqlite.prepare(`
  UPDATE jobs 
  SET interview_questions_generated_at = ?
  WHERE id = ?
`).run(now, jobId);

// Return data
return NextResponse.json({
  success: true,
  recruiter: {...},
  hiringManager: {...},
  peer: {...},
  generatedAt: now
});
```

### **Loading from Cache**

In `analysis-data` endpoint:

```typescript
// Load cached questions
let interviewQuestions = null;
let interviewQuestionsMetadata = null;

if (jobData.interviewQuestionsGeneratedAt) {
  const cached = sqlite.prepare(`
    SELECT * FROM job_interview_questions 
    WHERE job_id = ?
  `).get(jobId);
  
  if (cached) {
    interviewQuestions = {
      recruiter: JSON.parse(cached.recruiter_questions || '[]'),
      hiringManager: JSON.parse(cached.hiring_manager_questions || '[]'),
      peer: JSON.parse(cached.peer_questions || '[]')
    };
    
    interviewQuestionsMetadata = {
      cached: true,
      analyzedAt: jobData.interviewQuestionsGeneratedAt,
      cacheAge: calculateAge(jobData.interviewQuestionsGeneratedAt),
      questionCount: getTotalQuestionCount(interviewQuestions)
    };
  }
}
```

---

## 🔧 AI Provider Integration

### **Prompt Registration**

In `lib/coach/aiProvider.ts`:

```typescript
// buildPromptVariables
case 'interview-questions-recruiter':
  return {
    companyName: inputs.companyName,
    jobTitle: inputs.jobTitle,
    jdSummary: inputs.jdSummary
  };

case 'interview-questions-hiring-manager':
  return {
    companyName: inputs.companyName,
    jobTitle: inputs.jobTitle,
    jobDescription: inputs.jobDescription,
    resumeSummary: inputs.resumeSummary
  };

case 'interview-questions-peer':
  return {
    companyName: inputs.companyName,
    jobTitle: inputs.jobTitle,
    jobDescription: inputs.jobDescription,
    technicalSkills: inputs.technicalSkills
  };

// mapCapabilityToPromptKind
function mapCapabilityToPromptKind(capability: string): string {
  if (capability === 'interview-questions-recruiter') return 'interview-questions-recruiter';
  if (capability === 'interview-questions-hiring-manager') return 'interview-questions-hiring-manager';
  if (capability === 'interview-questions-peer') return 'interview-questions-peer';
  // ... existing mappings
}

// getMaxTokens
function getMaxTokens(capability: string): number {
  const limits: Record<string, number> = {
    'interview-questions-recruiter': 2000,
    'interview-questions-hiring-manager': 3000,
    'interview-questions-peer': 3000,
    // ... existing limits
  };
  return limits[capability] || 1000;
}
```

---

## 🧪 Testing Requirements

### **E2E Test IDs**

```tsx
// Section
data-testid="interview-questions-section"

// Buttons
data-testid="search-questions-button"
data-testid="generate-questions-button"
data-testid="view-prompt-interview-questions"
data-testid="view-sources-interview-questions"

// Question cards
data-testid={`question-${persona}-${index}`}

// Persona sections
data-testid="recruiter-questions-section"
data-testid="hiring-manager-questions-section"
data-testid="peer-questions-section"
```

### **Unit Tests**

Required for:
- `searchInterviewQuestions()` - Tavily integration
- `extractQuestions()` - Question parsing from search results
- `categorizeQuestion()` - Question categorization logic
- Question deduplication
- Cache expiration logic

---

## 📝 Prompt Template Standards

All prompts MUST:

1. **Start with version header**: `# [Feature Name] v1.0`
2. **Include context section**: `## Context` with input variables
3. **Define task clearly**: `## Your Task` with CRITICAL instructions
4. **Specify output format**: `## Required Output Format` with JSON schema
5. **Provide guidelines**: `## Guidelines` with numbered list
6. **Return ONLY JSON**: No markdown wrappers (handle in code)

**Example structure:**

```markdown
# Interview Questions Generation - Recruiter v1.0

## Context

You are helping a candidate prepare for a recruiter phone screen.

**Company**: {{companyName}}
**Role**: {{jobTitle}}
**Job Description Summary**: {{jdSummary}}

## Your Task

Generate 10 recruiter-focused interview questions that assess:
1. Cultural fit and motivation
2. Communication skills
3. Career goals

**CRITICAL**: Questions should be realistic and commonly asked.

## Required Output Format

Return ONLY valid JSON (no markdown):

{
  "questions": [
    {
      "question": "string",
      "category": "string",
      "difficulty": "Easy | Medium | Hard",
      "tip": "string"
    }
  ]
}

## Guidelines

1. Questions should be realistic and commonly asked
2. Include a mix of easy, medium difficulty
3. Focus on soft skills and culture fit
4. Provide actionable tips for each question
```

---

## 🎨 Color Palette for Interview Questions

Following Coach Mode design patterns:

```css
/* Primary colors */
--purple-600: #9333ea  /* Main accent */
--blue-600: #2563eb    /* Secondary accent */

/* Question type backgrounds */
--recruiter-bg: bg-cyan-50 dark:bg-cyan-900/10
--hiring-manager-bg: bg-purple-50 dark:bg-purple-900/10
--peer-bg: bg-indigo-50 dark:bg-indigo-900/10

/* Difficulty colors */
--easy: bg-green-100 text-green-700
--medium: bg-yellow-100 text-yellow-700
--hard: bg-red-100 text-red-700
```

---

## 📦 File Structure

```
app/
├── api/
│   └── jobs/
│       └── [id]/
│           └── interview-questions/
│               ├── search/route.ts      # Tavily web search
│               └── generate/route.ts     # AI generation (3 personas)
├── components/
│   └── interview/
│       ├── InterviewQuestionsCard.tsx   # Main section
│       └── QuestionCard.tsx             # Individual question display
lib/
└── interviewQuestions/
    └── searchQuestions.ts                # Tavily integration + parsing
prompts/
├── interview-questions-recruiter.v1.md
├── interview-questions-hiring-manager.v1.md
└── interview-questions-peer.v1.md
db/
└── migrations/
    └── 012_interview_questions.sql
```

---

## ✅ Implementation Checklist

Before starting implementation:

- [x] Read UI_DESIGN_SPEC.md for component standards
- [x] Read COACH_MODE_DESIGN_PATTERNS.md for visual guidelines
- [x] Review ARCHITECTURE.md for file handling patterns
- [x] Understand button order standard from existing AI sections
- [x] Review data persistence pattern from People Profiles fix
- [ ] Create database migration
- [ ] Write AI prompts following template standard
- [ ] Implement API endpoints with proper caching
- [ ] Build UI component following design patterns
- [ ] Add data-testid attributes for E2E tests
- [ ] Write unit tests for core logic
- [ ] Test cache expiration (90 days)
- [ ] Verify dark mode styling
- [ ] Check responsive design

---

## 🚀 Ready to Implement!

All standards gathered. Follow this document during implementation to ensure consistency with existing patterns.

**Key Principles:**
1. **Consistency**: Match existing AI section patterns
2. **Caching**: Minimize token usage with smart caching
3. **Dark Mode**: Always include dark mode variants
4. **Testing**: Add test IDs for E2E coverage
5. **Standards**: Follow button order, color palette, spacing

