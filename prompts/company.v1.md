# Company Intelligence Analysis v1.0

## Your Task
Analyze a company based on job description and web research. Use your knowledge + web search to gather comprehensive intel.

## Input Data
You will receive:
- **Job Description (AI-Optimized)**: {{jdVariant}}
- **Company Name**: {{companyName}} (extracted from JD)
- **Web Search Results**: {{webSearchResults}} (from Tavily API, pre-fetched for you)

## Web Search Results Format
The web search results are provided with source weighting:
- **primary** (company_website): Official company information - HIGHEST PRIORITY
- **high** (recent_news, culture): Recent announcements, leadership changes, company principles - PRIORITIZE THESE
- **medium** (news): General news articles - use if no better source available

## Source Prioritization Rules
1. **Company Website** (primary): Use for official facts (founding year, employee count, mission, principles)
2. **Recent News (2024-2025)** (high): Use for CEO/leadership info, recent changes, current status
3. **Culture/Principles** (high): Use for company values, operating system, cultural keywords
4. **Older News (< 2024)** (medium): Use only if no recent data available

### Handling Conflicting Information
If sources disagree (e.g., different CEO names):
- **Priority Order**: Recent news > Company website > Older news
- **Recency Matters**: For leadership roles, prefer sources from last 6 months
- **Example**: If 2024 news says "New CEO John Doe" but older sources say "CEO Jane Smith", use John Doe

**Budget**: 10-12 web searches per analysis (~$0.10-0.15 additional cost via Tavily)

## Required Output Format

**IMPORTANT**: You MUST return a JSON object matching this exact schema. Do not deviate from this format. If data is unavailable, use null or empty arrays.

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
    "principles": ["Official framework principle 1", "principle 2"],
    "cultureOfficial": ["Official value 1", "value 2"],
    "cultureEmployeeSentiment": {
      "positive": ["Great work-life balance", "Smart colleagues", "Good benefits"],
      "negative": ["Slow decision making", "Lots of meetings", "Limited growth"],
      "overall": "Generally positive (3.8/5.0)",
      "sourceCount": 10
    },
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

### 3. Company Principles - Official Framework (3-5 items) ⭐ INTERVIEW KEYWORDS!
- **What to look for**: Named corporate frameworks, operating systems, core principles
- **Examples**: "Fortive Business System", "Toyota Production System", "Amazon Leadership Principles"
- **Primary Sources**: Company website (About Us, Careers), investor relations, annual reports
- **Search Priority**: Company website results > news articles
- **Format**: Specific, named principles (not generic values)
- **Why Critical**: Candidates are expected to use these exact terms in interviews!
- **If not found**: Return empty array (don't make up generic values)

### 4. Official Culture & Values (3-5 items)
- **Sources**: Company "About Us", careers page, mission statements
- **Extract**: What the company officially promotes as their values
- **Examples**: "Innovation", "Collaboration", "Customer First"
- **Distinct from Principles**: These are broader values, not named frameworks

### 5. Employee Sentiment (MUST include both positive AND negative)
**From Web Search Results** (Glassdoor, Reddit, Blind, etc.):

**Positive (Top 3 themes)**:
- Most frequently mentioned pros from reviews
- Recent praise (2024-2025 preferred)
- Examples: "Great work-life balance", "Smart colleagues", "Good benefits"

**Negative (Top 3 challenges)**:
- Most common complaints or concerns
- Be honest - this helps candidates make informed decisions
- Examples: "Slow decision making", "Lots of meetings", "Limited growth opportunities"

**Overall Sentiment**:
- Synthesize into rating format: "Generally positive (3.8/5.0)"
- Or: "Mixed reviews (3.2/5.0)", "Very positive (4.5/5.0)"
- Base on source data, not speculation

**Source Count**:
- How many review sources you analyzed (max 10)
- Mix of positive and negative sources

**Important**: ALWAYS include negative feedback if found. Balanced view is crucial for candidates!

### 6. Leadership (Top 3-5 people)
- CEO, CTO, or relevant executives
- Include their background if available
- Focus on those mentioned in JD or context

### 7. Competitors (Top 10-20)
**Direct Competitors** (same product/market):
- Companies solving the same problem
- Direct alternatives customers would consider
- Score 80-100% relevance

**Adjacent Companies** (related but different):
- Complementary products
- Similar tech stack, different market
- Potential career pivot opportunities
- Score 50-79% relevance

### 8. Sources
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

