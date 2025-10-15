# Normalized Extraction Strategy

**Created**: October 15, 2025  
**Status**: 📋 Design Phase  
**Priority**: High

---

## 🎯 **Goal**

Extract and normalize ALL user-provided information (attachments, profiles, etc.) into AI-friendly structured summaries that can be:
1. **Reused** across multiple analysis sections
2. **Save tokens** (use 500-token summaries instead of 2000-token raw text)
3. **Ensure consistency** (same data format every time)
4. **Speed up analysis** (extract once, use everywhere)

---

## 🏗️ **Architecture**

### **Flow:**
```
User uploads attachment
↓
Extract raw text (if document)
↓
AI summarizes into normalized schema
↓
Store in attachment_extractions table
↓
Reuse across all analysis sections
↓
Cache intermediate results in analysis_cache
```

### **Token Savings Example:**
- **Before**: Pass 2000-token resume to 5 sections = 10,000 tokens
- **After**: Extract once (2000 tokens) → Use 500-token summary in 5 sections = 2,500 tokens
- **Savings**: 75% reduction (7,500 tokens saved)

---

## 📦 **Database Schema**

### **Table 1: attachment_extractions**
Stores normalized summaries of uploaded attachments.

```sql
CREATE TABLE attachment_extractions (
  id TEXT PRIMARY KEY,
  attachment_id TEXT NOT NULL REFERENCES attachments(id) ON DELETE CASCADE,
  extraction_type TEXT NOT NULL, -- 'resume', 'jd', 'cover_letter', 'portfolio', 'linkedin_profile'
  extracted_at INTEGER NOT NULL, -- Unix timestamp
  summary TEXT NOT NULL, -- JSON blob with normalized data
  tokens_used INTEGER, -- Cost tracking
  model TEXT, -- Which AI model was used (gpt-4, claude-3.5-sonnet, etc.)
  
  UNIQUE(attachment_id)
);

CREATE INDEX idx_extractions_job ON attachment_extractions(attachment_id);
```

### **Table 2: analysis_cache**
Stores reusable analysis results to avoid re-computation.

```sql
CREATE TABLE analysis_cache (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  cache_type TEXT NOT NULL, -- 'resume_skills', 'jd_requirements', 'skill_gap', etc.
  data TEXT NOT NULL, -- JSON blob
  created_at INTEGER NOT NULL,
  expires_at INTEGER, -- Optional: invalidate after X days or when attachments change
  source_ids TEXT, -- JSON array of attachment IDs used to generate this cache
  
  UNIQUE(job_id, cache_type)
);

CREATE INDEX idx_cache_job ON analysis_cache(job_id);
CREATE INDEX idx_cache_expires ON analysis_cache(expires_at);
```

---

## 📋 **Extraction Schemas**

### **1. Resume Extraction**

**Input**: Resume PDF/DOCX (2000 tokens)  
**Output**: Normalized JSON (500 tokens)

```json
{
  "summary": "Brief 2-3 sentence overview",
  "skills": {
    "technical": ["Python", "AWS", "Docker", "React"],
    "soft": ["Leadership", "Communication", "Problem Solving"]
  },
  "experience": [
    {
      "role": "Senior Software Engineer",
      "company": "Tech Corp",
      "duration": "3 years",
      "startDate": "2020-01",
      "endDate": "2023-01",
      "highlights": [
        "Built scalable microservices handling 1M requests/day",
        "Led team of 5 engineers"
      ],
      "technologies": ["Python", "AWS", "Docker"]
    }
  ],
  "education": [
    {
      "degree": "BS Computer Science",
      "institution": "University X",
      "year": "2019"
    }
  ],
  "certifications": ["AWS Solutions Architect", "PMP"],
  "totalYearsExperience": 5,
  "industryExperience": ["FinTech", "E-commerce"]
}
```

---

### **2. Job Description Extraction**

**Input**: JD PDF/DOCX/Text (1500 tokens)  
**Output**: Normalized JSON (400 tokens)

```json
{
  "role": "Senior Software Engineer",
  "company": "Amazing Startup",
  "location": "Remote / SF Bay Area",
  "salaryRange": "$150k-$200k",
  "requirements": {
    "technical": [
      { "skill": "Python", "required": true, "years": 5 },
      { "skill": "AWS", "required": true, "years": 3 },
      { "skill": "React", "required": false, "years": 2 }
    ],
    "soft": ["Leadership", "Communication", "Self-starter"],
    "education": ["BS in Computer Science or equivalent"],
    "certifications": []
  },
  "responsibilities": [
    "Design and build scalable microservices",
    "Lead engineering team",
    "Mentor junior developers"
  ],
  "niceToHave": ["Startup experience", "Open source contributions"],
  "companyInfo": {
    "industry": "FinTech",
    "size": "50-100 employees",
    "stage": "Series B",
    "culture": ["Fast-paced", "Innovative", "Remote-friendly"]
  }
}
```

