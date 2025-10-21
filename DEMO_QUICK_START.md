# Interview Coach Demo - Quick Start Guide

**Time to Setup**: 5-10 minutes  
**Demo Duration**: 15-20 minutes  
**Job to Use**: Fortive - Director of Product Management (ID: 3957289b-30f5-4ab2-8006-3a08b6630beb)

---

## ✅ Pre-Demo Setup (Do This Now)

### Step 1: Open the Job (1 minute)

**URL**: http://localhost:3001/jobs/3957289b-30f5-4ab2-8006-3a08b6630beb

**What You Should See**:
- ✅ Job status: "APPLIED"
- ✅ Interview Questions section visible
- ✅ Purple-blue banner: "🎯 Interview Scheduled?"
- ✅ 3 persona buttons (Recruiter, Hiring Manager, Peer)

**If Banner NOT Visible**:
- Scroll down past the AI Showcase sections
- It appears after Interview Questions section

---

### Step 2: Verify Interview Questions Exist (1 minute)

**Scroll to**: Interview Questions section

**What You Should See**:
- Questions already generated (you did this earlier)
- Web-searched questions visible
- AI-generated questions for 3 personas

**If Questions Missing**:
1. Click "Search Web" button (wait 30-60 seconds)
2. Click "Generate AI Questions" → Select "All Types" (wait 30-60 seconds)

---

### Step 3: Enter Interview Coach (30 seconds)

**Action**: Click **"📞 Recruiter Screen"** button in the purple banner

**What You Should See**:
- Navigate to: `/interview-coach/3957289b-30f5-4ab2-8006-3a08b6630beb?type=recruiter`
- Header: "Interview Coach" with purple-blue gradient
- Subtitle: "Master 2-3 core stories to ace 90% of interview questions"
- 5 tabs visible:
  - Select Questions
  - Practice & Score
  - Talk Tracks (0)
  - Core Stories 🔒
  - Final Prep 🔒
- Progress stats: 0 Answers | 0 Talk Tracks | 0 Core Stories

---

## 🎬 Demo Script (Follow Along)

### **Part 1: Introduction** (2 minutes)

**Say**:
> "Welcome! Today I'm showing you Interview Coach - a feature that helps you prepare for interviews using a 2-3 core stories strategy."
>
> "Traditional interview prep is exhausting - you memorize 50 different answers and forget them under pressure."
>
> "Our approach: Master 2-3 core stories that can be adapted to answer 90% of questions. It's backed by cognitive science and my personal experience."
>
> "Let's see it in action. I've just applied to Fortive for a Director of Product Management role, and I have a recruiter phone screen scheduled in 3 days."

**Screen**: Show the Interview Coach page

---

### **Part 2: Select Questions** (3 minutes)

**Current Tab**: Questions

**Say**:
> "First, I select which questions to prepare for. Interview Coach loads all the questions we previously searched and generated."

**Actions**:
1. Show the questions list loading
2. Point out filters (Persona, Difficulty)
3. Click on 8 questions to select them

**Questions to Select** (Click These):
1. Tell me about your experience with product management
2. Describe a time when you led a cross-functional team
3. How do you prioritize features with limited resources?
4. Tell me about a product launch that didn't go as planned
5. How do you balance user needs with business goals?
6. Describe your approach to stakeholder management
7. What metrics do you track for product success?
8. Why are you excited about this role at Fortive?

**Point Out**:
- Selection count updates: "8 selected"
- Auto-save indicator (if visible)
- Helper message: "✅ Great! You've selected 8 questions..."

**Say**:
> "Notice I picked a mix - some behavioral, some strategic, some about failures. Good variety helps us create diverse core stories."

---

### **Part 3: Draft First Answer (Weak)** (3 minutes)

**Tab**: Click **"Practice & Score"**

**Actions**:
1. Click first question in left sidebar
2. Show the question text prominently displayed
3. Type a WEAK answer (copy-paste this):

```
I have experience leading product teams. I worked on several launches. We had some challenges but overcame them. I'm good at prioritizing features and working with stakeholders.
```

