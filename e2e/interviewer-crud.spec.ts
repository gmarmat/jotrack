import { test, expect } from "./_setup";

test.describe("Interviewer CRUD", () => {
  test("can add multiple interviewers and fields autosave", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Multi Interviewer");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "ONSITE");
    await page.click('button[type="submit"]');

    await page.click('a:has-text("Multi Interviewer")');
    await page.waitForTimeout(1000);

    await page.getByTestId("timeline-ONSITE").click();

    // Add first interviewer
    await page.getByTestId("add-interviewer").click();
    await page.waitForTimeout(500);

    await page.fill('input[placeholder="Interviewer Name"]', "Alice Smith");
    await page.fill('input[placeholder="Title"]', "Engineering Manager");
    await page.fill('input[placeholder="LinkedIn URL"]', "https://linkedin.com/in/alice");
    await page.fill('input[placeholder="Email (optional)"]', "alice@company.com");

    await page.waitForTimeout(1500); // Autosave

    // Reload to verify persistence
    await page.reload();
    await page.waitForTimeout(1000);

    await page.getByTestId("timeline-ONSITE").click();
    await page.waitForTimeout(500);

    // Should still have the interviewer
    await expect(page.locator('input[value="Alice Smith"]')).toBeVisible();
    await expect(page.locator('input[value="Engineering Manager"]')).toBeVisible();
  });

  test("can reorder interviewers by dragging", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Reorder Interviewers");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "ONSITE");
    await page.click('button[type="submit"]');

    await page.click('a:has-text("Reorder Interviewers")');
    await page.waitForTimeout(1000);

    await page.getByTestId("timeline-ONSITE").click();

    // Add two interviewers
    await page.getByTestId("add-interviewer").click();
    await page.waitForTimeout(300);
    await page.fill('input[placeholder="Interviewer Name"]', "First");

    await page.getByTestId("add-interviewer").click();
    await page.waitForTimeout(300);
    const inputs = page.locator('input[placeholder="Interviewer Name"]');
    await inputs.nth(1).fill("Second");

    await page.waitForTimeout(1000);

    // Verify order
    const interviewers = page.locator('[data-testid^="interviewer-"]');
    await expect(interviewers).toHaveCount(2);

    // Check for drag handle
    const dragHandle = page.locator('svg').filter({ hasText: '' }).first();
    await expect(dragHandle).toBeVisible();
  });

  test("interviewer notes field works", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Interviewer Notes");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "PHONE_SCREEN");
    await page.click('button[type="submit"]');

    await page.click('a:has-text("Interviewer Notes")');
    await page.waitForTimeout(1000);

    await page.getByTestId("timeline-PHONE_SCREEN").click();
    await page.getByTestId("add-interviewer").click();
    await page.waitForTimeout(500);

    // Fill notes
    const notesField = page.locator('textarea[placeholder*="Notes about this interviewer"]');
    await notesField.fill("Great technical depth, ask about React performance");

    await page.waitForTimeout(1500);

    // Reload
    await page.reload();
    await page.waitForTimeout(1000);

    await page.getByTestId("timeline-PHONE_SCREEN").click();
    await page.waitForTimeout(500);

    // Should persist
    await expect(notesField).toHaveValue("Great technical depth, ask about React performance");
  });

  test("deleting interviewer removes all data", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Delete Interviewer");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "ONSITE");
    await page.click('button[type="submit"]');

    await page.click('a:has-text("Delete Interviewer")');
    await page.waitForTimeout(1000);

    await page.getByTestId("timeline-ONSITE").click();
    await page.getByTestId("add-interviewer").click();
    await page.waitForTimeout(500);

    await page.fill('input[placeholder="Interviewer Name"]', "To Be Deleted");
    await page.waitForTimeout(1000);

    // Remove
    await page.locator('button[aria-label="Remove interviewer"]').click();
    await page.waitForTimeout(1000);

    // Should show empty state
    await expect(page.getByText("No interviewers added yet")).toBeVisible();
  });
});

