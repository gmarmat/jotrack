// API to view the ACTUAL extraction prompts used by refresh-variants
// These are the inline prompts, not the markdown files

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/jobs/[id]/extraction-prompts
 * Returns the actual inline prompts used for variant extraction
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // These are the EXACT prompts from refresh-variants/route.ts (lines 54-113)
  
  const resumePrompt = `Extract structured information from this resume. Return ONLY valid JSON with no markdown formatting:

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
{{rawText}}`;

  const jdPrompt = `Extract structured information from this job description. Return ONLY valid JSON with no markdown formatting:

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
{{rawText}}`;

  const coverLetterPrompt = `Extract key information from this cover letter. Return ONLY valid JSON with no markdown formatting:

{
  "target_company": "Company Name",
  "target_role": "Role Name",
  "key_points": ["point1", "point2", ...],
  "motivations": ["motivation1", "motivation2", ...],
  "summary": "Brief summary"
}

Cover letter text:
{{rawText}}`;

  return NextResponse.json({
    prompts: {
      resume: resumePrompt,
      jd: jdPrompt,
      cover_letter: coverLetterPrompt
    },
    note: 'These are the actual inline prompts used in /api/jobs/[id]/refresh-variants',
    process: {
      step1: 'Upload documents → Local UTF-8 extraction (FREE) → Save as "raw" variant',
      step2: 'Click Refresh Data → Load raw variant → Send to AI with prompts above → Save "ai_optimized" and "detailed" variants',
      cost: '~$0.02 per document (2 AI variants)',
      model: 'gpt-4o-mini'
    }
  });
}

