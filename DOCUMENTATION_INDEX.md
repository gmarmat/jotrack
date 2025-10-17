# JoTrack Documentation Index

**Last Updated**: October 17, 2025  
**Purpose**: Central hub for all project documentation, organized by category

---

## 🏗️ **Architecture & Setup**

### **Core Documentation**
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture, data flow, tech stack
- **[README.md](README.md)** - Project overview, getting started, installation

### **Project Organization**
- **[TERMINOLOGY_GUIDE.md](TERMINOLOGY_GUIDE.md)** - Definitions of key terms and concepts
- **[NAVIGATION_MAP.md](NAVIGATION_MAP.md)** - App navigation structure and routes

---

## 🎨 **Design & UI Standards**

### **Design System (PRIMARY REFERENCE)**
- **[UI_DESIGN_SYSTEM.md](UI_DESIGN_SYSTEM.md)** - Complete design system v2.7
  - Color palette & gradients
  - Section-specific styling
  - AI Analysis section standardization
  - Company Intelligence v2 standard
  - Button order: [Analyze] [Expand] [Prompt] [Sources]
  - Badge placement rules
  - Animation standards

### **Supplementary Design Docs**
- **[UI_DESIGN_SPEC.md](UI_DESIGN_SPEC.md)** - Additional UI specifications
- **[PREVIEW_SYSTEM_GUIDE.md](PREVIEW_SYSTEM_GUIDE.md)** - Document preview system

---

## 🧪 **Testing & Quality**

### **Testing Guides**
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Comprehensive testing documentation
- **[QUICK_TEST.md](QUICK_TEST.md)** - Quick smoke tests for common features

### **Quality Assurance**
- **[KNOWN_ISSUES.md](KNOWN_ISSUES.md)** - Tracked bugs and limitations
- **[CHANGELOG.md](CHANGELOG.md)** - Version history and changes

---

## 🤖 **AI Analysis & Prompts**

### **Active Prompts (Production)**

Located in: `prompts/` directory

1. **[prompts/matchScore.v1.md](prompts/matchScore.v1.md)** - Match Score + Skill Match analysis
   - Overall score calculation
   - **NEW:** Semantic keyword matching (15-25 keywords)
   - **NEW:** Intent-based matching (React.js = React)
   - Technical skills categorization
   - Soft skills assessment
   - Gap analysis

2. **[prompts/company.v1.md](prompts/company.v1.md)** - Company Intelligence
   - **NEW:** Company Principles (⭐ interview keywords)
   - **NEW:** Employee Sentiment (positive + negative)
   - **NEW:** 6 targeted web searches
   - Leadership analysis
   - Competitor mapping

3. **[prompts/companyEcosystem.v1.md](prompts/companyEcosystem.v1.md)** - Company Ecosystem
   - Competitor research
   - Adjacent companies
   - Market positioning

4. **[prompts/match-signals.v1.md](prompts/match-signals.v1.md)** - Match Matrix (ATS Signals)
   - 30 ATS compatibility signals
   - Comprehensive scoring
   - Evidence-based evaluation

5. **[prompts/people.v1.md](prompts/people.v1.md)** - People Profiles
   - LinkedIn analysis
   - Interviewer research
   - Background investigation

6. **[prompts/userProfile.v1.md](prompts/userProfile.v1.md)** - User profile analysis
   - Extended profile creation
   - Skills extraction

7. **[prompts/notes-summary.v1.md](prompts/notes-summary.v1.md)** - Notes Summarization
   - **NEW:** Bullet-point condensation
   - Keyword extraction
   - Interview prep focus

### **Legacy Prompts (Reference Only)**

Located in: `core/ai/prompts/` directory

- `analyze.v1.md` - Original analysis prompt
- `compare.v1.md` - Comparison logic
- `improve.v1.md` - Improvement suggestions
- `persona.v1.md` - Persona generation
- `skillpath.v1.md` - Career path analysis

---

## 📊 **Data & Database**

### **Database Schema**
- **Location**: `db/schema.ts` (Drizzle ORM)
- **Migrations**: `db/migrations/` directory
  - `009_add_analysis_cache.sql` - Latest (analysis caching)

