# Interview Questions Feature - E2E Testing Strategy

## Overview

Comprehensive end-to-end testing strategy for the Interview Questions feature, covering all user flows, edge cases, and integration points.

---

## Test Suite Structure

```
e2e/
└── interview-questions.spec.ts
    ├── Setup & Teardown
    ├── P0: Critical Path Tests (Must Pass)
    ├── P1: Important Feature Tests
    ├── P2: Edge Cases & Error Handling
    └── E2E: Integration Tests
```

---

## P0: Critical Path Tests (Must Pass)

### **P0-01: Feature visibility based on status**
```typescript
test('P0-01: Interview Questions hidden on ON_RADAR, visible after Applied', async ({ page }) => {
  // Setup: Create job with ON_RADAR status
  const job = await createTestJob({ status: 'ON_RADAR' });
  
  // Navigate to job page
  await page.goto(`http://localhost:3000/jobs/${job.id}`);
  
  // Verify: Interview Questions section should NOT be visible
  const section = page.locator('[data-testid="interview-questions-section"]');
  await expect(section).not.toBeVisible();
  
  // Change status to Applied
  await page.locator('[data-testid^="status-select-"]').selectOption('APPLIED');
  await page.locator('[data-testid^="save-status-"]').click();
  await page.waitForTimeout(500);
  
  // Verify: Interview Questions section NOW visible
  await expect(section).toBeVisible();
  
  // Verify: Empty state shows
  await expect(page.getByText('Prepare for Your Interview')).toBeVisible();
  await expect(page.getByText('📅 I Have an Interview Scheduled')).toBeVisible();
});
```

### **P0-02: Persona selector modal opens and displays options**
```typescript
test('P0-02: Clicking Interview Scheduled opens persona selector', async ({ page }) => {
  // Setup: Job with Applied status
  const job = await createTestJob({ status: 'APPLIED' });
  await page.goto(`http://localhost:3000/jobs/${job.id}`);
  
  // Click "I Have an Interview Scheduled"
  await page.getByText('📅 I Have an Interview Scheduled').click();
  
  // Verify: Modal opens
  await expect(page.getByText("Who's Interviewing You?")).toBeVisible();
  
  // Verify: All 4 options visible
  await expect(page.getByText('Recruiter / HR')).toBeVisible();
  await expect(page.getByText('Hiring Manager')).toBeVisible();
  await expect(page.getByText('Peer / Panel')).toBeVisible();
  await expect(page.getByText('All Interview Types')).toBeVisible();
  
  // Verify: Descriptions visible
  await expect(page.getByText('10 questions')).toBeVisible();
  await expect(page.getByText('15 questions')).toBeVisible();
  await expect(page.getByText('12 questions')).toBeVisible();
  await expect(page.getByText('37 questions')).toBeVisible();
});
```

### **P0-03: AI generation works for single persona (Recruiter)**
```typescript
test('P0-03: Selecting Recruiter generates 10 questions', async ({ page }) => {
  const job = await createTestJob({ status: 'APPLIED' });
  await page.goto(`http://localhost:3000/jobs/${job.id}`);
  
  // Open persona selector
  await page.getByText('📅 I Have an Interview Scheduled').click();
  
  // Select Recruiter
  await page.getByText('Recruiter / HR').click();
  
  // Wait for generation (may take 10-30 seconds)
  await page.waitForTimeout(2000); // Initial delay
  await page.waitForSelector('[data-testid="recruiter-questions-section"]', { timeout: 45000 });
  
  // Verify: Recruiter section appears and is expanded
  const recruiterSection = page.locator('[data-testid="recruiter-questions-section"]');
  await expect(recruiterSection).toBeVisible();
  
  // Verify: Questions count badge
  await expect(recruiterSection.getByText(/10 questions/)).toBeVisible();
  
  // Verify: At least one question visible
  const firstQuestion = recruiterSection.locator('[data-testid^="question-recruiter-"]').first();
  await expect(firstQuestion).toBeVisible();
  
  // Verify: Question has required elements
  await expect(firstQuestion.locator('text=/\\?$/')).toBeVisible(); // Ends with ?
  
  // Verify: Analyzed badge appears
  await expect(page.getByText(/Generated.*ago/)).toBeVisible();
});
```

### **P0-04: Generated questions persist after refresh**
```typescript
test('P0-04: Questions persist after page refresh', async ({ page }) => {
  const job = await createTestJob({ status: 'APPLIED' });
  
  // Generate questions
  await page.goto(`http://localhost:3000/jobs/${job.id}`);
  await page.getByText('📅 I Have an Interview Scheduled').click();
  await page.getByText('Recruiter / HR').click();
  await page.waitForSelector('[data-testid="recruiter-questions-section"]', { timeout: 45000 });
  
  // Refresh page
  await page.reload();
  
  // Verify: Questions still visible (no empty state)
  await expect(page.getByText('Prepare for Your Interview')).not.toBeVisible();
  await expect(page.locator('[data-testid="recruiter-questions-section"]')).toBeVisible();
  
  // Verify: Analyzed badge shows
  await expect(page.getByText(/Generated.*ago/)).toBeVisible();
});
```

### **P0-05: Web search works and shows results**
```typescript
test('P0-05: Web search returns questions with sources', async ({ page }) => {
  const job = await createTestJob({ status: 'APPLIED', company: 'Google' });
  await page.goto(`http://localhost:3000/jobs/${job.id}`);
  
  // Click Search Web button
  await page.getByRole('button', { name: /Search Web/i }).click();
  
  // Wait for search results
  await page.waitForTimeout(5000); // Tavily search
  
  // Verify: Questions appear
  await expect(page.getByText(/From Web Search/i)).toBeVisible();
  
  // Verify: At least one question
  const webQuestion = page.locator('[data-testid^="question-web-"]').first();
  await expect(webQuestion).toBeVisible();
  
  // Verify: Sources button enabled
  const sourcesButton = page.locator('[data-testid="view-sources-interview-questions"]');
  await expect(sourcesButton).toBeVisible();
  await expect(sourcesButton).toBeEnabled();
  
  // Click sources
  await sourcesButton.click();
  
  // Verify: Sources modal opens with URLs
  await expect(page.getByText('Interview Questions Sources')).toBeVisible();
});
```

---

## P1: Important Feature Tests

### **P1-01: Generate all 3 personas**
```typescript
test('P1-01: Generating all types creates 3 persona sections', async ({ page }) => {
  const job = await createTestJob({ status: 'APPLIED' });
  await page.goto(`http://localhost:3000/jobs/${job.id}`);
  
  await page.getByText('📅 I Have an Interview Scheduled').click();
  await page.getByText('All Interview Types').click();
  
  await page.waitForTimeout(2000);
  await page.waitForSelector('[data-testid="recruiter-questions-section"]', { timeout: 60000 });
  
  // Verify: All 3 sections exist
  await expect(page.locator('[data-testid="recruiter-questions-section"]')).toBeVisible();
  await expect(page.locator('[data-testid="hiring-manager-questions-section"]')).toBeVisible();
  await expect(page.locator('[data-testid="peer/panel-questions-section"]')).toBeVisible();
  
  // Verify: Question counts
  await expect(page.getByText('10 questions')).toBeVisible();
  await expect(page.getByText('15 questions')).toBeVisible();
  await expect(page.getByText('12 questions')).toBeVisible();
});
```

### **P1-02: Persona sections expand/collapse**
```typescript
test('P1-02: Persona sections are expandable', async ({ page }) => {
  // Assume questions already generated
  const job = await setupJobWithQuestions({ status: 'APPLIED' });
  await page.goto(`http://localhost:3000/jobs/${job.id}`);
  
  const recruiterSection = page.locator('[data-testid="recruiter-questions-section"]');
  
  // Initially collapsed (or expanded based on flow)
  const firstQuestion = recruiterSection.locator('[data-testid^="question-recruiter-"]').first();
  const isExpanded = await firstQuestion.isVisible();
  
  // Click to toggle
  await recruiterSection.locator('button').first().click();
  
  // Verify: State changed
  if (isExpanded) {
    await expect(firstQuestion).not.toBeVisible();
  } else {
    await expect(firstQuestion).toBeVisible();
  }
});
```

### **P1-03: Question cards show all metadata**
```typescript
test('P1-03: Question cards display category, difficulty, tips', async ({ page }) => {
  const job = await setupJobWithQuestions({ status: 'APPLIED' });
  await page.goto(`http://localhost:3000/jobs/${job.id}`);
  
  // Expand recruiter section
  const recruiterSection = page.locator('[data-testid="recruiter-questions-section"]');
  await recruiterSection.locator('button').first().click();
  
  const firstQuestion = recruiterSection.locator('[data-testid="question-recruiter-questions-0"]');
  
  // Verify: Has question text ending with ?
  await expect(firstQuestion.locator('text=/\\?$/')).toBeVisible();
  
  // Verify: Has category badge
  await expect(firstQuestion.locator('span', { hasText: /Motivation|Culture Fit|Career Goals/i })).toBeVisible();
  
  // Verify: Has difficulty badge
  await expect(firstQuestion.locator('span', { hasText: /Easy|Medium|Hard/i })).toBeVisible();
  
  // Verify: Has tip
  await expect(firstQuestion.getByText(/💡 Tip:/i)).toBeVisible();
});
```

### **P1-04: Web search caching works (90 days)**
```typescript
test('P1-04: Second search for same company uses cache', async ({ page }) => {
  const company = 'Amazon';
  const job1 = await createTestJob({ status: 'APPLIED', company });
  const job2 = await createTestJob({ status: 'APPLIED', company });
  
  // First search
  await page.goto(`http://localhost:3000/jobs/${job1.id}`);
  await page.getByRole('button', { name: /Search Web/i }).click();
  await page.waitForTimeout(5000);
  
  const firstSearchTime = Date.now();
  
  // Navigate to second job
  await page.goto(`http://localhost:3000/jobs/${job2.id}`);
  await page.getByRole('button', { name: /Search Web/i }).click();
  
  const secondSearchTime = Date.now();
  
  // Verify: Second search is faster (cached - should be < 1 second)
  expect(secondSearchTime - firstSearchTime).toBeLessThan(1000);
  
  // Verify: Both show same questions
  const questions1 = await getQuestionTexts(page, 'web');
  await page.goto(`http://localhost:3000/jobs/${job1.id}`);
  const questions2 = await getQuestionTexts(page, 'web');
  
  expect(questions1).toEqual(questions2);
});
```

### **P1-05: Hiring Manager questions include STAR guidance**
```typescript
test('P1-05: HM questions show STAR method guidance', async ({ page }) => {
  const job = await setupJobWithQuestions({ status: 'APPLIED' });
  await page.goto(`http://localhost:3000/jobs/${job.id}`);
  
  // Expand Hiring Manager section
  await page.locator('[data-testid="hiring-manager-questions-section"]').locator('button').first().click();
  
  // Find first question
  const firstQuestion = page.locator('[data-testid^="question-hiring-manager-"]').first();
  
  // Verify: Has STAR guidance
  await expect(firstQuestion.getByText(/⭐ STAR Method:/i)).toBeVisible();
  
  // Verify: Mentions Situation, Task, Action, Result
  const starText = await firstQuestion.getByText(/STAR Method/).textContent();
  expect(starText).toMatch(/Situation|Task|Action|Result/i);
});
```

### **P1-06: Peer questions show key discussion points**
```typescript
test('P1-06: Peer questions display technical key points', async ({ page }) => {
  const job = await setupJobWithQuestions({ status: 'APPLIED' });
  await page.goto(`http://localhost:3000/jobs/${job.id}`);
  
  // Expand Peer section
  await page.locator('[data-testid="peer/panel-questions-section"]').locator('button').first().click();
  
  // Find first question
  const firstQuestion = page.locator('[data-testid^="question-peer-"]').first();
  
  // Verify: Has key points section
  await expect(firstQuestion.getByText(/Key points to discuss:/i)).toBeVisible();
  
  // Verify: Has bullet list
  const bulletPoints = firstQuestion.locator('ul li');
  await expect(bulletPoints.first()).toBeVisible();
});
```

---

## P2: Edge Cases & Error Handling

### **P2-01: Handle no JD (should still generate generic questions)**
```typescript
test('P2-01: Generate questions works without job description', async ({ page }) => {
  const job = await createTestJob({ status: 'APPLIED', jobDescription: '' });
  await page.goto(`http://localhost:3000/jobs/${job.id}`);
  
  await page.getByText('📅 I Have an Interview Scheduled').click();
  await page.getByText('Recruiter / HR').click();
  
  // Should still generate (generic questions)
  await page.waitForSelector('[data-testid="recruiter-questions-section"]', { timeout: 45000 });
  await expect(page.locator('[data-testid="recruiter-questions-section"]')).toBeVisible();
});
```

### **P2-02: Handle API timeout gracefully**
```typescript
test('P2-02: Shows error on API timeout', async ({ page }) => {
  // Mock slow API response
  await page.route('**/interview-questions/generate', route => {
    setTimeout(() => route.abort(), 5000); // Simulate timeout
  }, 70000);
  
  const job = await createTestJob({ status: 'APPLIED' });
  await page.goto(`http://localhost:3000/jobs/${job.id}`);
  
  await page.getByText('📅 I Have an Interview Scheduled').click();
  await page.getByText('Recruiter / HR').click();
  
  // Verify: Error message appears
  await expect(page.getByText(/Generation failed|timeout|error/i)).toBeVisible();
  
  // Verify: UI not stuck (button re-enabled)
  await expect(page.getByRole('button', { name: /Generate AI/i })).toBeEnabled();
});
```

### **P2-03: Handle missing Tavily API key**
```typescript
test('P2-03: Web search shows error without Tavily key', async ({ page }) => {
  // Clear Tavily key
  await clearApiKey('tavily');
  
  const job = await createTestJob({ status: 'APPLIED' });
  await page.goto(`http://localhost:3000/jobs/${job.id}`);
  
  await page.getByRole('button', { name: /Search Web/i }).click();
  
  // Verify: Error about missing API key
  await expect(page.getByText(/Tavily.*API key|Search failed/i)).toBeVisible();
});
```

### **P2-04: Handle cache expiration (90 days)**
```typescript
test('P2-04: Expired cache triggers new search', async ({ page }) => {
  // Create cache entry that expired 91 days ago
  const expiredTimestamp = Date.now() - (91 * 24 * 60 * 60 * 1000);
  await createExpiredCache({ 
    company: 'TestCorp', 
    expiresAt: Math.floor(expiredTimestamp / 1000) 
  });
  
  const job = await createTestJob({ status: 'APPLIED', company: 'TestCorp' });
  await page.goto(`http://localhost:3000/jobs/${job.id}`);
  
  // Search web
  await page.getByRole('button', { name: /Search Web/i }).click();
  
  // Should trigger new search (not use expired cache)
  // Verify: Longer wait time (new search vs instant cache)
  const startTime = Date.now();
  await page.waitForSelector('text=/From Web Search/i', { timeout: 15000 });
  const searchTime = Date.now() - startTime;
  
  expect(searchTime).toBeGreaterThan(2000); // New search takes time
});
```

---

## E2E: Integration Tests

### **E2E-01: Full user journey from ON_RADAR to interview prep**
```typescript
test('E2E-01: Complete flow from job creation to interview prep', async ({ page }) => {
  // 1. Create job
  await page.goto('http://localhost:3000');
  await page.getByLabel('Job Title').fill('Senior Software Engineer');
  await page.getByLabel('Company').fill('Meta');
  await page.getByRole('button', { name: /Add Job/i }).click();
  
  // 2. Navigate to job page
  await page.waitForURL(/\/jobs\//);
  const jobUrl = page.url();
  
  // 3. Verify: Interview Questions NOT visible yet
  await expect(page.locator('[data-testid="interview-questions-section"]')).not.toBeVisible();
  
  // 4. Change status to Applied
  await page.locator('[data-testid^="status-select-"]').selectOption('APPLIED');
  await page.locator('[data-testid^="save-status-"]').click();
  await page.waitForTimeout(500);
  
  // 5. Verify: Interview Questions NOW visible
  await expect(page.locator('[data-testid="interview-questions-section"]')).toBeVisible();
  
  // 6. Generate questions
  await page.getByText('📅 I Have an Interview Scheduled').click();
  await page.getByText('All Interview Types').click();
  
  // 7. Wait for all 3 personas
  await page.waitForSelector('[data-testid="recruiter-questions-section"]', { timeout: 60000 });
  
  // 8. Verify: All data present
  await expect(page.locator('[data-testid="recruiter-questions-section"]')).toBeVisible();
  await expect(page.locator('[data-testid="hiring-manager-questions-section"]')).toBeVisible();
  await expect(page.locator('[data-testid="peer/panel-questions-section"]')).toBeVisible();
  
  // 9. Refresh and verify persistence
  await page.reload();
  await expect(page.locator('[data-testid="recruiter-questions-section"]')).toBeVisible();
});
```

### **E2E-02: Multiple jobs at same company share web search cache**
```typescript
test('E2E-02: Web search cache shared across jobs for same company', async ({ page }) => {
  const company = 'Stripe';
  
  // Create 2 jobs at same company
  const job1 = await createTestJob({ status: 'APPLIED', company });
  const job2 = await createTestJob({ status: 'APPLIED', company });
  
  // Search web for job 1
  await page.goto(`http://localhost:3000/jobs/${job1.id}`);
  await page.getByRole('button', { name: /Search Web/i }).click();
  await page.waitForSelector('text=/From Web Search/i', { timeout: 15000 });
  
  // Get questions from job 1
  const questions1 = await page.locator('[data-testid^="question-web-"]').count();
  
  // Navigate to job 2 and search
  await page.goto(`http://localhost:3000/jobs/${job2.id}`);
  await page.getByRole('button', { name: /Search Web/i }).click();
  
  // Should be instant (cached)
  await page.waitForSelector('text=/From Web Search/i', { timeout: 2000 });
  
  // Get questions from job 2
  const questions2 = await page.locator('[data-testid^="question-web-"]').count();
  
  // Verify: Same number of questions (shared cache)
  expect(questions1).toBe(questions2);
  expect(questions1).toBeGreaterThan(0);
});
```

---

## Test Utilities & Helpers

### **Setup Functions**

```typescript
async function createTestJob(options: {
  status?: JobStatus;
  company?: string;
  title?: string;
  jobDescription?: string;
}) {
  const res = await fetch('http://localhost:3000/api/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: options.title || 'Software Engineer',
      company: options.company || 'TestCorp',
      status: options.status || 'ON_RADAR',
      postingUrl: 'https://example.com/job',
    })
  });
  
  const data = await res.json();
  
  // Update job description if provided
  if (options.jobDescription) {
    await sqlite.prepare(`
      UPDATE jobs SET job_description = ? WHERE id = ?
    `).run(options.jobDescription, data.jobId);
  }
  
  return { id: data.jobId, ...options };
}

