# Company Ecosystem Matrix v1.0

## Your Task
Identify and analyze companies in this company's ecosystem to help the user prepare for interviews by understanding competitive context, market dynamics, and industry trends.

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
      "reason": "Direct competitor with similar product features and tech stack",
      "interviewPrepValue": "very-likely",
      "interviewRelevance": "Main competitor - prepare product differentiation, technical architecture, scaling challenges",
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

### 3. Interview Prep Value Assessment
- **Very Likely**: Will almost certainly be discussed (main competitors, major players)
- **Likely**: Good chance of coming up (adjacent markets, partnerships)
- **Possible**: Might be mentioned (complementary products, upstream/downstream)
- **Unlikely**: Rarely discussed (tangential connections)

### 4. Interview Talking Points
- What to prepare for each company (product comparison, market position, etc.)
- Likely interview questions: "How do you compare to X?" "What makes you different from Y?"
- Smart responses the user can craft based on this research

### 5. Quick Insights (2-3 Sentences)
Generate a concise summary for each company focused on:
- **Market position**: Leader, challenger, niche player?
- **Notable characteristics**: Culture, tech stack, recent momentum
- **Interview prep angle**: What specific points to prepare for this company

**Format**: 2-3 sentences, max 200 characters. Interview-focused, not career-hunting focused.

**Good Example**: 
"Market leader in collaborative workspace sector with strong product-market fit and innovative design culture. Known for real-time collaboration tech similar to target company. Interview prep: Prepare to discuss product differentiation and technical architecture choices."

**Bad Example** (too career-focused):
"Great career opportunity with competitive compensation. Apply now as they're hiring 47 roles. High growth potential."

## Strict Rules

1. **Research Quality**: Use your knowledge of tech industry, public companies, recent news
2. **No Hallucination**: Only include companies you're confident exist
3. **Realistic Scores**: Most companies should be 60-85%, not 95%+
4. **Interview Prep Focus**: This is for interview preparation, NOT job hunting
5. **Actionable Insights**: Help user understand market context and prepare smart responses
6. **Concise**: Insights must be 2-3 sentences max, focused on interview value

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
      "interviewPrepValue": "very-likely",
      "interviewRelevance": "Main competitor - prepare to discuss product differentiation, why customers choose one over the other, technical architecture differences",
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


