# Match Score Analysis v1.0

## Your Task
Generate a quick overall match score between a resume and job description, with key highlights and gaps.

## Input Data
You will receive:
- **Resume (AI-Optimized)**: {{resumeVariant}}
- **Job Description (AI-Optimized)**: {{jdVariant}}
- **Company Name**: {{companyName}}

## Required Output Format

Return a JSON object with this exact structure:

```json
{
  "overallScore": 0.85,
  "categoryBreakdown": {
    "technical": {"score": 0.82, "weight": 0.40},
    "experience": {"score": 0.88, "weight": 0.35},
    "softSkills": {"score": 0.85, "weight": 0.25}
  },
  "topStrengths": [
    "Strong React expertise (3 years) matches key requirement",
    "Proven startup experience aligns with company stage",
    "Leadership experience (managed team of 5)"
  ],
  "topGaps": [
    "Limited PostgreSQL experience (1 year vs 3+ required)",
    "No CI/CD pipeline experience mentioned",
    "Missing domain-specific regulatory knowledge"
  ],
  "quickRecommendation": "Strong overall fit (85%). Highlight React projects and startup adaptability. Address PostgreSQL gap in cover letter or be prepared to discuss learning plan.",
  "confidence": 0.90
}
```

## Scoring Guidelines

### Overall Score Calculation
```
Overall = (technical × 0.40) + (experience × 0.35) + (softSkills × 0.25)
```

### Score Ranges
- **90-100%**: Exceptional fit, rare to find
- **80-89%**: Strong fit, highly competitive candidate
- **70-79%**: Good fit, meets most requirements
- **60-69%**: Moderate fit, has potential with gaps
- **<60%**: Weak fit, significant gaps

### Category Scoring

**Technical (40% weight):**
- Required skills match
- Tech stack alignment
- Tools/platforms experience
- Certifications

**Experience (35% weight):**
- Years of experience
- Industry background
- Company size/type match
- Role progression

**Soft Skills (25% weight):**
- Communication
- Leadership
- Collaboration
- Domain knowledge

## Analysis Rules

1. **Be Conservative**: Better to underestimate than overestimate
2. **Evidence-Based**: Every score must cite specific resume/JD text
3. **Balanced**: Include both strengths and gaps (3-5 each)
4. **Actionable**: Recommendations should be specific and achievable
5. **Realistic Confidence**: Use 0.85-0.95 for complete data, 0.60-0.80 if data sparse

## Quality Checks
- [ ] Overall score is weighted average of categories
- [ ] All category weights sum to 1.0
- [ ] All scores between 0.0 and 1.0
- [ ] 3-5 top strengths listed
- [ ] 3-5 top gaps listed
- [ ] Quick recommendation is actionable (1-2 sentences)
- [ ] Confidence reflects data completeness

Do not deviate from this format. Return JSON only, no markdown or explanatory text.

