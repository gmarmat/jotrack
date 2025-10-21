# Data Pipeline Restoration Plan

**Goal**: Restore 3-variant text extraction system (Raw → Normalized → Detailed)  
**Current Issue**: Prompts creating structured JSON instead of text variants  
**Based On**: "Cleaned UP data flow and storage strat v1 10.15.2025.txt"

---

## ✅ What's Working

1. **Local Raw Extraction** (Step 1)
   - ✅ Supports: PDF, DOCX, TXT
   - ✅ Creates UTF-8 plain text
   - ✅ Saves as 'raw' variant
   - ✅ Free, fast, local

2. **Database Schema**
   - ✅ `artifactVariants` table exists
   - ✅ Supports 4 variant types: raw, ui, ai_optimized, detailed
   - ✅ Content hash tracking
   - ✅ Version history

3. **UI Display**
   - ✅ Shows "Raw", "Normalized", "Detailed" labels
   - ✅ Eye icons to preview each variant
   - ✅ Viewer modal works

---

## ❌ What's Broken

**Current Prompts** (lines 54-114 in refresh-variants/route.ts):
```javascript
// WRONG: Creates structured JSON
{
  "skills": ["skill1", "skill2"],
  "experience": [{...}],
  "education": [{...}]
}
```

**Should Be**: Creates TEXT variants
```javascript
// CORRECT: Creates cleaned/enhanced TEXT
{
  "text": "Cleaned resume text here...",
  "wordCount": 450,
  "summary": "Brief overview"
}
```

---

## 🔧 Fix Required

### New Prompts for AI Extraction

#### Prompt 1: Normalized/AI-Short Variant

**Purpose**: Clean, concise text (500 tokens max)

```javascript
async function createNormalizedVariant(rawText: string, sourceType: string) {
  const prompt = `
You are creating a NORMALIZED TEXT variant of a ${sourceType}.

TASK: Clean and condense the raw text below into a concise, well-formatted version.

RULES:
1. OUTPUT PLAIN TEXT ONLY (no JSON, no markdown, no structure)
2. Remove: Formatting artifacts, redundant whitespace, page numbers, headers/footers
3. Preserve: ALL meaningful content, skills, experiences, achievements, requirements
4. Condense: Reduce verbosity but keep ALL facts and details
5. Fix: Spelling errors, grammar issues, unclear phrasing
6. Target: 500-800 words (shorter is better if possible)

EXAMPLE INPUT (Resume):
"
Page 1
====
JOHN    DOE
Email: john@example.com      Phone: 555-1234

EXPERIENCE
Company A                                                     2020-Present
Senior Engineer
- Led team of 5 engineers building microservices architecture
- Reduced API latency by 60% through optimization

Company B                                                     2018-2020
Software Engineer
- Built RESTful APIs using Python/Django
- Worked with team of 10 developers

SKILLS
Python, Django, AWS, Docker, Kubernetes, etc etc etc
"

EXAMPLE OUTPUT (Normalized):
"
John Doe - Senior Software Engineer
Email: john@example.com | Phone: 555-1234

EXPERIENCE:
Senior Engineer at Company A (2020-Present): Led team of 5 engineers building microservices architecture. Reduced API latency by 60% through optimization.

Software Engineer at Company B (2018-2020): Built RESTful APIs using Python/Django. Worked with team of 10 developers.

SKILLS: Python, Django, AWS, Docker, Kubernetes

Education: [Include if present in raw text]
"

NOW PROCESS THIS ${sourceType.toUpperCase()}:

${rawText}

OUTPUT NORMALIZED TEXT (NO JSON, NO MARKDOWN):
`;

  const { result } = await callAiProvider('create_normalized_variant', {
    prompt,
    sourceType,
  }, false, 'v1');
  
  return {
    text: result.trim(),
    wordCount: result.split(/\s+/).length,
    variant: 'normalized'
  };
}
```

#### Prompt 2: Detailed/AI-Long Variant

**Purpose**: Enhanced, complete text (full detail)

```javascript
async function createDetailedVariant(normalizedText: string, sourceType: string) {
  const prompt = `
You are creating a DETAILED TEXT variant of a ${sourceType}.

TASK: Enhance the normalized text below by expanding abbreviations and adding clarity.

