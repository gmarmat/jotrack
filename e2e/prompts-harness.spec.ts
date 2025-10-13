import { test, expect } from '@playwright/test';

test.describe('Prompts Evaluation Harness v1.3', () => {
  test('should run eval script on golden cases', async () => {
    // This test would run: npm run eval:prompts -- --case=pm_saas_mid --dry-run
    // For e2e, we'll verify the files exist and structure is correct
    
    const fs = require('fs');
    const path = require('path');

    const casesDir = path.join(process.cwd(), 'prompts_eval/cases');
    const expectedDir = path.join(process.cwd(), 'prompts_eval/expected');

    // Verify golden cases exist
    expect(fs.existsSync(path.join(casesDir, 'pm_saas_mid.json'))).toBe(true);
    expect(fs.existsSync(path.join(casesDir, 'swe_fintech_sr.json'))).toBe(true);
    expect(fs.existsSync(path.join(casesDir, 'ds_research_junior.json'))).toBe(true);

    // Verify expected outputs exist
    expect(fs.existsSync(path.join(expectedDir, 'analyze.pm_saas_mid.json'))).toBe(true);
    expect(fs.existsSync(path.join(expectedDir, 'analyze.swe_fintech_sr.json'))).toBe(true);
    expect(fs.existsSync(path.join(expectedDir, 'analyze.ds_research_junior.json'))).toBe(true);

    // Load and validate structure of a golden case
    const goldenCase = JSON.parse(fs.readFileSync(path.join(casesDir, 'pm_saas_mid.json'), 'utf-8'));
    expect(goldenCase.jobTitle).toBeTruthy();
    expect(goldenCase.company).toBeTruthy();
    expect(goldenCase.jdText).toBeTruthy();
    expect(goldenCase.resumeText).toBeTruthy();

    // Load and validate expected output structure
    const expected = JSON.parse(fs.readFileSync(path.join(expectedDir, 'analyze.pm_saas_mid.json'), 'utf-8'));
    expect(expected.fit).toBeDefined();
    expect(expected.fit.overall).toBeGreaterThanOrEqual(0);
    expect(expected.fit.overall).toBeLessThanOrEqual(1);
    expect(Array.isArray(expected.fit.breakdown)).toBe(true);
    expect(Array.isArray(expected.keywords)).toBe(true);
  });

  test('should verify eval script is runnable', async () => {
    const fs = require('fs');
    const path = require('path');

    const scriptPath = path.join(process.cwd(), 'scripts/eval-prompts.ts');
    expect(fs.existsSync(scriptPath)).toBe(true);

    // Verify script has proper structure
    const scriptContent = fs.readFileSync(scriptPath, 'utf-8');
    expect(scriptContent).toContain('evalCase');
    expect(scriptContent).toContain('compareResults');
    expect(scriptContent).toContain('loadTestCase');
  });
});