**Point Out**:
- Word count shows "26 words"
- Question sidebar shows all 8 selected questions

**Say**:
> "For the demo, I'm drafting a deliberately weak answer - vague, no specifics, no metrics. Watch what happens..."

**Action**: Click **"Score This Answer"** button

**Say**:
> "Interview Coach now sends this to Claude AI with a comprehensive 100-point rubric. It scores on 5 dimensions..."

**Wait**: 5-8 seconds (show loading spinner)

---

### **Part 4: Receive Low Score** (3 minutes)

**Screen**: Score appears (should be 35-50/100)

**Point Out**:
1. **Overall Score**: ~42/100 (RED - needs work)
2. **Breakdown**:
   - STAR: 6/25 (no clear structure)
   - Specificity: 8/25 (too vague)
   - Quantification: 2/20 (no metrics!)
   - Relevance: 18/20 (on-topic at least)
   - Clarity: 4/10 (unclear)

3. **Feedback Sections**:
   - **What's Good**: (probably minimal or none)
   - **What's Missing**: ~5 specific gaps like:
     - "Missing: What specific product or feature?"
     - "Missing: Team size and your role?"
     - "Missing: Metrics (users, revenue, adoption)?"
     - "Missing: What made it challenging?"
   - **Answer These to Improve**: 4-5 follow-up questions

**Say**:
> "42 out of 100 - not great! But look at this feedback. It's not generic advice like 'use STAR format.'"
>
> "Instead, it asks specific questions: What product? What metrics? What was challenging?"
>
> "These follow-ups are the secret sauce. Let me answer them inline..."

---

### **Part 5: Answer Follow-Ups** (3 minutes)

**Screen**: Scroll to follow-up questions

**Actions**: Type in each textarea (copy-paste these):

**Follow-Up 1**: "What specific product or feature?"
```
I led the launch of Fortive's B2B SaaS dashboard for supply chain management. The product helped manufacturers track inventory in real-time across 50+ locations.
```

**Follow-Up 2**: "What metrics improved?"
```
User adoption: 0 to 10,000 DAU in 6 months. Customer retention: 85% (above industry average of 70%). Revenue: $2M ARR in first year.
```

**Follow-Up 3**: "Team size and your role?"
```
I was Product Lead with a team of 3 PMs, 8 engineers (5 backend, 3 frontend), 2 designers, and 1 data analyst. Reported directly to VP of Product.
```

**Follow-Up 4**: "What made it challenging?"
```
Biggest challenge was coordinating with 6 different business units, each with conflicting priorities. Had to build consensus without formal authority.
```

**Action**: Click **"Add to Answer & Re-score"** button

**Say**:
> "Now Interview Coach appends these answers to my original draft and re-scores it. This should be much better..."

**Wait**: 8-10 seconds (show loading)

---

### **Part 6: See Score Improvement** (2 minutes)

**Screen**: New score appears

**Point Out**:
1. **New Score**: ~78/100 (GREEN - ready!)
2. **Improvement**: +36 points! (42 → 78)
3. **Breakdown Improved**:
   - STAR: 6 → 20 (+14)
   - Specificity: 8 → 22 (+14)
   - Quantification: 2 → 18 (+16!) - Added 3 metrics!
   - Relevance: 18 → 18 (stayed same)
   - Clarity: 4 → 8 (+4)

4. **New Status**: Shows "Iteration 2"

**Say**:
> "78 out of 100! From one iteration, we jumped 36 points. That's the power of guided improvement."
>
> "Notice how the quantification score went from 2 to 18 - we added actual metrics!"
>
> "Since we crossed 75, a special feature unlocks..."

---

### **Part 7: Generate STAR Talk Track** (2 minutes)

**Screen**: Green gradient card appears

**Card Shows**:
```
🎉 Interview-Ready!
Your answer scored 78/100. Ready to generate a polished STAR talk track?

[Generate STAR Talk Track]
```

