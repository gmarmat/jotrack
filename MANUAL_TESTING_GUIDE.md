# Coach Mode - Manual Testing Guide

**Date**: October 18, 2025  
**Server**: http://localhost:3000  
**Status**: ✅ Server running, pages loading  
**Test Data**: e2e/fixtures/  

---

## 🚀 Quick Start - Test Coach Mode in 5 Minutes

### **Quick Test** (Existing Job):
1. Open http://localhost:3000/jobs/3957289b-30f5-4ab2-8006-3a08b6630beb
2. Scroll down - should see Coach Mode entry card
3. Click "Enter Coach Mode" or "Preview Coach Mode"
4. Explore tabs (Discovery, Score, Resume, Cover Letter, Ready)
5. Click "Generate Discovery Questions" button
6. Observe what happens (should generate questions)

**Expected Time**: 5 minutes  
**Purpose**: Verify basic functionality

---

## 📋 Comprehensive Testing - Marcus Persona (45 min)

### **Setup** (5 min):

1. **Create New Job**:
   - Go to http://localhost:3000
   - Click "+ New Job" or similar
   - Title: "Google - Staff Software Engineer"
   - Company: "Google"
   - Status: "Saved"
   - Click Save/Create

2. **Upload Job Description**:
   - Find attachments section
   - Upload as JD or paste text
   - Copy entire content of: `e2e/fixtures/jd-google-staff-engineer.txt`
   - Paste into document
   - Save

3. **Upload Resume**:
   - Upload as Resume or paste text
   - Copy entire content of: `e2e/fixtures/resume-midlevel-marcus.txt`
   - Paste into document
   - Save

---

### **Step 1: Run Match Score Analysis** (30 sec + AI wait):

**Actions**:
1. Find "Match Score" section
2. Click "Analyze" button
3. Wait for sparkler animation (~20-30s)

**Expected Result**:
- Score: 65-70% (YELLOW tier)
- Color: Yellow/amber gradient
- Gaps listed: Missing quantified achievements, vague descriptions
- Skills section shows keywords

**Test Checkpoints**:
- [ ] Analysis completes successfully
- [ ] Score displays correctly
- [ ] Yellow color applied
- [ ] Gaps make sense (achievement quantification)
- [ ] No crashes or errors

**Screenshot**: Match score result showing 68%

**If It Fails**:
- Check browser console for errors
- Verify files uploaded correctly
- Try refreshing page

---

### **Step 2: See Coach Mode Entry Card** (Immediate):

**After match score completes, scroll to entry card**

**Expected**:
- Yellow/amber gradient card appears
- Message: "Score Medium (68%) - Coach Mode can optimize your application"
- Button: "Enter Coach Mode"
- Quick preview icons (Discovery, Score, Resume, Interview Prep)

**Test Checkpoints**:
- [ ] Entry card appears
- [ ] Correct color (yellow for medium)
- [ ] Message is motivating
- [ ] Button is visible and clickable

**Screenshot**: Entry card with medium score message

**Bug Watch**:
- Card doesn't appear → Bug in CoachModeEntryCard rendering
- Wrong color → Bug in tier calculation
- Wrong message → Bug in score-based messaging

---

### **Step 3: Enter Coach Mode** (5 sec):

**Actions**:
1. Click "Enter Coach Mode" button
2. Wait for navigation

**Expected**:
- Navigate to `/coach/[jobId]`
- See "Coach Mode" header
- 5 tabs visible: Discovery, Score Improvement, Resume Generator, Cover Letter, Ready to Apply
- Discovery tab is active (first tab)
- Other tabs are locked (greyed out with lock icons)
- Phase indicator shows "Pre-Application"

**Test Checkpoints**:
- [ ] Navigation works
- [ ] Page loads in < 2s
- [ ] All tabs visible
- [ ] Discovery tab active
- [ ] Lock icons on other tabs
- [ ] Pre-Application badge shows

**Screenshot**: Coach Mode main page with tabs

**Bug Watch**:
- Page doesn't load → Check browser console
- Tabs missing → Bug in tab rendering
- No lock icons → Bug in progress tracking

---

### **Step 4: Generate Discovery Questions** (15 sec + AI wait):

**Actions**:
1. Should see "Build Your Extended Profile" section
2. Click "Generate Discovery Questions" button
3. Watch sparkler animation (~15s countdown)

**Expected**:
- Button shows countdown timer
- After ~15s, questions appear
- 12-15 questions total
- Batched into groups of 4
- Categories: Leadership, Technical, Projects, Achievements
- Progress bar at top

**Test Checkpoints**:
- [ ] Button animation works
- [ ] Questions generate successfully
- [ ] Right number of questions (12-15)
- [ ] Questions are gap-focused (mentions missing skills)
- [ ] Batched (showing 4 at a time)
- [ ] Progress bar shows "Batch 1 of 4"

