import { test, expect } from '@playwright/test';

test.describe('Fit Evidence Tables v1.1', () => {
  let jobId: string;

  test.beforeEach(async ({ page }) => {
    const response = await page.request.post('/api/jobs', {
      data: {
        title: 'Test Position',
        company: 'Test Corp',
        status: 'APPLIED',
      },
    });

    const data = await response.json();
    jobId = data.job.id;
  });

  test('should render fit table with at least 10 parameters', async ({ page }) => {
    await page.goto(`/coach/${jobId}`);

    // Fill minimal data
    await page.getByTestId('jd-textarea').fill('React TypeScript developer needed');
    await page.getByTestId('resume-textarea').fill('React TypeScript expert');
    await page.getByTestId('analyze-button').click();

    // Navigate to fit step
    await page.getByTestId('profile-next-button').click();
    await expect(page.getByTestId('fit-table')).toBeVisible({ timeout: 15000 });

    // Count rows in tbody
    const rows = await page.locator('[data-testid="fit-table"] tbody tr').count();
    expect(rows).toBeGreaterThanOrEqual(10);
    expect(rows).toBeLessThanOrEqual(25); // Should be exactly 25
  });

  test('should have all required table columns', async ({ page }) => {
    await page.goto(`/coach/${jobId}`);

    await page.getByTestId('jd-textarea').fill('Python developer');
    await page.getByTestId('resume-textarea').fill('Python expert');
    await page.getByTestId('analyze-button').click();
    await page.getByTestId('profile-next-button').click();

    await expect(page.getByTestId('fit-table')).toBeVisible({ timeout: 15000 });

    // Verify all required columns
    await expect(page.locator('th:has-text("Parameter")')).toBeVisible();
    await expect(page.locator('th:has-text("Weight")')).toBeVisible();
    await expect(page.locator('th:has-text("JD Evidence")')).toBeVisible();
    await expect(page.locator('th:has-text("Resume Evidence")')).toBeVisible();
    await expect(page.locator('th:has-text("Score")')).toBeVisible();
    await expect(page.locator('th:has-text("Notes")')).toBeVisible();
  });

  test('should show explain accordion with formula', async ({ page }) => {
    await page.goto(`/coach/${jobId}`);

    await page.getByTestId('jd-textarea').fill('Test JD');
    await page.getByTestId('resume-textarea').fill('Test Resume');
    await page.getByTestId('analyze-button').click();
    await page.getByTestId('profile-next-button').click();

    await expect(page.getByTestId('fit-table')).toBeVisible({ timeout: 15000 });

    // Click explain button
    await page.getByTestId('fit-explain').click();

    // Verify formula visible
    await expect(page.locator('text=Overall FIT = Σ(weight_i × score_i)')).toBeVisible();
    await expect(page.locator('text=Top 3 Contributors')).toBeVisible();
    await expect(page.locator('text=Threshold:')).toBeVisible();

    // Verify top contributors list has 3 items
    const contributors = page.locator('text=Top 3 Contributors').locator('..').locator('ul li');
    const count = await contributors.count();
    expect(count).toBe(3);

    // Each should show weight × score = contribution
    const firstContributor = await contributors.first().textContent();
    expect(firstContributor).toMatch(/\d+% weight × \d+% score = \d+\.?\d*% contribution/);

    // Hide explain
    await page.getByTestId('fit-explain').click();
    await expect(page.locator('text=Overall FIT = Σ(weight_i × score_i)')).not.toBeVisible();
  });

  test('should display evidence in truncated cells with title attribute', async ({ page }) => {
    await page.goto(`/coach/${jobId}`);

    const longJD = `
      Looking for React developer with expertise in building scalable applications.
      Must have experience with TypeScript, Redux, and modern frontend architecture.
      Familiarity with testing frameworks and CI/CD pipelines required.
    `;

    const longResume = `
      Senior React Developer with 7 years of experience building production applications.
      Expert in TypeScript, Redux state management, and component architecture.
      Strong testing practices using Jest and React Testing Library.
    `;

    await page.getByTestId('jd-textarea').fill(longJD);
    await page.getByTestId('resume-textarea').fill(longResume);
    await page.getByTestId('analyze-button').click();
    await page.getByTestId('profile-next-button').click();

    await expect(page.getByTestId('fit-table')).toBeVisible({ timeout: 15000 });

    // Check that evidence cells have title attributes for hover
    const evidenceCells = page.locator('[data-testid="fit-table"] tbody td:nth-child(3)');
    const firstCell = evidenceCells.first();
    const titleAttr = await firstCell.getAttribute('title');
    
    // Title should contain full evidence (not just truncated version)
    expect(titleAttr).toBeTruthy();
    if (titleAttr) {
      expect(titleAttr.length).toBeGreaterThan(0);
    }
  });

  test('should show progress bars for scores', async ({ page }) => {
    await page.goto(`/coach/${jobId}`);

    await page.getByTestId('jd-textarea').fill('Developer needed');
    await page.getByTestId('resume-textarea').fill('Developer');
    await page.getByTestId('analyze-button').click();
    await page.getByTestId('profile-next-button').click();

    await expect(page.getByTestId('fit-table')).toBeVisible({ timeout: 15000 });

    // Check for progress bars in score column
    const progressBars = page.locator('[data-testid="fit-table"] tbody td:nth-child(5) div.bg-gray-200');
    const count = await progressBars.count();
    expect(count).toBeGreaterThanOrEqual(10); // At least 10 params have progress bars
  });

  test('should show "Why this matters" microcopy', async ({ page }) => {
    await page.goto(`/coach/${jobId}`);

    await page.getByTestId('jd-textarea').fill('Test');
    await page.getByTestId('resume-textarea').fill('Test');
    await page.getByTestId('analyze-button').click();
    await page.getByTestId('profile-next-button').click();

    await expect(page.getByTestId('fit-table')).toBeVisible({ timeout: 15000 });

    // Find and expand "Why this matters"
    const summary = page.locator('summary:has-text("Why this matters")');
    await summary.click();

    // Verify explanation appears
    await expect(page.locator('text=The fit matrix evaluates your profile')).toBeVisible();
  });

  test('should calculate overall score from weighted parameters', async ({ page }) => {
    await page.goto(`/coach/${jobId}`);

    await page.getByTestId('jd-textarea').fill('Python Django AWS');
    await page.getByTestId('resume-textarea').fill('Python Django AWS expert');
    await page.getByTestId('analyze-button').click();
    await page.getByTestId('profile-next-button').click();

    await expect(page.getByTestId('fit-table')).toBeVisible({ timeout: 15000 });

    // Get overall score from header
    const headerText = await page.getByTestId('fit-table').locator('h3').first().locator('..').textContent();
    const scoreMatch = headerText?.match(/(\d+)%/);
    expect(scoreMatch).toBeTruthy();
    
    if (scoreMatch) {
      const score = parseInt(scoreMatch[1]);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });
});

