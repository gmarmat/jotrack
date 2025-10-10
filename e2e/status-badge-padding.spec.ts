import { test, expect } from "@playwright/test";

test.describe("Status Badge Padding", () => {
  test("Phone Screen badge should have compact padding (px-1.5)", async ({ page }) => {
    await page.goto("/");
    
    // Create a new job using the full form
    const jobTitle = "Padding Test Job";
    const company = "Test Company";
    
    await page.fill('input[placeholder*="Senior React Developer"]', jobTitle);
    await page.fill('input[placeholder*="TechCorp"]', company);
    await page.selectOption('select', 'ON_RADAR');
    await page.click('button[type="submit"]');
    
    // Wait for the job to appear
    await expect(page.getByRole("row", { name: new RegExp(jobTitle) })).toBeVisible();

    // Change status to PHONE_SCREEN using the quick action dropdown
    const jobRow = page.getByRole("row", { name: new RegExp(jobTitle) });
    await jobRow.getByTestId("status-select").selectOption("PHONE_SCREEN");
    await expect(jobRow.getByTestId("status-badge-PHONE_SCREEN")).toBeVisible();

    // Get the computed style of the status badge
    const phoneScreenBadge = jobRow.getByTestId("status-badge-PHONE_SCREEN");
    const paddingLeft = await phoneScreenBadge.evaluate(el => getComputedStyle(el).paddingLeft);
    const paddingRight = await phoneScreenBadge.evaluate(el => getComputedStyle(el).paddingRight);

    // Log the actual values for debugging
    console.log(`Phone Screen badge padding: left=${paddingLeft}, right=${paddingRight}`);

    // Assert padding is 6px (equivalent to px-1.5 in Tailwind CSS)
    expect(paddingLeft).toBe("6px");
    expect(paddingRight).toBe("6px");
  });

  test("Check existing badges for padding issues", async ({ page }) => {
    await page.goto("/");
    
    // Wait for any existing jobs to load
    await page.waitForLoadState('networkidle');
    
    // Look for any existing status badges and check their padding
    const badges = page.locator('[data-testid^="status-badge-"]');
    const count = await badges.count();
    
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const badge = badges.nth(i);
        const paddingLeft = await badge.evaluate(el => getComputedStyle(el).paddingLeft);
        const paddingRight = await badge.evaluate(el => getComputedStyle(el).paddingRight);
        const testId = await badge.getAttribute('data-testid');
        
        console.log(`Badge ${testId}: left=${paddingLeft}, right=${paddingRight}`);
        
        // Check if padding is excessive (more than 8px)
        const leftPx = parseInt(paddingLeft);
        const rightPx = parseInt(paddingRight);
        
        if (leftPx > 8 || rightPx > 8) {
          throw new Error(`Badge ${testId} has excessive padding: left=${paddingLeft}, right=${paddingRight}`);
        }
      }
    } else {
      console.log("No existing badges found to test");
    }
  });
});
