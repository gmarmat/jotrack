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
9. **Match 15-25 key skills**: Focus on the most important and frequently mentioned skills

## Keyword Matching Strategy (CRITICAL for Visual Word Cloud)

**Purpose**: Generate a rich, semantically-aware keyword cloud that shows JD-Resume alignment at a glance.

### 10. **Semantic Matching (Not Exact Text Matching)**

Match on **intent and meaning**, not just exact words:

**Examples of Good Semantic Matching:**
- JD: "React.js" ↔ Resume: "React", "ReactJS", "React Native" → **Match!**
- JD: "Kubernetes" ↔ Resume: "K8s", "container orchestration" → **Match!**
- JD: "Python" ↔ Resume: "Python 3", "Python development", "PyTorch" → **Match!**
- JD: "Team leadership" ↔ Resume: "Led team of 5", "Managed engineers" → **Match!**
- JD: "Agile" ↔ Resume: "Scrum", "Sprint planning", "Agile methodologies" → **Match!**

**DO NOT Require Exact Matches:**
- ❌ WRONG: JD says "JavaScript", resume says "JS" → No match (too strict!)
- ✅ RIGHT: JD says "JavaScript", resume says "JS", "Node.js", "TypeScript" → Match!

### 11. **Keyword Normalization Rules**

**Variants to Consider as Same Skill:**
- **Abbreviations**: AWS/Amazon Web Services, K8s/Kubernetes, JS/JavaScript
- **Versions**: Python 2/Python 3/Python, React 16/React 18/React
- **Alternate Names**: PostgreSQL/Postgres, MongoDB/Mongo, JavaScript/JS
- **Related Terms**: Docker/containerization, Kubernetes/orchestration
- **Framework Families**: React/Vue/Angular → "Frontend frameworks"

### 12. **Frequency Counting Guidelines**

**jdCount** (How many times JD mentions this skill concept):
- Count ALL semantic variations
- Include: Exact match + synonyms + related terms
- Example: JD mentions "React" 3 times, "React.js" 2 times, "React Native" 1 time → jdCount = 6

**resumeCount** (How many times Resume mentions this skill concept):
- Count ALL semantic variations
- Include context mentions (e.g., "Built with React", "React developer")
- Example: Resume says "React" 5 times, "ReactJS" 3 times → resumeCount = 8

**fullProfileCount** (Extended profile mentions):
- If userProfile provided, count additional mentions not in resume
- Side projects, certifications, courses mentioning the skill

### 13. **Skill Extraction Priority**

Extract skills in this order:

1. **Exact technical terms** (React, AWS, Python)
2. **Related semantic variants** (JS/JavaScript, K8s/Kubernetes)
3. **Skill categories** (Frontend, Backend, DevOps)
4. **Contextual skills** ("Team leadership" from "Led team of 5")
5. **Domain concepts** ("E-commerce" from "Built shopping platform")

### 14. **Visual Word Cloud Optimization**

**Goal**: Create a keyword cloud that's:
- ✅ Visually rich (15-25 keywords, not just 3-5)
- ✅ Semantically accurate (intent > exact match)
- ✅ Informative (shows both matches and gaps)
- ✅ Interview-relevant (focuses on skills likely to be discussed)

**Minimum Coverage:**
- Include ALL critical/important skills from JD (even if missing in resume)
- Include top 10 most frequent JD keywords
- Include top 5 unexpected resume strengths
- Total: 15-25 keywords for comprehensive view

## Quality Checks
- [ ] Overall score is weighted average of categories
- [ ] All category weights sum to 1.0
- [ ] All scores between 0.0 and 1.0
- [ ] 3-5 top strengths listed
- [ ] 3-5 top gaps listed
- [ ] Quick recommendation is actionable (1-2 sentences)
- [ ] Confidence reflects data completeness
- [ ] Skills match includes 15-25 keywords (rich word cloud!)
- [ ] Semantic matching used (React = React.js = ReactJS)
- [ ] All critical JD skills represented (even if missing in resume)
- [ ] Missing critical skills identified
- [ ] Unexpected strengths noted
- [ ] Transferable skills identified
- [ ] Keyword frequencies reflect semantic grouping (not exact text matches)

## Keyword Matching Examples (For Word Cloud Quality)

### Example 1: Good Semantic Matching

**JD Excerpt:**
"We're looking for a React developer with experience in TypeScript, AWS, and CI/CD pipelines."

**Resume Excerpt:**
"Built responsive web apps with React.js and TS. Deployed on Amazon Web Services using Docker."

**CORRECT Technical Skills Output:**
```json
[
  { "skill": "React", "jdCount": 1, "resumeCount": 1, "matchStrength": "strong" },
  { "skill": "TypeScript", "jdCount": 1, "resumeCount": 1, "matchStrength": "strong" },
  { "skill": "AWS", "jdCount": 1, "resumeCount": 1, "matchStrength": "strong" },
  { "skill": "CI/CD", "jdCount": 1, "resumeCount": 0, "matchStrength": "weak" },
  { "skill": "Docker", "jdCount": 0, "resumeCount": 1, "matchStrength": "strong" }
]
```

**Note**: React.js → React, TS → TypeScript, Amazon Web Services → AWS (semantic matching!)

### Example 2: Missing Skills Should Still Appear

**JD Mentions**: Kubernetes (5 times)
**Resume**: No mention of Kubernetes, K8s, or container orchestration

**CORRECT Output:**
```json
{ "skill": "Kubernetes", "jdCount": 5, "resumeCount": 0, "matchStrength": "weak", "importance": "critical" }
```

**Purpose**: Shows red/orange keyword in cloud → visual gap indicator!

### Example 3: Related Skills Count as Partial Matches

**JD**: "Experience with relational databases"
**Resume**: "PostgreSQL, MySQL, database design"

**CORRECT Output:**
```json
{ "skill": "Relational Databases", "jdCount": 1, "resumeCount": 3, "matchStrength": "strong" }
```

**Note**: PostgreSQL + MySQL semantically match "relational databases"

Do not deviate from this format. Return JSON only, no markdown or explanatory text.