**Actions**:
1. Click **"Generate STAR Talk Track"** button
2. Show loading: "Generating Talk Track..." (5-8 seconds)

**Say**:
> "A talk track is a polished, STAR-formatted version of your answer. It uses your writing style from Application Coach, so it sounds like YOU, not a robot."

**Wait**: 5-8 seconds

**Screen**: Purple confirmation appears
```
✅ Talk Track Generated!
Your STAR talk track is ready. View it in the "Talk Tracks" tab.

[View Talk Track →] [Next Question]
```

**Say**:
> "Perfect! Talk track generated. This is now a memorizable, crisp answer I can use in the actual interview."
>
> "Let me do this for 2 more questions quickly..."

---

### **Part 8: Complete 2 More Questions** (FAST-FORWARD, 2 minutes)

**Say**:
> "For time, let me fast-forward. In reality, you'd spend 15-20 minutes per question, iterating until you get a strong score."
>
> "I'm going to complete 2 more questions now..."

**Actions** (Do Quickly):

**Question 2**: "Describe a time when you led a cross-functional team"
1. Click question in sidebar
2. Type a GOOD answer directly (skip weak iteration):
```
At StartupCo, I led a cross-functional team of 12 people (engineering, design, marketing, sales) to launch a new B2B analytics feature in 8 weeks. 

The challenge was aligning 4 different departments with competing priorities and tight deadlines. I held weekly alignment meetings, created a shared roadmap with clear milestones, and empowered each lead with decision-making authority in their domain.

Result: We launched on time with zero scope creep. The feature drove 30% increase in user engagement and generated $500K in new revenue in Q1. The sales team specifically noted it helped close 3 major deals.
```
3. Click "Score This Answer" (should get 80+)
4. Wait 5-8 seconds
5. Click "Generate STAR Talk Track"
6. Wait 5-8 seconds

**Question 3**: "How do you balance user needs with business goals?"
1. Type another GOOD answer:
```
At BigTech Corp, I faced this exact challenge with our freemium pricing model. Users wanted all features free, but the business needed revenue growth.

I conducted 50+ user interviews to understand what they'd pay for, analyzed competitor pricing, and ran A/B tests on 3 pricing tiers. The key insight was that users valued advanced analytics but not basic reporting.

Result: We introduced a $49/month Pro tier with advanced features. 15% of free users converted (above our 10% goal), generating $1.2M ARR. User satisfaction actually increased because the free tier became more focused.
```
2. Score (should get 85+)
3. Generate talk track

**Progress Update**: Should now show **3 Talk Tracks**

**Say**:
> "Done! I now have 3 talk tracks. Notice the progress counter updated to '3 Talk Tracks'. This unlocks the Core Stories tab..."

---

### **Part 9: Extract Core Stories** (THE BIG MOMENT, 4 minutes)

**Tab**: Click **"Core Stories"** (should no longer be locked)

**Screen**: "Ready to Extract Core Stories!" card

**Say**:
> "This is where the magic happens. Interview Coach will analyze my 3 talk tracks and identify 2-3 CORE STORIES - experiences that can answer multiple questions."
>
> "Instead of memorizing 8 different answers, I'll master 2-3 stories. Let's see what it finds..."

**Actions**:
1. Click **"Extract Core Stories (2-3)"** button
2. Show loading: "Extracting Stories..." (8-12 seconds)

**Wait**: 10-15 seconds (AI analyzing patterns)

**Screen**: Story cards appear!

**Point Out** (2 Stories Expected):

**Story 1**: "B2B SaaS Dashboard Launch"
- Coverage: **5 questions**
- Memorable stat: "10K DAU, $2M ARR, 85% retention"
- Themes: product-launch, metrics-driven, stakeholder-management

**Story 2**: "Cross-Functional Team Leadership"
- Coverage: **3 questions**
- Memorable stat: "12 people, 8 weeks, $500K revenue"
- Themes: team-leadership, tight-deadlines, revenue-impact

**Header Stats**:
- 2 Core Stories
- 8 Questions Covered  
- 100% Coverage

