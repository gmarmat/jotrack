import { test, expect } from "./_setup";

test.describe("AI Insights", () => {
  test("can generate AI insights in dry-run mode", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "AI Insights Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "PHONE_SCREEN");
    await page.click('button[type="submit"]');

    await page.click('a:has-text("AI Insights Test")');
    await page.waitForTimeout(1000);

    // Open PHONE_SCREEN detail
    await page.getByTestId("timeline-PHONE_SCREEN").click();
    await expect(page.getByTestId("ai-analysis-section")).toBeVisible();

    // Click Generate Insights
    await page.getByTestId("refresh-ai").click();
    await page.waitForTimeout(2000);

    // Should show analysis
    await expect(page.getByText(/Analysis Score/)).toBeVisible();
    await expect(page.getByText(/Highlights/)).toBeVisible();
    await expect(page.getByText(/Gaps/)).toBeVisible();

    // Should show timestamp
    await expect(page.getByText(/Last updated:/)).toBeVisible();
  });

  test("can revert AI analysis", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Revert AI Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "APPLIED");
    await page.click('button[type="submit"]');

    await page.click('a:has-text("Revert AI Test")');
    await page.waitForTimeout(1000);

    await page.getByTestId("timeline-APPLIED").click();

    // Generate insights
    await page.getByTestId("refresh-ai").click();
    await page.waitForTimeout(2000);

    await expect(page.getByText(/Analysis Score/)).toBeVisible();

    // Clear button should appear
    await expect(page.getByTestId("revert-ai")).toBeVisible();

    // Click clear
    await page.getByTestId("revert-ai").click();
    await page.waitForTimeout(1000);

    // Should show placeholder again
    await expect(page.getByText(/No analysis yet/)).toBeVisible();
    await expect(page.getByTestId("revert-ai")).not.toBeVisible();
  });

  test("AI insights persist across page reload", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Persist AI Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "ONSITE");
    await page.click('button[type="submit"]');

    await page.click('a:has-text("Persist AI Test")');
    await page.waitForTimeout(1000);

    await page.getByTestId("timeline-ONSITE").click();
    await page.getByTestId("refresh-ai").click();
    await page.waitForTimeout(2000);

    // Reload page
    await page.reload();
    await page.waitForTimeout(1000);

    // Open same status
    await page.getByTestId("timeline-ONSITE").click();
    await page.waitForTimeout(500);

    // AI analysis should still be there
    await expect(page.getByText(/Analysis Score/)).toBeVisible();
  });

  test("wordcloud appears after AI insights generated", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Wordcloud AI Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "PHONE_SCREEN");
    await page.click('button[type="submit"]');

    await page.click('a:has-text("Wordcloud AI Test")');
    await page.waitForTimeout(1000);

    await page.getByTestId("timeline-PHONE_SCREEN").click();

    // Before insights
    await expect(page.getByTestId("wordcloud")).not.toBeVisible();

    // Generate insights
    await page.getByTestId("refresh-ai").click();
    await page.waitForTimeout(2000);

    // Wordcloud should appear
    await expect(page.getByTestId("wordcloud")).toBeVisible();

    // Should have keywords
    const words = page.locator('[data-testid^="wordcloud-word-"]');
    await expect(words.first()).toBeVisible();
  });
});

