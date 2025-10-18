import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;
const baseURL = process.env.BASE_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: !isCI,
  retries: isCI ? 2 : 0,
  // Slightly higher timeouts on CI for stability
  timeout: isCI ? 60_000 : 30_000,
  expect: { timeout: isCI ? 8_000 : 5_000 },
  reporter: isCI ? [['list'], ['html', { outputFolder: 'playwright-report' }]] : 'list',
  use: {
    baseURL,
    headless: true,
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Add webkit/firefox locally if you want, but keep CI lean
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000, // Increased timeout
  },
});
