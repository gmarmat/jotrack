# Interview Coach - Visual Data Flow

## 🎨 Simplified Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER ENTRY POINT                              │
│  Job Detail Page → Click [Recruiter] [HM] [Peer] Button         │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                 STEP 1: QUESTION DISCOVERY                       │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Web Search   │  │ AI Generate  │  │ AI Synthesize│          │
│  │ (Tavily)     │→ │ Questions    │→ │ Top 4        │          │
│  │ 50-150 Qs    │  │ 10-12 Qs     │  │ Questions    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  SIGNALS USED:                       MISSING:                   │
│  ✅ Company name                     ❌ People Profiles         │
│  ✅ Job title                        ❌ Match Score             │
│  ✅ JD + Resume                      ❌ Skills Match            │
│  ✅ Company culture                  ❌ Interviewer priorities  │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│              STEP 2: ANSWER PRACTICE (Question 1)                │
│                                                                  │
│  User drafts answer (200-300 words)                             │
│  User clicks [Score My Answer]                                  │
│                                                                  │
│  ┌─────────────────────────────────────┐                        │
│  │   AI SCORING ENGINE                 │                        │
│  │                                     │                        │
│  │   Rubric:                           │                        │
│  │   - STAR structure (25 pts)         │                        │
│  │   - Specificity (25 pts)            │                        │
│  │   - Quantification (20 pts)         │                        │
│  │   - Relevance (20 pts)              │                        │
│  │   - Clarity (10 pts)                │                        │
│  │                                     │                        │
│  │   Output: Score 0-100 + Feedback    │                        │
│  └─────────────────────────────────────┘                        │
│                                                                  │
│  SIGNALS USED:                       MISSING:                   │
│  ✅ JD + Resume                      ❌ People Profile insights │
│  ✅ Company culture                  ❌ Persona-specific weights│
│  ✅ User writing style               ❌ Interviewer comm style  │
│  ✅ Previous scores                  ❌ Match score gaps        │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│              STEP 3: ITERATIVE IMPROVEMENT                       │
│                                                                  │
│  AI generates 3-5 follow-up questions                           │
│  User answers follow-ups                                        │
│  User clicks [Add to Answer & Re-score]                         │
│                                                                  │
│  Score improves: 45 → 68 → 83                                   │
│  (Show ↑/↓/− indicators)                                        │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼ (When score ≥ 75)
┌─────────────────────────────────────────────────────────────────┐
│              STEP 4: TALK TRACK GENERATION                       │
│                                                                  │
│  User clicks [Generate STAR Talk Track]                         │
│                                                                  │
│  ┌─────────────────────────────────────┐                        │
│  │   AI TALK TRACK ENGINE              │                        │
│  │                                     │                        │
│  │   Input: User's final answer        │                        │
│  │   Output:                           │                        │
│  │   - Long-form STAR (with labels)    │                        │
│  │   - Cheat sheet (bullets)           │                        │
│  │   - Key metrics to memorize         │                        │
│  └─────────────────────────────────────┘                        │
│                                                                  │
│  SIGNALS USED:                       MISSING:                   │
│  ✅ User's answer                     ❌ Interviewer comm style │
│  ✅ Writing style                     ❌ Match score emphasis   │
│  ✅ Discovery insights                ❌ Skills to highlight    │
│  ✅ Company culture                                             │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼ (Repeat Steps 2-4 for Questions 2-4)
┌─────────────────────────────────────────────────────────────────┐
│           STEP 5: CORE STORIES EXTRACTION                        │
│                                                                  │
│  User has 4 talk tracks                                         │
│  User clicks [Extract Core Stories]                             │
│                                                                  │
│  ┌─────────────────────────────────────┐                        │
│  │   AI STORY CLUSTERING ENGINE        │                        │
│  │                                     │                        │
│  │   Analyzes 4 talk tracks            │                        │
│  │   Identifies 2-3 core stories       │                        │
│  │   Maps: Question → Story + Tips     │                        │
│  └─────────────────────────────────────┘                        │
│                                                                  │
│  Output:                                                        │
│  Story 1: "Microservices Migration" (covers Q1, Q3)            │
│  Story 2: "Team Conflict Resolution" (covers Q2, Q4)           │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│              STEP 6: FINAL CHEAT SHEET                           │
│                                                                  │
│  Display:                                                       │
│  - 2-3 core stories (one-liners + memorable stats)             │
│  - Story mapping (which story for which question)              │
│  - Quick tips per persona                                      │
│  - Printable format                                            │
│                                                                  │
│  MISSING:                                                       │
│  ❌ Interviewer-specific tips (from people profiles)           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Signal Utilization Map

### **Available Signals (From Previous Sections)**

