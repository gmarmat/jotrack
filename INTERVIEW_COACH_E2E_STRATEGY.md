# Interview Coach E2E Testing Strategy

**Date**: October 20, 2025  
**Status**: Planning Phase

---

## 🎯 Testing Readiness Assessment

### Development Completion Status

| Feature | Status | Blocker for E2E? |
|---------|--------|------------------|
| Database schema | ✅ Complete | No |
| AI prompts | ✅ Complete | No |
| API endpoints (scoring, extraction) | ✅ Complete | No |
| Interview Coach page shell | ✅ Complete | No |
| Practice workspace UI | ✅ Complete | No |
| Core stories display UI | ✅ Complete | No |
| Entry point integration | ✅ Complete | No |
| **Question selection flow** | ❌ Placeholder | **YES** |
| **Talk track generation integration** | ❌ Missing | **YES** |
| **Mock data / seed script** | ❌ Missing | **YES** |

### Recommendation: **Complete 3 Items Before E2E Testing**

We need to complete these 3 items first:

1. **Question Selection Integration** (30 min)
   - Connect to Interview Questions section
   - Allow user to select 8-10 questions
   - Save to `interview_coach_json.selectedQuestions`

2. **Talk Track Generation Integration** (30 min)
   - Add "Generate Talk Track" button when score ≥ 75
   - Call existing `/api/coach/[jobId]/generate-talk-tracks` endpoint
   - Save to `interview_coach_json.answers[qId].talkTrack`

3. **Mock Data / Seed Script** (1 hour)
   - Create test job with all prerequisites
   - Seed interview questions
   - Create helper functions for E2E setup

**Total Time to E2E Ready**: ~2 hours

---

## 📋 E2E Testing Grading Matrix (Score Out of 100)

### Category 1: Coverage Completeness (30 points)

| Criterion | Points | Description |
|-----------|--------|-------------|
| Happy path coverage | 10 | All steps from entry → core stories work |
| Edge cases | 8 | Empty states, error states, missing data |
| User flow variants | 7 | Different personas, different question counts |
| Integration points | 5 | Reuses Application Coach data correctly |

### Category 2: Technical Standards (25 points)

| Criterion | Points | Description |
|-----------|--------|-------------|
| Test isolation | 8 | Each test independent, no state leakage |
| Data cleanup | 7 | Tests clean up after themselves |
| Naming conventions | 5 | Test names follow `should_do_X_when_Y` pattern |
| Assertions quality | 5 | Specific, meaningful assertions (not just "exists") |

### Category 3: Reliability (20 points)

| Criterion | Points | Description |
|-----------|--------|-------------|
| No flaky tests | 10 | Tests pass consistently (99%+ success rate) |
| Proper waits | 5 | Uses waitFor/waitForSelector (no arbitrary timeouts) |
| Error handling | 5 | Tests verify error messages and recovery |

### Category 4: Real-World Simulation (15 points)

| Criterion | Points | Description |
|-----------|--------|-------------|
| Realistic user behavior | 7 | Types like human, pauses, iterates |
| Data realism | 5 | Mock data looks like production data |
| Multi-session simulation | 3 | Tests save/load across "sessions" |

### Category 5: Documentation & Maintainability (10 points)

| Criterion | Points | Description |
|-----------|--------|-------------|
| Test documentation | 5 | Each test has clear description and purpose |
| Helper functions | 3 | DRY principle, reusable setup/teardown |
| Debug-ability | 2 | Easy to understand failures |

**Total**: 100 points

**Grading Scale**:
- **90-100**: Excellent - Production ready
- **75-89**: Good - Minor improvements needed
- **60-74**: Acceptable - Some gaps to fill
- **< 60**: Needs work - Major issues

---

## 🎭 User Journey Map for E2E Testing

### Persona: "Alex - Senior Software Engineer"

**Context**: Alex applied to a Senior Backend Engineer role at TechCorp and just got an email scheduling a recruiter phone screen in 3 days.

### Journey Steps

