# Company Intelligence Analysis v1.0

## Your Task
Analyze a company based on job description, public information, and any provided context URLs.

## Input Data
You will receive:
- **Job Description**: {{jobDescription}}
- **Company Name**: {{companyName}}
- **Company URLs**: {{companyUrls}}
- **Additional Context**: {{additionalContext}}

## Output Contract

Return a JSON object with this exact structure:

```json
{
  "company": {
    "name": "string",
    "founded": "number (year) or null",
    "employees": "string (e.g., '250+', '1000-5000') or null",
    "funding": "string (e.g., 'Series B', 'Public', 'Bootstrapped') or null",
    "revenue": "string (e.g., '$50M ARR') or null",
    "description": "string (1-2 sentences about what they do)",
    "keyFacts": ["fact1", "fact2", "fact3"],
    "culture": ["value1", "value2", "value3"],
    "leadership": [
      {"name": "string", "role": "string", "background": "string"}
    ],
    "competitors": ["Company1", "Company2", "Company3"]
  },
  "ecosystem": [
    {
      "name": "CompanyName",
      "category": "direct" | "adjacent",
      "relevanceScore": 0-100,
      "reason": "Why this company is relevant (1 sentence)"
    }
  ],
  "sources": ["url1", "url2", "url3"]
}
```

## Analysis Guidelines

### 1. Company Overview
- Extract founding year, employee count, funding stage from JD or context
- Write a clear 1-2 sentence description of what the company does
- Focus on their core product/service

### 2. Key Facts (3-5 items)
- Revenue/growth metrics if mentioned
- Funding information
- Notable achievements or milestones
- Market position

### 3. Culture & Values (3-5 items)
- Extract from JD language (e.g., "fast-paced", "innovative", "remote-friendly")
- Look for explicit values statements
- Infer from benefits and perks mentioned

### 4. Leadership (Top 3-5 people)
- CEO, CTO, or relevant executives
- Include their background if available
- Focus on those mentioned in JD or context

### 5. Competitors (Top 10-20)
**Direct Competitors** (same product/market):
- Companies solving the same problem
- Direct alternatives customers would consider
- Score 80-100% relevance

**Adjacent Companies** (related but different):
- Complementary products
- Similar tech stack, different market
- Potential career pivot opportunities
- Score 50-79% relevance

### 6. Sources
- List all URLs used to gather information
- Include JD link if provided
- Include context URLs that were analyzed

## Strict Rules

1. **Extraction Only**: Do NOT hallucinate. If information isn't in the input, use `null` or empty array.
2. **Evidence Required**: Every fact must be traceable to input text or sources.
3. **Conservative Scoring**: Competitor relevance should be realistic (most will be 60-85%, not 95%+).
4. **Concise**: Keep facts to 1 sentence each, descriptions to 2 sentences max.
5. **Sources**: Always include the source URL for each piece of information.

## Example Output

```json
{
  "company": {
    "name": "TechCorp Inc.",
    "founded": 2018,
    "employees": "250+",
    "funding": "Series B ($75M)",
    "revenue": "$50M ARR",
    "description": "Enterprise SaaS platform helping modern teams collaborate. Specializes in real-time document editing and project management.",
    "keyFacts": [
      "Revenue: $50M ARR with 3x YoY growth",
      "Funding: $75M total raised (Series B led by Sequoia)",
      "Customer base: 5,000+ companies including Fortune 500"
    ],
    "culture": [
      "Innovation-first mindset with weekly hackathons",
      "Remote-friendly with flexible hours",
      "Fast-paced startup environment"
    ],
    "leadership": [
      {"name": "Jane Doe", "role": "CEO", "background": "Former Google PM, Stanford MBA"},
      {"name": "John Smith", "role": "CTO", "background": "PhD Computer Science, ex-Meta"}
    ],
    "competitors": ["Notion", "Asana", "Monday.com"]
  },
  "ecosystem": [
    {"name": "Notion", "category": "direct", "relevanceScore": 95, "reason": "Direct competitor in collaborative workspace market"},
    {"name": "Asana", "category": "direct", "relevanceScore": 88, "reason": "Project management focus, overlapping features"},
    {"name": "Slack", "category": "adjacent", "relevanceScore": 72, "reason": "Complementary product, similar target market"},
    {"name": "Figma", "category": "adjacent", "relevanceScore": 65, "reason": "Real-time collaboration tech, different product category"}
  ],
  "sources": [
    "https://techcorp.com/about",
    "https://linkedin.com/company/techcorp"
  ]
}
```

## Remember

- Be conservative with scores
- Only include information you can support with evidence
- Keep descriptions concise
- Always cite sources
- Return valid JSON only, no markdown or explanatory text