RULES:
1. OUTPUT PLAIN TEXT ONLY (no JSON, no markdown, no structure)
2. Expand: Abbreviations, acronyms, unclear terms
3. Add: Context that makes content self-explanatory
4. Preserve: Original meaning and all facts
5. Enhance: Clarity for AI analysis (this will be fed to other AI systems)
6. Target: Keep under 2000 words

EXAMPLE INPUT (Normalized Resume):
"
Senior Engineer at Company A (2020-Present): Led team of 5 building microservices. Reduced API latency by 60%.

SKILLS: Python, Django, AWS, K8s
"

EXAMPLE OUTPUT (Detailed):
"
Senior Software Engineer at Company A (2020-Present):
Led a team of 5 engineers to architect and build a microservices architecture system. This involved migrating from a monolithic application to distributed services. Successfully reduced API response latency by 60 percent through performance optimization techniques including caching, database query optimization, and service-level improvements.

TECHNICAL SKILLS:
- Programming Languages: Python (5+ years experience)
- Web Frameworks: Django (backend API development)
- Cloud Infrastructure: Amazon Web Services (AWS)
- Container Orchestration: Kubernetes (K8s) for managing microservices deployment
"

NOW PROCESS THIS ${sourceType.toUpperCase()}:

${normalizedText}

OUTPUT DETAILED TEXT (NO JSON, NO MARKDOWN):
`;

  const { result } = await callAiProvider('create_detailed_variant', {
    prompt,
    sourceType,
  }, false, 'v1');
  
  return {
    text: result.trim(),
    wordCount: result.split(/\s+/).length,
    variant: 'detailed'
  };
}
```

---

## 📋 Implementation Steps

1. **Replace extractWithAI() function** in `refresh-variants/route.ts`
   - Remove JSON structure prompts
   - Add text normalization prompts
   - Add text enhancement prompts

2. **Update POST handler** (lines 388-443)
   - Create ai_optimized variant with normalized text
   - Create detailed variant with enhanced text
   - Save both as TEXT (not JSON)

3. **Update bundle save logic** (lines 488-520)
   - Extract `.text` property from variants
   - Handle both old JSON format and new text format (migration)

4. **Add variant type detection**
   - Check if variant content is JSON or plain text
   - Handle both formats for backward compatibility

---

## 🧪 E2E Test Suite

### Test Data Fixtures

Create test files in `e2e/fixtures/data-pipeline/`:

1. **Resume Files** (3 formats):
   - `test-resume.pdf` (2-page resume with experience, skills, education)
   - `test-resume.docx` (same content)
   - `test-resume.txt` (same content)

2. **JD Files** (3 formats):
   - `test-jd.pdf` (job description with requirements)
   - `test-jd.docx` (same content)
   - `test-jd.txt` (same content)

### Test Suite

