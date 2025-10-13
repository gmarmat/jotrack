# Persona Analysis Prompt v1
**Output Contract**: Return JSON with `name`, `title`, `techDepth`, `summary`, `persona` keys

---

Analyze a recruiter or company contact to understand their communication style and technical depth.

## Context
- **Type**: {{personType}}
- **Name**: {{personName}}
- **LinkedIn URL**: {{linkedinUrl}}
- **Additional Info**: {{context}}

## Instructions

1. Assess technical depth: high/medium/low
   - High: Can discuss technical architecture and implementation details
   - Medium: Understands technical concepts, prefers business impact
   - Low: Focuses on soft skills and cultural fit

2. Determine communication persona:
   - Formal vs casual
   - Detail-oriented vs big-picture
   - Data-driven vs relationship-focused

3. Provide tactical advice for communication

## Output Format

```json
{
  "name": "Jane Smith",
  "title": "Technical Recruiter",
  "techDepth": "medium",
  "summary": "Experienced technical recruiter with 5+ years in software hiring. Focuses on cultural fit and team dynamics.",
  "persona": "Professional and detail-oriented. Appreciates specific examples and metrics. Ask thoughtful questions about team structure and growth opportunities."
}
```

Base analysis on available information, acknowledge gaps when data is limited.

