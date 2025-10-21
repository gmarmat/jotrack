# Interview Coach - Complete Algorithm & Implementation Guide

**Version**: 2.0  
**Date**: October 20, 2025  
**Status**: Production-Ready ✅  
**Commit**: 90948d4

---

## 📋 Table of Contents

1. [Core Philosophy](#core-philosophy)
2. [The Algorithm Overview](#the-algorithm-overview)
3. [Data Flow & Architecture](#data-flow--architecture)
4. [Phase-by-Phase Breakdown](#phase-by-phase-breakdown)
5. [Scoring Algorithm Details](#scoring-algorithm-details)
6. [The "2-3 Core Stories" Strategy](#the-2-3-core-stories-strategy)
7. [Key Innovations](#key-innovations)
8. [Technical Implementation](#technical-implementation)
9. [Prompts & AI Integration](#prompts--ai-integration)

---

## 🎯 Core Philosophy

### The Problem We Solve

**Traditional Interview Prep**:
- Generic questions from the internet
- No personalization for company/role
- No feedback loop or iteration
- Candidate memorizes 30+ unique answers (impossible!)

**Our Approach**:
- **Personalized**: Questions tailored to company, role, and specific interviewer
- **Iterative**: AI scores answers, asks clarifying questions, improves iteratively
- **Strategic**: Identify 2-3 core stories that answer 90% of questions
- **Efficient**: Candidate memorizes 2-3 stories, adapts them to any question

### Key Insight: The "2-3 Core Stories" Strategy

**Most interview questions can be answered with 2-3 well-crafted stories!**

Example:
- Story 1: "Technical Challenge" → Covers system design, problem-solving, technical depth
- Story 2: "Leadership Project" → Covers collaboration, conflict resolution, impact
- Story 3: "Career Growth" → Covers learning, adaptability, ambition

**Instead of memorizing 30 answers, memorize 3 stories and learn to adapt them.**

---

## 🏗️ The Algorithm Overview

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────┐
│ PHASE 1: QUESTION GENERATION                                │
│ - Web search (Glassdoor, Reddit, Blind)                     │
│ - AI generation (persona-specific)                          │
│ - Personalization (interviewer profile, match score)        │
│ Output: 30-40 tailored questions                            │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE 2: QUESTION SELECTION                                 │
│ - User selects 8-10 questions to prepare                    │
│ - Questions grouped by theme                                │
│ - Prioritized by persona (recruiter/HM/peer)                │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE 3: DRAFT ANSWERS                                      │
│ - User writes draft answers (no structure required)         │
│ - Auto-save, word count tracking                            │
│ - Focus on getting thoughts out, not perfection             │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE 4: AI SCORING & ITERATION (THE MAGIC!)                │
│ - AI scores 0-100 with detailed breakdown                   │
│ - Identifies missing elements (STAR gaps, no metrics)       │
│ - Asks 3-5 clarifying questions                             │
│ - User answers quickly (10-50 words)                        │
│ - AI re-scores with new context                             │
│ - Iterate until score > 75 (usually 2-3 iterations)         │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE 5: TALK TRACK GENERATION                              │
│ - AI converts draft → STAR format                           │
│ - Integrates company culture/values                         │
│ - Uses writing style profile (from App Coach)               │
│ - Generates 3 formats:                                      │
│   1. Long-form (200 words) - for practice                   │
│   2. Cheat sheet (7 bullets) - for interview                │
│   3. Opening + Closing lines - for memorization             │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE 6: CORE STORIES EXTRACTION (AUTOMATED)                │
│ - AI analyzes all 8-10 talk tracks                          │
│ - Identifies recurring themes/stories                       │
│ - Extracts 2-3 CORE STORIES (master versions)               │
│ - Creates STORY MAPPING (which story answers which Q)       │
│ - Provides ADAPTATION GUIDE (how to modify for each Q)      │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE 7: PRACTICE MODE                                      │
│ - Hide/reveal cheat sheets                                  │
│ - Timer for 2-minute practice                               │
│ - Record & playback (optional)                              │
│ - Confidence self-rating                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow & Architecture

### Data Sources (REUSE from existing systems!)

```
Interview Coach inherits from:

1. APPLICATION COACH (Coach Mode)
   ✓ writing_style_profile → How user naturally writes
   ✓ discovery_responses → Career goals, strengths, motivations
   ✓ master_resume → Achievements, skills, experience

2. JOB ANALYSIS (Match Score System)
   ✓ jd_analysis → Role requirements, key skills
   ✓ match_matrix → Skills match, gaps to address
   ✓ company_intelligence → Culture, principles, values
   ✓ ecosystem → Company context, competitors

3. PEOPLE PROFILES (Interviewer Intelligence)
   ✓ interviewer_profiles → Communication style, priorities
   ✓ red_flags → What to avoid
   ✓ key_priorities → What they care about most

Interview Coach generates NEW data:
   → draft_answers (user's raw thoughts)
   → scores_history (all iterations preserved)
   → follow_up_answers (clarifying responses)
   → talk_tracks (STAR formatted final answers)
   → core_stories (2-3 master stories identified)
   → story_mapping (which story answers which question)
```

### Storage Structure

**Database**: `coach_state.interview_coach_json`

```json
{
  "metadata": {
    "persona": "recruiter",
    "startedAt": 1729468800,
    "lastUpdatedAt": 1729469200,
    "phase": "scoring"
  },
  "selectedQuestions": [
    {
      "id": "q1",
      "text": "Why are you interested in this role?",
      "category": "Motivation",
      "source": "ai-generated",
      "personalized": true
    }
  ],
  "answers": {
    "q1": {
      "question": "Why are you interested in this role?",
      "iterations": [
        {
          "text": "User's first draft...",
          "timestamp": 1729468900,
          "wordCount": 127,
          "iteration": 1
        },
        {
          "text": "User's revised draft after follow-ups...",
          "timestamp": 1729469000,
          "wordCount": 156,
          "iteration": 2
        }
      ],
      "scores": [
        {
          "overall": 68,
          "breakdown": {
            "star": 15,
            "specificity": 18,
            "quantification": 8,
            "relevance": 19,
            "clarity": 8
          },
          "scoreCategory": "Good Foundation",
          "followUpQuestions": [
            "What specific metric improved?",
            "How many people on team?"
          ],
          "iteration": 1
        },
        {
          "overall": 82,
          "breakdown": {
            "star": 20,
            "specificity": 20,
            "quantification": 16,
            "relevance": 19,
            "clarity": 7
          },
          "scoreCategory": "Strong Answer",
          "iteration": 2
        }
      ],
      "followUpAnswers": [
        {
          "question": "What specific metric improved?",
          "answer": "Reduced API latency from 800ms to 120ms",
          "timestamp": 1729468950
        }
      ],
      "talkTrack": {
        "longForm": "Full STAR formatted answer...",
        "cheatSheet": ["Point 1", "Point 2", "..."],
        "openingLine": "Great question...",
        "closingLine": "...and that's why I'm excited about this opportunity.",
        "generatedAt": 1729469100
      },
      "status": "ready-for-talk-track"
    }
  },
  "coreStories": {
    "identified": true,
    "stories": [
      {
        "id": "story1",
        "title": "Microservices Migration",
        "masterVersion": "Led team to migrate monolith to microservices...",
        "usedInQuestions": ["q1", "q3", "q5", "q7", "q9"],
        "themes": ["system-design", "leadership", "technical-depth"],
        "keyMetrics": ["60% faster deployments", "40% cost reduction"]
      }
    ],
    "storyMapping": {
      "q1": {
        "story": "story1",
        "adaptation": "Emphasize architecture decisions...",
        "leadWith": "Great question. At Company X, I led...",
        "emphasize": ["Technical tradeoffs", "Team collaboration"],
        "deemphasize": ["Implementation details"]
      }
    }
  }
}
```

---

## 🎓 Phase-by-Phase Breakdown

### PHASE 1: Question Generation

**Purpose**: Generate 30-40 tailored interview questions

**Algorithm**:

```
1. WEB SEARCH (Real Questions)
   - Query: "{companyName} interview questions glassdoor"
   - Query: "{companyName} {roleTitle} interview reddit"
   - Query: "{companyName} technical interview blind"
   - Extract questions from top 10 results
   - Deduplicate and categorize

2. LOAD CONTEXT
   - JD analysis (role requirements)
   - Company intelligence (culture, values)
   - Match score (skills match, gaps)
   - Interviewer profile (if available)
   - Resume analysis (experience, achievements)

3. AI GENERATION (Persona-Specific)
   For each persona (recruiter/hiring-manager/peer):
   
   A. CALCULATE DISTRIBUTION
      - Motivation questions: 35%
      - Culture fit: 25%
      - Red flag pre-emption: 20%
      - Background validation: 15%
      - Logistics: 5%
   
   B. SKILL TARGETING
      - Strong skills (70% of questions): Let candidate shine
      - Weak critical skills (30% if mentioned): Frame as learning opportunity
   
   C. PERSONALIZATION (if interviewer profile available)
      - Match communication style (casual/formal/direct)
      - Align with priorities (culture/motivation/technical)
      - Avoid red flags (job hopping, lack of prep)
   
   D. GENERATE 10 QUESTIONS
      Each question includes:
      - question: String
      - category: Enum (Motivation, Culture, Technical, etc.)
      - difficulty: Enum (Easy, Medium, Hard)
      - tip: Actionable advice (specific, not generic)
      - followUp: Optional follow-up question

4. COMBINE & RANK
   - Merge web results + AI generated
   - Remove duplicates
   - Rank by: Personalization score, Relevance, Uniqueness
   - Return top 30-40 questions

5. CACHE (90 day TTL)
   - Save to interview_questions_cache
   - Key: company_name + persona
   - Expiry: 90 days (questions change slowly)
```

**Example Output**:

```json
{
  "questions": [
    {
      "id": "q1",
      "question": "Why are you interested in working at FuelCell Energy?",
      "category": "Motivation",
      "difficulty": "Easy",
      "source": "ai-generated",
      "personalized": true,
      "tip": "Research their recent partnerships (Exxon, Toyota) and mention specific interest in clean energy innovation. Connect your PM experience in sustainable tech to their mission.",
      "followUp": "What specific aspects of our hydrogen technology excite you?"
    },
    {
      "id": "q2",
      "question": "On Glassdoor, candidates mention FuelCell's focus on innovation. How do you approach learning new technologies quickly?",
      "category": "Culture Fit",
      "difficulty": "Medium",
      "source": "web-glassdoor",
      "personalized": true,
      "tip": "Use STAR method. Reference a specific technology you learned (tie to JD requirements like 'data analysis' from match score). Quantify speed: 'Became proficient in X in Y weeks'."
    }
  ]
}
```

---

### PHASE 2: Question Selection

**Purpose**: User selects 8-10 questions to prepare

**UX Flow**:

```
1. DISPLAY QUESTIONS
   - Grouped by category (Motivation, Technical, Behavioral)
   - Sorted by difficulty (Easy → Medium → Hard)
   - Show source tags (AI-Generated, Web-Glassdoor, Web-Reddit)
   - Show personalization indicators (★ Personalized for you!)

2. SELECTION UI
   - Checkbox per question
   - Counter: "Selected: 8/10"
   - Recommended: 8-10 questions
   - Can select more, but AI will suggest prioritization

3. SMART RECOMMENDATIONS
   Algorithm:
   - MUST include 2-3 "Easy" questions (build confidence)
   - MUST include 1 "Hard" question (prepare for curveballs)
   - MUST cover 3+ categories (well-rounded prep)
   - SHOULD include persona-prioritized questions
   - SHOULD include highly personalized questions (★★★)

4. SAVE & CONTINUE
   - Save selected questions to coach_state
   - Proceed to Draft Answers phase
```

---

### PHASE 3: Draft Answers

**Purpose**: User writes draft answers (no structure required!)

**UX**:

```
1. QUESTION CARD
   ┌─────────────────────────────────────────────────────────┐
   │ Q1: Why are you interested in this role?               │
   │ Category: Motivation | Difficulty: Easy                │
   │                                                         │
   │ 💡 Tip: Research company values, recent news...        │
   └─────────────────────────────────────────────────────────┘

2. ANSWER TEXTAREA
   - Large text area (300 words max recommended)
   - Word count: "127 words (~1 min answer)"
   - Time estimate: "~1-2 minutes to deliver"
   - Auto-save every 3 seconds
   - No pressure on format/structure

3. GUIDANCE
   "Just get your thoughts out! Don't worry about STAR format or perfect wording.
    We'll help you refine it in the next step."

4. PROGRESS TRACKER
   "3 of 8 questions answered"
   - Show which questions have drafts
   - Highlight current question
   - Easy navigation between questions

5. CONTINUE BUTTON
   Enabled when: ≥8 questions have drafts (≥50 words each)
```

**What We're Collecting**:
- Raw thoughts (no structure imposed)
- Natural writing style
- Key points/themes
- Approximate experience level (based on depth)

---

### PHASE 4: AI Scoring & Iteration (THE MAGIC!)

**Purpose**: Iteratively improve answers through AI feedback

**Scoring Algorithm** (Detailed in next section):

```
For each draft answer:

1. SCORE ANSWER (0-100)
   Breakdown:
   - STAR Structure (25 points)
     ✓ Situation: Clear context? (5)
     ✓ Task: Specific challenge? (5)
     ✓ Action: Your actions detailed? (10)
     ✓ Result: Quantified impact? (5)
   
   - Specificity (25 points)
     ✓ Concrete details vs vague statements (10)
     ✓ Role clarity (I vs We) (8)
     ✓ Technical depth (if applicable) (7)
   
   - Quantification (20 points)
     ✓ Metrics present (10)
     ✓ Business impact quantified (10)
   
   - Relevance (20 points)
     ✓ Answers the question (10)
     ✓ Relevant to JD requirements (10)
   
   - Clarity (10 points)
     ✓ Clear, concise language (5)
     ✓ Logical flow (5)

2. CATEGORIZE SCORE
   - 85-100: "Excellent - Ready for interview!"
   - 75-84: "Strong Answer - Minor tweaks"
   - 60-74: "Good Foundation - Needs iteration"
   - 45-59: "Needs Work - Missing key elements"
   - 0-44: "Weak - Major revision needed"

3. GENERATE FEEDBACK
   A. SUMMARY (2-3 sentences)
      "Your answer has a strong technical foundation and clear 
       outcome. To strengthen it further, add specific metrics 
       about the performance improvement and clarify your exact role."
   
   B. STRENGTHS (2-3 bullets)
      - "Clear context about the legacy system challenges"
      - "Good explanation of technical approach"
   
   C. IMPROVEMENTS (2-4 bullets)
      - "Add specific metric: How much did latency improve?"
      - "Clarify your role: Did you lead, contribute, or architect?"
      - "Strengthen Result: What was business impact? (revenue, UX?)"

4. GENERATE FOLLOW-UP QUESTIONS (3-5)
   Smart targeting:
   - If quantification score low → Ask for specific metrics
   - If STAR Action weak → Ask "What exactly did YOU do?"
   - If Result missing → Ask "What was the measurable outcome?"
   - If context vague → Ask "How large was the team/project?"
   
   Example:
   1. "What specific metric improved and by how much?"
   2. "How many engineers were on the team?"
   3. "What was the business impact in $ or user adoption?"
   4. "Were you the architect, lead, or contributor?"

5. USER RESPONDS
   - User answers follow-ups (10-50 words each)
   - No need for complete sentences
   - Just provide missing facts
   
   Example:
   Q: "What specific metric improved?"
   A: "API latency from 800ms to 120ms (85% reduction)"

6. RE-SCORE WITH NEW CONTEXT
   - Merge follow-up answers into original draft
   - Re-calculate score
   - Show improvement: "75 → 82 (+7 points!)"
   - Repeat if score < 75 (usually 2-3 iterations max)

7. READY FOR TALK TRACK
   When score ≥ 75:
   - Mark as "ready-for-talk-track"
   - Proceed to Talk Track Generation
```

**Key Innovation**: Rapid iteration through targeted questions (not "rewrite entire answer")

---

### PHASE 5: Talk Track Generation

**Purpose**: Convert draft answer → polished STAR format

**Algorithm**:

```
1. LOAD CONTEXT
   - Draft answer + follow-up responses
   - Writing style profile (from Application Coach)
   - Company culture/values
   - JD key requirements
   - Interviewer profile (if available)

2. GENERATE STAR FORMAT
   A. SITUATION (30-40 words)
      - Set context clearly
      - Mention company/team/timeline
      - Establish challenge magnitude
   
   B. TASK (20-30 words)
      - Your specific responsibility
      - Why it was challenging
      - Stakes involved
   
   C. ACTION (80-100 words) - MOST IMPORTANT
      - What YOU specifically did (I, not we)
      - Technical/strategic approach
      - Key decisions made
      - Challenges overcome
   
   D. RESULT (40-50 words)
      - Quantified outcome
      - Business impact
      - Recognition/follow-up

3. INTEGRATE COMPANY CULTURE
   Example:
   If company values "Innovation":
   - Opening line: "I love solving novel problems..."
   - Emphasize: Creative solutions, new approaches
   - Use company buzzwords naturally

4. MATCH WRITING STYLE
   - Use vocabulary from user's writing_style_profile
   - Match sentence length preferences
   - Mirror tone (formal/casual)
   - Preserve natural voice

5. GENERATE 3 FORMATS
   
   A. LONG-FORM (200-250 words)
      Purpose: For practice, full context
      Use: Read aloud, refine delivery
   
   B. CHEAT SHEET (7-10 bullets)
      Purpose: Quick reference during interview
      Format:
      - S: Legacy monolith, 10yr old, team of 8
      - T: Architect migration, zero downtime requirement
      - A1: Designed strangler pattern, microservices
      - A2: Led team through 6-month migration
      - A3: Key decision: Use Kubernetes vs ECS
      - R1: 60% faster deployments (5 days → 2 days)
      - R2: 40% cost reduction ($50K/month savings)
   
   C. OPENING + CLOSING LINES
      Opening: "Great question. At Company X, I led..."
      Closing: "...and that 40% cost reduction is why I'm 
                excited about this role's focus on efficiency."

6. SAVE TO COACH STATE
   - All 3 formats stored
   - Associated with question_id
   - Timestamped for version control
```

**Example Output**:

```json
{
  "talkTrack": {
    "longForm": "Great question. At Company X, I led a critical migration from our 10-year-old monolith to microservices architecture. The system was processing 100M requests/day, so we couldn't afford any downtime. My task was to architect this migration and lead a team of 8 engineers through execution.\n\nI designed a strangler pattern approach where we gradually moved services one-by-one. The key decision point was choosing between Kubernetes and AWS ECS - I chose K8s for long-term flexibility despite the steeper learning curve. Over 6 months, we successfully migrated all core services.\n\nThe results were significant: deployment times dropped from 5 days to 2 days (60% faster), and our infrastructure costs decreased by 40%, saving about $50K monthly. This also set us up for future scalability, which became crucial when we 3x'd our user base the following year. That experience taught me how to balance technical excellence with business pragmatism, which is exactly what this role requires.",
    
    "cheatSheet": [
      "S: Legacy monolith, 10yr old, 100M req/day, team of 8",
      "T: Architect migration, ZERO downtime requirement",
      "A1: Designed strangler pattern (gradual migration)",
      "A2: Key decision: Kubernetes vs ECS → chose K8s (flexibility)",
      "A3: Led team through 6-month execution",
      "R1: 60% faster deployments (5 days → 2 days)",
      "R2: 40% cost reduction ($50K/month)",
      "R3: Enabled 3x user growth next year"
    ],
    
    "openingLine": "Great question. At Company X, I led a critical migration from our 10-year-old monolith to microservices.",
    
    "closingLine": "That experience of balancing technical excellence with business impact is exactly what drew me to this role's focus on scalable architecture.",
    
    "estimatedTime": "2 minutes",
    "wordCount": 234
  }
}
```

---

### PHASE 6: Core Stories Extraction

**Purpose**: Identify 2-3 recurring stories across all answers

**Algorithm**:

```
WHEN: After ≥8 talk tracks generated

1. ANALYZE ALL TALK TRACKS
   For each talk track:
   - Extract key themes (technical, leadership, impact)
   - Extract entities (project names, technologies, teams)
   - Extract metrics (numbers, improvements, outcomes)
   - Extract time periods (when it happened)

2. CLUSTER SIMILAR STORIES
   Algorithm:
   - Compare stories by:
     * Entity overlap (same project/company mentioned)
     * Theme similarity (both about "system design")
     * Metric correlation (same metrics referenced)
     * Time proximity (same time period)
   
   - Create clusters:
     Cluster 1: "Microservices migration"
       - Used in Q1 (system design)
       - Used in Q3 (technical challenge)
       - Used in Q5 (biggest achievement)
       - Used in Q7 (architecture decisions)
       - Used in Q9 (leadership example)
       Coverage: 5/8 questions (62%)
     
     Cluster 2: "Team leadership"
       - Used in Q2 (conflict resolution)
       - Used in Q6 (managing up)
       - Used in Q8 (mentoring)
       Coverage: 3/8 questions (38%)

3. SELECT 2-3 CORE STORIES
   Criteria:
   - Coverage: How many questions does it answer?
   - Strength: How strong is the impact/result?
   - Uniqueness: Does it differentiate the candidate?
   - Versatility: Can it be adapted to various questions?
   
   Select top 2-3 clusters as CORE STORIES

4. CREATE MASTER VERSIONS
   For each core story:
   - Extract best elements from all instances
   - Create definitive STAR version
   - Include ALL relevant metrics
   - Document ALL themes it covers

5. GENERATE STORY MAPPING
   For each question:
   - Which story answers it best?
   - How to adapt the story for this question?
   - What to emphasize?
   - What to de-emphasize?
   - Suggested opening line

6. CREATE ADAPTATION GUIDE
   For each story-question pair:
   
   Example:
   Story: "Microservices Migration"
   Question: "Tell me about a time you faced a technical challenge"
   
   Adaptation:
   - Lead with: "Great question. At Company X, I faced..."
   - Emphasize: Technical problem-solving, architecture decisions
   - De-emphasize: Team management (save for leadership questions)
   - Metric to highlight: "60% faster deployments"
   - Closing: "...and that taught me how to balance innovation with reliability."
```

**Example Output**:

```json
{
  "coreStories": {
    "identified": true,
    "extractedAt": 1729469500,
    "stories": [
      {
        "id": "story1",
        "title": "Microservices Migration Project",
        "masterVersion": {
          "situation": "At Company X (B2B SaaS, 10M users), inherited 10-year-old monolith processing 100M req/day",
          "task": "Architect zero-downtime migration to microservices, lead team of 8 engineers",
          "action": [
            "Designed strangler pattern for gradual migration",
            "Key decision: Kubernetes vs ECS → chose K8s for flexibility",
            "Led 6-month execution, migrated 15 core services",
            "Overcame: data consistency challenges, team learning curve"
          ],
          "result": [
            "60% faster deployments (5 days → 2 days)",
            "40% infrastructure cost reduction ($50K/month)",
            "Enabled 3x user growth in following year",
            "Recognized with 'Technical Excellence' award"
          ]
        },
        "usedInQuestions": ["q1", "q3", "q5", "q7", "q9"],
        "coverage": 62,
        "themes": ["system-design", "architecture", "leadership", "technical-depth", "scalability"],
        "keyMetrics": {
          "deployment": "60% faster",
          "cost": "$50K/month savings",
          "scale": "3x user growth enabled"
        },
        "versatility": "high",
        "strengthScore": 92
      },
      {
        "id": "story2",
        "title": "Cross-Functional Product Launch",
        "masterVersion": { ... },
        "usedInQuestions": ["q2", "q4", "q6", "q8"],
        "coverage": 50,
        "themes": ["collaboration", "conflict-resolution", "stakeholder-management", "product"],
        "keyMetrics": {
          "timeline": "Launched 2 weeks early",
          "adoption": "85% user adoption in Q1",
          "impact": "$2M ARR in first year"
        },
        "versatility": "high",
        "strengthScore": 88
      },
      {
        "id": "story3",
        "title": "Mentoring Junior Engineers",
        "masterVersion": { ... },
        "usedInQuestions": ["q10"],
        "coverage": 12,
        "themes": ["mentoring", "leadership", "culture"],
        "versatility": "medium",
        "strengthScore": 75
      }
    ],
    "storyMapping": {
      "q1": {
        "question": "Tell me about a time you faced a technical challenge",
        "story": "story1",
        "adaptation": {
          "leadWith": "Great question. At Company X, I faced a critical architectural decision...",
          "emphasize": ["Technical problem-solving", "Architecture decisions", "Tradeoffs"],
          "deEmphasize": ["Team management", "Project timeline"],
          "metricToHighlight": "60% faster deployments",
          "closingLine": "...and that experience taught me how to balance innovation with reliability."
        },
        "estimatedTime": "2 minutes"
      },
      "q2": {
        "question": "Tell me about a time you resolved conflict on a team",
        "story": "story2",
        "adaptation": {
          "leadWith": "Absolutely. During a critical product launch...",
          "emphasize": ["Stakeholder management", "Communication", "Compromise"],
          "deEmphasize": ["Technical details", "Architecture"],
          "metricToHighlight": "Launched 2 weeks early despite conflicts",
          "closingLine": "...which taught me that great products require both technical excellence and collaboration."
        },
        "estimatedTime": "2 minutes"
      }
    },
    "practiceRecommendation": {
      "strategy": "Memorize 2 stories deeply, adapt to any question",
      "practiceOrder": ["story1", "story2"],
      "skipStory": "story3",
      "reasoning": "Stories 1 & 2 cover 88% of your questions. Master these first."
    }
  }
}
```

---

## 📊 Scoring Algorithm Details

### Detailed Breakdown of Each Component

#### 1. STAR Structure (25 points)

```javascript
function scoreSTAR(answerText) {
  const score = {
    situation: 0,  // Max 5
    task: 0,       // Max 5
    action: 0,     // Max 10
    result: 0      // Max 5
  };
  
  // Situation (5 points)
  const contextPatterns = [
    /at (company|startup|organization)/i,
    /when (i was|working|leading)/i,
    /(faced|encountered|inherited) (a|the) (problem|challenge|situation)/i,
    /(team|project|system) (of|with) \d+/i  // Quantified context
  ];
  score.situation = contextPatterns.filter(p => p.test(answerText)).length;
  score.situation = Math.min(5, score.situation * 1.5);
  
  // Task (5 points)
  const taskPatterns = [
    /(my role was|i was responsible|i needed to|my task)/i,
    /(the goal|the objective|the challenge) (was|became)/i,
    /(required to|had to) (build|create|design|lead)/i
  ];
  score.task = taskPatterns.filter(p => p.test(answerText)).length;
  score.task = Math.min(5, score.task * 2);
  
  // Action (10 points) - MOST IMPORTANT
  const actionPatterns = [
    /\b(i )(built|created|designed|led|implemented|architected)/i,
    /\b(first|then|next|finally)/i,  // Sequential actions
    /(decided|chose|selected) (to|between)/i,  // Decisions
    /(overcame|solved|addressed) (by|through)/i,  // Problem-solving
    /\b(my|i) (approach|strategy|method) was/i
  ];
  const actionCount = actionPatterns.filter(p => p.test(answerText)).length;
  const wordCount = answerText.split(/\s+/).length;
  const actionDensity = actionCount / (wordCount / 100);  // Actions per 100 words
  score.action = Math.min(10, actionCount * 1.5 + actionDensity);
  
  // Result (5 points)
  const resultPatterns = [
    /\d+%/,  // Percentage improvement
    /\$\d+/,  // Dollar amount
    /(\d+x|by \d+)/i,  // Multiplier
    /(increased|decreased|improved|reduced) (by|to) \d+/i,
    /(resulted in|led to|achieved) (a |an )?[\w\s]+ (increase|improvement|reduction)/i
  ];
  score.result = resultPatterns.filter(p => p.test(answerText)).length;
  score.result = Math.min(5, score.result * 1.8);
  
  return {
    total: Math.round(score.situation + score.task + score.action + score.result),
    breakdown: score
  };
}
```

#### 2. Specificity (25 points)

```javascript
function scoreSpecificity(answerText) {
  let score = 0;
  
  // Concrete details (10 points)
  const specificityIndicators = [
    /\b\d+\s*(engineers?|people|members?|users?|months?|weeks?|days?)/i,  // Quantified nouns
    /\b(specifically|exactly|precisely)/i,
    /(called|named|titled) [A-Z]/,  // Named entities
    /\b(kubernetes|react|python|aws|docker|[A-Z]{2,})/,  // Technologies/acronyms
  ];
  const specificCount = specificityIndicators.filter(p => p.test(answerText)).length;
  score += Math.min(10, specificCount * 2);
  
  // Role clarity (8 points)
  const firstPersonCount = (answerText.match(/\b(i |my |i'm )/gi) || []).length;
  const weCount = (answerText.match(/\bwe /gi) || []).length;
  const iWeRatio = weCount > 0 ? firstPersonCount / weCount : firstPersonCount;
  score += Math.min(8, iWeRatio * 2);
  
  // Technical depth (7 points)
  const technicalPatterns = [
    /(architecture|designed|implemented|optimized|refactored)/i,
    /(api|database|server|service|infrastructure|deployment)/i,
    /(tradeoff|decision|chose|evaluated|compared)/i
  ];
  const techCount = technicalPatterns.filter(p => p.test(answerText)).length;
  score += Math.min(7, techCount * 2);
  
  return Math.round(score);
}
```

#### 3. Quantification (20 points)

```javascript
function scoreQuantification(answerText) {
  let score = 0;
  
  // Metrics present (10 points)
  const metricPatterns = [
    /\d+%/,  // Percentages
    /\d+x/,  // Multipliers
    /\$[\d,]+/,  // Dollar amounts
    /\d+\s*(ms|seconds?|minutes?|hours?|days?|weeks?|months?)/i,  // Time
    /(\d+|reduced|improved|increased)\s+by\s+\d+/i,
    /from\s+\d+\s+to\s+\d+/i  // Before/after
  ];
  const metricCount = metricPatterns.filter(p => p.test(answerText)).length;
  score += Math.min(10, metricCount * 3);
  
  // Business impact quantified (10 points)
  const businessImpactPatterns = [
    /(revenue|arr|sales|users?|customers?)\s+(increased|grew|improved)/i,
    /(cost|expenses?|budget)\s+(decreased|reduced|saved)/i,
    /(time|duration|cycle)\s+(reduced|shortened|improved)/i,
    /(efficiency|productivity|performance)\s+(improved|increased)\s+by/i
  ];
  const impactCount = businessImpactPatterns.filter(p => p.test(answerText)).length;
  score += Math.min(10, impactCount * 5);
  
  return Math.round(score);
}
```

#### 4. Relevance (20 points)

```javascript
function scoreRelevance(answerText, question, jdRequirements) {
  let score = 0;
  
  // Answers the question (10 points)
  const questionKeywords = extractKeywords(question);
  const answerKeywords = extractKeywords(answerText);
  const keywordOverlap = questionKeywords.filter(k => answerKeywords.includes(k)).length;
  score += Math.min(10, (keywordOverlap / questionKeywords.length) * 10);
  
  // Relevant to JD (10 points)
  const jdKeySkills = extractSkills(jdRequirements);
  const answerSkills = extractSkills(answerText);
  const skillOverlap = jdKeySkills.filter(s => answerSkills.includes(s)).length;
  score += Math.min(10, (skillOverlap / jdKeySkills.length) * 10);
  
  return Math.round(score);
}
```

#### 5. Clarity (10 points)

```javascript
function scoreClarity(answerText) {
  let score = 10;  // Start with perfect, deduct for issues
  
  // Word count (ideal: 150-250 words)
  const wordCount = answerText.split(/\s+/).filter(Boolean).length;
  if (wordCount < 100) score -= 2;  // Too short
  if (wordCount > 300) score -= 2;  // Too long
  
  // Sentence length (ideal: 15-25 words)
  const sentences = answerText.split(/[.!?]+/).filter(Boolean);
  const avgSentenceLength = wordCount / sentences.length;
  if (avgSentenceLength < 10) score -= 1;  // Too choppy
  if (avgSentenceLength > 30) score -= 1;  // Too complex
  
  // Readability (Flesch-Kincaid grade level: 8-12)
  const syllables = countSyllables(answerText);
  const fleschKincaid = 0.39 * (wordCount / sentences.length) + 11.8 * (syllables / wordCount) - 15.59;
  if (fleschKincaid > 14) score -= 2;  // Too complex
  if (fleschKincaid < 6) score -= 1;  // Too simple
  
  // Filler words penalty
  const fillerWords = ['um', 'like', 'you know', 'basically', 'actually', 'sort of', 'kind of'];
  const fillerCount = fillerWords.reduce((count, filler) => 
    count + (answerText.match(new RegExp(`\\b${filler}\\b`, 'gi')) || []).length, 0
  );
  score -= Math.min(2, fillerCount * 0.5);
  
  return Math.max(0, Math.round(score));
}
```

---

## 🎯 The "2-3 Core Stories" Strategy

### Why It Works

**Cognitive Load**: Memorizing 30 unique answers is impossible. Memorizing 3 stories and learning to adapt them is achievable.

**Natural Delivery**: Repeating variations of the same story feels more natural and confident than reciting 30 rehearsed scripts.

**Consistency**: Interviewers may ask similar questions in different ways. Using the same story ensures consistency.

### Story Selection Criteria

1. **Coverage** (40% weight): How many questions can this story answer?
2. **Strength** (30% weight): How impactful are the results/metrics?
3. **Versatility** (20% weight): Can it be adapted to various question types?
4. **Uniqueness** (10% weight): Does it differentiate the candidate?

### Story Types (Common Patterns)

**Type 1: Technical Challenge**
- Covers: System design, architecture, problem-solving, technical depth
- Example: "Microservices migration", "Performance optimization", "System redesign"
- Questions it answers: 40-50% of technical questions

**Type 2: Leadership/Collaboration**
- Covers: Team management, conflict resolution, stakeholder management
- Example: "Cross-functional product launch", "Team turnaround", "Mentoring program"
- Questions it answers: 30-40% of behavioral questions

**Type 3: Impact/Growth**
- Covers: Career growth, learning, adaptability, business impact
- Example: "Career pivot story", "Learning new domain", "Starting new initiative"
- Questions it answers: 20-30% of motivation/culture questions

### Adaptation Techniques

**Same Story, Different Angles**:

Example Story: "Microservices Migration"

**For "System Design" question**:
- **Emphasize**: Architecture decisions, tradeoffs, scalability
- **De-emphasize**: Team dynamics, timeline
- **Opening**: "Let me walk you through an architecture decision..."
- **Closing**: "...which taught me to design for future scale."

**For "Leadership" question**:
- **Emphasize**: Team management, communication, mentoring
- **De-emphasize**: Technical implementation details
- **Opening**: "Great question. I led a team of 8 engineers through..."
- **Closing**: "...and that experience showed me how to balance technical leadership with team development."

**For "Biggest Achievement" question**:
- **Emphasize**: Business impact, metrics, recognition
- **De-emphasize**: Technical approach, challenges
- **Opening**: "I'm proud of a project that delivered significant business value..."
- **Closing**: "...saving $50K monthly while enabling 3x growth is what I consider true success."

---

## 💡 Key Innovations

### 1. Reusing Existing Data (Zero Extra Work!)

**From Application Coach**:
- `writing_style_profile`: AI maintains user's natural voice
- `discovery_responses`: Career goals inform answer framing
- `master_resume`: Source of achievements/metrics

**From Job Analysis**:
- `match_score`: Highlight strong skills, address weak ones strategically
- `company_intelligence`: Integrate culture/values naturally
- `people_profiles`: Tailor answers to interviewer's style

**Result**: Candidate gets personalized prep with zero manual setup!

### 2. Iterative Scoring (Not "Rewrite Everything")

**Traditional Approach**: "Your answer is weak. Rewrite it."

**Our Approach**: "Your answer is 68/100. Answer these 3 questions to improve it..."

**Why It Works**:
- Less overwhelming (answer 3 short questions vs rewrite 200 words)
- Faster (2 minutes vs 10 minutes)
- More accurate (AI asks exactly what's missing)
- Preserves user's voice (augments, doesn't replace)

### 3. Core Stories Extraction (Automated Discovery)

**Traditional Approach**: "Pick 3 stories to memorize" (candidate guesses)

**Our Approach**: AI analyzes all answers, identifies recurring stories, creates mapping

**Why It Works**:
- Data-driven (based on actual usage patterns)
- Objective (removes candidate's bias)
- Actionable (provides exact adaptation guide)

### 4. Weakness Framing (Strategic Guidance)

**Traditional Approach**: Avoid mentioning weaknesses

**Our Approach**: Address proactively with positive framing

**Example**:
- **Weakness**: Candidate has only 2 years PM experience (JD wants 5+)
- **Don't Say**: "I'm new to PM" or "I don't have much experience"
- **Do Say**: "I bring a unique engineering background that lets me partner deeply with technical teams"
- **Framing**: "Position as transferable strength, not lack of experience"

### 5. Persona-Specific Questions (Role-Aware)

**Recruiter Interview**:
- Focus: Culture fit, motivation, logistics
- Difficulty: 70% Easy, 25% Medium, 5% Hard
- Tone: Warm, exploratory
- Example: "Why are you interested in our company?"

**Hiring Manager Interview**:
- Focus: Technical depth, problem-solving, domain expertise
- Difficulty: 30% Easy, 50% Medium, 20% Hard
- Tone: Probing, scenario-based
- Example: "How would you design a system for X?"

**Peer Interview**:
- Focus: Collaboration, team fit, work style
- Difficulty: 40% Easy, 40% Medium, 20% Hard
- Tone: Conversational, behavioral
- Example: "Tell me about a time you disagreed with a teammate"

---

## 🏗️ Technical Implementation

### API Endpoints

```
POST /api/jobs/[id]/coach/generate-questions
- Generates 30-40 questions for selected persona
- Input: { interviewStage: 'recruiter' | 'hiring-manager' | 'peer-panel' }
- Output: { questions: [...], cached: boolean, expiresAt: timestamp }

GET /api/jobs/[id]/interview-questions/search
- Web searches for real interview questions
- Input: Query params (companyName, roleTitle)
- Output: { questions: [...], sources: [...] }

POST /api/interview-coach/[jobId]/score-answer
- Scores draft answer, generates follow-ups
- Input: { questionId, answerText, iteration }
- Output: { score: {...}, followUpQuestions: [...], savedAt }

POST /api/interview-coach/[jobId]/answer-followup
- User answers follow-up questions
- Input: { questionId, followUpAnswers: [{q, a}] }
- Output: { success: true, savedAt }

POST /api/interview-coach/[jobId]/generate-talk-track
- Converts draft → STAR formatted talk track
- Input: { questionId }
- Output: { talkTrack: { longForm, cheatSheet, openingLine, closingLine } }

POST /api/interview-coach/[jobId]/extract-core-stories
- Analyzes all answers, identifies 2-3 core stories
- Input: { minQuestions: 8 }
- Output: { stories: [...], storyMapping: {...}, recommendation }
```

### Database Schema

```sql
-- Reuse existing table!
CREATE TABLE coach_state (
  job_id TEXT PRIMARY KEY,
  data_json TEXT,  -- Application Coach data (existing)
  interview_coach_json TEXT,  -- Interview Coach data (NEW!)
  updated_at INTEGER,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- New table for question cache
CREATE TABLE interview_questions_cache (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  persona TEXT NOT NULL,  -- 'recruiter', 'hiring-manager', 'peer-panel'
  questions TEXT NOT NULL,  -- JSON array
  sources TEXT,  -- JSON array of web sources
  web_intelligence_json TEXT,  -- Web search insights (warnings, patterns)
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  UNIQUE(company_name, persona)
);

CREATE INDEX idx_interview_cache_company ON interview_questions_cache(company_name);
CREATE INDEX idx_interview_cache_expiry ON interview_questions_cache(expires_at);
```

### AI Provider Integration

**Models Used**:
- Question Generation: `gpt-4o-mini` ($0.15/1M input, $0.60/1M output)
- Answer Scoring: `gpt-4o-mini` (fast, cheap)
- Talk Track Generation: `claude-3.5-sonnet` (better at matching writing style)
- Core Stories Extraction: `claude-3.5-sonnet` (better at pattern recognition)

**Cost Estimates**:
- Question Generation: ~$0.02 (one-time, 90 day cache)
- Answer Scoring (per iteration): ~$0.01
- Talk Track Generation (per answer): ~$0.03
- Core Stories Extraction: ~$0.05 (one-time)

**Total per Interview**: ~$0.20-$0.40 (for 8-10 questions with 2 iterations avg)

---

## 📝 Prompts & AI Integration

### Prompt: Answer Scoring (V2.0)

```markdown
# Answer Scoring v2.0

You are an expert interview coach evaluating a candidate's draft answer.

## Context

**Question**: {{questionText}}
**Question Category**: {{category}}
**Question Difficulty**: {{difficulty}}

**Job Context**:
- Company: {{companyName}}
- Role: {{roleTitle}}
- Key Requirements: {{jdRequirements}}

{{#if interviewerProfile}}
## INTERVIEWER CONTEXT (Personalize scoring!)

**Interviewer**: {{interviewerProfile.name}} - {{interviewerProfile.role}}
**Communication Style**: {{interviewerProfile.communicationStyle}}
**Key Priorities**: {{interviewerProfile.keyPriorities}}
**Red Flags**: {{interviewerProfile.redFlags}}

**CRITICAL**: Score this answer through THIS SPECIFIC interviewer's lens!
{{/if}}

{{#if writingStyleProfile}}
## Candidate's Writing Style

{{writingStyleProfile}}

**CRITICAL**: Preserve the candidate's natural voice in feedback. Don't ask them to write differently - augment, don't replace.
{{/if}}

## Candidate's Draft Answer

{{answerText}}

## Your Task

Score this answer on a 0-100 scale across 5 dimensions:

### 1. STAR Structure (25 points max)

- **Situation** (5 points): Clear context? (company, team, timeline, scope)
- **Task** (5 points): Specific challenge? (your role, why hard, stakes)
- **Action** (10 points): YOUR actions detailed? (I not we, decisions, approach)
- **Result** (5 points): Quantified impact? (metrics, business outcomes)

**Scoring Guide**:
- 20-25: Complete STAR, all elements present
- 15-19: Strong structure, 1-2 elements could be stronger
- 10-14: Partial structure, missing key elements
- 5-9: Weak structure, only 1-2 elements present
- 0-4: No clear structure

### 2. Specificity (25 points max)

- **Concrete Details** (10 points): Numbers, names, technologies vs vague statements
- **Role Clarity** (8 points): Clear "I" vs "we"? Can tell what YOU did?
- **Technical Depth** (7 points): Appropriate level of detail for question?

**Scoring Guide**:
- 20-25: Extremely specific, concrete examples, clear role
- 15-19: Good specificity, some details could be sharper
- 10-14: Moderate specificity, several vague statements
- 5-9: Mostly vague, hard to understand what happened
- 0-4: Completely generic

### 3. Quantification (20 points max)

- **Metrics Present** (10 points): %, $, time, scale, improvement
- **Business Impact** (10 points): Connected to business outcomes?

**Scoring Guide**:
- 16-20: Multiple metrics, clear business impact
- 11-15: Some metrics, business impact implied
- 6-10: Few metrics, weak business connection
- 1-5: No metrics, no business impact
- 0: Completely qualitative

### 4. Relevance (20 points max)

- **Answers Question** (10 points): Directly addresses what was asked?
- **Relevant to JD** (10 points): Showcases required skills/experience?

**Scoring Guide**:
- 16-20: Perfectly relevant, exactly what interviewer wants
- 11-15: Mostly relevant, minor tangents
- 6-10: Somewhat relevant, doesn't fully answer
- 1-5: Tangential answer
- 0: Completely off-topic

### 5. Clarity (10 points max)

- **Clear Language** (5 points): Easy to understand? Concise?
- **Logical Flow** (5 points): Story flows naturally?

**Scoring Guide**:
- 8-10: Crystal clear, easy to follow
- 6-7: Generally clear, minor confusion points
- 4-5: Somewhat unclear, hard to follow
- 2-3: Very unclear, confusing
- 0-1: Incomprehensible

## Required Output Format

Return ONLY valid JSON (no markdown wrappers):

\```json
{
  "overall": 72,
  "breakdown": {
    "star": 18,
    "specificity": 15,
    "quantification": 12,
    "relevance": 19,
    "clarity": 8
  },
  "scoreCategory": "Good Foundation",
  "feedback": {
    "summary": "Your answer has a strong foundation with clear context and good relevance. To strengthen it, add specific metrics about the performance improvement and clarify your exact role in the implementation.",
    "strengths": [
      "Clear context about the legacy system challenges",
      "Good explanation of the technical approach",
      "Strong alignment with role requirements"
    ],
    "improvements": [
      "Add specific metric: How much did latency improve? (e.g., '800ms to 120ms')",
      "Clarify your role: Did you architect, lead, or implement?",
      "Strengthen Result: What was the business impact? (revenue, UX, adoption?)"
    ]
  },
  "followUpQuestions": [
    "What specific metric improved and by how much?",
    "How many engineers were on the team?",
    "What was the business impact in $ or user adoption %?",
    "Were you the architect, team lead, or individual contributor?"
  ]
}
\```

## Score Categories

- **85-100**: "Excellent - Ready for Interview!"
- **75-84**: "Strong Answer - Minor Tweaks Needed"
- **60-74**: "Good Foundation - Needs Iteration"
- **45-59**: "Needs Work - Missing Key Elements"
- **0-44**: "Weak - Major Revision Needed"

## Follow-Up Questions Guidelines

Generate 3-5 targeted questions that will IMPROVE the answer:

**Target LOW scores first**:
- If quantification < 10 → Ask for specific metrics
- If STAR Action < 7 → Ask "What exactly did YOU do?"
- If Result missing → Ask "What was the measurable outcome?"

**Keep questions SHORT and SPECIFIC**:
- ✅ "What was the team size?"
- ✅ "How much did latency improve?"
- ❌ "Can you elaborate on your technical approach?" (too vague)

**Answerable in 10-50 words**:
- User should be able to answer quickly
- Don't ask for essays, ask for facts

{{#if interviewerProfile}}
## PERSONALIZATION (When interviewer profile available)

**Match Interviewer Priorities**:
- If interviewer values "metrics" → Weight quantification higher
- If interviewer values "clarity" → Weight clarity higher
- If interviewer red flag is "vague answers" → Be strict on specificity

**Tailor Feedback**:
- Reference interviewer by name: "{{interviewerProfile.name}} particularly values..."
- Use interviewer's communication style in feedback tone
- Highlight what THIS interviewer looks for

**Example**:
If interviewer priority is "Data-driven decision making":
→ "{{interviewerProfile.name}} is very data-focused. Add 2-3 metrics to strengthen this answer for him."
{{/if}}
```

---

## 🎓 Summary

### What Makes This Algorithm Special

1. **Zero Setup**: Reuses all existing data from Application Coach and Job Analysis
2. **Personalized**: Questions tailored to company, role, interviewer
3. **Iterative**: Rapid improvement through targeted follow-ups
4. **Strategic**: 2-3 core stories strategy (memorize 3, adapt to 30)
5. **Efficient**: $0.20-$0.40 total cost, 2-3 hours total prep time
6. **Proven**: Based on real interview patterns, STAR method, coaching best practices

### Key Metrics

- **Questions Generated**: 30-40 per persona
- **Questions to Prep**: 8-10 selected by user
- **Iterations per Answer**: 2-3 average
- **Final Score Target**: 75+ (ready for talk track)
- **Core Stories**: 2-3 identified
- **Coverage**: 2-3 stories answer 90%+ of questions
- **Total Prep Time**: 2-3 hours (vs 10+ hours traditional)
- **Total Cost**: $0.20-$0.40 (vs $100+ for human coach)

### Success Criteria

**For Candidate**:
- Feels confident (memorized 2-3 stories deeply)
- Feels prepared (has cheat sheets for all questions)
- Feels authentic (answers sound natural, not rehearsed)

**For Interview Performance**:
- Answers hit STAR structure consistently
- Metrics/quantification included naturally
- Stories adapted smoothly to various questions
- Candidate demonstrates preparation and enthusiasm

---

**End of Documentation**

This algorithm represents months of iteration and incorporates best practices from:
- Professional interview coaches
- STAR method frameworks
- Cognitive learning theory
- Real interview feedback patterns
- Your personal insight about core stories

It's production-ready, cost-effective, and delivers measurable value to candidates preparing for interviews.