```typescript
// e2e/data-pipeline.spec.ts

import { test, expect } from '@playwright/test';
import path from 'path';
import { db } from '@/db/client';
import { artifactVariants } from '@/db/schema';
import { eq } from 'drizzle-orm';

test.describe('Data Pipeline - Variant Extraction', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to app and create a test job
    await page.goto('http://localhost:3000');
    await page.click('button:has-text("New Job")');
    await page.fill('input[name="title"]', 'Test Software Engineer');
    await page.fill('input[name="company"]', 'Test Company Inc');
    await page.click('button:has-text("Create")');
    await page.waitForURL('**/jobs/**');
  });
  
  // === TEST 1: PDF Upload + Raw Extraction ===
  test('extracts raw text from PDF resume', async ({ page }) => {
    const resumePath = path.join(__dirname, 'fixtures/data-pipeline/test-resume.pdf');
    
    // Upload resume PDF
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(resumePath);
    
    // Wait for upload success
    await expect(page.locator('text=Resume:')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=v1')).toBeVisible();
    
    // Get job ID from URL
    const url = page.url();
    const jobId = url.split('/jobs/')[1];
    
    // Verify raw variant was created in database
    const rawVariants = await db
      .select()
      .from(artifactVariants)
      .where(eq(artifactVariants.variantType, 'raw'))
      .limit(1);
    
    expect(rawVariants.length).toBe(1);
    
    const rawContent = JSON.parse(rawVariants[0].content);
    expect(rawContent.text).toBeTruthy();
    expect(rawContent.text.length).toBeGreaterThan(100);
    expect(rawContent.metadata.wordCount).toBeGreaterThan(50);
    
    console.log(`✅ Raw variant created: ${rawContent.metadata.wordCount} words`);
  });
  
  // === TEST 2: DOCX Upload + Raw Extraction ===
  test('extracts raw text from DOCX resume', async ({ page }) => {
    const resumePath = path.join(__dirname, 'fixtures/data-pipeline/test-resume.docx');
    
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(resumePath);
    
    await expect(page.locator('text=Resume:')).toBeVisible({ timeout: 5000 });
    
    // Verify extraction worked
    const rawVariants = await db
      .select()
      .from(artifactVariants)
      .where(eq(artifactVariants.variantType, 'raw'))
      .limit(1);
    
    expect(rawVariants.length).toBe(1);
    const rawContent = JSON.parse(rawVariants[0].content);
    expect(rawContent.text).toContain('Software Engineer'); // Should contain key terms
    
    console.log(`✅ DOCX extraction: ${rawContent.metadata.wordCount} words`);
  });
  
  // === TEST 3: AI Variant Creation ===
  test('creates normalized and detailed variants from raw', async ({ page }) => {
    // Upload resume
    const resumePath = path.join(__dirname, 'fixtures/data-pipeline/test-resume.pdf');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(resumePath);
    await expect(page.locator('text=Resume:')).toBeVisible({ timeout: 5000 });
    
    // Click "Refresh Data" button in Data Pipeline
    await page.click('button:has-text("Refresh Data")');
    
    // Wait for processing
    await page.waitForTimeout(3000); // AI call takes time
    
    // Check for success indicator
    await expect(page.locator('text=Analyzed')).toBeVisible({ timeout: 30000 });
    
    // Verify AI variants in database
    const allVariants = await db
      .select()
      .from(artifactVariants)
      .where(eq(artifactVariants.isActive, true));
    
    const variantTypes = allVariants.map(v => v.variantType);
    
    // Should have all 3 variants
    expect(variantTypes).toContain('raw');
    expect(variantTypes).toContain('ai_optimized');
    expect(variantTypes).toContain('detailed');
    
    // Check normalized variant is shorter than raw
    const rawVariant = allVariants.find(v => v.variantType === 'raw');
    const normalizedVariant = allVariants.find(v => v.variantType === 'ai_optimized');
    const detailedVariant = allVariants.find(v => v.variantType === 'detailed');
    
    const rawText = JSON.parse(rawVariant!.content).text;
    const normalizedText = JSON.parse(normalizedVariant!.content).text;
    const detailedText = JSON.parse(detailedVariant!.content).text;
    
    // Normalized should be shorter than raw
    expect(normalizedText.length).toBeLessThan(rawText.length);
    
    // Detailed should be longer than normalized (or similar)
    expect(detailedText.length).toBeGreaterThanOrEqual(normalizedText.length * 0.9);
    
    // All should be plain TEXT not JSON structures
    expect(() => JSON.parse(normalizedText)).toThrow(); // Should NOT be JSON
    expect(() => JSON.parse(detailedText)).toThrow(); // Should NOT be JSON
    
    console.log(`✅ All variants created:`);
    console.log(`   Raw: ${rawText.length} chars`);
    console.log(`   Normalized: ${normalizedText.length} chars`);
    console.log(`   Detailed: ${detailedText.length} chars`);
  });
  
  // === TEST 4: Variant Viewer ===
  test('displays all 3 variants in viewer modal', async ({ page }) => {
    // Upload and extract
    const resumePath = path.join(__dirname, 'fixtures/data-pipeline/test-resume.pdf');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(resumePath);
    await expect(page.locator('text=Resume:')).toBeVisible();
    
    await page.click('button:has-text("Refresh Data")');
    await expect(page.locator('text=Analyzed')).toBeVisible({ timeout: 30000 });
    
    // Click eye icon for "Raw" variant
    await page.click('button[aria-label="View Raw"]');
    await expect(page.locator('text=Raw Version')).toBeVisible();
    const rawContent = await page.locator('.modal-content').textContent();
    expect(rawContent!.length).toBeGreaterThan(100);
    await page.click('button:has-text("Close")');
    
    // Click eye icon for "Normalized" variant
    await page.click('button[aria-label="View Normalized"]');
    await expect(page.locator('text=Normalized Version')).toBeVisible();
    const normalizedContent = await page.locator('.modal-content').textContent();
    expect(normalizedContent!.length).toBeGreaterThan(50);
    await page.click('button:has-text("Close")');
    
    // Click eye icon for "Detailed" variant
    await page.click('button[aria-label="View Detailed"]');
    await expect(page.locator('text=Detailed Version')).toBeVisible();
    const detailedContent = await page.locator('.modal-content').textContent();
    expect(detailedContent!.length).toBeGreaterThan(50);
    await page.click('button:has-text("Close")');
    
    console.log(`✅ All variants viewable in UI`);
  });
  
  // === TEST 5: Change Detection ===
  test('detects changes when uploading new resume version', async ({ page }) => {
    // Upload v1
    const resume1 = path.join(__dirname, 'fixtures/data-pipeline/test-resume-v1.pdf');
    let fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(resume1);
    await expect(page.locator('text=v1')).toBeVisible();
    
    await page.click('button:has-text("Refresh Data")');
    await expect(page.locator('text=Analyzed')).toBeVisible({ timeout: 30000 });
    
    // Upload v2 (different content)
    const resume2 = path.join(__dirname, 'fixtures/data-pipeline/test-resume-v2.pdf');
    fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(resume2);
    await expect(page.locator('text=v2')).toBeVisible();
    
    // Click "Refresh Data" again
    await page.click('button:has-text("Refresh Data")');
    
    // Should show comparison results
    await expect(page.locator('text=Major changes detected')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('text=Added')).toBeVisible(); // Shows added skills
    
    console.log(`✅ Change detection working`);
  });
  
  // === TEST 6: Multi-Format Support ===
  test('handles PDF, DOCX, and TXT formats', async ({ page }) => {
    const formats = [
      { file: 'test-resume.pdf', format: 'PDF' },
      { file: 'test-resume.docx', format: 'DOCX' },
      { file: 'test-resume.txt', format: 'TXT' },
    ];
    
    for (const { file, format } of formats) {
      await page.goto('http://localhost:3000');
      await page.click('button:has-text("New Job")');
      await page.fill('input[name="title"]', `Test ${format}`);
      await page.fill('input[name="company"]', 'Test Co');
      await page.click('button:has-text("Create")');
      await page.waitForURL('**/jobs/**');
      
      const filePath = path.join(__dirname, 'fixtures/data-pipeline', file);
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(filePath);
      
      await expect(page.locator('text=Resume:')).toBeVisible({ timeout: 10000 });
      
      await page.click('button:has-text("Refresh Data")');
      await expect(page.locator('text=Analyzed')).toBeVisible({ timeout: 30000 });
      
      // Verify variant created
      const variants = await db
        .select()
        .from(artifactVariants)
        .where(eq(artifactVariants.variantType, 'ai_optimized'))
        .limit(1);
      
      expect(variants.length).toBe(1);
      console.log(`✅ ${format} format works`);
    }
  });
  
  // === TEST 7: Cost Estimation ===
  test('shows accurate cost estimate', async ({ page }) => {
    const resumePath = path.join(__dirname, 'fixtures/data-pipeline/test-resume.pdf');
    const jdPath = path.join(__dirname, 'fixtures/data-pipeline/test-jd.pdf');
    
    // Upload both files
    let fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(resumePath);
    await expect(page.locator('text=Resume:')).toBeVisible();
    
    fileInput = page.locator('input[type="file"]').nth(1);
    await fileInput.setInputFiles(jdPath);
    await expect(page.locator('text=JD:')).toBeVisible();
    
    // Hover over "Refresh Data" button
    await page.hover('button:has-text("Refresh Data")');
    
    // Should show cost estimate
    await expect(page.locator('text=~$0.02')).toBeVisible();
    
    // Click to extract
    await page.click('button:has-text("Refresh Data")');
    await expect(page.locator('text=Analyzed')).toBeVisible({ timeout: 30000 });
    
    // Verify cost was logged
    const response = await page.request.post(`/api/jobs/${jobId}/refresh-variants`);
    const data = await response.json();
    
    expect(data.totalCost).toBeTruthy();
    expect(parseFloat(data.totalCost.replace('$', ''))).toBeLessThan(0.05);
    
    console.log(`✅ Extraction cost: ${data.totalCost}`);
  });
  
  // === TEST 8: Error Handling ===
  test('handles corrupted PDF gracefully', async ({ page }) => {
    const corruptedPath = path.join(__dirname, 'fixtures/data-pipeline/corrupted.pdf');
    
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(corruptedPath);
    
    await page.click('button:has-text("Refresh Data")');
    
    // Should show error message
    await expect(page.locator('text=PDF parsing failed')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Try converting to .docx')).toBeVisible();
    
    // Should NOT have created variants
    const variants = await db
      .select()
      .from(artifactVariants)
      .limit(1);
    
    expect(variants.length).toBe(0);
    
    console.log(`✅ Error handling works`);
  });
});
```

