# Interview Coach - Architecture & Design
**Date**: October 20, 2025  
**Purpose**: Separate interview prep system from application prep

---

## 🎯 The Problem

**Current State**: Everything crammed into "Coach Mode"
- Resume optimization (Pre-Application)
- Cover letter (Pre-Application)
- Interview prep (Post-Application)
- Mixed purposes = confusing UX

**The Insight**: These are **two distinct journeys** with different goals:

| Application Coach | Interview Coach |
|-------------------|-----------------|
| Goal: Get the interview | Goal: Ace the interview |
| Focus: Resume, ATS, Cover Letter | Focus: Answers, Stories, Talk Tracks |
| Timeline: Before applying | Timeline: After interview scheduled |
| Output: Strong resume (high score) | Output: 2-3 STAR stories (memorable) |
| User: Solo prep | User: Active practice |

---

## 🏗️ Proposed Architecture

### Two Separate Coaches

```
Main Job Page
├── Coach Mode (Application Coach)
│   ├── Discovery Wizard
│   ├── Score Improvement
│   ├── Resume Editor
│   ├── Cover Letter Generator
│   └── Ready Tab → "Mark as Applied"
│
└── Interview Coach (NEW!)
    ├── Entry: When interview scheduled
    ├── Interview Type Selector (Recruiter/HM/Peer)
    ├── Question Bank (web search + AI generated)
    ├── Answer Practice (user provides answers)
    ├── Answer Scoring (AI evaluates + suggests improvements)
    ├── Quick Iterations (follow-up questions to clarify)
    ├── Talk Track Formatter (convert final answer → STAR)
    ├── Core Stories (identify 2-3 stories that cover 90%)
    └── Practice Mode (hide/reveal, memorization)
```

---

## 📊 Data Sharing Strategy

### Shared Profile (Master Context)

Create a **`user_profiles`** table:

```sql
CREATE TABLE user_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE, -- Future: multi-user support
  
  -- From Coach Mode (Application Coach)
  discovery_responses TEXT, -- JSON: Career goals, motivations, strengths
  writing_style_profile TEXT, -- JSON: Vocabulary, tone, patterns
  master_resume TEXT, -- Latest optimized resume
  
  -- From Jobs (Analysis Data)
  common_skills TEXT, -- JSON: Skills across all jobs
  common_industries TEXT, -- JSON: Industries applied to
  
  -- From Interview Coach
  star_stories TEXT, -- JSON: 2-3 core stories (reusable)
  interview_performance TEXT, -- JSON: Past scores, improvements
  
  -- Metadata
  created_at INTEGER,
  updated_at INTEGER
);
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ JOB CREATED                                                 │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ COACH MODE (Application Coach)                              │
│ - Discovery wizard → writing_style_profile                  │
│ - Resume optimization → master_resume                       │
│ - Cover letter generation                                   │
│ Output: Strong application ready to send                    │
└────────────┬────────────────────────────────────────────────┘
             │
             │ User applies ✅
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ MAIN JOB PAGE                                               │
│ - Status: "APPLIED" → "PHONE_SCREEN"                        │
│ - Interview Questions section appears                       │
│ - Shows: "Interview scheduled? Start Interview Coach →"     │
└────────────┬────────────────────────────────────────────────┘
             │
             │ User clicks "Start Interview Coach"
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ INTERVIEW COACH (NEW!)                                      │
│                                                             │
│ Inherits from Coach Mode:                                  │
│ ✓ writing_style_profile (how user writes)                  │
│ ✓ discovery_responses (goals, strengths)                   │
│ ✓ master_resume (achievements, skills)                     │
│                                                             │
│ Inherits from Job:                                         │
│ ✓ JD analysis (requirements, culture)                      │
│ ✓ Company Intelligence (principles, values)                │
│ ✓ People Profiles (interviewer insights)                   │
│ ✓ Match Matrix (gaps to address)                           │
│                                                             │
│ New Data Collected:                                        │
│ → User's draft answers                                     │
│ → AI scores + feedback                                     │
│ → Iterative improvements                                   │
│ → Final STAR talk tracks                                   │
│ → 2-3 core stories identified                              │
│                                                             │
│ Output: Memorized talk tracks ready for interview          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Interview Coach UX Flow

### Entry Point

**Location**: Main job page, Interview Questions section

**Trigger**: User marks status as "PHONE_SCREEN" or later

**CTA Button**: 
```tsx
<button className="gradient-purple-blue">
  🎯 Start Interview Coach →
  <span className="text-xs">Prep for {interviewType} interview</span>