---

### **3. Cover Letter Extraction**

**Input**: Cover letter text (800 tokens)  
**Output**: Normalized JSON (200 tokens)

```json
{
  "keyPoints": [
    "5+ years Python experience with AWS",
    "Led team at previous startup",
    "Passion for FinTech and financial inclusion"
  ],
  "specificExamples": [
    {
      "claim": "Scaled microservices to 1M requests/day",
      "context": "At Tech Corp, built payment processing system"
    }
  ],
  "motivations": [
    "Excited about company's mission",
    "Want to work on distributed systems at scale"
  ],
  "tone": "Professional, enthusiastic, technical"
}
```

---

### **4. LinkedIn Profile Extraction (Recruiter/Hiring Manager/Peer)**

**Input**: LinkedIn URL or scraped text (1000 tokens)  
**Output**: Normalized JSON (250 tokens)

```json
{
  "name": "Jane Smith",
  "role": "Engineering Manager",
  "company": "Amazing Startup",
  "background": {
    "previousRoles": [
      { "role": "Senior Engineer", "company": "Google", "years": 4 },
      { "role": "Tech Lead", "company": "Facebook", "years": 3 }
    ],
    "education": "MS Computer Science, Stanford",
    "totalYearsExperience": 12
  },
  "expertise": ["Distributed Systems", "Team Leadership", "Python", "Go"],
  "interests": ["Open source", "Mentoring", "Hiking"],
  "communicationStyle": "Direct, technical, collaborative",
  "recentActivity": [
    "Posted about new product launch",
    "Shared article on microservices architecture"
  ],
  "commonalities": {
    "sharedCompanies": [],
    "sharedSchools": [],
    "sharedInterests": ["Python", "Open source"]
  }
}
```

---

### **5. Portfolio Extraction**

**Input**: Portfolio PDF/Link (1200 tokens)  
**Output**: Normalized JSON (300 tokens)

```json
{
  "projects": [
    {
      "name": "E-commerce Platform",
      "description": "Built scalable marketplace handling $10M GMV",
      "technologies": ["Python", "Django", "AWS Lambda", "DynamoDB"],
      "outcomes": ["99.9% uptime", "50% faster page loads"],
      "url": "https://github.com/user/project",
      "relevance": "Demonstrates AWS and scalability expertise"
    }
  ],
  "githubStats": {
    "totalRepos": 45,
    "totalStars": 2300,
    "contributions": 1500
  },
  "notableAchievements": [
    "Top 1% contributor on Stack Overflow",
    "Maintainer of popular open source library (5k stars)"
  ]
}
```

---

## 🔄 **Extraction Trigger Points**

### **Option A: On Upload (Recommended)**
**When**: User uploads attachment  
**Pros**: 
- Analysis is instant (no waiting)
- Better UX (proactive)
- Can show "Processing..." indicator

**Cons**:
- Uses tokens even if never analyzed
- Requires background job handling

**Implementation**:
```typescript
// In POST /api/jobs/[id]/attachments
const attachment = await saveAttachment(...);

// Trigger extraction (async)
await extractAndNormalize(attachment.id, attachment.kind);

return { success: true, attachment };
```

---

### **Option B: On First Analysis (Lazy)**
**When**: User clicks "Analyze" button  
**Pros**:
- Only pay for what's used
- No wasted tokens

**Cons**:
- Slight delay on first analysis
- Worse UX

---

## 📊 **Cache Reuse Strategy**

### **Example: Skills Match Analysis**

```typescript
async function analyzeSkillsMatch(jobId: string) {
  // Try to get cached resume skills
  let resumeSkills = await getCachedData(jobId, 'resume_skills');
  
  if (!resumeSkills) {
    // Extract from normalized resume
    const resume = await getExtraction(jobId, 'resume');
    resumeSkills = resume.skills;
    
    // Cache for future use
    await setCachedData(jobId, 'resume_skills', resumeSkills);
  }
  
  // Try to get cached JD requirements
  let jdRequirements = await getCachedData(jobId, 'jd_requirements');
  
  if (!jdRequirements) {
    const jd = await getExtraction(jobId, 'jd');
    jdRequirements = jd.requirements.technical;
    
    await setCachedData(jobId, 'jd_requirements', jdRequirements);
  }
  
  // Now do the actual skill gap analysis
  const gap = calculateSkillGap(resumeSkills, jdRequirements);
  
  return { gap, recommendations: [...] };
}
```

---

## 🔄 **Cache Invalidation**

### **Trigger Points:**
1. **Attachment updated** → Invalidate all caches that used this attachment
2. **Attachment deleted** → Invalidate all caches that used this attachment
3. **Manual clear** → User clicks "Refresh Analysis"
4. **Time-based** → Auto-expire after 30 days (optional)

