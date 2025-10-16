# Data Flow Visual Guide 📊

**Complete User Journey with Data Transformations**

---

## 🚀 **The Complete User Journey**

### **What You'll See Now (Compact Design):**

```
┌────────────────────────────────────────────────────────────────┐
│ ✅ Analysis Up to Date                            [↓]          │
│ Analysis is up to date                                         │
├────────────────────────────────────────────────────────────────┤
│ 📎 Input Documents (3)                                         │
│                                                                │
│ ┌──────────────────────────────────────┬─────────────────┐    │
│ │ 📄 Resume.docx • v1 • Active        │ View Variants   │    │
│ └──────────────────────────────────────┴─────────────────┘    │
│ ┌──────────────────────────────────────┬─────────────────┐    │
│ │ 💼 JD.pdf • v1 • Active             │ View Variants   │    │
│ └──────────────────────────────────────┴─────────────────┘    │
│ ┌──────────────────────────────────────┬─────────────────┐    │
│ │ ✉️ Cover.docx • v1                  │ View Variants   │    │
│ └──────────────────────────────────────┴─────────────────┘    │
│                                                                │
│ 🤖 Analysis Ready                                              │
│ ┌──────────────┐ ┌───────────────┐ ┌──────────────────┐      │
│ │🎯 Match      │ │🏢 Company     │ │👥 People         │      │
│ │  Analysis    │ │  Intel        │ │  Profiles        │      │
│ └──────────────┘ └───────────────┘ └──────────────────┘      │
└────────────────────────────────────────────────────────────────┘
```

**New Design: Compact Pills!**
- All 3 analysis tags fit on **ONE LINE**
- Only ~40px tall (was ~200px)
- Still color-coded, clickable, smooth scroll

---

## 📦 **The 3 Data Versions Explained**

### **Version 1: `raw` (FREE - Local Extraction)**

**What It Is:**
```
Plain text string extracted locally using:
- mammoth (for DOCX)
- pdf-parse (for PDF)
- fs.readFile (for TXT)
```

**Example:**
```
"John Smith
Senior Product Manager
San Francisco, CA | john@example.com | (555) 123-4567

PROFESSIONAL EXPERIENCE
Google Inc. | Senior Product Manager | 2020-2023
- Led cross-functional team of 12 engineers and designers
- Launched search feature used by 10M+ daily active users
- Increased user engagement by 35% through data-driven iterations

EDUCATION
Stanford University | MBA | 2018
GPA: 3.8/4.0

SKILLS
Product Management, Agile, SQL, Python, Tableau..."
```

**Storage:**
```json
{
  "variant_type": "raw",
  "content": "John Smith\nSenior Product Manager...",
  "token_count": 2500,
  "created_at": 1234567890
}
```

**Why We Need It:**
- ✅ Full original text (no data loss)
- ✅ Reference for debugging
- ✅ Can re-run AI extraction if needed
- ✅ Compare AI output against source
- ✅ FREE (no AI cost)

---

### **Version 2: `ai_optimized` (PAID - $0.01 per doc)**

**What It Is:**
```
Structured JSON extracted by AI (GPT-4o Mini)
Optimized for:
- Token efficiency (saves money)
- Prompt inclusion (used in ALL sections)
- Key information only
```

**Example:**
```json
{
  "name": "John Smith",
  "role": "Senior Product Manager",
  "location": "San Francisco, CA",
  "contact": {
    "email": "john@example.com",
    "phone": "(555) 123-4567"
  },
  "skills": [
    "Product Management",
    "Agile",
    "SQL",
    "Python",
    "Tableau"
  ],
  "experience": [
    {
      "company": "Google",
      "role": "Senior Product Manager",
      "duration": "3 years",
      "key_achievement": "Launched feature with 10M+ DAU"
    }
  ],
  "education": {
    "degree": "MBA",
    "school": "Stanford",
    "year": 2018
  }
}
```