**Screenshot**: Discovery wizard with first batch of questions

**Bug Watch**:
- Button freezes → API error (check console)
- Too many/few questions → Prompt logic issue
- Generic questions → Not using match gaps
- All questions at once → Batching broken

---

### **Step 5: Answer Discovery Questions - Batch 1** (5-10 min):

**Sample Answers for Marcus**:

**Q1** (Leadership): "Tell me about a time you led a team..."
```
At CloudTech, I led our backend team of 5 engineers through a major system redesign. 
We were facing performance issues (API taking 800ms), and I coordinated the team to 
redesign our architecture. I held daily standups, divided work into manageable chunks, 
and we reduced response time to 200ms—a 75% improvement. The system now serves 50,000 
daily users with 99.9% uptime.
```
(~80 words)

**Q2** (Achievement): "What was the measurable result of your performance improvements?"
```
Reduced API response time from 800ms to 200ms (75% improvement). This impacted 50,000 
daily active users. We also reduced infrastructure costs by optimizing database queries, 
saving approximately $30K annually in cloud costs.
```
(~40 words)

**Q3** (Technical): "Describe your experience with databases at scale"
```
At CloudTech, I designed PostgreSQL schema handling 10 million records with 50,000 
writes per day. I optimized slow queries, added proper indexing, and implemented caching 
strategy. Query performance improved from 2-3 seconds to under 100ms for most operations.
```
(~45 words)

**Q4** (Skip this one to test skip functionality)
- Click "Skip" button

**Test Checkpoints**:
- [ ] Can type in text areas
- [ ] Word count updates in real-time
- [ ] Word count shows correctly (e.g., "80 / 500 words")
- [ ] Skip button works
- [ ] Progress updates (1 answered, 1 skipped)
- [ ] Can click "Next" to go to batch 2

**Screenshot**: Batch 1 with answers typed in

---

### **Step 6: Complete Remaining Batches** (10-15 min):

**Batch 2** (4 questions):
- Answer 3, skip 1

**Batch 3** (4 questions):
- Answer all 4

**Batch 4** (Final batch):
- Answer 2, skip 1

**Total**: 12 answered, 4 skipped

**Test Checkpoints**:
- [ ] Can navigate Previous/Next between batches
- [ ] Answers persist when going back
- [ ] Progress bar updates correctly
- [ ] Final batch shows "Complete Discovery" button (not "Next")

---

### **Step 7: Complete Discovery & Profile Analysis** (20 sec + AI wait):

**Actions**:
1. Click "Complete Discovery" button
2. Wait for profile analysis (~20s)

**Expected**:
- Button shows sparkler animation
- Countdown timer (~20s)
- Auto-advances to "Score Improvement" tab
- Profile analysis completes

**Expected Profile Extraction**:
```
Skills: Technical Mentorship, High-Scale Systems, Database Optimization
Projects: None new (from resume already)
Achievements:
  - 75% API performance improvement (800ms → 200ms)
  - Serves 50K users daily
  - Designed schema for 10M records
  - Saved $30K annually
Experience Years: leadership: 2, database: 5
Profile Completeness: 80%
```

**Test Checkpoints**:
- [ ] Profile analysis completes
- [ ] Extracts metrics from answers
- [ ] No hallucinated skills
- [ ] Source attribution shown
- [ ] Auto-advances to Score tab

**Screenshot**: Profile analysis results (if visible)