### **Key Tables**
- `jobs` - Core job data + analysis cache
- `job_attachments` - Document storage
- `attachment_variants` - AI-optimized versions
- `company_ecosystem_cache` - Ecosystem research cache
- `analysis_logs` - Token usage tracking

### **Data Repositories**
- `db/signalRepository.ts` - ATS signals
- `db/companyEcosystemCacheRepository.ts` - Ecosystem caching

---

## 🔧 **Technical Guides**

### **AI Integration**
- **Core Files**:
  - `lib/analysis/promptExecutor.ts` - Unified prompt execution
  - `lib/analysis/tavilySearch.ts` - Web search integration
  - `lib/coach/aiProvider.ts` - AI provider configuration
  - `core/ai/promptLoader.ts` - Prompt template loading

### **Key Concepts**
- **Two-Tier AI System**: 
  - Claude (Sonnet 3.5) - Deep analysis
  - Tavily Search - Real-time web research
- **Prompt Versioning**: `{name}.v{number}.md` format
- **Analysis Caching**: Reduce token usage, persist results
- **Source Weighting**: Primary (1.0) > High (0.8) > Medium (0.6)

---

## 📈 **Session Summaries & Progress**

### **Recent Sessions (Oct 17, 2025)**
- **[SESSION_OCT_17_FINAL_COMPLETE.md](SESSION_OCT_17_FINAL_COMPLETE.md)** - Latest complete session
- **[SESSION_OCT_17_PART2_COMPLETE.md](SESSION_OCT_17_PART2_COMPLETE.md)** - Part 2 summary
- **[PROGRESS_OCT_17_PART3.md](PROGRESS_OCT_17_PART3.md)** - Part 3 progress
- **[SESSION_WRAP_OCT_17_2025.md](SESSION_WRAP_OCT_17_2025.md)** - Wrap-up notes

### **Current State**
- **[CURRENT_STATE.md](CURRENT_STATE.md)** - Current implementation status
- **[SIGNAL_LEGEND.md](SIGNAL_LEGEND.md)** - ATS signal explanations

### **Templates**
- **[SESSION_STARTER_TEMPLATE.md](SESSION_STARTER_TEMPLATE.md)** - Template for new sessions

---

## 📝 **Quick References**

### **For Development**
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Quick lookup guide
- **[DOCUMENTATION_CLEANUP.md](DOCUMENTATION_CLEANUP.md)** - Doc maintenance notes

### **For Features**
- **[RELEASE_NOTES_v2.7.md](RELEASE_NOTES_v2.7.md)** - v2.7 feature summary
- **[RELEASE_NOTES_v0.2.md](RELEASE_NOTES_v0.2.md)** - v0.2 feature summary

---

## 🎯 **Feature-Specific Documentation**

### **AI Analysis Features**
- **Match Score**: Semantic keyword matching, 15-25 keywords, intent-based
- **Company Intelligence v2**: Principles separation, employee sentiment balance
- **Company Ecosystem**: Competitor research with web search
- **Match Matrix**: 30 ATS signals with evidence
- **People Profiles**: LinkedIn + interviewer research
- **Notes Summarization**: AI-powered bullet-point condensation

### **UI Features**
- **3-Column Layout**: Job header with Data Status and Notes
- **Button Animations**: Sparkler border + progress ring + countdown
- **Sources Modal**: Unified source display
- **Prompt Viewer**: View AI prompts for transparency
- **Settings**: Multi-provider AI configuration (Claude, OpenAI, Tavily)

---

## 🎓 **For New Contributors / Coach Mode**

### **Essential Reading (In Order)**

1. **[README.md](README.md)** - Start here
2. **[ARCHITECTURE.md](ARCHITECTURE.md)** - Understand the system
3. **[UI_DESIGN_SYSTEM.md](UI_DESIGN_SYSTEM.md)** - Learn design standards
4. **[TERMINOLOGY_GUIDE.md](TERMINOLOGY_GUIDE.md)** - Key concepts
5. **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - How to test

