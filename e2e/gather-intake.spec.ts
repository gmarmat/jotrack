import { test, expect } from '@playwright/test';

test.describe('Coach Gather Intake v1.1', () => {
  let jobId: string;

  test.beforeEach(async ({ page }) => {
    const response = await page.request.post('/api/jobs', {
      data: {
        title: 'Test Engineer v1.1',
        company: 'Test Corp',
        status: 'APPLIED',
        notes: 'Testing v1.1 gather intake',
      },
    });

    const data = await response.json();
    jobId = data.job.id;
  });

  test('should have all new v1.1 input fields', async ({ page }) => {
    await page.goto(`/coach/${jobId}`);

    // Verify all new testids exist
    await expect(page.getByTestId('gather-recruiter-url')).toBeVisible();
    await expect(page.getByTestId('gather-peer-url')).toBeVisible();
    await expect(page.getByTestId('gather-skip-url')).toBeVisible();
    await expect(page.getByTestId('gather-otherco-url')).toBeVisible();

    // Verify original inputs still exist
    await expect(page.getByTestId('jd-textarea')).toBeVisible();
    await expect(page.getByTestId('resume-textarea')).toBeVisible();
  });

  test('should add and display recruiter URL', async ({ page }) => {
    await page.goto(`/coach/${jobId}`);

    const recruiterUrl = 'https://linkedin.com/in/test-recruiter-v11';
    await page.getByTestId('gather-recruiter-url').fill(recruiterUrl);

    // Verify it's stored in the field
    await expect(page.getByTestId('gather-recruiter-url')).toHaveValue(recruiterUrl);
  });

  test('should add multiple peers with role labels', async ({ page }) => {
    await page.goto(`/coach/${jobId}`);

    // Add first peer
    await page.getByTestId('gather-peer-url').fill('https://linkedin.com/in/peer1');
    await page.locator('input[placeholder="Role (optional)"]').first().fill('Senior Engineer');
    await page.locator('button:has-text("Add")').first().click();

    // Verify peer appears
    await expect(page.locator('text=https://linkedin.com/in/peer1')).toBeVisible();
    await expect(page.locator('text=Senior Engineer')).toBeVisible();

    // Add second peer
    await page.getByTestId('gather-peer-url').fill('https://linkedin.com/in/peer2');
    await page.locator('input[placeholder="Role (optional)"]').first().fill('Tech Lead');
    await page.locator('button:has-text("Add")').first().click();

    // Verify both peers visible
    await expect(page.locator('text=https://linkedin.com/in/peer1')).toBeVisible();
    await expect(page.locator('text=https://linkedin.com/in/peer2')).toBeVisible();
    await expect(page.locator('text=Tech Lead')).toBeVisible();

    // Remove first peer
    await page.locator('button:has-text("Remove")').first().click();

    // Verify only second peer remains
    await expect(page.locator('text=https://linkedin.com/in/peer1')).not.toBeVisible();
    await expect(page.locator('text=https://linkedin.com/in/peer2')).toBeVisible();
  });

  test('should add skip-level URLs', async ({ page }) => {
    await page.goto(`/coach/${jobId}`);

    // Add skip-level
    await page.getByTestId('gather-skip-url').fill('https://linkedin.com/in/vp-engineering');
    
    // Click Add button using more specific selector
    await page.locator('button:has-text("Add")').nth(1).click(); // Second Add button (after peers)

    // Verify appears
    await expect(page.locator('text=https://linkedin.com/in/vp-engineering')).toBeVisible();
  });

  test('should add other company URLs for context', async ({ page }) => {
    await page.goto(`/coach/${jobId}`);

    // Add first competitor
    await page.getByTestId('gather-otherco-url').fill('https://competitor1.com');
    await page.locator('button:has-text("Add")').nth(2).click(); // Third Add button (after peers and skip)

    // Add second
    await page.getByTestId('gather-otherco-url').fill('https://competitor2.com');
    await page.locator('button:has-text("Add")').nth(2).click();

    // Verify both visible
    await expect(page.locator('text=https://competitor1.com')).toBeVisible();
    await expect(page.locator('text=https://competitor2.com')).toBeVisible();
  });

  test('should persist all gathered data through wizard', async ({ page }) => {
    await page.goto(`/coach/${jobId}`);

    // Fill all fields
    await page.getByTestId('jd-textarea').fill('Test JD for v1.1');
    await page.getByTestId('resume-textarea').fill('Test Resume for v1.1');
    await page.getByTestId('gather-recruiter-url').fill('https://linkedin.com/in/recruiter');
    
    // Add peer
    await page.getByTestId('gather-peer-url').fill('https://linkedin.com/in/peer');
    await page.locator('input[placeholder="Role (optional)"]').first().fill('Engineer');
    await page.locator('button:has-text("Add")').first().click();

    // Proceed to next step
    await page.getByTestId('analyze-button').click();

    // Wait for profile step
    await expect(page.getByTestId('profile-step')).toBeVisible({ timeout: 15000 });

    // Go back
    await page.locator('button:has-text("← Back")').click();

    // Verify data still there
    await expect(page.getByTestId('jd-textarea')).toHaveValue(/Test JD for v1.1/);
    await expect(page.getByTestId('resume-textarea')).toHaveValue(/Test Resume for v1.1/);
    await expect(page.getByTestId('gather-recruiter-url')).toHaveValue('https://linkedin.com/in/recruiter');
    await expect(page.locator('text=https://linkedin.com/in/peer')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto(`/coach/${jobId}`);

    // Analyze button should be disabled initially
    await expect(page.getByTestId('analyze-button')).toBeDisabled();

    // Add only JD
    await page.getByTestId('jd-textarea').fill('Some JD');
    await expect(page.getByTestId('analyze-button')).toBeDisabled();

    // Add resume
    await page.getByTestId('resume-textarea').fill('Some resume');
    await expect(page.getByTestId('analyze-button')).toBeEnabled();

    // Optional fields should not affect validation
    await page.getByTestId('gather-recruiter-url').fill('');
    await expect(page.getByTestId('analyze-button')).toBeEnabled();
  });
});