**Bug Watch**:
- Hallucinates skills Marcus doesn't have
- Over-estimates years of experience
- Doesn't extract metrics
- Gets stuck (doesn't auto-advance)

---

### **Step 8: See Score Improvement** (15 sec + AI wait):

**Expected to see on Score Improvement tab**:
- "Recalculate Score" button OR auto-calculation

**Actions**:
1. Click "Recalculate Score" if button present
2. Wait for calculation (~15s)

**Expected Result**:
- Before: 68% (yellow gauge, left side)
- After: 78-82% (green gauge, right side)
- Improvement: +10-14 points
- Breakdown shows: Resume 68% + Profile 12% = 80%
- "+12 points!" celebration banner
- Color changes from yellow to green

**Test Checkpoints**:
- [ ] Score recalculates successfully
- [ ] Improvement is realistic (10-15 points)
- [ ] Gauges display correctly (side-by-side)
- [ ] Color changes to green
- [ ] Celebration appears
- [ ] Breakdown makes sense

**Screenshot**: Before/after score comparison with celebration

**Bug Watch**:
- No improvement or negative improvement
- Unrealistic jump (>20 points)
- Gauges don't display
- Still shows yellow (should be green)

---

### **Step 9: Generate Resume** (25 sec + AI wait):

**Actions**:
1. Navigate to "Resume Generator" tab (should be unlocked now)
2. Click "Generate Resume" button
3. Wait for generation (~25s)

**Expected Result**:
- Split-view editor appears
- Left pane: AI-optimized resume (read-only)
- Right pane: Same resume (editable)
- Resume includes:
  * "Reduced API response time by 75% (800ms → 200ms)"
  * "Serves 50,000+ daily active users"
  * "Led team of 5 engineers"
  * "Saved $30K annually"
  * Keywords from JD (Google, distributed systems, leadership)

**Test Checkpoints**:
- [ ] Resume generates successfully
- [ ] Split-view loads correctly
- [ ] Metrics from discovery are included
- [ ] Achievements quantified
- [ ] Keywords from JD present
- [ ] Resume is honest (no fabrication)
- [ ] ATS-friendly formatting

**Screenshot**: Split-view resume editor with generated resume

**Bug Watch**:
- Resume is vague (doesn't use discovery data)
- Fabricates skills
- Poor formatting
- Missing metrics

---

### **Step 10: Edit & Re-Optimize Resume** (10 min):

**Actions**:
1. In right pane, make a change: Change "Architected" to "Designed and built"
2. Click "Re-Optimize with AI" button
3. Wait for re-optimization (~15s)

**Expected**:
- Left pane updates with new version
- User's language preference preserved ("Designed and built")
- Keywords still present
- Formatting maintained

**Test Checkpoints**:
- [ ] Can edit in right pane
- [ ] Re-Optimize button works
- [ ] Left pane updates
- [ ] User's changes incorporated
- [ ] Keywords maintained

**Screenshot**: Before and after re-optimization

---

### **Step 11: Accept Final Resume** (5 sec):

**Actions**:
1. Click "Accept as Final Resume" button
2. Confirm in dialog

**Expected**:
- Confirmation dialog appears
- Resume saved
- Checkmark appears on Resume tab
- Auto-advances to Cover Letter tab OR tab unlocks

**Test Checkpoints**:
- [ ] Dialog appears
- [ ] Acceptance works
- [ ] Tab shows completion
- [ ] Can proceed to cover letter

---

### **Step 12: Generate Cover Letter** (20 sec + AI wait):

**Actions**:
1. On Cover Letter tab
2. Click "Generate Cover Letter" button
3. Wait (~20s)

**Expected Cover Letter**:
```
Dear Hiring Manager,

I'm excited to apply for the Staff Software Engineer position at Google. Your emphasis 
on innovation and technical excellence resonates with my approach to engineering. With 
5+ years building scalable systems serving 50,000+ users, I'm eager to contribute to 
Google's infrastructure team.

Your job description emphasizes distributed systems and leadership—areas where I've 
delivered results. At CloudTech, I reduced API latency by 75% while mentoring 5 engineers...
```

**Test Checkpoints**:
- [ ] Cover letter generates
- [ ] Mentions Google (not generic)
- [ ] Includes quantified achievements
- [ ] References company culture/values
- [ ] Professional but conversational tone
- [ ] 250-350 words
- [ ] Can edit, copy, download

**Screenshot**: Generated cover letter

---

### **Step 13: Mark as Applied** (10 sec):

**Actions**:
1. Navigate to "Ready to Apply" tab
2. Click "I've Applied! → Start Interview Prep" button
3. Confirm

**Expected**:
- Confirmation dialog
- Phase changes to "Interview Prep"
- Tabs switch to: Recruiter Prep, Hiring Manager Prep, Peer Panel Prep
- Badge changes from "Pre-Application" to "Interview Prep"

**Test Checkpoints**:
- [ ] Dialog appears
- [ ] Phase transition works
- [ ] Tabs switch correctly
- [ ] Badge updates

**Screenshot**: Interview Prep phase with new tabs

---

### **Step 14: Interview Prep Tabs** (2 min):

**Actions**:
1. Click "Recruiter Prep" tab
2. Click "Hiring Manager Prep" tab
3. Click "Peer Panel Prep" tab

**Expected**:
- Placeholder content OR beginning of interview prep
- Clear indication this feature is coming
- Not jarring or broken

**Test Checkpoints**:
- [ ] Tabs clickable
- [ ] Content shows (placeholder ok)
- [ ] No errors or crashes

---

## 🐛 Bug Documentation During Testing

**When you find a bug**:

1. **Note it immediately** in `COACH_MODE_BUGS_DISCOVERED.md`
2. **Use this format**:

```markdown
### Bug #X: [Short descriptive title]
**Severity**: Critical / High / Medium / Low
**Step**: Which step above
**Symptom**: What you see (be specific)
**Expected**: What should happen
**Actual**: What actually happens
**Screenshot**: Take screenshot (Cmd+Shift+4)
**Reproduction**:
1. Step 1
2. Step 2
3. Bug appears

**Priority**: P0 / P1 / P2 / P3
```

3. **Screenshot it**: Save as `bug-X-description.png`
4. **Continue testing**: Don't stop, document and move on

---

## 📸 Screenshots to Capture

**Mandatory** (12 screenshots):
1. Match score result (68%)
2. Entry card (yellow, medium score message)
3. Coach Mode main page (5 tabs)
4. Discovery wizard (first batch)
5. Discovery progress (mid-way through)
6. Score improvement (before/after gauges)
7. Resume editor (split-view)
8. Generated resume (close-up)
9. Re-optimized resume
10. Cover letter generated
11. Mark as Applied confirmation
12. Interview Prep phase (3 new tabs)

**Plus**: Any bugs encountered

---

## ✅ Success Criteria

### **Must Work** (Blocking if broken):
- [ ] Can enter Coach Mode
- [ ] Discovery questions generate
- [ ] Can answer questions
- [ ] Profile analysis completes
- [ ] Score recalculates
- [ ] Resume generates
- [ ] Cover letter generates
- [ ] Can mark as applied

### **Should Work** (Important UX):
- [ ] Entry card shows correct messaging
- [ ] Tab locking works
- [ ] Progress tracking accurate
- [ ] Animations smooth
- [ ] No crashes or errors
- [ ] Performance good (< 3s per step)

### **Nice to Have** (Polish):
- [ ] Messaging is encouraging
- [ ] AI output is high quality
- [ ] UI is intuitive
- [ ] Dark mode works

---

## 🎯 What to Focus On

### **For Marcus (Medium Match)**:

**Key Tests**:
1. **Score Improvement**: Should jump from 68% → 80%+ (dramatic!)
2. **Resume Quality**: Should show all metrics from discovery
3. **Cover Letter**: Should feel personalized to Google
4. **User Feeling**: Marcus should feel "Wow, I was underselling myself!"

**Critical Validations**:
- [ ] Metrics from discovery appear in resume
- [ ] Score improvement is significant (+10-15 points)
- [ ] Cover letter mentions Google culture
- [ ] User feels confident to apply

---

## 🚨 Known Issues (May Encounter)

### **Expected Placeholders**:
- Interview Prep tabs show placeholder (not implemented yet)
- No error - this is expected

### **Potential Issues**:
- Generate buttons may take 20-30s (AI calls)
- Some animations may not be perfect
- Minor UI glitches possible

### **Critical Issues** (Report immediately):
- Page crashes
- Data loss
- Infinite loading
- Fabricated skills in resume
- Score doesn't improve

---

## 🏁 After Completing Marcus

**Next Steps**:
1. Document overall experience (good/bad/confusing)
2. List all bugs found
3. Rate the experience (1-10)
4. Decide: Test Sarah and Elena OR fix bugs first?

**Then**:
- [ ] Test Sarah (Low Match) - Tests recommendations
- [ ] Test Elena (High Match) - Tests minimal editing
- [ ] Compile all findings
- [ ] Create fix priority list

---

## 💡 Quick Tips

**If something seems broken**:
1. Check browser console (F12)
2. Check terminal (server logs)
3. Refresh the page
4. Try clicking again

**If AI call hangs**:
- Wait up to 60s (some calls are slow)
- If > 60s, something's wrong
- Check server logs for errors

**If you see "Sample Data"**:
- This means cached data is being shown
- Click "Analyze" to regenerate

**If you feel confused**:
- That's valuable feedback!
- Note where and why you felt confused
- This helps us improve UX

---

## 📊 Time Estimates

| Step | Time | Total |
|------|------|-------|
| Setup | 5 min | 5 min |
| Match Score | 1 min | 6 min |
| Entry & Navigation | 1 min | 7 min |
| Discovery Questions | 25 min | 32 min |
| Score Improvement | 2 min | 34 min |
| Resume Generation | 10 min | 44 min |
| Cover Letter | 3 min | 47 min |
| Mark as Applied | 1 min | 48 min |
| Documentation | 10 min | 58 min |

**Total**: ~1 hour (including setup and documentation)

---

## 🎉 You're Ready!

**Before Starting**:
- [x] Server running (verified ✅)
- [x] Pages loading (verified ✅)
- [x] Test data ready (fixtures created ✅)
- [x] Bug tracker ready (template created ✅)
- [x] Screenshots folder ready

**Start Here**:
1. Open http://localhost:3000
2. Create new job for Google
3. Upload test fixtures
4. Follow this guide step-by-step!

**Good luck and happy testing!** 🚀