#### Step 0: Prerequisites (Setup)
- ✅ Job exists (TechCorp - Senior Backend Engineer)
- ✅ Status: APPLIED
- ✅ Resume uploaded and analyzed
- ✅ JD uploaded and analyzed
- ✅ Application Coach completed (writing style evaluated)
- ✅ Interview questions searched and generated

#### Step 1: Entry (Discovery)
**Action**: Alex opens job detail page
- Sees "🎯 Interview Scheduled?" banner
- Reads: "Master your 2-3 core stories that can answer 90% of questions"
- Sees 3 buttons: Recruiter Screen, Hiring Manager, Peer/Panel

**Expected**:
- Banner visible (only if status !== ON_RADAR)
- 3 persona buttons present
- Gradient styling (purple-blue)

#### Step 2: Enter Interview Coach (Commitment)
**Action**: Clicks "📞 Recruiter Screen" button
- Navigates to `/interview-coach/[jobId]?type=recruiter`
- Sees 5 tabs (Questions | Practice | Talk Tracks | Core Stories | Prep)
- Core Stories and Prep tabs are locked (needs 3+ talk tracks)

**Expected**:
- Page loads with purple-blue gradient header
- "Questions" tab active by default
- Progress stats show 0/0/0

#### Step 3: Select Questions (Planning)
**Action**: Alex selects 8 questions to prepare
- Sees list of web-searched + AI-generated questions
- Filters for "Recruiter" persona
- Selects 8 questions (checks boxes)
- Clicks "Start Practicing" button

**Expected**:
- Questions loaded from Interview Questions section
- Can filter by persona/difficulty
- Selected count updates (0/8, 1/8, etc.)
- "Start Practicing" button enabled after 3+ selected
- Auto-saves selection to `interview_coach_json.selectedQuestions`

#### Step 4: Draft First Answer (Initial Attempt)
**Action**: Clicks "Practice & Score" tab
- Sees first question: "Tell me about your experience with system design"
- Drafts a short answer (50 words) - no STAR, vague
- Word count shows "50 words"
- Clicks "Score This Answer"

**Expected**:
- Question text visible
- Textarea updates word count in real-time
- "Score This Answer" button enabled when text > 0
- Loading state shown ("Scoring...")

#### Step 5: Receive Low Score & Feedback (Learning)
**Action**: AI returns score: 42/100
- Sees breakdown: STAR 8/25, Specificity 10/25, etc.
- Reads feedback:
  - ✅ "What's Good": (none, answer too weak)
  - ⚠️ "What's Missing": 5 specific gaps
  - 💬 "Follow-ups": 4 questions to improve
- Reads follow-up questions

**Expected**:
- Score displayed prominently (red color for < 50)
- Breakdown shows all 5 categories
- Feedback sections populated
- Follow-up questions rendered with textareas

#### Step 6: Answer Follow-Ups (Iteration)
**Action**: Alex answers the 4 follow-up questions inline
- Q1: "What was the biggest challenge?" → Types 30 words
- Q2: "What metrics improved?" → Types "Reduced latency from 2s to 200ms"
- Q3: "How many people on team?" → Types "5 engineers, I was tech lead"
- Q4: "What did you learn?" → Types 25 words
- Clicks "Add to Answer & Re-score"

**Expected**:
- Can type in all 4 textareas
- Button disabled until at least 1 follow-up answered
- Clicking button appends answers to original draft
- Automatically re-submits for scoring (iteration 2)

#### Step 7: Receive Improved Score (Progress)
**Action**: AI returns score: 78/100 (iteration 2)
- Sees improvement: +36 points!
- Breakdown improved: STAR 20/25, Specificity 18/25, etc.
- Status changes to "ready-for-talk-track" (≥ 75)
- "Generate Talk Track" button appears

**Expected**:
- Score color changes to green (≥ 75)
- Can view iteration history (iteration 1: 42 → iteration 2: 78)
- "Generate Talk Track" button visible and enabled
- Progress indicator updated

#### Step 8: Generate Talk Track (Conversion)
**Action**: Clicks "Generate Talk Track" button
- Loading state: "Generating STAR talk track..."
- AI returns structured talk track with:
  - Long-form version (STAR breakdown)
  - Cheat sheet (7 bullet points)
  - Estimated time: "90 seconds"