---

## 📊 Test Data Content

### test-resume.pdf Content:

```
John Doe
Senior Software Engineer
Email: john.doe@example.com | Phone: 555-0123
LinkedIn: linkedin.com/in/johndoe

SUMMARY
Software engineer with 8+ years of experience building scalable web applications.
Expertise in Python, React, and AWS cloud infrastructure.

EXPERIENCE

Senior Software Engineer | Tech Company A | 2020 - Present
- Led team of 5 engineers to migrate monolithic application to microservices architecture
- Reduced API response latency by 60% (from 800ms to 320ms) through optimization
- Designed and implemented RESTful APIs serving 1M+ requests per day
- Technologies: Python, Django, Docker, Kubernetes, AWS

Software Engineer | Tech Company B | 2018 - 2020
- Developed backend services using Python and Flask
- Built data pipelines processing 100K+ records daily
- Collaborated with frontend team (React) on API integration
- Technologies: Python, Flask, PostgreSQL, Redis, AWS Lambda

Junior Developer | Startup C | 2016 - 2018
- Built web applications using JavaScript and Node.js
- Implemented user authentication and authorization systems
- Technologies: Node.js, Express, MongoDB

EDUCATION
BS in Computer Science | University of Technology | 2016
Relevant Courses: Algorithms, Data Structures, Database Systems, Web Development

SKILLS
Languages: Python, JavaScript, TypeScript, SQL
Frameworks: Django, Flask, React, Node.js
Tools: Docker, Kubernetes, Git, AWS, PostgreSQL, Redis
Methodologies: Agile, Scrum, CI/CD, Test-Driven Development

CERTIFICATIONS
AWS Certified Solutions Architect - Associate | 2021
```