</button>
```

---

### Interview Coach Page Structure

**URL**: `/interview-coach/[jobId]?type=recruiter|hiring-manager|peer`

**Layout**: Similar to Coach Mode but different tabs

```
┌─────────────────────────────────────────────────────────────┐
│ Interview Coach - {Company} - {Role}                        │
│ Interview Type: [Recruiter ▼] [Hiring Manager] [Peer]      │
└─────────────────────────────────────────────────────────────┘

Tabs:
1. Questions (Web + AI generated)
2. Practice (User provides answers)
3. Scoring (AI evaluates answers)
4. Talk Tracks (STAR formatted)
5. Core Stories (2-3 reusable stories)
6. Final Prep (Cheat sheets + Practice mode)
```

---

## 💡 The "2-3 Core Stories" Strategy

### Your Insight: Most Questions Can Be Answered with 2-3 Stories!

**Example Core Stories**:

1. **Story 1: Technical Challenge** (Covers 40% of questions)
   - System design
   - Problem-solving
   - Technical depth
   - Performance optimization
   - Architecture decisions
   
   **Maps to questions like**:
   - "Tell me about a technical challenge"
   - "Describe your system design experience"
   - "How do you optimize performance?"
   - "Walk me through an architecture decision"

2. **Story 2: Leadership/Collaboration** (Covers 40% of questions)
   - Team leadership
   - Conflict resolution
   - Mentoring
   - Cross-functional work
   - Influence without authority
   
   **Maps to questions like**:
   - "Tell me about leading a team"
   - "How do you handle conflict?"
   - "Describe mentoring experience"
   - "How do you work with non-technical stakeholders?"

3. **Story 3: Impact/Results** (Covers 20% of questions)
   - Business impact
   - Metrics-driven
   - Scalability
   - Customer focus
   - Innovation
   
   **Maps to questions like**:
   - "Biggest impact you've made?"
   - "Tell me about a project you're proud of"
   - "How do you measure success?"

### AI Feature: **Story Mapping**

**Algorithm**:
1. User provides 2-3 STAR stories
2. AI analyzes each story for themes/keywords
3. For each interview question → AI suggests which story to use
4. AI provides "adaptation tips" (how to angle the story for that question)

**Example**:
```
Question: "Tell me about a time you disagreed with a senior engineer"

Suggested Story: Story #2 (Leadership/Collaboration)

