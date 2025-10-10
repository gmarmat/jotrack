import { test, expect } from "./_setup";

test.describe("Wordcloud Visualization", () => {
  test("wordcloud displays auto-generated keywords", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Wordcloud Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "PHONE_SCREEN");
    await page.click('button[type="submit"]');

    await page.click('a:has-text("Wordcloud Test")');
    await page.waitForTimeout(1000);

    // Open PHONE_SCREEN detail
    await page.getByTestId("timeline-PHONE_SCREEN").click();
    await expect(page.getByTestId("status-detail-panel")).toBeVisible();

    // Refresh AI to generate keywords
    await page.getByTestId("refresh-ai").click();
    await page.waitForTimeout(2000);

    // Should show wordcloud
    await expect(page.getByTestId("wordcloud")).toBeVisible();
  });

  test("clicking wordcloud word adds to manual tags", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Wordcloud Click Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "PHONE_SCREEN");
    await page.click('button[type="submit"]');

    await page.click('a:has-text("Wordcloud Click Test")');
    await page.waitForTimeout(1000);

    await page.getByTestId("timeline-PHONE_SCREEN").click();
    
    // Refresh AI
    await page.getByTestId("refresh-ai").click();
    await page.waitForTimeout(2000);

    // Click a wordcloud word
    const firstWord = page.locator('[data-testid^="wordcloud-word-"]').first();
    const wordText = await firstWord.textContent();
    
    if (wordText) {
      await firstWord.click();
      await page.waitForTimeout(1000);

      // Should appear in manual tags section
      const manualTags = page.locator('.bg-gray-200.text-gray-800.rounded-full');
      const tagTexts = await manualTags.allTextContents();
      expect(tagTexts.some(t => t.includes(wordText))).toBeTruthy();
    }
  });

  test("wordcloud has visual feedback on hover", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Wordcloud Hover Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "PHONE_SCREEN");
    await page.click('button[type="submit"]');

    await page.click('a:has-text("Wordcloud Hover Test")');
    await page.waitForTimeout(1000);

    await page.getByTestId("timeline-PHONE_SCREEN").click();
    await page.getByTestId("refresh-ai").click();
    await page.waitForTimeout(2000);

    // Hover over a word
    const firstWord = page.locator('[data-testid^="wordcloud-word-"]').first();
    await firstWord.hover();

    // Should have scale-110 class or transition
    const classList = await firstWord.getAttribute("class");
    expect(classList).toContain("transition");
  });
});