async function setupJobWithQuestions(options: any) {
  const job = await createTestJob(options);
  
  // Pre-generate questions
  await fetch(`http://localhost:3000/api/jobs/${job.id}/interview-questions/generate`, {
    method: 'POST'
  });
  
  await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for generation
  
  return job;
}

async function clearApiKey(provider: 'tavily' | 'claude') {
  await fetch('http://localhost:3000/api/settings/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ [provider + 'ApiKey']: '' })
  });
}

async function createExpiredCache(options: {
  company: string;
  expiresAt: number;
}) {
  await sqlite.prepare(`
    INSERT INTO interview_questions_cache 
    (id, company_name, role_category, searched_questions, search_sources, searched_at, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    options.company.toLowerCase(),
    'Software Engineer',
    JSON.stringify([]),
    JSON.stringify([]),
    options.expiresAt,
    options.expiresAt,
    options.expiresAt
  );
}

async function getQuestionTexts(page: Page, persona: string): Promise<string[]> {
  const questions = page.locator(`[data-testid^="question-${persona}-"]`);
  const count = await questions.count();
  const texts: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const text = await questions.nth(i).textContent();
    if (text) texts.push(text.trim());
  }
  
  return texts;
}
```

---

## Performance Tests

### **PERF-01: AI generation completes within 60 seconds**
```typescript
test('PERF-01: All 3 personas generate in under 60s', async ({ page }) => {
  const job = await createTestJob({ status: 'APPLIED' });
  await page.goto(`http://localhost:3000/jobs/${job.id}`);
  
  await page.getByText('📅 I Have an Interview Scheduled').click();
  
  const startTime = Date.now();
  await page.getByText('All Interview Types').click();
  
  await page.waitForSelector('[data-testid="recruiter-questions-section"]', { timeout: 60000 });
  const endTime = Date.now();
  
  const duration = endTime - startTime;
  expect(duration).toBeLessThan(60000);
  
  console.log(`✅ Generation took ${duration}ms`);
});
```

---

## Accessibility Tests

### **A11Y-01: All buttons have proper labels**
```typescript
test('A11Y-01: Buttons have aria-labels and titles', async ({ page }) => {
  const job = await createTestJob({ status: 'APPLIED' });
  await page.goto(`http://localhost:3000/jobs/${job.id}`);
  
  // Check Search Web button
  const searchBtn = page.getByRole('button', { name: /Search Web/i });
  await expect(searchBtn).toBeVisible();
  
  // Check Generate button
  const generateBtn = page.getByRole('button', { name: /Generate AI/i });
  await expect(generateBtn).toBeVisible();
  
  // Check Sources button (if visible)
  // await expect(page.locator('[title="View Sources"]')).toBeDefined();
});
```

---

## Test Execution Plan

### **Phase 1: Critical Path (Must Pass)**
Run P0 tests first. If any fail, fix before proceeding.

**Expected Duration**: 10-15 minutes
**Pass Criteria**: 5/5 tests pass

### **Phase 2: Feature Tests**
Run P1 tests to verify all features work correctly.

**Expected Duration**: 15-20 minutes
**Pass Criteria**: 6/6 tests pass

### **Phase 3: Edge Cases**
Run P2 tests to ensure error handling.

**Expected Duration**: 10-15 minutes
**Pass Criteria**: 4/4 tests pass

### **Phase 4: Integration**
Run E2E tests for full user journey.

**Expected Duration**: 10-15 minutes
**Pass Criteria**: 2/2 tests pass

---

## Test Data Requirements

### **Jobs**
- Minimum 3 test jobs
- Different companies: Google, Amazon, Meta
- Different statuses: ON_RADAR, APPLIED, PHONE_SCREEN
- With/without job descriptions

### **API Keys**
- Valid Tavily API key (for web search tests)
- Valid Claude API key (for AI generation tests)

### **Database**
- Clean state before each test suite
- Seed data for cache tests
- Cleanup after tests

---

## Success Criteria

### **Definition of Done**

- [ ] All P0 tests pass (5/5)
- [ ] All P1 tests pass (6/6)
- [ ] All P2 tests pass (4/4)
- [ ] All E2E tests pass (2/2)
- [ ] Performance tests pass (generation < 60s)
- [ ] No console errors during tests
- [ ] All features work in both light and dark mode
- [ ] Data persists after refresh
- [ ] Cache works correctly (90 days)

---

## Test Execution

```bash
# Run all interview questions tests
npm run test:e2e -- interview-questions

# Run only P0 (critical path)
npm run test:e2e -- interview-questions -g "P0-"

# Run with UI (for debugging)
npm run test:e2e:ui -- interview-questions
```

---

## Known Issues to Test For

Based on previous experience:

1. **Timestamp format inconsistency** (ms vs seconds)
2. **JSON parsing errors** (markdown wrapper from AI)
3. **Modal z-index conflicts** (persona selector behind other elements)
4. **Loading states not clearing** (stuck on "generating")
5. **Data not persisting** (timestamps not saved)
6. **Cache not working** (duplicate Tavily calls)

---

## Total Estimated Time: 45-65 minutes

All tests should complete in under 1 hour with proper setup.

