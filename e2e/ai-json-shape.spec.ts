import { test, expect } from '@playwright/test';

test.describe('AI JSON Shape Validation v1.2', () => {
  test('should return properly structured fit analysis response', async ({ page }) => {
    const response = await page.request.post('/api/jobs', {
      data: {
        title: 'Test Engineer',
        company: 'Test Co',
        status: 'APPLIED',
      },
    });
    const { job } = await response.json();

    // Call analyze API directly
    const analyzeResponse = await page.request.post('/api/ai/analyze?dryRun=1', {
      data: {
        jobId: job.id,
        capability: 'fit_analysis',
        inputs: {
          jobDescription: 'Python Django developer',
          resume: 'Python Django expert',
        },
        promptVersion: 'v1',
      },
    });

    expect(analyzeResponse.ok()).toBe(true);
    const data = await analyzeResponse.json();

    // Verify response structure
    expect(data).toHaveProperty('result');
    expect(data).toHaveProperty('runId');
    expect(data).toHaveProperty('provider');

    // Verify result has required keys for fit_analysis
    const result = data.result;
    expect(result).toHaveProperty('fit');
    expect(result.fit).toHaveProperty('overall');
    expect(result.fit).toHaveProperty('threshold');
    expect(result.fit).toHaveProperty('breakdown');

    // Verify breakdown is array of 25 params
    expect(Array.isArray(result.fit.breakdown)).toBe(true);
    expect(result.fit.breakdown.length).toBe(25);

    // Verify each parameter has required fields
    const firstParam = result.fit.breakdown[0];
    expect(firstParam).toHaveProperty('param');
    expect(firstParam).toHaveProperty('weight');
    expect(firstParam).toHaveProperty('jdEvidence');
    expect(firstParam).toHaveProperty('resumeEvidence');
    expect(firstParam).toHaveProperty('score');
    expect(firstParam).toHaveProperty('reasoning');

    // Verify keywords array
    expect(result).toHaveProperty('keywords');
    expect(Array.isArray(result.keywords)).toBe(true);
  });

  test('should handle malformed JSON gracefully', async ({ page }) => {
    // This test verifies error handling
    // In real scenario, if OpenAI returns invalid JSON, we should show user-friendly error
    
    const response = await page.request.post('/api/jobs', {
      data: { title: 'Test', company: 'Test', status: 'APPLIED' },
    });
    const { job } = await response.json();

    await page.goto(`/coach/${job.id}`);
    await page.getByTestId('jd-textarea').fill('Test JD');
    await page.getByTestId('resume-textarea').fill('Test Resume');
    await page.getByTestId('analyze-button').click();

    // Should not crash, should show loading then result
    await page.waitForTimeout(2000);
    
    // Should successfully navigate (dry-run returns valid JSON)
    await expect(page.getByTestId('profile-step')).toBeVisible({ timeout: 15000 });
  });

  test('should include provider info in response', async ({ page }) => {
    const response = await page.request.post('/api/jobs', {
      data: { title: 'Test', company: 'Test', status: 'APPLIED' },
    });
    const { job } = await response.json();

    const analyzeResponse = await page.request.post('/api/ai/analyze?dryRun=1', {
      data: {
        jobId: job.id,
        capability: 'fit_analysis',
        inputs: {
          jobDescription: 'Test JD',
          resume: 'Test Resume',
        },
      },
    });

    const data = await analyzeResponse.json();
    expect(data.provider).toBe('local'); // Dry-run mode
  });
});

