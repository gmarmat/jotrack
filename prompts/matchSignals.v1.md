# Match Signals Analysis Prompt v1

## Context
You are analyzing a job description and resume to generate a comprehensive fit assessment using a hybrid signal system.

## Input Data
- **Job Description**: {jobDescription}
- **Resume**: {resume}
- **Company Name**: {companyName}

## Your Task
Generate a match analysis with 50 signals total:
- **20 Core ATS Signals** (predefined industry standards)
- **30 Dynamic Signals** (specific to this job and company)

Distribute signals across 3 categories:
1. **Technical Skills & Expertise** (~17 signals)
2. **Relevant Experience** (~17 signals)
3. **Domain Knowledge** (~16 signals)

## Core ATS Signals (Always Include These 20)

### Technical (7 signals)
1. Required tech stack match
2. Programming language proficiency
3. Framework/library expertise
4. Tool/platform familiarity
5. Certification alignment
6. Version control systems
7. CI/CD pipeline knowledge

### Experience (7 signals)
8. Years of experience match
9. Industry experience
10. Role/title progression
11. Company size/type match
12. Team size managed
13. Project scale/complexity
14. Remote work experience

### Domain (6 signals)
15. Domain expertise
16. Regulatory knowledge
17. Methodology familiarity (Agile, etc)
18. Soft skills match
19. Communication skills
20. Leadership indicators

## Dynamic Signals (Generate 30 More)
Analyze the JD deeply to identify:
- **Implicit requirements** not explicitly stated
- **Company culture signals** (startup vs enterprise, innovation vs stability)
- **Role-specific skills** unique to this position
- **Growth potential signals** (learning agility, adaptability)
- **Collaboration signals** (cross-functional work, stakeholder management)

### Examples of Dynamic Signals:
- "Startup environment adaptability" (if company is early-stage)
- "Customer-facing communication" (if role involves client interaction)
- "Data-driven decision making" (if analytics mentioned)
- "Ambiguity tolerance" (if role is undefined/new)
- "Teaching/mentorship capability" (if team growth mentioned)

## Required Output Format

You MUST return a JSON object matching this exact schema:

```json
{
  "overallScore": 0.85,
  "categoryScores": {
    "technical": 0.82,
    "experience": 0.88,
    "domain": 0.85
  },
  "signals": [
    {
      "id": "ats-tech-stack",
      "name": "Required tech stack match",
      "category": "technical",
      "weight": 0.08,
      "score": 0.75,
      "evidence": "JD requires React, Node.js, PostgreSQL. Resume shows 3 years React, 2 years Node, 1 year PostgreSQL.",
      "reasoning": "Strong match on frontend (React) but limited backend database experience",
      "source": "ats"
    },
    {
      "id": "dynamic-startup-adaptability",
      "name": "Startup environment adaptability",
      "category": "domain",
      "weight": 0.04,
      "score": 0.90,
      "evidence": "Resume shows 2 startup roles (0-50 employees), built features from scratch",
      "reasoning": "Demonstrated ability to thrive in ambiguous, fast-paced environments",
      "source": "dynamic"
    }
  ],
  "highlights": [
    "Strong frontend expertise with React (3 years)",
    "Proven startup experience (2 previous early-stage companies)",
    "Leadership indicators: managed team of 5"
  ],
  "gaps": [
    "Limited PostgreSQL experience (only 1 year vs 3+ years required)",
    "No mention of CI/CD in resume",
    "Missing domain-specific regulatory knowledge"
  ],
  "recommendations": [
    "Highlight React projects prominently in application",
    "Address PostgreSQL gap: take online course or contribute to open-source project",
    "Prepare examples of handling ambiguity in interviews (plays to startup strength)"
  ],
  "sources": [
    {
      "url": "job_description_analysis",
      "title": "Job Description Requirements",
      "type": "other",
      "dateAccessed": "{currentDate}",
      "relevance": "Primary source for all signal requirements"
    },
    {
      "url": "resume_analysis",
      "title": "Candidate Resume",
      "type": "other",
      "dateAccessed": "{currentDate}",
      "relevance": "Primary source for all candidate evidence"
    }
  ]
}
```

## Scoring Guidelines
- **Score Range**: 0.0 to 1.0 (0% to 100%)
- **Weight Range**: 0.0 to 1.0 (all weights should sum to 1.0)
- **Weight Distribution**: Higher weights for core technical skills and key requirements
- **Evidence**: Be specific with numbers, years, project names
- **Reasoning**: Explain why the score is what it is

## Quality Checks
- [ ] Exactly 50 signals (20 ATS + 30 dynamic)
- [ ] All signals distributed across 3 categories
- [ ] All weights sum to 1.0
- [ ] All scores between 0.0 and 1.0
- [ ] Every signal has concrete evidence from resume or JD
- [ ] Every signal has clear reasoning
- [ ] Highlights focus on strengths (3-5 items)
- [ ] Gaps focus on weaknesses (3-5 items)
- [ ] Recommendations are actionable (3-5 items)
- [ ] Sources properly attributed

Do not deviate from this format. If data is unavailable, use null or empty arrays.

