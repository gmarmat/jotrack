# User Profile Building v1.0

## Your Task
Build a comprehensive job-specific user profile from resume and analysis results to support personalized coaching and interview prep.

## Input Data
You will receive:
- **Resume (AI-Optimized)**: {{resumeVariant}}
- **Job Description (AI-Optimized)**: {{jdVariant}}
- **Match Analysis**: {{matchAnalysis}} (optional)
- **Existing Job Profile**: {{existingJobProfile}} (optional, for updates)
- **Global Profile**: {{globalProfile}} (optional, for context)

## Required Output Format

Return a JSON object with this exact structure:

```json
{
  "jobSpecific": {
    "targetRole": "Senior Product Manager",
    "keyStrengths": [
      "5 years PM experience with B2B SaaS products",
      "Led cross-functional teams of 10+ engineers and designers",
      "Shipped 3 major features with 10M+ DAU each"
    ],
    "relevantAchievements": [
      {
        "achievement": "Launched search feature used by 10M+ daily users",
        "relevance": "high",
        "reason": "Demonstrates scale and user-facing product experience matching JD requirement",
        "starStory": {
          "situation": "Search feature was slow and users were complaining",
          "task": "Improve search performance and add advanced filters",
          "action": "Led 6-month project with 5 engineers, implemented Elasticsearch, A/B tested UI",
          "result": "50% faster search, 35% increase in engagement, 10M+ DAU"
        }
      }
    ],
    "skillsForThisRole": {
      "strong": ["Product Strategy", "Agile", "SQL", "User Research"],
      "developing": ["PostgreSQL", "Machine Learning", "Data Science"],
      "missing": ["Kubernetes", "GraphQL"]
    },
    "gapClosingPlan": [
      {
        "gap": "Limited PostgreSQL experience",
        "action": "Complete online course or contribute to open-source project",
        "timeframe": "1-2 weeks",
        "priority": "high"
      }
    ],
    "interviewStories": [
      {
        "topic": "Leadership",
        "story": "Led team of 12 to launch feature with 10M DAU",
        "keywords": ["cross-functional", "scale", "data-driven"],
        "duration": "2-3 minutes"
      }
    ],
    "uniqueValueProps": [
      "Rare combination: PM + SQL skills (only 20% of PMs have technical depth)",
      "Proven at scale: 10M+ DAU experience",
      "Startup to enterprise: worked at both 50-person and 5000-person companies"
    ]
  },
  "globalInsights": [
    {
      "insight": "Strong track record launching features that achieve 10M+ DAU",
      "category": "product_impact",
      "confidence": 0.95,
      "source": "resume",
      "applicableToFutureJobs": true
    },
    {
      "insight": "Comfortable leading cross-functional teams of 10-15 people",
      "category": "leadership",
      "confidence": 0.90,
      "source": "resume",
      "applicableToFutureJobs": true
    }
  ],
  "metadata": {
    "profileVersion": "1.0",
    "lastUpdated": "{{timestamp}}",
    "confidence": 0.88,
    "dataCompleteness": "high"
  }
}
```

## Analysis Guidelines

### 1. Job-Specific Profile (Tailored to THIS Job)

**Key Strengths (3-5 items):**
- Most relevant skills/experiences for THIS role
- Quantified achievements
- Unique combinations

**Relevant Achievements (3-5 STAR stories):**
- Filter resume achievements for THIS job's requirements
- Each achievement marked with relevance (high/medium/low)
- Pre-formatted as STAR stories for interviews
- Include keywords from JD

**Skills Categorization:**
- **Strong**: Matches JD requirements, years of experience
- **Developing**: Some experience but needs growth
- **Missing**: Required by JD but not in resume

**Gap Closing Plan:**
- Prioritize gaps by importance to role
- Suggest actionable steps (courses, projects, etc.)
- Realistic timeframes

**Interview Stories (5-7 stories):**
- Cover common topics: Leadership, Technical, Conflict, Failure, Success
- 2-3 minute duration each
- Include keywords from JD for natural integration

**Unique Value Props (2-3 items):**
- What makes THIS candidate stand out
- Rare skill combinations
- Proven at scale
- Industry-specific expertise

### 2. Global Insights (Reusable Across Jobs)

Extract insights that are:
- ✅ Generic enough for future jobs
- ✅ High confidence (supported by evidence)
- ✅ Transferable skills/achievements
- ✅ Not role-specific

**Categories:**
- `product_impact` - Shipped features, user growth
- `leadership` - Team management, mentorship
- `technical` - Programming, tools, platforms
- `domain` - Industry knowledge
- `soft_skills` - Communication, collaboration
- `achievements` - Awards, recognition, promotions

## Scoring Guidelines

### Relevance Score
- **High**: Directly addresses JD requirement
- **Medium**: Related but not exact match
- **Low**: Tangentially relevant

### Confidence Score
- **0.90-1.0**: Explicit evidence in resume
- **0.75-0.89**: Inferred from experience
- **0.60-0.74**: Reasonable assumption
- **<0.60**: Speculative (avoid)

### Career Opportunity
- **High**: Company hiring, strong growth, good fit
- **Medium**: Stable but competitive
- **Low**: Limited opportunities or weak fit

## STAR Story Format

For each relevant achievement, structure as:
- **S**ituation: Context (1 sentence)
- **T**ask: Challenge/goal (1 sentence)
- **A**ction: What you did (2-3 sentences with specifics)
- **R**esult: Outcome with metrics (1 sentence)

**Keep each story to 2-3 minutes when spoken.**

## Quality Checks

- [ ] 3-5 key strengths specific to THIS job
- [ ] 3-5 relevant achievements with STAR format
- [ ] Skills categorized (strong/developing/missing)
- [ ] 2-4 gap closing plans prioritized
- [ ] 5-7 interview stories covering common topics
- [ ] 2-3 unique value propositions
- [ ] Global insights marked as applicable to future jobs
- [ ] All confidence scores between 0.60-1.0
- [ ] Metadata includes version, timestamp, confidence

## Strict Rules

1. **Evidence-Based**: Every claim must be supported by resume text
2. **No Speculation**: Use null/empty if not in resume
3. **Quantify**: Always include numbers, percentages, timeframes
4. **Relevance**: Focus on THIS job's requirements
5. **Actionable**: Stories and gaps should be interview-ready

Do not deviate from this format. Return JSON only, no markdown or explanatory text.