### **Key Decisions & Standards**

**Design Philosophy:**
- Semantic over syntactic (intent matters more than exact words)
- Balanced feedback (show positive AND negative)
- Source transparency (always cite sources)
- Interview-focused (every feature helps prep)

**AI Strategy:**
- Claude for analysis (deep understanding)
- Tavily for research (real-time web data)
- Prompt versioning (iterative improvement)
- Token optimization (caching, smart queries)

**Data Strategy:**
- Cache everything (reduce costs)
- Expire after 7-30 days (configurable)
- Track usage (costs, tokens, timing)
- Support variants (raw, AI-optimized, detailed)

**UI Standards:**
- Button order: [Analyze] [Expand] [Prompt] [Sources]
- Badge placement: Right side, before buttons
- Time format: mins/hours/days ago
- Dark mode: Always supported
- Animations: Subtle, tasteful, non-distracting

---

## 📦 **File Structure Summary**

```
jotrack/
├── app/                          # Next.js app (frontend + API)
│   ├── api/                      # API endpoints
│   │   ├── jobs/[id]/           # Job-specific APIs
│   │   │   ├── analyze-company/
│   │   │   ├── analyze-ecosystem/
│   │   │   ├── analyze-match-score/
│   │   │   ├── summarize-notes/
│   │   │   └── ...
│   │   └── ai/                   # AI provider APIs
│   ├── components/               # React components
│   │   ├── ai/                   # AI analysis components
│   │   ├── jobs/                 # Job-related components
│   │   └── ...
│   ├── jobs/[id]/               # Job detail page
│   └── playground/              # UI testing playground
├── db/                           # Database
│   ├── schema.ts                # Drizzle ORM schema
│   ├── migrations/              # SQL migrations
│   └── repositories/            # Data access layer
├── lib/                          # Utilities
│   ├── analysis/                # AI analysis logic
│   └── coach/                   # Coach mode logic
├── prompts/                      # AI prompts (PRODUCTION)
└── core/ai/prompts/             # Legacy prompts (REFERENCE)
```

---

## 🚀 **Recent Enhancements (Oct 17, 2025)**

### **Completed Today (22 commits):**

1. ✅ **Company Intelligence v2** - Principles separation, employee sentiment
2. ✅ **Button Animations** - Sparkler border + progress + countdown
3. ✅ **Notes AI Summarization** - Bullet-point condensation
4. ✅ **Keyword Match Enhancement** - Semantic matching (15-25 keywords)
5. ✅ **3-Column Layout Polish** - Fixed height, scrolling, variant buttons
6. ✅ **UI Standardization** - All 6 sections consistent
7. ✅ **Time Display** - mins/hours/days format
8. ✅ **/playground Route** - UI experimentation without token waste

---

## 📚 **Documentation Maintenance**

### **Keep Updated:**
- `UI_DESIGN_SYSTEM.md` - When adding new UI patterns
- `ARCHITECTURE.md` - When changing data flow
- `CHANGELOG.md` - For each release
- Prompt files - Version increment when changing

### **Archive When Stale:**
- Session summaries > 30 days old
- Planning docs after implementation
- Temporary test/debug files

---

## 🔗 **Quick Links**

**For Daily Development:**
- Design standards: [UI_DESIGN_SYSTEM.md](UI_DESIGN_SYSTEM.md)
- Testing: [TESTING_GUIDE.md](TESTING_GUIDE.md)
- Quick ref: [QUICK_REFERENCE.md](QUICK_REFERENCE.md)

**For New Features:**
- Prompt template: `prompts/*.v1.md`
- API endpoint: `app/api/jobs/[id]/*.ts`
- Component: `app/components/ai/*.tsx`

**For Debugging:**
- Known issues: [KNOWN_ISSUES.md](KNOWN_ISSUES.md)
- Current state: [CURRENT_STATE.md](CURRENT_STATE.md)

---

**Status**: ✅ Documentation complete and organized  
**Total Docs**: 40 markdown files  
**Categories**: 6 (Architecture, Design, Testing, AI, Progress, Reference)