Adaptation Tips:
- Lead with: "At {Company}, I collaborated with a senior eng on..."
- Emphasize: How you presented your perspective respectfully
- Skip: The technical details (focus on communication)
- Close with: Learning about balancing conviction with humility
```

---

## 🔄 Interview Coach Flow (Step by Step)

### Tab 1: Questions
- Show web-searched + AI-generated questions
- Group by persona (Recruiter/HM/Peer)
- User selects 8-10 questions to prepare for

### Tab 2: Practice
- User writes draft answers (text area, 100-300 words)
- No formatting, just brain dump
- Save draft answers to `interview_coach_state`

### Tab 3: Scoring
- AI scores each answer (0-100)
- Rubric:
  - STAR structure (25 pts)
  - Specificity/details (25 pts)
  - Quantification (20 pts)
  - Relevance to question (20 pts)
  - Confidence/clarity (10 pts)
- Shows what's missing: "Add metrics" "Clarify the Task" "Explain Result better"
- Quick follow-up questions:
  - "What metric improved?"
  - "How many people on the team?"
  - "What was the business impact?"
- User answers follow-ups → AI re-scores

### Tab 4: Talk Tracks
- Once score > 75 (user configurable threshold)
- AI converts draft answer → STAR talk track
- Uses writing style profile
- Integrates company culture/principles
- Shows long-form (for practice) + cheat sheet (for interview)

### Tab 5: Core Stories
- **AI identifies 2-3 core stories** from all answers
- Shows story themes:
  - Story 1: Technical Challenge (architected microservices)
  - Story 2: Leadership (led team of 5)
  - Story 3: Impact (saved $500K, 60% efficiency)
- **Story Mapping**: For each question, shows which story to use
- **Adaptation Guide**: How to angle the story for different questions

### Tab 6: Final Prep
- Practice mode (hide/reveal)
- Cheat sheets for all stories
- Memorization tips
- Last-minute review
- Export to PDF

---

## 🗄️ Database Schema

### New Table: `interview_coach_sessions`

```sql
CREATE TABLE interview_coach_sessions (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  interview_type TEXT NOT NULL, -- 'recruiter', 'hiring-manager', 'peer'
  
  -- State (JSON blobs)
  selected_questions TEXT, -- JSON: Questions user wants to prep for
  draft_answers TEXT,      -- JSON: { questionId: userAnswer }
  answer_scores TEXT,      -- JSON: { questionId: { score, feedback, iteration } }
  talk_tracks TEXT,        -- JSON: Final STAR-formatted answers
  core_stories TEXT,       -- JSON: 2-3 reusable stories
  story_mappings TEXT,     -- JSON: { questionId: coreStoryId }
  
  -- Progress
  questions_selected INTEGER DEFAULT 0,
  answers_drafted INTEGER DEFAULT 0,
  answers_scored_above_75 INTEGER DEFAULT 0,
  talk_tracks_generated INTEGER DEFAULT 0,
  core_stories_identified INTEGER DEFAULT 0,
  
  -- Metadata
  created_at INTEGER,
  updated_at INTEGER,
  
  UNIQUE(job_id, interview_type)
);
```

---

## 🎨 UX Differences

### Application Coach (Current Coach Mode)
- **Entry**: From job detail page, "Enter Coach Mode"
- **Phase**: Pre-Application
- **Linear flow**: Discovery → Score → Resume → Cover Letter → Apply
- **Goal**: Maximize ATS score, create strong application
- **Output**: Optimized resume + cover letter
- **Duration**: 2-4 hours total

### Interview Coach (NEW!)
- **Entry**: From job detail page, "Start Interview Coach" (after applied)
- **Phase**: Post-Application (Interview Scheduled)
- **Non-linear**: Pick questions → Practice → Score → Refine → Format
- **Goal**: Master 2-3 core stories, feel confident
- **Output**: STAR talk tracks + cheat sheets
- **Duration**: 3-6 hours per interview type

---

## 🔗 Integration Points

### 1. Coach Mode → Interview Coach

**Hand-off Data**:
- ✅ `writing_style_profile` → Use for talk track generation
- ✅ `discovery_responses` → Understand user's goals/strengths
- ✅ `master_resume` → Source for achievements/stories
- ✅ `match_matrix_gaps` → Know what to emphasize/avoid

**Trigger**: User clicks "I've Applied" → unlocks Interview Coach

---

### 2. Job Analysis → Interview Coach

**Hand-off Data**:
- ✅ `company_intelligence` → Company culture, principles, values
- ✅ `people_profiles` → Interviewer insights
- ✅ `jd_analysis` → Role requirements, key skills
- ✅ `ecosystem` → Company context, competitors

**Usage**: Integrate into talk tracks ("Given {Company}'s focus on X...")

---

### 3. Interview Coach → User Profile

**Saved to Master Profile**:
- ✅ `core_stories` → Reusable across future interviews
- ✅ `star_stories` → Portfolio of prepared stories
- ✅ `interview_performance` → Track scores, improvements

**Benefit**: Future interviews start with existing stories

---

## 🎯 The "2-3 Core Stories" Feature

### Story Identification Algorithm

```
1. User provides 8-10 draft answers
2. AI analyzes for common themes:
   - Technical challenges
   - Leadership moments
   - Impact/results
   - Collaboration examples
   
3. AI clusters answers:
   - Cluster 1: "Microservices migration" (appears in 5 answers)
   - Cluster 2: "Team leadership" (appears in 4 answers)
   - Cluster 3: "Performance optimization" (appears in 3 answers)
   
4. AI extracts 2-3 CORE STORIES:
   - Story A: "Led team to architect microservices platform"
   - Story B: "Reduced API latency by 90%"
   - Story C: "Mentored 3 junior engineers"
   
5. AI creates STORY MAPPING:
   Question 1: "System design experience" → Use Story A
   Question 2: "Technical challenge" → Use Story B
   Question 3: "Leadership example" → Use Story A or C
   Question 4: "Biggest impact" → Use Story B
   