### **Implementation:**
```typescript
// When attachment changes
async function onAttachmentChange(attachmentId: string) {
  // Delete extraction
  await db.delete(attachment_extractions)
    .where(eq(attachment_extractions.attachment_id, attachmentId));
  
  // Delete caches that referenced this attachment
  const caches = await db.select()
    .from(analysis_cache)
    .where(sql`json_array_contains(source_ids, ${attachmentId})`);
  
  for (const cache of caches) {
    await db.delete(analysis_cache).where(eq(analysis_cache.id, cache.id));
  }
}
```

---

## 💰 **Token Economics**

### **Extraction Costs (One-time per attachment)**
| Attachment Type | Input Tokens | Output Tokens | Cost (GPT-4) |
|----------------|--------------|---------------|--------------|
| Resume | 2000 | 500 | $0.015 |
| Job Description | 1500 | 400 | $0.011 |
| Cover Letter | 800 | 200 | $0.006 |
| LinkedIn Profile | 1000 | 250 | $0.008 |
| Portfolio | 1200 | 300 | $0.009 |

**Total one-time extraction cost**: ~$0.05 per job

---

### **Analysis Savings (Every analysis)**

**Without Extraction** (passing raw text):
- Match Score: 2000 (resume) + 1500 (JD) = 3500 tokens
- Skills Match: 2000 + 1500 = 3500 tokens
- Company Intel: 1500 = 1500 tokens
- Match Matrix: 2000 + 1500 = 3500 tokens
- **Total**: 12,000 tokens (~$0.072)

**With Extraction** (using summaries):
- Match Score: 500 + 400 = 900 tokens
- Skills Match: 500 + 400 = 900 tokens (mostly from cache)
- Company Intel: 400 = 400 tokens
- Match Matrix: 500 + 400 = 900 tokens
- **Total**: 3,100 tokens (~$0.019)

**Savings**: 74% reduction ($0.053 saved per full analysis)

**ROI**: Extraction pays for itself after 1 full analysis!

---

## 🎯 **Implementation Phases**

### **Phase 1: Foundation** (Tasks 11-12)
- [ ] Design extraction schemas (this doc)
- [ ] Create `attachment_extractions` table
- [ ] Create `analysis_cache` table
- [ ] Migration script

### **Phase 2: Extraction Service** (Tasks 13-14)
- [ ] Build extraction prompt templates
- [ ] Create extraction service (`lib/extraction.ts`)
- [ ] Add on-upload trigger
- [ ] Handle extraction errors/retries

### **Phase 3: Integration** (Tasks 15-17)
- [ ] Update all analysis sections to use extractions
- [ ] Implement cache layer
- [ ] Add cache invalidation logic
- [ ] Test cross-section reuse

### **Phase 4: Monitoring** (Task 18)
- [ ] Add token usage tracking
- [ ] Display extraction status in UI
- [ ] Add "Re-extract" button for manual refresh
- [ ] Track savings metrics

---

## 🧪 **Testing Strategy**

### **Unit Tests**
- Extraction schema validation
- Cache hit/miss logic
- Invalidation triggers

### **Integration Tests**
- End-to-end extraction flow
- Cross-section data reuse
- Token counting accuracy

### **E2E Tests**
1. Upload resume → Verify extraction created
2. Run analysis → Verify uses extraction (not raw text)
3. Update resume → Verify cache invalidated
4. Run analysis again → Verify new extraction used

---

## 📈 **Success Metrics**

### **Performance**
- ✅ 75% token reduction per analysis
- ✅ Analysis speed: <2s (cached) vs 10s+ (uncached)
- ✅ Extraction success rate: >95%

### **Cost**
- ✅ Extraction ROI: Positive after 1 full analysis
- ✅ Monthly token spend: Reduced by 70%

### **UX**
- ✅ Instant analysis (no extraction delay)
- ✅ Consistent data format (no UI errors)
- ✅ Transparent to user (works behind the scenes)

---

## 🚧 **Future Enhancements**

### **Smart Extraction**
- Incremental extraction (only extract changed sections)
- Multi-language support
- Image extraction (charts, graphs from resumes)

### **Advanced Caching**
- Partial cache updates (update just one field)
- Cross-job caching (reuse company intel across jobs)
- Predictive extraction (pre-extract before user clicks analyze)

### **Analytics**
- Track which extractions are most valuable
- Identify extraction quality issues
- A/B test extraction prompts

---

**Status**: 📋 **READY FOR IMPLEMENTATION**  
**Next Step**: Begin Phase 1 (Database schema creation)  
**Owner**: To be assigned  
**Estimated Effort**: 2-3 days for full implementation