**Storage:**
```json
{
  "variant_type": "ai_optimized",
  "content": {...structured JSON above...},
  "token_count": 500,
  "extraction_model": "gpt-4o-mini",
  "created_at": 1234567890
}
```

**Why We Need It:**
- ✅ **Used in EVERY analysis section** (Match, Company, Profiles)
- ✅ **80% smaller** than raw (500 vs 2,500 tokens)
- ✅ **Saves money** on subsequent AI calls
- ✅ **Structured** (easy to use in prompts)
- ✅ **Key info only** (no fluff)

**How It's Used:**
```
Match Analysis Prompt:
"Given this resume: {ai_optimized_resume}
And this JD: {ai_optimized_jd}
Calculate match score..."

Company Intelligence Prompt:
"Given this JD: {ai_optimized_jd}
Research the company..."

People Profiles Prompt:
"Given this resume: {ai_optimized_resume}
And recruiter LinkedIn..."
```

---

### **Version 3: `detailed` (PAID - Same $0.01 call)**

**What It Is:**
```
Full structured extraction with ALL fields
Same AI call as 'ai_optimized' (no extra cost)
Includes:
- Extended metadata
- Nested structures
- Additional context
```

**Example:**
```json
{
  "name": "John Smith",
  "role": "Senior Product Manager",
  "location": {
    "city": "San Francisco",
    "state": "CA",
    "timezone": "PST"
  },
  "contact": {
    "email": "john@example.com",
    "phone": "(555) 123-4567",
    "linkedin": "linkedin.com/in/johnsmith"
  },
  "skills": [
    {
      "name": "Product Management",
      "years_experience": 5,
      "proficiency": "expert",
      "certifications": ["CSPO", "CPO"]
    },
    {
      "name": "Agile",
      "years_experience": 4,
      "proficiency": "advanced",
      "frameworks": ["Scrum", "Kanban"]
    }
  ],
  "experience": [
    {
      "company": "Google Inc.",
      "role": "Senior Product Manager",
      "duration": "3 years",
      "dates": "2020-2023",
      "achievements": [
        "Launched search feature used by 10M+ daily active users",
        "Increased user engagement by 35% through data-driven iterations",
        "Led cross-functional team of 12 engineers and designers"
      ],
      "technologies": ["Python", "SQL", "Tableau", "Figma"],
      "methodologies": ["Agile", "Scrum", "Design Thinking"]
    }
  ],
  "education": {
    "degree": "MBA",
    "school": "Stanford University",
    "year": 2018,
    "gpa": 3.8,
    "honors": ["Dean's List"],
    "focus": "Product Strategy"
  },
  "certifications": [
    "Certified Scrum Product Owner (CSPO)",
    "Certified Product Owner (CPO)"
  ],
  "languages": [
    {"name": "English", "level": "native"},
    {"name": "Spanish", "level": "conversational"}
  ]
}
```

**Storage:**
```json
{
  "variant_type": "detailed",
  "content": {...full structured JSON above...},
  "token_count": 1500,
  "extraction_model": "gpt-4o-mini",
  "created_at": 1234567890
}
```