```
┌─────────────────────────────────────────────────────────────────┐
│                     DATA SOURCES                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1️⃣  JOB DESCRIPTION (AI-optimized)                             │
│      - Role requirements                                        │
│      - Technical skills needed                                  │
│      - Experience level                                         │
│                                                                  │
│  2️⃣  RESUME (AI-optimized)                                      │
│      - User's experience                                        │
│      - Technical skills                                         │
│      - Achievements                                             │
│                                                                  │
│  3️⃣  COMPANY INTELLIGENCE                                       │
│      - Culture principles (4-6 values)                          │
│      - Recent news                                              │
│      - Keywords (innovation, data-driven, etc.)                 │
│                                                                  │
│  4️⃣  COMPANY ECOSYSTEM                                          │
│      - Competitors                                              │
│      - Partners                                                 │
│      - Market position                                          │
│                                                                  │
│  5️⃣  PEOPLE PROFILES ⭐ (UNDERUTILIZED!)                        │
│      - Interviewer name, title, background                      │
│      - Communication style (formal/casual/data-driven)          │
│      - Key priorities (culture fit/technical/leadership)        │
│      - Red flags (job hopping/lack of metrics/etc.)             │
│      - How to prepare (specific tips)                           │
│                                                                  │
│  6️⃣  MATCH SCORE ANALYSIS (UNDERUTILIZED!)                      │
│      - Overall score: 72/100                                    │
│      - Strong areas (Data Analysis, Python)                     │
│      - Weak areas (Leadership, Cloud)                           │
│      - Gaps to address                                          │
│                                                                  │
│  7️⃣  SKILLS MATCH DATA (UNDERUTILIZED!)                         │
│      - 8 skills matched (strong/medium/weak)                    │
│      - Critical skills (must emphasize)                         │
│      - Missing skills (must address)                            │
│                                                                  │
│  8️⃣  USER WRITING STYLE (from Application Coach)                │
│      - Tone (professional/conversational)                       │
│      - Sentence structure                                       │
│      - Vocabulary level                                         │
│                                                                  │
│  9️⃣  DISCOVERY RESPONSES (from Application Coach)               │
│      - Career motivations                                       │
│      - Work preferences                                         │
│      - Personal stories                                         │
│                                                                  │
│  🔟 WEB SEARCH RESULTS (Glassdoor, Reddit, Blind)              │
│      - Real questions asked at this company                     │
│      - Interview format (behavioral/technical/case)             │
│      - Difficulty level                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔥 Critical Gap: People Profiles Not Used!

### **What We're Missing**

```
┌─────────────────────────────────────────────────────────────────┐
│            PEOPLE PROFILE DATA (EXAMPLE)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Profile: Sarah Johnson (Recruiter)                             │
│  ───────────────────────────────────────────                    │
│                                                                  │
│  Communication Style: "Casual and conversational"               │
│  → Should score answers that use contractions, shorter          │
│     sentences, personal anecdotes HIGHER                        │
│                                                                  │
│  Key Priorities:                                                │
│  - Culture fit (30% weight)                                     │
│  - Motivation (25% weight)                                      │
│  - Team dynamics (20% weight)                                   │
│  → Should generate questions focused on THESE                   │
│  → Should weight scoring rubric toward THESE                    │
│                                                                  │
│  Red Flags:                                                     │
│  - Overly rehearsed answers                                     │
│  - Job hopping without clear reason                             │
│  → Should penalize talk tracks that sound too "scripted"        │
│  → Should proactively address job changes in answers            │
│                                                                  │
│  How to Prepare:                                                │
│  "Focus on 'why this company' and 'why now' stories.            │
│   Be authentic, don't try to sound too corporate."              │
│  → Should include these tips in cheat sheet                     │
│  → Should adjust question selection to cover these areas        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

VS

┌─────────────────────────────────────────────────────────────────┐
│            PEOPLE PROFILE DATA (EXAMPLE 2)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Profile: Michael Chen (Hiring Manager)                         │
│  ───────────────────────────────────────────────                │
│                                                                  │
│  Communication Style: "Data-driven and analytical"              │
│  → Should score answers that lead with METRICS HIGHER           │
│                                                                  │
│  Key Priorities:                                                │
│  - STAR stories with metrics (40% weight!)                      │
│  - Technical depth (30% weight)                                 │
│  - Leadership examples (20% weight)                             │
│  → Different rubric than recruiter!                             │
│                                                                  │
│  Red Flags:                                                     │
│  - Vague answers without specifics                              │
│  - Taking credit for team work                                  │
│  → Should ensure every answer has specific numbers              │
│  → Should emphasize "I led" vs "We did"                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Impact**: Same user, same job, but COMPLETELY different scoring/coaching needed!

---

## 🎯 Enhanced Flow (With People Profiles)