**Expected**:
- Loading state shown (5-8 seconds)
- Talk track saved to `interview_coach_json.answers[qId].talkTrack`
- Can toggle between long-form and cheat sheet views
- Progress updated: talkTracksGenerated: 1

#### Step 9: Complete 2 More Questions (Momentum)
**Action**: Alex repeats steps 4-8 for questions 2 and 3
- Question 2: Initial score 55 → After follow-ups: 82
- Question 3: Initial score 60 → After follow-ups: 88
- Now has 3 talk tracks generated

**Expected**:
- Each question tracked independently
- All iterations preserved
- Progress: talkTracksGenerated: 3
- "Core Stories" tab unlocks (no longer disabled)

#### Step 10: Extract Core Stories (Synthesis)
**Action**: Clicks "Core Stories" tab
- Sees: "Ready to Extract Core Stories!"
- Reads: "You have 3 talk tracks ready. Let's identify your 2-3 core stories..."
- Clicks "Extract Core Stories (2-3)" button
- Loading: "Extracting Stories..." (8-12 seconds)
- AI analyzes all 3 talk tracks

**Expected**:
- Tab becomes clickable after 3+ talk tracks
- Big CTA button to extract
- Loading state shown
- API calls `/extract-core-stories` endpoint

#### Step 11: View Core Stories (Mastery)
**Action**: AI returns 2 core stories
- **Story 1**: "Microservices Migration"
  - Memorable stat: "60% faster deploys, $200K saved"
  - Covers questions: 1, 3
  - Themes: system-design, architecture, scalability
- **Story 2**: "Real-time Analytics Dashboard"
  - Memorable stat: "10K users, 30% adoption"
  - Covers questions: 2, 4, 5
  - Themes: team-leadership, tight-deadlines

**Expected**:
- 2 story cards displayed (grid layout)
- Each card shows: title, stat, coverage count, themes
- Coverage analysis: "2 stories cover 100% of 5 questions"
- Progress updated: coreStoriesExtracted: true

#### Step 12: Explore Story Details (Deep Dive)
**Action**: Clicks on Story 1 card
- Expands to show full STAR breakdown
- Sees cheat sheet (7 bullets to memorize)
- Sees question mapping:
  - Q1: "Tell me about system design"
    - Opening: "Great question. At {Company}, we faced..."
    - Emphasis: Docker + K8s, 8 services, zero-downtime
  - Q3: "Most technical challenge"
    - Opening: "Absolutely. The migration to microservices was..."
    - Emphasis: Feature flags, gradual rollout

**Expected**:
- Story details expand smoothly
- Full STAR visible (Situation, Task, Action, Result)
- Cheat sheet formatted for memorization
- Question mapping specific and actionable

#### Step 13: Save & Exit (Persistence)
**Action**: Alex closes browser tab
- No explicit "Save" button clicked (auto-save handled it)
- Returns 1 hour later
- Navigates back to Interview Coach page

**Expected**:
- All data persists (no loss)
- Can see all 3 answered questions
- Can see 2 core stories
- Can continue where left off

#### Step 14: Practice Mode (Preparation) - Coming Soon
**Action**: Clicks "Final Prep" tab
- Sees practice mode interface (placeholder for now)

**Expected**:
- Tab unlocked after core stories extracted
- Placeholder UI visible
- Future: Full-screen simulator, cheat sheets, timer

---

## 🧪 E2E Test Suite Structure

### File: `e2e/interview-coach-full-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { setupTestJobWithPrerequisites } from './helpers/interview-coach-helpers';

