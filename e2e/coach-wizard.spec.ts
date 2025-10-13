import { test, expect, Page } from '@playwright/test';

test.describe('Coach Mode Wizard', () => {
  let jobId: string;

  test.beforeEach(async ({ page }) => {
    // Create a test job first
    const response = await page.request.post('/api/jobs', {
      data: {
        title: 'Senior Software Engineer',
        company: 'Coach Test Corp',
        status: 'APPLIED',
        notes: 'Testing coach mode',
      },
    });

    const data = await response.json();
    jobId = data.job.id;
  });

  test('should display stepper with 4 steps', async ({ page }) => {
    await page.goto(`/coach/${jobId}`);

    await expect(page.getByTestId('coach-stepper')).toBeVisible();
    await expect(page.getByTestId('step-gather')).toBeVisible();
    await expect(page.getByTestId('step-profile')).toBeVisible();
    await expect(page.getByTestId('step-fit')).toBeVisible();
    await expect(page.getByTestId('step-improve')).toBeVisible();
  });

  test('should navigate through Gather step', async ({ page }) => {
    await page.goto(`/coach/${jobId}`);

    await expect(page.getByTestId('gather-step')).toBeVisible();

    // Fill in job description
    await page.getByTestId('jd-textarea').fill(`
      Senior Software Engineer - Remote
      
      About the Role:
      We are looking for an experienced software engineer with expertise in React and TypeScript.
      
      Requirements:
      - 5+ years of experience
      - Strong knowledge of React, TypeScript, Node.js
      - Experience with AWS and Docker
    `);

    // Fill in resume
    await page.getByTestId('resume-textarea').fill(`
      John Doe
      Senior Software Engineer
      
      Experience:
      - 6 years of software development
      - Expert in React and TypeScript
      - Built scalable applications on AWS
    `);

    // Check that analyze button is enabled
    const analyzeButton = page.getByTestId('analyze-button');
    await expect(analyzeButton).toBeEnabled();

    // Click analyze to move to next step
    await analyzeButton.click();

    // Should move to Profile step
    await expect(page.getByTestId('profile-step')).toBeVisible({ timeout: 10000 });
  });

  test('should add and remove recruiter links', async ({ page }) => {
    await page.goto(`/coach/${jobId}`);

    const recruiterInput = page.getByTestId('recruiter-link-input');
    await recruiterInput.fill('https://linkedin.com/in/recruiter-test');
    await recruiterInput.press('Enter');

    // Link should appear in the list
    await expect(page.locator('text=https://linkedin.com/in/recruiter-test')).toBeVisible();

    // Remove the link
    await page.locator('button:has-text("Remove")').first().click();
    await expect(page.locator('text=https://linkedin.com/in/recruiter-test')).not.toBeVisible();
  });

  test('should show profile analysis with company info', async ({ page }) => {
    await page.goto(`/coach/${jobId}`);

    // Fill minimal data
    await page.getByTestId('jd-textarea').fill('Looking for React developer at TechCorp');
    await page.getByTestId('resume-textarea').fill('React developer with 5 years experience');
    await page.getByTestId('analyze-button').click();

    // Wait for profile analysis
    await expect(page.getByTestId('profile-step')).toBeVisible({ timeout: 10000 });

    // Should show company profile
    await expect(page.locator('text=Company Profile')).toBeVisible();
    await expect(page.locator('text=Sample Company')).toBeVisible({ timeout: 5000 });

    // Click next
    await page.getByTestId('profile-next-button').click();
    await expect(page.getByTestId('fit-step')).toBeVisible({ timeout: 10000 });
  });

  test('should display fit analysis with scores', async ({ page }) => {
    await page.goto(`/coach/${jobId}`);

    // Navigate through wizard quickly
    await page.getByTestId('jd-textarea').fill('React developer needed');
    await page.getByTestId('resume-textarea').fill('React developer');
    await page.getByTestId('analyze-button').click();

    await expect(page.getByTestId('profile-step')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('profile-next-button').click();

    await expect(page.getByTestId('fit-step')).toBeVisible({ timeout: 10000 });

    // Should show overall score
    await expect(page.locator('text=Overall Fit Score')).toBeVisible();
    await expect(page.locator('text=/\\d+\\/100/')).toBeVisible();

    // Should show dimensions
    await expect(page.locator('text=Weighted Dimensions')).toBeVisible();

    // Should show keyword matches
    await expect(page.locator('text=Keyword Analysis')).toBeVisible();
    await expect(page.locator('text=Found in Resume')).toBeVisible();
    await expect(page.locator('text=Missing from Resume')).toBeVisible();
  });

  test('should show/hide dimension details', async ({ page }) => {
    await page.goto(`/coach/${jobId}`);

    // Navigate to fit step
    await page.getByTestId('jd-textarea').fill('React developer');
    await page.getByTestId('resume-textarea').fill('React expert');
    await page.getByTestId('analyze-button').click();
    await page.getByTestId('profile-next-button').click();

    await expect(page.getByTestId('fit-step')).toBeVisible({ timeout: 10000 });

    // Toggle details
    const toggleButton = page.locator('button:has-text("Show Details")');
    await toggleButton.click();
    await expect(page.locator('button:has-text("Hide Details")')).toBeVisible();

    // Should show reasoning text
    await expect(page.locator('text=/reasoning/i')).toBeVisible();
  });

  test('should navigate to improve step and show options', async ({ page }) => {
    await page.goto(`/coach/${jobId}`);

    // Navigate to improve step
    await page.getByTestId('jd-textarea').fill('React developer');
    await page.getByTestId('resume-textarea').fill('React developer');
    await page.getByTestId('analyze-button').click();
    await page.getByTestId('profile-next-button').click();
    await page.getByTestId('fit-next-button').click();

    await expect(page.getByTestId('improve-step')).toBeVisible({ timeout: 10000 });

    // Should show two options
    await expect(page.getByTestId('improve-button')).toBeVisible();
    await expect(page.getByTestId('apply-anyway-button')).toBeVisible();
  });

  test('should generate improvement suggestions', async ({ page }) => {
    await page.goto(`/coach/${jobId}`);

    // Navigate to improve step
    await page.getByTestId('jd-textarea').fill('React developer');
    await page.getByTestId('resume-textarea').fill('React developer');
    await page.getByTestId('analyze-button').click();
    await page.getByTestId('profile-next-button').click();
    await page.getByTestId('fit-next-button').click();

    await expect(page.getByTestId('improve-step')).toBeVisible({ timeout: 10000 });

    // Click improve
    await page.getByTestId('improve-button').click();

    // Should show suggestions
    await expect(page.locator('text=Improvement Suggestions')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Estimated New Score')).toBeVisible();
  });

  test('should generate skill path and talk track', async ({ page }) => {
    await page.goto(`/coach/${jobId}`);

    // Navigate to improve step
    await page.getByTestId('jd-textarea').fill('React developer');
    await page.getByTestId('resume-textarea').fill('React developer');
    await page.getByTestId('analyze-button').click();
    await page.getByTestId('profile-next-button').click();
    await page.getByTestId('fit-next-button').click();

    await expect(page.getByTestId('improve-step')).toBeVisible({ timeout: 10000 });

    // Click apply anyway
    await page.getByTestId('apply-anyway-button').click();

    // Should show skill path
    await expect(page.locator('text=Fast Upskilling Plan')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Total Time Investment')).toBeVisible();
    await expect(page.locator('text=Recruiter Talk Track')).toBeVisible();
  });

  test('should support keyboard navigation between steps', async ({ page }) => {
    await page.goto(`/coach/${jobId}`);

    // Complete first step
    await page.getByTestId('jd-textarea').fill('Test JD');
    await page.getByTestId('resume-textarea').fill('Test Resume');
    await page.getByTestId('analyze-button').click();

    await expect(page.getByTestId('profile-step')).toBeVisible({ timeout: 10000 });

    // Press left arrow to go back
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByTestId('gather-step')).toBeVisible();

    // Navigate forward again
    await page.getByTestId('analyze-button').click();
    await expect(page.getByTestId('profile-step')).toBeVisible({ timeout: 10000 });
  });

  test('should handle empty required fields', async ({ page }) => {
    await page.goto(`/coach/${jobId}`);

    // Analyze button should be disabled without required fields
    const analyzeButton = page.getByTestId('analyze-button');
    await expect(analyzeButton).toBeDisabled();

    // Fill only JD
    await page.getByTestId('jd-textarea').fill('Test JD');
    await expect(analyzeButton).toBeDisabled();

    // Fill both
    await page.getByTestId('resume-textarea').fill('Test Resume');
    await expect(analyzeButton).toBeEnabled();
  });
});

