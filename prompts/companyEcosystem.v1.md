# Company Ecosystem Matrix v1.0

## Your Task
Identify and score companies in this company's ecosystem for career exploration and interview preparation.

## Input Data
You will receive:
- **Job Description (AI-Optimized)**: {{jdVariant}}
- **Company Name**: {{companyName}}
- **Company Intelligence**: {{companyIntel}} (optional, from previous analysis)

## Required Output Format

Return a JSON object with this exact structure:

```json
{
  "ecosystem": [
    {
      "name": "CompanyName",
      "category": "direct" | "adjacent" | "upstream" | "downstream" | "complementary",
      "relevanceScore": 85,
      "reason": "One sentence explaining why this company is relevant",
      "careerOpportunity": "high" | "medium" | "low",
      "interviewRelevance": "Likely discussion topic in interview"
    }
  ],
  "summary": {
    "totalCompanies": 20,
    "directCompetitors": 5,
    "adjacentMarkets": 8,
    "partnerEcosystem": 7
  },
  "insights": [
    "This is a competitive market with 5 major players",
    "Strong partner ecosystem suggests collaborative culture",
    "Adjacent opportunities in fintech for career pivoting"
  ]
}
```

## Categories Explained

### **Direct Competitors** (Same Product/Market)
- Companies solving the exact same problem
- Customer would choose between these options
- **Relevance Score**: 80-100%
- **Examples**: Notion vs Asana, AWS vs Google Cloud

### **Adjacent Markets** (Related but Different)
- Similar tech stack, different customer segment
- Complementary products
- Career pivot opportunities
- **Relevance Score**: 60-79%
- **Examples**: Slack (if analyzing Notion), Stripe (if analyzing Shopify)

### **Upstream Partners** (Supply Chain)
- Companies this company depends on
- Technology providers, infrastructure
- **Relevance Score**: 50-70%
- **Examples**: AWS (if analyzing SaaS company), Twilio (if analyzing messaging app)

### **Downstream Partners** (Distribution)
- Companies that use/integrate this product
- Major customers or integration partners
- **Relevance Score**: 40-60%
- **Examples**: Enterprise customers, platform integrations

### **Complementary** (Better Together)
- Products often used alongside
- Non-competitive but synergistic
- **Relevance Score**: 50-75%
- **Examples**: Figma + Notion, GitHub + CircleCI

## Analysis Guidelines

### 1. Identify 15-25 Companies
- **Direct**: 4-6 companies (highest relevance)
- **Adjacent**: 6-10 companies (good career pivot options)
- **Upstream**: 2-4 companies (understand dependencies)
- **Downstream**: 2-4 companies (understand customer base)
- **Complementary**: 3-5 companies (interview talking points)

### 2. Score Relevance (0-100)
- **95-100**: Perfect alternative (near-identical product)
- **85-94**: Strong competitor/partner (overlapping market)
- **70-84**: Adjacent opportunity (related but distinct)
- **60-69**: Ecosystem player (indirect connection)
- **50-59**: Tangential (weak connection)

### 3. Career Opportunity Assessment
- **High**: Similar role exists, good hiring, strong growth
- **Medium**: Role exists but competitive or slower growth
- **Low**: Limited opportunities or declining market

### 4. Interview Relevance
- Flag companies likely to be discussed in interviews
- "How do you compare to [Competitor X]?"
- "Have you considered [Partner Y]?"

## Strict Rules

1. **Research Quality**: Use your knowledge of tech industry, public companies, recent news
2. **No Hallucination**: Only include companies you're confident exist
3. **Realistic Scores**: Most companies should be 60-85%, not 95%+
4. **Career Focus**: Prioritize companies user might apply to next
5. **Interview Prep**: Flag companies interviewer will likely mention

## Example Output

```json
{
  "ecosystem": [
    {
      "name": "Notion",
      "category": "direct",
      "relevanceScore": 95,
      "reason": "Direct competitor in collaborative workspace market with similar product features",
      "careerOpportunity": "high",
      "interviewRelevance": "Very likely - main competitor comparison"
    },
    {
      "name": "Asana",
      "category": "direct",
      "relevanceScore": 88,
      "reason": "Project management focus with overlapping features and target market",
      "careerOpportunity": "high",
      "interviewRelevance": "Likely - another major competitor"
    },
    {
      "name": "Slack",
      "category": "complementary",
      "relevanceScore": 72,
      "reason": "Complementary communication tool, often used alongside collaboration platforms",
      "careerOpportunity": "medium",
      "interviewRelevance": "Possible - integration partner discussion"
    },
    {
      "name": "AWS",
      "category": "upstream",
      "relevanceScore": 65,
      "reason": "Infrastructure provider - likely hosting platform for this SaaS product",
      "careerOpportunity": "medium",
      "interviewRelevance": "Possible - technical infrastructure discussion"
    },
    {
      "name": "Figma",
      "category": "adjacent",
      "relevanceScore": 68,
      "reason": "Real-time collaboration technology in different product category (design vs docs)",
      "careerOpportunity": "high",
      "interviewRelevance": "Possible - similar tech stack discussion"
    }
  ],
  "summary": {
    "totalCompanies": 20,
    "directCompetitors": 5,
    "adjacentMarkets": 8,
    "partnerEcosystem": 7
  },
  "insights": [
    "Highly competitive market with strong direct competitors (Notion, Asana)",
    "Rich partner ecosystem suggests collaborative, integration-friendly culture",
    "Adjacent opportunities in design tools (Figma, Miro) for career pivoting",
    "Strong upstream dependencies on AWS/cloud infrastructure"
  ]
}
```

## Remember

- Focus on companies user might apply to next (career opportunity)
- Flag companies interviewer will likely ask about (interview prep)
- Be conservative with scores (60-85% is realistic)
- Keep reasons to one clear sentence
- Return valid JSON only, no markdown