### test-jd.pdf Content:

```
Senior Software Engineer
Tech Company A | San Francisco, CA (Remote OK)

ABOUT THE ROLE
We're looking for a Senior Software Engineer to join our Platform team. You'll be responsible
for designing and building scalable backend services that power our core product.

REQUIREMENTS
- 5+ years of software engineering experience
- Strong proficiency in Python and Django framework
- Experience with microservices architecture and Docker/Kubernetes
- Solid understanding of RESTful API design
- Experience with AWS cloud services
- Strong SQL and database optimization skills
- Bachelor's degree in Computer Science or related field

PREFERRED QUALIFICATIONS
- Experience leading technical teams
- Knowledge of React for frontend integration
- Experience with high-traffic systems (1M+ requests/day)
- AWS certifications
- Open source contributions

RESPONSIBILITIES
- Design and implement backend services and APIs
- Lead technical discussions and architecture decisions
- Mentor junior engineers
- Collaborate with product and frontend teams
- Optimize system performance and reliability
- Participate in code reviews and technical planning

NICE TO HAVE
- Experience with GraphQL
- Knowledge of machine learning systems
- Published technical blog posts or talks

We offer competitive salary, equity, comprehensive health benefits, and flexible remote work.
```

---

## ✅ Expected Test Results

After running tests, we should see:

```
✅ All 8 tests pass
✅ Raw extraction: 100% success (PDF, DOCX, TXT)
✅ AI normalized variant: Created as plain TEXT
✅ AI detailed variant: Created as plain TEXT
✅ Viewer modal: Displays all 3 variants
✅ Change detection: Identifies added/removed/updated content
✅ Error handling: Graceful failure for corrupted files
✅ Cost: < $0.05 per extraction (2 documents × 2 variants)
```

---

## 🎯 Success Criteria

Before marking as complete:

1. [ ] Raw extraction works for PDF, DOCX, TXT
2. [ ] AI creates NORMALIZED text (not JSON)
3. [ ] AI creates DETAILED text (not JSON)
4. [ ] All 3 variants viewable in UI
5. [ ] Change detection identifies major/minor/none
6. [ ] Cost < $0.05 per job (2 docs)
7. [ ] E2E tests all pass
8. [ ] Error handling tested with corrupted files
9. [ ] Bundle system uses .text property from variants
10. [ ] Match Score analysis still works (can handle text variants)

---

**Next Step**: Update `refresh-variants/route.ts` with correct text-based prompts!