test.describe('Interview Coach - Full Flow', () => {
  let testJobId: string;
  
  test.beforeEach(async ({ page }) => {
    // Create test job with all prerequisites
    testJobId = await setupTestJobWithPrerequisites(page);
  });
  
  test.afterEach(async () => {
    // Cleanup test data
    // TODO: Delete test job and all related data
  });
  
  // Tests below...
});
```

---

## 📝 Detailed Test Cases

### Test 1: Entry Point Visibility
**Score Impact**: 5 points (Coverage - Happy path)

```typescript
test('IC-01: Interview Coach entry point appears after applying', async ({ page }) => {
  // Navigate to job
  await page.goto(`/jobs/${testJobId}`);
  
  // Verify entry banner NOT visible when ON_RADAR
  await expect(page.locator('text=🎯 Interview Scheduled?')).not.toBeVisible();
  
  // Change status to APPLIED
  await page.locator('[data-testid="status-dropdown"]').click();
  await page.locator('text=Applied').click();
  
  // Verify entry banner now visible
  await expect(page.locator('text=🎯 Interview Scheduled?')).toBeVisible();
  await expect(page.locator('text=Master your 2-3 core stories')).toBeVisible();
  
  // Verify 3 persona buttons
  await expect(page.locator('button:has-text("Recruiter Screen")')).toBeVisible();
  await expect(page.locator('button:has-text("Hiring Manager")')).toBeVisible();
  await expect(page.locator('button:has-text("Peer / Panel")')).toBeVisible();
});
```

### Test 2: Navigation to Interview Coach
**Score Impact**: 5 points (Coverage - Happy path)

```typescript
test('IC-02: Can navigate to Interview Coach page', async ({ page }) => {
  await page.goto(`/jobs/${testJobId}`);
  
  // Click Recruiter Screen button
  await page.locator('button:has-text("Recruiter Screen")').click();
  
  // Verify navigation
  await expect(page).toHaveURL(new RegExp(`/interview-coach/${testJobId}\\?type=recruiter`));
  
  // Verify page elements
  await expect(page.locator('h1:has-text("Interview Coach")')).toBeVisible();
  await expect(page.locator('text=Master 2-3 core stories')).toBeVisible();
  
  // Verify 5 tabs
  await expect(page.locator('button:has-text("Select Questions")')).toBeVisible();
  await expect(page.locator('button:has-text("Practice & Score")')).toBeVisible();
  await expect(page.locator('button:has-text("Talk Tracks")')).toBeVisible();
  await expect(page.locator('button:has-text("Core Stories")')).toBeVisible();
  await expect(page.locator('button:has-text("Final Prep")')).toBeVisible();
});
```

### Test 3: Question Selection Flow
**Score Impact**: 8 points (Coverage - Happy path + Edge case)

```typescript
test('IC-03: Can select questions for practice', async ({ page }) => {
  await page.goto(`/interview-coach/${testJobId}?type=recruiter`);
  
  // Verify Questions tab active
  await expect(page.locator('[data-testid="tab-questions"].active')).toBeVisible();
  
  // Verify questions loaded
  await expect(page.locator('[data-testid="question-item"]')).toHaveCount(10, { timeout: 10000 });
  
  // Select 8 questions
  const questions = page.locator('[data-testid="question-checkbox"]');
  for (let i = 0; i < 8; i++) {
    await questions.nth(i).check();
  }
  
  // Verify selection count
  await expect(page.locator('text=8 questions selected')).toBeVisible();
  
  // Verify auto-save (wait for indicator)
  await expect(page.locator('text=Saved')).toBeVisible({ timeout: 3000 });
});
```

### Test 4: Draft Answer and Initial Scoring
**Score Impact**: 10 points (Coverage - Happy path core feature)

```typescript
test('IC-04: Can draft answer and receive score', async ({ page }) => {
  await page.goto(`/interview-coach/${testJobId}?type=recruiter`);
  
  // Select questions first (helper)
  await selectQuestions(page, 3);
  
  // Go to Practice tab
  await page.locator('button:has-text("Practice & Score")').click();
  
  // Select first question
  await page.locator('[data-testid="question-item"]').first().click();
  
  // Verify question loaded
  await expect(page.locator('[data-testid="question-text"]')).toContainText('Tell me about');
  
  // Draft a weak answer (should score low)
  const weakAnswer = "I worked on a project. It was good. We made improvements.";
  await page.locator('[data-testid="answer-textarea"]').fill(weakAnswer);
  
  // Verify word count
  await expect(page.locator('text=/\\d+ words/')).toContainText('10 words');
  
  // Submit for scoring
  await page.locator('button:has-text("Score This Answer")').click();
  
  // Wait for score (AI call takes 3-5 seconds)
  await expect(page.locator('[data-testid="score-overall"]')).toBeVisible({ timeout: 10000 });
  
  // Verify score is low (< 50)
  const scoreText = await page.locator('[data-testid="score-overall"]').textContent();
  const score = parseInt(scoreText || '0');
  expect(score).toBeLessThan(50);
  
  // Verify breakdown visible
  await expect(page.locator('text=STAR')).toBeVisible();
  await expect(page.locator('text=Specificity')).toBeVisible();
  await expect(page.locator('text=Metrics')).toBeVisible();
  
  // Verify feedback sections
  await expect(page.locator('text=What\'s Missing')).toBeVisible();
  await expect(page.locator('text=Answer These to Improve')).toBeVisible();
});
```

### Test 5: Answer Follow-Ups and Improve Score
**Score Impact**: 10 points (Coverage - Happy path iteration)

```typescript
test('IC-05: Can answer follow-ups and improve score', async ({ page }) => {
  await page.goto(`/interview-coach/${testJobId}?type=recruiter`);
  
  // Complete draft + initial scoring (helper)
  await draftAndScoreAnswer(page, "Weak answer without details");
  
  // Verify follow-up questions exist
  const followUps = page.locator('[data-testid="followup-textarea"]');
  await expect(followUps).toHaveCount(4, { timeout: 2000 });
  
  // Answer all follow-ups
  await followUps.nth(0).fill("The challenge was scaling to 100K users with limited infrastructure");
  await followUps.nth(1).fill("We reduced latency from 2000ms to 200ms (90% improvement)");
  await followUps.nth(2).fill("Team of 5 engineers, I was the tech lead");
  await followUps.nth(3).fill("Learned to balance technical debt with feature velocity");
  
  // Click "Add to Answer & Re-score"
  await page.locator('button:has-text("Add to Answer & Re-score")').click();
  
  // Wait for new score
  await page.waitForTimeout(8000); // AI scoring takes time
  
  // Verify score improved
  const newScoreText = await page.locator('[data-testid="score-overall"]').textContent();
  const newScore = parseInt(newScoreText || '0');
  expect(newScore).toBeGreaterThan(70); // Should be ≥ 75 ideally
  
  // Verify iteration count
  await expect(page.locator('text=/Iteration \\d+/')).toContainText('Iteration 2');
  
  // Verify can view iteration history
  await page.locator('button:has-text("View History")').click();
  await expect(page.locator('text=Iteration 1')).toBeVisible();
  await expect(page.locator('text=Iteration 2')).toBeVisible();
});
```

### Test 6: Generate Talk Track
**Score Impact**: 8 points (Coverage - Happy path conversion)

```typescript
test('IC-06: Can generate talk track when score ≥ 75', async ({ page }) => {
  await page.goto(`/interview-coach/${testJobId}?type=recruiter`);
  
  // Complete answer with good score (helper)
  await draftAndScoreHighQualityAnswer(page);
  
  // Verify "Generate Talk Track" button appears
  await expect(page.locator('button:has-text("Generate Talk Track")')).toBeVisible();
  
  // Click button
  await page.locator('button:has-text("Generate Talk Track")').click();
  
  // Wait for generation (5-8 seconds)
  await expect(page.locator('text=Generating')).toBeVisible();
  await page.waitForTimeout(10000);
  
  // Verify talk track displayed
  await expect(page.locator('[data-testid="talk-track-longform"]')).toBeVisible();
  
  // Verify STAR sections
  await expect(page.locator('text=Situation')).toBeVisible();
  await expect(page.locator('text=Task')).toBeVisible();
  await expect(page.locator('text=Action')).toBeVisible();
  await expect(page.locator('text=Result')).toBeVisible();
  
  // Toggle to cheat sheet view
  await page.locator('button:has-text("Cheat Sheet")').click();
  await expect(page.locator('[data-testid="talk-track-cheatsheet"]')).toBeVisible();
  
  // Verify progress updated
  await expect(page.locator('text=/1.* Talk Track/')).toBeVisible();
});
```

### Test 7: Complete Multiple Questions
**Score Impact**: 7 points (Coverage - User flow variant)

```typescript
test('IC-07: Can complete 3 questions to unlock Core Stories', async ({ page }) => {
  await page.goto(`/interview-coach/${testJobId}?type=recruiter`);
  
  // Complete 3 high-quality answers (helper loop)
  for (let i = 0; i < 3; i++) {
    await selectQuestion(page, i);
    await draftAndScoreHighQualityAnswer(page, `Question ${i+1} answer`);
    await generateTalkTrack(page);
  }
  
  // Verify progress
  await expect(page.locator('text=3')).toBeVisible(); // Talk tracks count in header
  
  // Verify Core Stories tab unlocked
  const coreStoriesTab = page.locator('button:has-text("Core Stories")');
  await expect(coreStoriesTab).not.toHaveAttribute('disabled');
  await expect(coreStoriesTab).not.toContainText('🔒');
});
```

### Test 8: Extract Core Stories
**Score Impact**: 10 points (Coverage - Happy path synthesis)

```typescript
test('IC-08: Can extract 2-3 core stories from talk tracks', async ({ page }) => {
  await page.goto(`/interview-coach/${testJobId}?type=recruiter`);
  
  // Complete 3 talk tracks (helper)
  await completeThreeTalkTracks(page);
  
  // Navigate to Core Stories tab
  await page.locator('button:has-text("Core Stories")').click();
  
  // Verify ready state
  await expect(page.locator('text=Ready to Extract Core Stories!')).toBeVisible();
  await expect(page.locator('text=You have 3 talk tracks ready')).toBeVisible();
  
  // Click extract button
  await page.locator('button:has-text("Extract Core Stories")').click();
  
  // Wait for extraction (8-12 seconds)
  await expect(page.locator('text=Extracting')).toBeVisible();
  await page.waitForTimeout(15000);
  
  // Verify stories displayed
  const stories = page.locator('[data-testid="core-story-card"]');
  await expect(stories).toHaveCount(2, { timeout: 2000 }); // Should be 2-3
  
  // Verify story 1 has required fields
  const story1 = stories.first();
  await expect(story1.locator('[data-testid="story-title"]')).not.toBeEmpty();
  await expect(story1.locator('[data-testid="story-stat"]')).not.toBeEmpty();
  await expect(story1.locator('[data-testid="story-coverage"]')).toContainText(/\\d+ questions/);
  
  // Verify coverage analysis
  await expect(page.locator('text=/\\d+% of your interview questions/')).toBeVisible();
});
```

### Test 9: Explore Story Details
**Score Impact**: 5 points (Coverage - Deep dive)

```typescript
test('IC-09: Can view full story details and question mapping', async ({ page }) => {
  await page.goto(`/interview-coach/${testJobId}?type=recruiter`);
  
  // Complete full flow to core stories (helper)
  await completeFlowToCoreStories(page);
  
  // Click on first story card
  await page.locator('[data-testid="core-story-card"]').first().click();
  
  // Verify expansion
  await expect(page.locator('[data-testid="story-details-expanded"]')).toBeVisible();
  
  // Verify full STAR
  await expect(page.locator('text=Situation')).toBeVisible();
  await expect(page.locator('text=Task')).toBeVisible();
  await expect(page.locator('text=Action')).toBeVisible();
  await expect(page.locator('text=Result')).toBeVisible();
  
  // Verify cheat sheet
  await expect(page.locator('[data-testid="cheat-sheet"]')).toBeVisible();
  const cheatItems = page.locator('[data-testid="cheat-sheet"] li');
  await expect(cheatItems).toHaveCount(7, { timeout: 1000 });
  
  // Verify question mapping
  await expect(page.locator('text=Questions This Story Answers')).toBeVisible();
  await expect(page.locator('[data-testid="question-mapping-item"]')).toHaveCountGreaterThan(0);
  
  // Verify opening line for mapped question
  await expect(page.locator('text=/Great question|Absolutely/')).toBeVisible();
});
```

### Test 10: Data Persistence Across Sessions
**Score Impact**: 7 points (Real-world - Multi-session)

```typescript
test('IC-10: Data persists across browser sessions', async ({ page, context }) => {
  await page.goto(`/interview-coach/${testJobId}?type=recruiter`);
  
  // Draft and score one answer
  await selectQuestions(page, 3);
  await page.locator('button:has-text("Practice & Score")').click();
  await draftAndScoreAnswer(page, "My detailed answer about system design");
  
  // Verify auto-save indicator
  await expect(page.locator('text=Saved')).toBeVisible({ timeout: 3000 });
  
  // Close page and create new one (simulates closing browser)
  await page.close();
  const newPage = await context.newPage();
  
  // Navigate back to Interview Coach
  await newPage.goto(`/interview-coach/${testJobId}?type=recruiter`);
  await newPage.locator('button:has-text("Practice & Score")').click();
  
  // Verify data persisted
  await expect(newPage.locator('[data-testid="answer-textarea"]')).toContainText('My detailed answer');
  await expect(newPage.locator('[data-testid="score-overall"]')).toBeVisible();
  
  // Verify can continue where left off
  const followUps = newPage.locator('[data-testid="followup-textarea"]');
  await expect(followUps).toHaveCountGreaterThan(0);
});
```

---

## 🛠 Helper Functions

### File: `e2e/helpers/interview-coach-helpers.ts`

```typescript
import { Page } from '@playwright/test';
import { sqlite } from '@/db/client';