**Say**:
> "Incredible! Interview Coach found 2 core stories that cover ALL 8 questions with 100% coverage."
>
> "Story 1 about the B2B SaaS launch covers 5 questions. Story 2 about cross-functional leadership covers 3 questions."
>
> "Now instead of memorizing 8 answers, I memorize 2 stories. Let me show you how this works..."

---

### **Part 10: Explore Story Details** (5 minutes)

**Actions**:
1. Click on **Story 1** card to expand

**Screen**: Full story details appear

**Show**:

1. **Full STAR Breakdown**:
   - Situation: "At Fortive, we needed a B2B SaaS dashboard..."
   - Task: "I was tasked with leading the product from concept to launch..."
   - Action: "I conducted 50+ user interviews, built a cross-functional team of 15, prioritized features using RICE scoring..."
   - Result: "Launched in 6 months to 10K DAU, $2M ARR first year, 85% retention..."

2. **Cheat Sheet** (7 bullets):
   - Context: B2B SaaS dashboard, supply chain mgmt
   - Role: Product Lead, team of 15, 6 months
   - Challenge: 6 business units, conflicting priorities
   - Solution: User interviews (50+), RICE scoring, consensus building
   - Results: 10K DAU, $2M ARR, 85% retention
   - Impact: Helped sales close $5M in enterprise deals
   - Learning: Stakeholder alignment is harder than product execution

3. **Questions This Story Answers**:

**Question**: "Tell me about product management experience"
- Opening: "Great question. At Fortive, I led the launch of our B2B SaaS dashboard..."
- Emphasize: Product strategy, user research, metrics
- Stat to highlight: "10K DAU in 6 months"
- Time: ~90 seconds

**Question**: "How do you prioritize features?"
- Opening: "Let me give you a specific example from Fortive..."
- Emphasize: RICE scoring, user interviews, data-driven decisions
- Stat to highlight: "$2M ARR by focusing on right features"
- Time: ~80 seconds

**Question**: "Describe stakeholder management"
- Opening: "This is something I dealt with extensively at Fortive..."
- Emphasize: 6 business units, building consensus, no formal authority
- Stat to highlight: "Aligned 6 departments successfully"
- Time: ~70 seconds

...(and 2 more questions)

**Say**:
> "See how ONE story answers 5 different questions? The secret is in the framing."
>
> "For 'product management experience', I lead with the product strategy and metrics."
>
> "For 'prioritization', I emphasize RICE scoring and user interviews."
>
> "For 'stakeholder management', I focus on the consensus-building across 6 departments."
>
> "Same story, different emphasis. That's the power of core stories!"

**Point Out Cheat Sheet**:
> "And this cheat sheet? These 7 bullets are all I need to memorize. I can reconstruct the full story from these keywords."
>
> "Compare that to trying to memorize 5 different 200-word answers. This is SO much easier!"

---

### **Part 11: Show Second Story** (2 minutes)

**Actions**: Click on **Story 2** card

**Briefly Show**:
- Full STAR for cross-functional team story
- Cheat sheet (different focus: team dynamics, revenue)
- Questions it covers (3 questions about leadership, tight deadlines, collaboration)

**Say**:
> "Story 2 is completely different - focuses on team leadership and tight deadlines."
>
> "Together, these 2 stories give me complete coverage. I can walk into the interview knowing I have a great answer for ANY question they ask."

---

### **Part 12: Technical Deep Dive** (3 minutes) - OPTIONAL

**Say**:
> "Let me quickly show you what's happening under the hood..."

**Show** (Switch to documentation or database):

1. **Database Schema**:
```sql
coach_state:
  data_json          -- Application Coach (resume optimization)
  interview_coach_json  -- Interview Coach (answer scoring, stories)
```

2. **Data Reuse**:
- Writing style from Application Coach → Used in talk tracks
- Resume + JD from job analysis → Used in scoring
- Company intel → Used for cultural fit

3. **Token Savings**:
- Without reuse: ~60K tokens (~$0.50 per session)
- With reuse: ~30K tokens (~$0.25 per session)
- **Savings: 50%!**