**Why We Need It:**
- ✅ **Global profile building** (user's career history)
- ✅ **Future features** (career insights, skill gaps)
- ✅ **Data mining** (trends across all jobs)
- ✅ **Extended analysis** (deep dives)
- ✅ **NOT same as raw** (structured + enriched)

**Difference from Raw:**
```
raw:      "Led team of 12 engineers..."  (unstructured text)
detailed: {"team_size": 12, "roles": ["engineers", "designers"]}  (structured)
```

---

## 🔄 **Complete Data Flow**

### **Step 1: User Uploads (Manual)**
```
User Action: Upload Resume.docx, JD.pdf, Cover.docx
Cost: FREE
Time: Instant
Result: Files stored in /data/attachments/[jobId]/
```

### **Step 2: Local Text Extraction (Automatic)**
```
Trigger: After upload (background)
Tool: mammoth / pdf-parse
Cost: FREE
Time: ~500ms per file
Input: Binary DOCX/PDF files
Output: Plain text strings
Stored As: variant_type='raw'

Resume.docx → "John Smith\nSenior Product Manager..."
JD.pdf      → "We are seeking a Product Manager..."
Cover.docx  → "Dear Hiring Manager..."
```

### **Step 3: AI Structured Extraction (Button Click)**
```
Trigger: User clicks "Refresh Data" (~$0.02)
Tool: GPT-4o Mini API
Cost: ~$0.01 per document
Time: ~2-3 seconds per file
Input: raw text variants
Output: Structured JSON (2 versions)
Stored As: variant_type='ai_optimized' + 'detailed'

Raw Text → AI Prompt:
"Extract structured data from this resume:
{raw_text}

Return JSON with: name, skills, experience, education..."

AI Response:
{
  "skills": ["PM", "Agile", "SQL"],
  "experience": [...]
}

Stored As:
- ai_optimized (500 tokens, compact)
- detailed (1500 tokens, complete)
```

### **Step 4: Full AI Analysis (Button Click)**
```
Trigger: User clicks "Analyze All" (~$0.20)
Tool: GPT-4o Mini API (multiple calls)
Cost: ~$0.05-0.10 per section
Time: ~10-15 seconds total
Input: ai_optimized variants + section-specific prompts
Output: Analysis results for each section

For Match Analysis:
"Given resume: {ai_optimized_resume}
And JD: {ai_optimized_jd}
Calculate: match score, signals, fit dimensions"

For Company Intelligence:
"Given JD: {ai_optimized_jd}
Company: {company_name}
Research: culture, values, ecosystem"

For People Profiles:
"Given resume: {ai_optimized_resume}
LinkedIn: {recruiter_url}
Analyze: compatibility, communication style"

Results Stored in: analysis_data table
```

### **Step 5: Display Results (Automatic)**
```
Trigger: After analysis completes
Display: AiShowcase component renders
Data: Fetched from analysis_data table
UI: Match cards, company cards, profile cards
State: Banner turns green ✅
```

---

## 🎨 **New Compact UI Visual**

### **Before (Large Cards):**
```
┌────────────────────────────────────────────────────┐
│ 🎯 Match Analysis                                  │
│ Match score, signals breakdown, fit dimensions     │
│                                      [View Analysis]│
├────────────────────────────────────────────────────┤
│ 🏢 Company Intelligence                            │
│ Company research, culture, ecosystem matrix        │
│                                  [View Intelligence]│
├────────────────────────────────────────────────────┤
│ 👥 People Profiles                                 │
│ User, recruiter, hiring manager insights           │
│                                      [View Profiles]│
└────────────────────────────────────────────────────┘
Height: ~200px
```

### **After (Compact Tags):**
```
┌────────────────────────────────────────────────────┐
│ 🤖 Analysis Ready                                  │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│ │🎯 Match  │ │🏢 Company│ │👥 People │           │
│ │ Analysis │ │   Intel  │ │ Profiles │           │
│ └──────────┘ └──────────┘ └──────────┘           │
└────────────────────────────────────────────────────┘
Height: ~40px (80% reduction!)
```

**Design Details:**
- Rounded-full pills
- Gradient backgrounds (purple/green/orange)
- Hover effects with shadow
- All fit on ONE LINE
- Click to scroll smoothly

---

## 🎯 **Summary**

### **3 Versions:**
1. **`raw`** - Full text (backup, debugging, FREE)
2. **`ai_optimized`** - Compact structured (used in all prompts, SAVES MONEY)
3. **`detailed`** - Full structured (profile building, FUTURE FEATURES)

### **Data Flow:**
```
Upload → Local Extract → AI Extract → AI Analyze → Display
FREE      FREE           $0.02        $0.20       FREE
```

### **New UI:**
- ✅ Compact pills (not large cards)
- ✅ All on one line
- ✅ Quick visual scan
- ✅ One-click scroll
- ✅ 80% less space

---

**Refresh browser to see the new compact design!** 🎉

