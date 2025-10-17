# Match Score & Skills Analysis v1.0

## Your Task
Generate a comprehensive match analysis between a resume and job description, including:
1. Overall match score with category breakdown
2. Detailed skills matching (technical, soft skills, domain knowledge)
3. Key highlights and gaps
4. Actionable recommendations

## Input Data
You will receive:
- **Resume (AI-Optimized)**: {{resumeVariant}}
- **Job Description (AI-Optimized)**: {{jdVariant}}
- **Company Name**: {{companyName}}
- **User Extended Profile** (if available): {{userProfile}}

## Required Output Format

Return a JSON object with this exact structure:

```json
{
  "matchScore": {
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
  },
  "skillsMatch": {
    "overallMatchPercentage": 78,
    "technicalSkills": [
      {
        "skill": "React",
        "category": "frontend",
        "jdCount": 8,
        "resumeCount": 12,
        "matchStrength": "strong",
        "yearsExperience": 3,
        "importance": "critical"
      },
      {
        "skill": "PostgreSQL",
        "category": "database",
        "jdCount": 5,
        "resumeCount": 1,
        "matchStrength": "weak",
        "yearsExperience": 1,
        "importance": "important"
      }
    ],
    "softSkills": [
      {
        "skill": "Leadership",
        "jdPresent": true,
        "resumePresent": true,
        "evidence": "Managed team of 5 engineers",
        "matchStrength": "strong"
      }
    ],
    "missingCriticalSkills": [
      "CI/CD pipelines",
      "Kubernetes"
    ],
    "unexpectedStrengths": [
      "GraphQL expertise not mentioned in JD but valuable"
    ],
    "transferableSkills": [
      "E-commerce experience applicable to fintech domain"
    ]
  }
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

### Skills Match Strength
- **strong**: Skill appears frequently in both JD and resume, with sufficient years of experience
- **moderate**: Skill present in both but with limited depth or experience
- **weak**: Skill mentioned in JD but missing or minimal in resume
- **transferable**: Related skill that can substitute for missing requirement

### Skill Importance Levels
- **critical**: Must-have for the role (deal-breaker if missing)
- **important**: Strongly preferred, significant advantage
- **nice-to-have**: Beneficial but not essential

## Analysis Rules

1. **Be Conservative**: Better to underestimate than overestimate
2. **Evidence-Based**: Every score must cite specific resume/JD text
3. **Balanced**: Include both strengths and gaps (3-5 each)
4. **Actionable**: Recommendations should be specific and achievable
5. **Realistic Confidence**: Use 0.85-0.95 for complete data, 0.60-0.80 if data sparse
6. **Consider Extended Profile**: If userProfile is provided, use it to fill gaps in resume (e.g., additional skills, certifications, side projects)
7. **Skills Categorization**: Group skills by category (frontend, backend, database, devops, cloud, etc.)
8. **Transferable Skills**: Identify skills from different domains that are applicable
9. **Match 10-15 key skills**: Focus on the most important skills, not every possible keyword

## Quality Checks
- [ ] Overall score is weighted average of categories
- [ ] All category weights sum to 1.0
- [ ] All scores between 0.0 and 1.0
- [ ] 3-5 top strengths listed
- [ ] 3-5 top gaps listed
- [ ] Quick recommendation is actionable (1-2 sentences)
- [ ] Confidence reflects data completeness
- [ ] Skills match includes 10-15 most relevant skills
- [ ] Missing critical skills identified
- [ ] Unexpected strengths noted
- [ ] Transferable skills identified

Do not deviate from this format. Return JSON only, no markdown or explanatory text.