6. AI provides ADAPTATION GUIDE:
   For Question 1 using Story A:
   - Lead with: "Great question. At {Company}, I led..."
   - Emphasize: Architecture decisions, tradeoffs
   - De-emphasize: Team dynamics (save for leadership q's)
   - Metric to highlight: "60% faster deployments"
```

---

## 💬 Interview Coach Workflow

### Phase 1: Question Selection (5 min)
```
1. Show 30-40 questions (web + AI)
2. User selects 8-10 to prepare
3. Group by theme (Technical, Behavioral, Cultural)
```

### Phase 2: Draft Answers (30-60 min)
```
1. For each question: Large text area
2. User writes draft answer (100-300 words)
3. No pressure on format - just get thoughts out
4. Auto-save as they type
5. Word count + estimated time shown
```

### Phase 3: AI Scoring (10 min, automated)
```
For each answer:
1. AI scores 0-100 with breakdown:
   - STAR structure: 20/25 (missing clear Result)
   - Specificity: 18/25 (needs more details)
   - Quantification: 10/20 (add metrics!)
   - Relevance: 19/20 (great fit for question)
   - Clarity: 8/10 (minor wording improvements)
   Total: 75/100

2. AI asks clarifying questions:
   - "What metric improved and by how much?"
   - "How many people were on the team?"
   - "What was the business impact in $ or %?"

3. User answers (short responses, 10-50 words each)

4. AI re-scores with new context:
   - Quantification: 10/20 → 18/20 (+8!)
   - Total: 75/100 → 83/100
```

### Phase 4: Talk Track Generation (5 min per story)
```
When answer score > 75 (configurable):
1. AI converts draft → STAR format
2. Uses writing_style_profile (user's natural voice)
3. Integrates company culture/principles
4. Generates:
   - Long-form (200 words, for practice)
   - Cheat sheet (7 bullets, for interview)
   - Opening line (memorable hook)
   - Closing line (strong finish)
```

### Phase 5: Core Stories Extraction (10 min, automated)
```
After 8+ talk tracks generated:
1. AI analyzes all talk tracks
2. Identifies 2-3 recurring stories:
   - Story A: Microservices migration (used in 5 talk tracks)
   - Story B: Team leadership (used in 4 talk tracks)
   - Story C: API optimization (used in 3 talk tracks)

3. AI creates MASTER VERSIONS of each story:
   - Full version (300 words, all details)
   - Short version (150 words, key points only)
   - Cheat sheet (10 bullets)

4. AI creates STORY MAPPING:
   - Question 1: "System design" → Story A (emphasize architecture)
   - Question 2: "Leadership" → Story B (emphasize team dynamics)
   - Question 3: "Technical challenge" → Story A or C (user picks)
   - Question 4: "Biggest impact" → Story C (emphasize 90% improvement)

5. For each mapping, provide ADAPTATION TIPS:
   - What to emphasize
   - What to de-emphasize
   - How to open/close
   - Memorable stat to lead with
```

### Phase 6: Practice & Memorization (30-60 min)
```
Practice Mode:
1. Show question
2. User recalls answer mentally (or speaks it)
3. Click "Reveal" → see cheat sheet
4. Check against cheat sheet
5. Next question

Memorization Aids:
- Visual: Color-coded STAR sections
- Mnemonic: First letter of each key point
- Repetition: Track practice count per story
- Audio: Text-to-speech for listening practice
```

---

## 🔧 Technical Implementation

### New Files to Create

1. **Page**: `app/interview-coach/[jobId]/page.tsx`
2. **Components**:
   - `QuestionSelector.tsx` (Pick 8-10 questions)
   - `AnswerPractice.tsx` (Draft answers text area)
   - `AnswerScoring.tsx` (Show scores + feedback)
   - `TalkTrackFormatter.tsx` (Convert → STAR)
   - `CoreStoriesIdentifier.tsx` (Show 2-3 stories + mapping)
   - `FinalPrepMode.tsx` (Practice + cheat sheets)

3. **API Endpoints**:
   - `/api/interview-coach/[jobId]/score-answer` (Score + suggest improvements)
   - `/api/interview-coach/[jobId]/ask-followups` (Quick clarifying questions)
   - `/api/interview-coach/[jobId]/identify-core-stories` (Find 2-3 stories)
   - `/api/interview-coach/[jobId]/map-stories` (Map questions → stories)

4. **Prompts**:
   - `answer-scoring.v1.md` (Rubric + feedback)
   - `clarifying-questions.v1.md` (Follow-ups to improve score)
   - `core-stories-extraction.v1.md` (Identify 2-3 stories)
   - `story-mapping.v1.md` (Map questions → stories + adaptation tips)

---

## 📊 Score Improvement Flow

```
Question: "Tell me about a time you led a team"

Draft Answer (User writes):
"I led a team to build a new feature. We used agile. 
It was successful and users liked it."

AI Score: 45/100
- STAR: 15/25 (missing Situation, Task, clear Action)
- Specificity: 8/25 (too vague: "new feature", "successful")
- Quantification: 0/20 (no metrics!)
- Relevance: 15/20 (on topic but lacks depth)
- Clarity: 7/10 (clear but basic)

AI Follow-up Questions:
1. "What was the feature and why was it needed?"
2. "How many people were on your team?"
3. "What was your specific role vs the team's?"
4. "What metrics improved (users, revenue, efficiency)?"
5. "What was challenging about leading this?"

User Answers Follow-ups:
1. "Real-time analytics dashboard, needed for product-led growth strategy"
2. "Team of 5 engineers (3 frontend, 2 backend)"
3. "I was tech lead: architecture decisions, code reviews, sprint planning"
4. "10K daily active users, 30% increase in feature adoption"
5. "Balancing technical debt with new features, tight 6-week deadline"

AI Re-scores: 83/100 🎉
- STAR: 22/25 (clear structure now)
- Specificity: 23/25 (much better detail!)
- Quantification: 18/20 (great metrics added)
- Relevance: 18/20 (strong fit)
- Clarity: 9/10 (excellent clarity)

Now AI says: "Ready for talk track formatting! ✅"

AI generates STAR talk track:
"Absolutely. At {Company}, we identified a gap in our product analytics—
we needed real-time insights to support our product-led growth strategy. 
I was asked to lead a team of 5 engineers to build a real-time analytics 
dashboard from scratch. [Situation + Task]

As tech lead, I architected the solution using React for the frontend and 
WebSocket for real-time updates. I led sprint planning, conducted code reviews, 
and made key architecture decisions. The biggest challenge was balancing 
technical debt with feature velocity—we had a tight 6-week deadline. 
[Action]

We delivered on time, and the dashboard now serves 10K daily active users. 
We saw a 30% increase in feature adoption because product managers could 
make data-driven decisions in real-time. This experience taught me the 
importance of clear architecture upfront and empowering the team with 
autonomy. [Result]"

Cheat Sheet:
• Team: 5 engineers (3 FE, 2 BE), 6-week deadline
• Challenge: Real-time analytics for product-led growth
• My role: Tech lead (architecture, reviews, planning)
• Tech: React + WebSocket
• Result: 10K DAU, 30% adoption increase
• Learning: Architecture + team autonomy = success
• Stat: "30% feature adoption increase, 10K daily users"
```

---

## 🎯 Core Stories Tab Design

```
┌─────────────────────────────────────────────────────────────┐
│ Your Core Stories (2-3 Reusable Stories)                    │
└─────────────────────────────────────────────────────────────┘

Story 1: Microservices Migration 🏗️
Covers: System design, Architecture, Technical depth
Used in: 6 questions
Memorable Stat: "60% faster deployments, $200K cost savings"

[View Full Story] [Practice] [Cheat Sheet]

Questions This Answers:
• "Tell me about system design experience" → Lead with architecture
• "Describe a technical challenge" → Emphasize migration complexity
• "How do you make tradeoffs?" → Highlight monolith vs microservices decision
• "Tell me about a project you're proud of" → Focus on business impact
• "Experience with cloud architecture?" → Mention AWS, Kubernetes
• "How do you handle technical debt?" → Frame as strategic migration

────────────────────────────────────────────────────────────────

Story 2: Team Leadership (5 Engineers) 👥
Covers: Leadership, Mentoring, Collaboration
Used in: 5 questions
Memorable Stat: "Led 5 engineers, delivered in 6 weeks, 30% adoption"

[View Full Story] [Practice] [Cheat Sheet]

Questions This Answers:
• "Tell me about leading a team" → Full story
• "How do you handle conflict?" → Adapt: mention code review disagreement
• "Mentoring experience?" → Adapt: highlight 2 junior devs mentored
• "Cross-functional work?" → Adapt: mention PM collaboration
• "Tight deadline experience?" → Adapt: emphasize 6-week sprint

────────────────────────────────────────────────────────────────

Story 3: API Performance Optimization ⚡
Covers: Problem-solving, Impact, Technical depth
Used in: 4 questions
Memorable Stat: "90% latency reduction (2000ms → 200ms)"

[View Full Story] [Practice] [Cheat Sheet]

Questions This Answers:
• "Tell me about optimizing performance" → Full story
• "How do you debug?" → Adapt: explain profiling process
• "Describe a technical challenge" → Emphasize N+1 queries
• "Biggest impact?" → Lead with 90% improvement

────────────────────────────────────────────────────────────────

💡 Pro Tip: These 3 stories cover 80% of interview questions!
For questions not covered, adapt the closest story or create a new one.
```

---

## 🚀 Implementation Phases

### Phase 1: Core Infrastructure (4 hours)
- [ ] Create `interview_coach_sessions` table
- [ ] Create Interview Coach page (`/interview-coach/[jobId]`)
- [ ] Create tab navigation (6 tabs)
- [ ] Add entry point from main job page

### Phase 2: Answer Scoring System (5 hours)
- [ ] Create answer scoring prompt (`answer-scoring.v1.md`)
- [ ] Create clarifying questions prompt (`clarifying-questions.v1.md`)
- [ ] API: `/score-answer` (scores + feedback)
- [ ] API: `/ask-followups` (generates follow-ups)
- [ ] UI: AnswerScoring component (show score breakdown)

### Phase 3: Core Stories Feature (6 hours)
- [ ] Create core stories extraction prompt
- [ ] Create story mapping prompt
- [ ] API: `/identify-core-stories`
- [ ] API: `/map-stories`
- [ ] UI: CoreStoriesIdentifier component
- [ ] UI: Story mapping display

### Phase 4: Integration & Testing (3 hours)
- [ ] Wire all tabs together
- [ ] Add data persistence
- [ ] Test full workflow
- [ ] E2E test for interview coach

**Total**: 18 hours (2-3 days)

---

## 💡 Key Design Decisions

1. **Separate Coaches**: Clear separation of concerns (App vs Interview)
2. **2-3 Core Stories**: Realistic preparation (don't memorize 50 answers!)
3. **Story Mapping**: Smart reuse (same story, different angles)
4. **Iterative Scoring**: Improve answers through AI feedback + follow-ups
5. **Threshold-based**: Only format when score > 75 (quality gate)
6. **Practice Mode**: Hide/reveal for memorization
7. **Company Context**: Integrate culture/principles into talk tracks
8. **Cheat Sheets**: Interview-day reference (printable)

---

## 🎨 Entry Point Design

### Main Job Page (After Applied)

```tsx
{currentStatus !== 'ON_RADAR' && (
  <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl p-6 shadow-lg">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-xl font-bold mb-2">
          🎯 Interview Scheduled?
        </h3>
        <p className="text-sm opacity-90 mb-4">
          Start Interview Coach to prep your 2-3 core stories and ace the interview.
        </p>
        
        <div className="flex items-center gap-3">
          <button className="bg-white text-purple-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            📞 Recruiter Screen →
          </button>
          <button className="bg-white/20 text-white px-6 py-2 rounded-lg font-semibold hover:bg-white/30 transition-colors">
            👔 Hiring Manager →
          </button>
          <button className="bg-white/20 text-white px-6 py-2 rounded-lg font-semibold hover:bg-white/30 transition-colors">
            👥 Peer/Panel →
          </button>
        </div>
      </div>
      
      <div className="text-right">
        <p className="text-xs opacity-75 mb-1">Inherited from Coach Mode:</p>
        <div className="flex flex-col gap-1 text-xs">
          <span>✓ Writing Style Analyzed</span>
          <span>✓ Resume Optimized</span>
          <span>✓ Company Intel Ready</span>
        </div>
      </div>
    </div>
  </div>
)}
```

---

## 📝 Next Steps

### Immediate (This Session):
1. Review this architecture with you
2. Get feedback on 2-3 core stories approach
3. Decide: Build now or continue with current P3 tasks?

### If Approved:
1. Create `interview_coach_sessions` table
2. Build Interview Coach page scaffold
3. Implement answer scoring system
4. Build core stories feature
5. Wire up integration points

---

## ❓ Questions for You

1. **Timing**: Build Interview Coach now or finish current P3 tasks first?
2. **Scope**: Start with one persona (Recruiter) or all 3?
3. **Score Threshold**: Default 75/100 to proceed to talk tracks?
4. **Core Stories**: Always 2-3 or let user configure (2-5)?
5. **Integration**: Separate page or tabs within current Coach Mode?

---

**My Recommendation**: 

This is a **brilliant insight** about 2-3 core stories! Let's:
1. ✅ Finish current P3 tasks (LinkedIn opt, User Profile modal) - 2 hours
2. ✅ Then build Interview Coach as a **new major feature** - 18 hours
3. ✅ This becomes our **killer feature** (unique, high value)

Sound good? 🚀