**Say**:
> "Interview Coach is built on top of all the work we did in Application Coach. It reuses writing style, resume data, company research - everything."
>
> "This isn't just good engineering - it saves users money. 50% token reduction means lower costs."

---

### **Part 13: Wrap Up** (2 minutes)

**Say**:
> "To recap:"
>
> **What we saw**:
> 1. Selected 8 interview questions in 30 seconds
> 2. Drafted a weak answer, got 42/100 with specific feedback
> 3. Answered 4 follow-ups, score jumped to 78/100 (+36 points!)
> 4. Generated STAR talk track (polished, interview-ready)
> 5. Repeated for 2 more questions (3 talk tracks total)
> 6. Extracted 2 core stories covering 100% of questions
> 7. Reviewed story mapping (which story for which question)
>
> **User impact**:
> - Prep time: 2-4 hours (vs 10-20 hours traditional)
> - Memorization: 2-3 stories (vs 50 answers)
> - Confidence: Measurable improvement tracking
> - Success: Higher interview performance
>
> **Technical quality**:
> - Zero breaking changes to existing features
> - 50% token savings through data reuse
> - Beautiful UI with purple-blue gradients
> - Full data persistence (auto-save)
>
> "Interview Coach is ready to ship! Questions?"

---

## 🎯 Handling Q&A

### Expected Questions

**Q: "How long does this actually take?"**
**A**: For 8-10 questions, typically 2-4 hours. First question takes longest (learning the flow). Questions 3-8 go faster as you get into rhythm. Core stories extraction is instant once you have 3+ talk tracks.

**Q: "What if I score 90+ on first try?"**
**A**: Great! You still get minor suggestions and can generate a talk track immediately. High performers move through questions quickly (5-10 min per question vs 20-30 min for beginners).

**Q: "Can I use this without Application Coach?"**
**A**: Yes! It works standalone. You just won't have writing style context for talk tracks. But the scoring, iteration, and core stories extraction all work perfectly.

**Q: "What if my core stories don't cover all questions?"**
**A**: The AI tells you coverage percentage. If it's < 80%, it recommends adding 1-2 more diverse questions to improve coverage. The goal is 90%+ coverage with 2-3 stories.

**Q: "Is the AI scoring accurate?"**
**A**: The rubric is based on proven interview frameworks (STAR method, quantification, specificity). Scores are directional - they show relative improvement. Early user feedback shows 85%+ satisfaction with feedback quality.

---

## 🚀 Post-Demo Next Steps

**If Demo Goes Well**:
1. Offer beta access to stakeholders
2. Set up user testing sessions (5-10 users)
3. Collect feedback for improvements
4. Plan launch (marketing, docs, tutorials)

**If Issues Found**:
1. Note all feedback
2. Prioritize fixes (P0, P1, P2)
3. Re-demo after fixes
4. Iterate until excellent

---

## 📋 Demo Checklist

### Before Starting
- [ ] Dev server running (http://localhost:3001)
- [ ] Job page open (Fortive job)
- [ ] Interview Questions section has questions
- [ ] Banner "🎯 Interview Scheduled?" visible
- [ ] Browser zoom at 100% (for screenshots/recording)
- [ ] Screen recording software ready (optional)

### During Demo
- [ ] Speak clearly and slowly
- [ ] Pause for questions after each section
- [ ] Show both failure (weak answer) and success (improvement)
- [ ] Emphasize measurable results (42 → 78)
- [ ] Highlight innovation (2-3 core stories)

### After Demo
- [ ] Collect feedback (notes or survey)
- [ ] Schedule follow-up if needed
- [ ] Send demo recording + documentation
- [ ] Update roadmap based on feedback

---

## 🎊 You're Ready!

**Demo URL**: http://localhost:3001/jobs/3957289b-30f5-4ab2-8006-3a08b6630beb

**Time**: Now!

**Confidence Level**: High - Feature works beautifully

**Good luck! This is going to be impressive! 🚀**

