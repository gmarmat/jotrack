import { test, expect } from "./_setup";

test.describe("Timeline UX", () => {
  test("horizontal timeline shows all status stages", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Timeline Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "PHONE_SCREEN");
    await page.click('button[type="submit"]');

    await page.click('a:has-text("Timeline Test")');
    await page.waitForTimeout(1000);

    // Verify timeline is visible
    await expect(page.getByTestId("timeline-ON_RADAR")).toBeVisible();
    await expect(page.getByTestId("timeline-APPLIED")).toBeVisible();
    await expect(page.getByTestId("timeline-PHONE_SCREEN")).toBeVisible();
    await expect(page.getByTestId("timeline-ONSITE")).toBeVisible();
    await expect(page.getByTestId("timeline-OFFER")).toBeVisible();
    await expect(page.getByTestId("timeline-REJECTED")).toBeVisible();

    // Current status should be highlighted
    const currentNode = page.locator('[data-current="true"]');
    await expect(currentNode).toBeVisible();
    await expect(currentNode).toContainText("Phone Screen");
  });

  test("clicking timeline status opens detail panel", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Detail Panel Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "PHONE_SCREEN");
    await page.click('button[type="submit"]');

    await page.click('a:has-text("Detail Panel Test")');
    await page.waitForTimeout(1000);

    // Click PHONE_SCREEN status
    await page.getByTestId("timeline-PHONE_SCREEN").click();

    // Verify detail panel appears
    await expect(page.getByTestId("status-detail-panel")).toBeVisible();

    // Should show interviewer section (PHONE_SCREEN allows multiple)
    await expect(page.getByTestId("interviewer-section")).toBeVisible();

    // Should show AI analysis section
    await expect(page.getByTestId("ai-analysis-section")).toBeVisible();

    // Should show keywords section
    await expect(page.getByTestId("keywords-section")).toBeVisible();

    // Should show notes section
    await expect(page.getByTestId("notes-section")).toBeVisible();
  });

  test("can add and remove interviewers for PHONE_SCREEN", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Interviewer Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "PHONE_SCREEN");
    await page.click('button[type="submit"]');

    await page.click('a:has-text("Interviewer Test")');
    await page.waitForTimeout(1000);

    // Open PHONE_SCREEN detail
    await page.getByTestId("timeline-PHONE_SCREEN").click();
    await expect(page.getByTestId("status-detail-panel")).toBeVisible();

    // Add interviewer
    await page.getByTestId("add-interviewer").click();
    await page.waitForTimeout(500);

    // Fill interviewer details
    await page.fill('input[placeholder="Interviewer Name"]', "Jane Doe");
    await page.fill('input[placeholder="Title"]', "Senior Recruiter");
    await page.fill('input[placeholder="LinkedIn URL"]', "https://linkedin.com/in/janedoe");

    await page.waitForTimeout(1000);

    // Verify interviewer appears
    await expect(page.getByText("Jane Doe")).toBeVisible();
    await expect(page.locator('input[value="Senior Recruiter"]')).toBeVisible();

    // Remove interviewer
    await page.locator('button[aria-label="Remove interviewer"]').first().click();
    await page.waitForTimeout(500);

    // Verify removed
    await expect(page.getByText("No interviewers added yet")).toBeVisible();
  });

  test("can add and remove manual keywords", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Keywords Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "APPLIED");
    await page.click('button[type="submit"]');

    await page.click('a:has-text("Keywords Test")');
    await page.waitForTimeout(1000);

    // Open APPLIED detail
    await page.getByTestId("timeline-APPLIED").click();
    await expect(page.getByTestId("keywords-section")).toBeVisible();

    // Add keyword
    const input = page.getByTestId("add-keyword-input");
    await input.fill("React");
    await input.press("Enter");

    await page.waitForTimeout(500);

    // Verify keyword appears
    await expect(page.getByText("React").first()).toBeVisible();

    // Remove keyword
    await page.locator('button:has-text("React")').filter({ has: page.locator('svg') }).click();
    await page.waitForTimeout(500);

    // Verify removed
    const reactButtons = page.locator('button:has-text("React")');
    await expect(reactButtons).toHaveCount(0);
  });

  test("notes autosave and undo works", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Notes Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "ON_RADAR");
    await page.click('button[type="submit"]');

    await page.click('a:has-text("Notes Test")');
    await page.waitForTimeout(1000);

    // Open ON_RADAR detail
    await page.getByTestId("timeline-ON_RADAR").click();
    await expect(page.getByTestId("notes-section")).toBeVisible();

    // Type first note
    const textarea = page.getByTestId("notes-textarea");
    await textarea.fill("First note version");
    await page.waitForTimeout(1000);

    // Type second note
    await textarea.fill("Second note version");
    await page.waitForTimeout(1000);

    // Undo should be available
    const undoBtn = page.locator('button:has-text("Undo")');
    await expect(undoBtn).toBeVisible();

    // Click undo
    await undoBtn.click();
    await page.waitForTimeout(500);

    // Should show first version
    await expect(textarea).toHaveValue("First note version");
  });

  test("AI analysis refresh generates insights", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "AI Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "PHONE_SCREEN");
    await page.click('button[type="submit"]');

    await page.click('a:has-text("AI Test")');
    await page.waitForTimeout(1000);

    // Open PHONE_SCREEN detail
    await page.getByTestId("timeline-PHONE_SCREEN").click();
    await expect(page.getByTestId("ai-analysis-section")).toBeVisible();

    // Initially should show placeholder
    await expect(page.getByText(/No analysis yet/)).toBeVisible();

    // Click refresh
    await page.getByTestId("refresh-ai").click();
    await page.waitForTimeout(1500);

    // Should show analysis (dry-run data)
    await expect(page.getByText(/Analysis Score/)).toBeVisible();
  });

  test("ON_RADAR status should not show interviewer section", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "No Interviewer Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "ON_RADAR");
    await page.click('button[type="submit"]');

    await page.click('a:has-text("No Interviewer Test")');
    await page.waitForTimeout(1000);

    // Open ON_RADAR detail
    await page.getByTestId("timeline-ON_RADAR").click();
    await expect(page.getByTestId("status-detail-panel")).toBeVisible();

    // Should NOT show interviewer section
    await expect(page.getByTestId("interviewer-section")).not.toBeVisible();
  });

  test("ONSITE status should allow multiple interviewers", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Multi Interviewer Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "ONSITE");
    await page.click('button[type="submit"]');

    await page.click('a:has-text("Multi Interviewer Test")');
    await page.waitForTimeout(1000);

    // Open ONSITE detail
    await page.getByTestId("timeline-ONSITE").click();
    await expect(page.getByTestId("interviewer-section")).toBeVisible();

    // Add first interviewer
    await page.getByTestId("add-interviewer").click();
    await page.waitForTimeout(500);
    await page.fill('input[placeholder="Interviewer Name"]', "Interviewer 1");

    // Add second interviewer
    await page.getByTestId("add-interviewer").click();
    await page.waitForTimeout(500);

    // Should have 2 interviewer blocks
    const interviewers = page.locator('[data-testid^="interviewer-"]');
    await expect(interviewers).toHaveCount(2);
  });
});