```
┌─────────────────────────────────────────────────────────────────┐
│                 ENHANCED QUESTION GENERATION                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Input: Web search (50 questions) + AI generation (10 Qs)       │
│         + People Profile (Recruiter: Sarah Johnson)             │
│                                                                  │
│  AI Logic:                                                      │
│  1. Filter web questions by Sarah's priorities:                 │
│     ✅ Keep: "Why do you want to work here?" (culture fit)      │
│     ❌ Drop: "Design a URL shortener" (too technical)           │
│                                                                  │
│  2. Generate new questions matching her style:                  │
│     ✅ "Tell me about a time you had to choose between two      │
│        competing job offers. How did you decide?"               │
│        (Motivation + decision-making)                           │
│                                                                  │
│  3. Avoid her red flags:                                        │
│     ❌ Don't ask: "Walk me through your resume"                 │
│        (Too rehearsed-sounding)                                 │
│                                                                  │
│  Output: 4 questions perfectly tailored to Sarah's interview    │
│          style + user's profile                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                 ENHANCED ANSWER SCORING                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Standard Rubric (Generic):                                     │
│  - STAR: 25 pts                                                 │
│  - Specificity: 25 pts                                          │
│  - Quantification: 20 pts                                       │
│  - Relevance: 20 pts                                            │
│  - Clarity: 10 pts                                              │
│                                                                  │
│  ⬇️ ADJUSTED FOR SARAH (Recruiter) ⬇️                           │
│                                                                  │
│  - Authenticity: 30 pts (NEW! Her top priority)                 │
│  - Culture fit signals: 25 pts (↑ from 20)                     │
│  - STAR: 15 pts (↓ from 25, less formal)                       │
│  - Conversational tone: 20 pts (NEW!)                           │
│  - Clarity: 10 pts (same)                                       │
│                                                                  │
│  Result: Same answer gets DIFFERENT scores for different        │
│          interviewers!                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                 ENHANCED TALK TRACK                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User's Draft (Generic):                                        │
│  "In my previous role, I implemented a new CI/CD pipeline       │
│   that reduced deployment time by 50%..."                       │
│                                                                  │
│  ⬇️ ADJUSTED FOR SARAH (Casual style) ⬇️                        │
│                                                                  │
│  "So at my last company, we had this really frustrating         │
│   deployment process - it would take hours, and everyone        │
│   dreaded release days. I thought, 'There's got to be a         │
│   better way,' so I pitched setting up a CI/CD pipeline.        │
│   Once we got it running, deployments went from 2 hours         │
│   down to just 20 minutes. The whole team was so much           │
│   happier on Fridays!"                                          │
│                                                                  │
│  Note: Same content, but:                                       │
│  - Uses contractions ("there's", "we'd")                        │
│  - Shorter sentences                                            │
│  - Personal emotion ("frustrating", "dreaded", "happier")       │
│  - Conversational transition ("So...")                          │
│                                                                  │
│  ⬇️ VS FOR MICHAEL (Data-driven HM) ⬇️                          │
│                                                                  │
│  "At my previous company, deployment time averaged 2.3 hours    │
│   per release, with a 15% failure rate. I led the              │
│   implementation of a Jenkins-based CI/CD pipeline with         │
│   automated testing. Results: deployment time reduced to        │
│   18 minutes (92% improvement), failure rate dropped to 2%,     │
│   and we increased release frequency from weekly to daily.      │
│   ROI: 40 engineering hours saved per month."                   │
│                                                                  │
│  Note: Same story, but:                                         │
│  - Leads with metrics (2.3 hours, 15% failure rate)             │
│  - Specifies technology (Jenkins)                               │
│  - Quantifies impact (92% improvement, 40 hours/month)          │
│  - Formal tone (no contractions)                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow: Current vs Enhanced

### **Current Flow**
```
Web Search (50 Qs)
        ↓
AI Generate (10 Qs)
        ↓
AI Synthesize (4 Qs)  ← Generic, persona-based
        ↓
User answers
        ↓
AI scores (generic rubric)
        ↓
AI generates talk track (standard format)
```

**Context Used**: 5/10 signals (50%)

---

### **Enhanced Flow**
```
Web Search (50 Qs)
        ↓
AI Generate (10 Qs) ← + People Profile priorities
        ↓
AI Synthesize (4 Qs) ← + Match score gaps + Skills to emphasize
        ↓
User answers
        ↓
AI scores ← + Interviewer-adjusted rubric + Communication style
        ↓
AI generates talk track ← + Interviewer tone + Skills emphasis
```

**Context Used**: 9/10 signals (90%)

---

## 🎯 Summary: What You Asked For

> "I want to understand whether we are catering the questions, responses, and our score for each persona like recruiter, hiring manager, and peer/panel by also accounting for the insights we have from the people profiles for those roles."

**Answer**: 
- ✅ We ARE catering to persona (different prompts for recruiter/HM/peer)
- ❌ We are NOT using People Profile insights (MAJOR GAP!)
- ❌ We are NOT using Match Score insights
- ❌ We are NOT using Skills Match data

**The Fix**: Pass People Profile data to all AI calls (question generation, scoring, talk track generation) to get truly personalized interview prep.

**Impact**: 
- Current: Generic "recruiter questions"
- Enhanced: "Sarah Johnson's style of recruiter questions, tailored to your specific gaps"

---

## 🚀 Recommended Next Step

**Option A (Recommended)**: Implement P0 enhancements FIRST
- Add People Profiles to question generation (2 hours)
- Add People Profiles to answer scoring (2 hours)
- Add People Profiles to talk track generation (2 hours)
- **Total: 6 hours of work, 10x better interview prep**

**Option B**: Document current state, do E2E, enhance later
- Test what we have now
- Build comprehensive test suite
- Enhance in next iteration

Your call! 🎯

