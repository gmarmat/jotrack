# Data Pipeline Extraction Prompts (Working Version from 80 hours ago)

These are the EXACT inline prompts from when the Data Pipeline was working perfectly.

## Location
File: `app/api/jobs/[id]/refresh-variants/route.ts`  
Function: `extractWithAI()`

---

## Resume Extraction Prompt

```javascript
if (sourceType === 'resume') {
  prompt = `
Extract structured information from this resume. Return ONLY valid JSON with no markdown formatting:

{
  "skills": ["skill1", "skill2", ...],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "duration": "Jan 2020 - Present",
      "highlights": ["achievement 1", "achievement 2"]
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "institution": "School Name",
      "year": "2020"
    }
  ],
  "summary": "Brief professional summary"
}

Resume text:
${rawText}
`;
}
```

---

## Job Description Extraction Prompt

```javascript
else if (sourceType === 'job_description') {
  prompt = `
Extract structured information from this job description. Return ONLY valid JSON with no markdown formatting:

{
  "title": "Job Title",
  "company": "Company Name",
  "required_skills": ["skill1", "skill2", ...],
  "preferred_skills": ["skill1", "skill2", ...],
  "responsibilities": ["resp1", "resp2", ...],
  "qualifications": ["qual1", "qual2", ...],
  "summary": "Brief job summary"
}

Job description text:
${rawText}
`;
}
```

---

## Cover Letter Extraction Prompt

```javascript
else {
  // cover_letter
  prompt = `
Extract key information from this cover letter. Return ONLY valid JSON with no markdown formatting:

{
  "target_company": "Company Name",
  "target_role": "Role Name",
  "key_points": ["point1", "point2", ...],
  "motivations": ["motivation1", "motivation2", ...],
  "summary": "Brief summary"
}

Cover letter text:
${rawText}
`;
}
```

---

## AI Provider Call

```javascript
const { result } = await callAiProvider('extract_structured_data', {
  prompt,
  sourceType,
}, false, 'v1');

// Parse JSON from result (handle potential markdown wrapping or direct object)
if (typeof result === 'object') {
  return result; // Already parsed
}

const jsonMatch = result.match(/\{[\s\S]*\}/);
if (!jsonMatch) {
  throw new Error('AI did not return valid JSON');
}

return JSON.parse(jsonMatch[0]);
```

---

## Comparison Prompt (For Detecting Changes)

```javascript
async function compareVariantsWithAI(
  oldVariant: any,
  newVariant: any,
  sourceType: string
): Promise<ComparisonResult> {
  const prompt = `
Compare these two ${sourceType} variants and determine what changed.
Return ONLY valid JSON with no markdown formatting:

{
  "similarity": 0.85,
  "changes": [
    { "type": "added", "category": "skill", "value": "AWS" },
    { "type": "updated", "category": "experience", "field": "current_role", "value": "New job title" },
    { "type": "removed", "category": "skill", "value": "PHP" }
  ],
  "significance": "major",
  "reasoning": "Added cloud skills and updated current role"
}

Significance levels:
- "none": Only typos/formatting changes
- "minor": Small updates that don't affect qualifications
- "major": Added/removed skills, changed jobs, updated qualifications

Old variant:
${JSON.stringify(oldVariant, null, 2)}

New variant:
${JSON.stringify(newVariant, null, 2)}
`;

  const { result } = await callAiProvider('compare_variants', {
    prompt,
    sourceType,
  }, false, 'v1');
  
  // Parse JSON from result (handle potential markdown wrapping or direct object)
  if (typeof result === 'object') {
    return result; // Already parsed
  }
  
  const jsonMatch = result.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('AI did not return valid JSON');
  }
  
  return JSON.parse(jsonMatch[0]);
}
```

---

## Key Points

1. **Inline Prompts**: These prompts are INLINE in the API route, not in separate files
2. **JSON-Only Output**: All prompts explicitly request "ONLY valid JSON with no markdown formatting"
3. **Parsing Logic**: Has fallback to extract JSON from markdown-wrapped responses
4. **Three Extraction Types**: Resume, Job Description, Cover Letter
5. **Comparison Logic**: Detects changes between versions and rates significance
6. **AI Provider**: Uses `callAiProvider()` function with 'v1' prompt version

---

## Status: ✅ PRESERVED AND WORKING

These prompts are STILL in your codebase at `app/api/jobs/[id]/refresh-variants/route.ts`.

The issue we're fixing is NOT the prompts - it's the PDF text extraction library (pdf-parse had bugs).

Now using pdfjs-dist (Mozilla's stable PDF.js) instead.

