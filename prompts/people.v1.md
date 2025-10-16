# People Profiles Analysis v1.0

## Your Task
Analyze people involved in the hiring process (recruiter, hiring manager, team members, peers) to help the candidate prepare for interviews and tailor their approach.

## Input Data
You will receive:
- **Job Description**: {{jobDescription}}
- **Recruiter URL**: {{recruiterUrl}}
- **Peer URLs**: {{peerUrls}}
- **Skip-Level URLs**: {{skipLevelUrls}}
- **Additional Context**: {{additionalContext}}

## Required Output Format

**IMPORTANT**: You MUST return a JSON object matching this exact schema. Do not deviate from this format. If data is unavailable, use null or empty arrays.

Return a JSON object with this exact structure:

```json
{
  "profiles": [
    {
      "name": "string",
      "role": "Recruiter" | "Hiring Manager" | "Team Member" | "Peer" | "Skip-Level" | "Other",
      "linkedInUrl": "string or null",
      "background": ["fact1", "fact2", "fact3"],
      "expertise": ["skill1", "skill2"],
      "communicationStyle": "Professional" | "Casual" | "Technical" | "Formal",
      "whatThisMeans": "1-2 sentence interpretation for the candidate"
    }
  ],
  "overallInsights": {
    "teamDynamics": "string (1-2 sentences about team composition)",
    "culturalFit": "string (what the team values based on profiles)",
    "preparationTips": ["tip1", "tip2", "tip3"]
  },
  "sources": ["url1", "url2", "url3"]
}
```

## Analysis Guidelines

### 1. For Each Person

**Extract**:
- Name and current role
- Previous roles/companies (if available)
- Years of experience
- Education background
- Skills and expertise areas
- Notable achievements

**Infer** (conservatively):
- Communication style based on LinkedIn content
- Technical depth based on background
- What they likely value in candidates

**Provide Interpretation**:
- "What this means for you": How should the candidate approach this person?
- What topics to emphasize?
- What questions to ask?
- What to avoid?

### 2. Communication Styles

**Professional**: 
- Formal language, structured approach
- Focus on achievements and metrics
- Emphasize: Results, professionalism, experience

**Casual**:
- Informal language, friendly tone
- Focus on cultural fit and collaboration
- Emphasize: Team dynamics, personality, values

**Technical**:
- Deep technical background
- Focus on problem-solving and expertise
- Emphasize: Technical skills, architecture, best practices

**Formal**:
- Very structured, executive-level
- Focus on strategic thinking
- Emphasize: Impact, leadership, vision

### 3. Team Dynamics Analysis

Look for:
- Team size and composition
- Seniority levels
- Skill diversity
- Geographic distribution
- Reporting structure

### 4. Cultural Fit Assessment

Based on profiles, infer:
- What the team values (speed, quality, innovation, etc.)
- Work style (collaborative, autonomous, structured)
- Growth opportunities
- Mentorship availability

### 5. Preparation Tips

Provide 3-5 specific tips:
- Questions to ask specific people
- Topics to research
- Skills to highlight
- Common ground to establish

## Strict Rules

1. **Extraction Only**: Do NOT make up facts about people. If info isn't available, say "Limited information available".
2. **Respectful**: Keep interpretations professional and constructive.
3. **Conservative**: Don't over-interpret limited data.
4. **Practical**: Focus on actionable insights for interview prep.
5. **Sources**: Cite every URL used to gather information.

## Example Output

```json
{
  "profiles": [
    {
      "name": "Jane Doe",
      "role": "Recruiter",
      "linkedInUrl": "https://linkedin.com/in/janedoe",
      "background": [
        "8+ years in tech recruiting",
        "Previously at Google and Stripe",
        "Specializes in senior engineering roles"
      ],
      "expertise": ["Technical recruiting", "Engineering talent", "Startup hiring"],
      "communicationStyle": "Professional",
      "whatThisMeans": "Jane has deep technical knowledge, so be prepared to discuss technical details and system design. Emphasize your senior-level experience and architectural decisions."
    },
    {
      "name": "John Smith",
      "role": "Hiring Manager",
      "linkedInUrl": "https://linkedin.com/in/johnsmith",
      "background": [
        "Engineering Director with 12+ years experience",
        "Previously CTO at FinTech startup",
        "Stanford CS, MIT MBA"
      ],
      "expertise": ["System architecture", "Team scaling", "Fintech domain"],
      "communicationStyle": "Technical",
      "whatThisMeans": "John will likely focus on scalability, architecture decisions, and your experience building reliable financial systems. Prepare examples of handling high-stakes technical challenges."
    }
  ],
  "overallInsights": {
    "teamDynamics": "Small, senior engineering team (5-8 people) with strong fintech background. Emphasis on quality and reliability over speed.",
    "culturalFit": "Team values technical excellence, thoughtful decision-making, and mentorship. Good fit for candidates who prioritize code quality and system design.",
    "preparationTips": [
      "Research fintech regulations and compliance challenges",
      "Prepare examples of scaling systems under regulatory constraints",
      "Ask about technical debt priorities and architectural vision",
      "Discuss mentorship approach (team seems to value knowledge sharing)",
      "Show interest in financial domain knowledge"
    ]
  },
  "sources": [
    "https://linkedin.com/in/janedoe",
    "https://linkedin.com/in/johnsmith"
  ]
}
```

## Remember

- Only include facts you can support with sources
- Keep interpretations constructive and professional
- Focus on actionable insights for interview preparation
- Cite all sources
- Return valid JSON only, no markdown or explanatory text

