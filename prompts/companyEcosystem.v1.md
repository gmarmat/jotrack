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
  "companies": [
    {
      "name": "CompanyName",
      "category": "direct" | "adjacent" | "upstream" | "downstream" | "complementary",
      "size": {
        "employees": "1,000-5,000",
        "sizeCategory": "scaleup"
      },
      "industry": {
        "broad": "Technology",
        "specific": "SaaS"
      },
      "location": {
        "headquarters": "San Francisco, CA, USA",
        "region": "North America",
        "isRemote": true
      },
      "leadership": {
        "ceo": "Jane Doe",
        "ceoBackground": "Ex-Google PM, Stanford MBA"
      },
      "careerMetrics": {
        "growthScore": 5,
        "stabilityScore": 4,
        "retentionScore": 4,
        "avgTenure": "3.2 years"
      },
      "recentNews": {
        "positive": 3,
        "negative": 1,
        "highlights": [
          "+ Series C funding ($275M)",
          "+ 10M users milestone",
          "+ Acquired competitor",
          "- Layoffs rumor (unverified)"
        ]
      },
      "skillsIntel": {
        "currentHotSkills": ["React", "AWS", "Python"],
        "futureSkills": ["AI/ML", "Kubernetes"],
        "hiringTrend": "growing",
        "openRoles": 47
      },
      "relevanceScore": 95,
      "reason": "Direct competitor with similar product features",
      "careerOpportunity": "high",
      "interviewRelevance": "Very likely - main competitor comparison",
      "confidence": {
        "score": "high",
        "percentage": 92
      },
      "insights": "Strong growth company with excellent market position. High hiring activity and competitive compensation. Great career opportunity with proven product-market fit.",
      "sources": [
        {
          "name": "LinkedIn",
          "url": "https://linkedin.com/company/example",
          "category": "company",
          "confidence": "high"
        },
        {
          "name": "TechCrunch",
          "url": "https://techcrunch.com/example",
          "category": "news",
          "confidence": "high"
        }
      ]
    }
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

## Example Output (10 Companies for MVP)

**IMPORTANT**: Return exactly 10 companies in this priority order:
- 5 direct competitors
- 3 adjacent markets  
- 2 complementary products

```json
{
  "companies": [
    {
      "name": "Notion",
      "category": "direct",
      "size": {
        "employees": "1,000-5,000",
        "sizeCategory": "scaleup"
      },
      "industry": {
        "broad": "Technology",
        "specific": "SaaS"
      },
      "location": {
        "headquarters": "San Francisco, CA, USA",
        "region": "North America",
        "isRemote": true
      },
      "leadership": {
        "ceo": "Ivan Zhao",
        "ceoBackground": "Ex-Inkling, Y Combinator"
      },
      "careerMetrics": {
        "growthScore": 5,
        "stabilityScore": 4,
        "retentionScore": 4,
        "avgTenure": "3.2 years"
      },
      "recentNews": {
        "positive": 3,
        "negative": 1,
        "highlights": [
          "+ Series C funding ($275M) - Oct 2024",
          "+ 10M users milestone - Sept 2024",
          "+ Acquired Cron Calendar - Aug 2024",
          "- Layoffs rumor (unverified) - Sept 2024"
        ]
      },
      "skillsIntel": {
        "currentHotSkills": ["React", "TypeScript", "PostgreSQL"],
        "futureSkills": ["AI/ML", "Real-time Collaboration"],
        "hiringTrend": "growing",
        "openRoles": 47
      },
      "relevanceScore": 95,
      "reason": "Direct competitor in collaborative workspace market with similar product features and tech stack",
      "careerOpportunity": "high",
      "interviewRelevance": "Very likely - main competitor comparison will be discussed",
      "confidence": {
        "score": "high",
        "percentage": 92
      },
      "insights": "Strong growth company with excellent market position and $275M Series C. High hiring activity (47 roles) indicates expansion. Competitive compensation and strong technical culture with emphasis on design. Great career opportunity with proven product-market fit.",
      "sources": [
        {
          "name": "LinkedIn",
          "url": "https://linkedin.com/company/notion",
          "category": "company",
          "confidence": "high"
        },
        {
          "name": "TechCrunch",
          "url": "https://techcrunch.com/notion-series-c",
          "category": "news",
          "confidence": "high"
        },
        {
          "name": "Glassdoor",
          "url": "https://glassdoor.com/notion",
          "category": "reviews",
          "confidence": "medium"
        }
      ]
    }
  ]
}
```

**Note**: For 10 companies total (MVP), focus on quality over quantity. Each company should have rich, verified data.

## Remember

- Focus on companies user might apply to next (career opportunity)
- Flag companies interviewer will likely ask about (interview prep)
- Be conservative with scores (60-85% is realistic)
- Keep reasons to one clear sentence
- Return valid JSON only, no markdown