export async function setupTestJobWithPrerequisites(page: Page): Promise<string> {
  // 1. Create test job
  const jobId = `test-job-${Date.now()}`;
  
  // 2. Insert job with APPLIED status
  sqlite.prepare(`
    INSERT INTO jobs (id, company, title, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(jobId, 'TestCorp', 'Senior Backend Engineer', 'APPLIED', Date.now(), Date.now());
  
  // 3. Upload test resume and JD (create variants)
  // TODO: Use existing seed functions
  
  // 4. Create Application Coach state (with writing style)
  const coachState = {
    writingStyleProfile: {
      tone: 'professional',
      complexity: 'technical',
      strengths: ['specific', 'quantified']
    },
    discoveryResponses: [
      { question: 'Tell me about yourself', answer: 'I am a senior backend engineer...' }
    ]
  };
  
  sqlite.prepare(`
    INSERT INTO coach_state (job_id, data_json, interview_coach_json, updated_at)
    VALUES (?, ?, ?, ?)
  `).run(jobId, JSON.stringify(coachState), '{}', Math.floor(Date.now() / 1000));
  
  // 5. Seed interview questions
  await seedInterviewQuestions(jobId);
  
  return jobId;
}

async function seedInterviewQuestions(jobId: string) {
  const questions = [
    {
      id: 'q1',
      text: 'Tell me about your experience with system design and architecture.',
      category: 'Technical',
      difficulty: 'Hard',
      persona: 'recruiter'
    },
    {
      id: 'q2',
      text: 'Describe a time when you led a team through a challenging project.',
      category: 'Leadership',
      difficulty: 'Medium',
      persona: 'recruiter'
    },
    {
      id: 'q3',
      text: 'What was the most technically challenging problem you solved?',
      category: 'Technical',
      difficulty: 'Hard',
      persona: 'hiring-manager'
    },
    // Add 7 more questions...
  ];
  
  // Insert into job_interview_questions table
  const recruiterQuestions = questions.filter(q => q.persona === 'recruiter');
  
  sqlite.prepare(`
    INSERT INTO job_interview_questions (id, job_id, recruiter_questions, generated_at, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    `iq-${jobId}`,
    jobId,
    JSON.stringify(recruiterQuestions),
    Math.floor(Date.now() / 1000),
    Math.floor(Date.now() / 1000)
  );
}

export async function selectQuestions(page: Page, count: number) {
  const questions = page.locator('[data-testid="question-checkbox"]');
  for (let i = 0; i < count; i++) {
    await questions.nth(i).check();
  }
  await page.waitForTimeout(2000); // Wait for auto-save
}

export async function draftAndScoreAnswer(page: Page, answerText: string) {
  await page.locator('[data-testid="answer-textarea"]').fill(answerText);
  await page.locator('button:has-text("Score This Answer")').click();
  await page.waitForTimeout(8000); // Wait for AI scoring
}

export async function draftAndScoreHighQualityAnswer(page: Page, context?: string) {
  const goodAnswer = `
    At ${context || 'TechCorp'}, I led the migration of our monolithic application to microservices architecture.
    
    Situation: Our monolith was causing 4-hour deployments and preventing us from scaling beyond 10K users.
    
    Task: As tech lead, I was responsible for architecting and leading the migration with zero downtime.
    
    Action: I designed the microservices architecture using Docker and Kubernetes, breaking the monolith into 8 services.
    I led a team of 6 engineers over 4 months, using feature flags for gradual rollout. The biggest challenge was 
    maintaining zero downtime, which we solved with blue-green deployments.
    
    Result: We reduced deployment time from 4 hours to 30 minutes (87% improvement), cut infrastructure costs by $200K 
    annually, and scaled to 50K concurrent users. The team also shipped features 3x faster.
  `;
  
  await draftAndScoreAnswer(page, goodAnswer);
}

// Add more helpers...
```

---

## ⚠️ Known Edge Cases to Test

1. **Empty States**
   - No questions selected
   - No answers drafted
   - Less than 3 talk tracks (Core Stories locked)

2. **Error States**
   - AI API timeout
   - Invalid API keys
   - Network failures

3. **Data Edge Cases**
   - Very long answers (> 1000 words)
   - Very short answers (< 10 words)
   - Special characters in answers
   - Emoji in answers

4. **Integration Edge Cases**
   - Missing writing style (Application Coach incomplete)
   - Missing JD (no relevance check possible)
   - Job status changes mid-session

---

## 📊 Current E2E Strategy Score

### Self-Grading (Before Implementation)

| Category | Score | Max | Notes |
|----------|-------|-----|-------|
| Coverage Completeness | 25 | 30 | Missing edge cases, need 5 more tests |
| Technical Standards | 20 | 25 | Need more specific assertions |
| Reliability | 15 | 20 | Need to add retry logic for AI calls |
| Real-World Simulation | 13 | 15 | Good realistic data, need multi-session |
| Documentation | 8 | 10 | Good docs, need more inline comments |

**Total Score**: 81/100 (**Good** - Minor improvements needed)

### Improvements to Reach 90+

1. **Add 5 Edge Case Tests** (+5 points)
   - Test: Empty question selection error
   - Test: AI timeout handling
   - Test: Very long answer handling
   - Test: Missing prerequisites warning
   - Test: Job status change during session

2. **Improve Assertions** (+3 points)
   - Use `toHaveText` instead of `toContainText` where exact match needed
   - Add data-testid to all interactive elements
   - Verify database state after operations

3. **Add Retry Logic** (+3 points)
   - Wrap AI calls with retry (3 attempts)
   - Add exponential backoff
   - Verify graceful degradation

**Revised Score After Improvements**: 92/100 (**Excellent** - Production ready)

---

## 🎯 Recommendation

### Option A: Complete Dev First (Recommended)
**Time**: 2 hours dev + 4 hours testing = **6 hours total**

1. Complete question selection integration (30 min)
2. Complete talk track generation integration (30 min)
3. Create mock data seed script (1 hour)
4. Implement E2E tests (3 hours)
5. Fix bugs found (1 hour)

**Benefits**:
- Can test full flow end-to-end
- Real user experience validated
- High confidence in deployment

### Option B: E2E Testing Now (Partial)
**Time**: 3 hours

1. Test what's complete (entry, navigation, UI)
2. Mock out incomplete features
3. Add TODOs for integration tests

**Benefits**:
- Catch UI bugs early
- Validate data persistence
- Parallel dev + testing

---

## 🚀 My Recommendation

**Go with Option A** - Complete the 3 missing features first (2 hours), then do comprehensive E2E testing (4 hours).

**Rationale**:
1. Question selection is critical - can't test practice flow without it
2. Talk track generation is the "conversion" step - need to validate it works
3. Mock data makes testing 10x faster and more reliable
4. We'll catch integration issues immediately instead of discovering them later

**What do you think? Should we:**
- ✅ Complete the 3 dev items first (my recommendation)
- ❌ Start E2E testing now with partial features

Let me know and I'll proceed!

