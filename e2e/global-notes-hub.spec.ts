import { test, expect } from "./_setup";

test.describe("Global Notes Hub", () => {
  test("aggregates notes from all statuses", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Notes Hub Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "PHONE_SCREEN");
    await page.click('button[type="submit"]');

    await page.click('a:has-text("Notes Hub Test")');
    await page.waitForTimeout(1000);

    // Add notes to PHONE_SCREEN
    await page.getByTestId("timeline-PHONE_SCREEN").click();
    await page.getByTestId("notes-textarea").fill("Phone screen went well");
    await page.waitForTimeout(1500);

    // Close panel
    await page.getByLabel("Close timeline detail").click();

    // Add notes to another status
    await page.getByTestId("timeline-APPLIED").click();
    await page.waitForTimeout(500);
    await page.getByTestId("notes-textarea").fill("Application submitted on Monday");
    await page.waitForTimeout(1500);

    // Open Global Notes tab
    await page.keyboard.press("g");
    await expect(page.getByTestId("global-notes-hub")).toBeVisible();

    // Should show both notes
    const noteItems = page.getByTestId("notes-hub-item");
    await expect(noteItems).toHaveCount(2);
  });

  test("search filters notes", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Notes Search Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "ON_RADAR");
    await page.click('button[type="submit"]');

    await page.click('a:has-text("Notes Search Test")');
    await page.waitForTimeout(1000);

    // Add notes to multiple statuses
    await page.getByTestId("timeline-ON_RADAR").click();
    await page.getByTestId("notes-textarea").fill("Research company culture");
    await page.waitForTimeout(1500);

    await page.getByLabel("Close timeline detail").click();
    
    await page.getByTestId("timeline-APPLIED").click();
    await page.waitForTimeout(500);
    await page.getByTestId("notes-textarea").fill("Submitted via LinkedIn");
    await page.waitForTimeout(1500);

    // Open Global Notes
    await page.keyboard.press("g");
    
    // Search for "LinkedIn"
    const searchInput = page.getByTestId("notes-hub-search");
    await searchInput.fill("LinkedIn");

    // Should only show APPLIED note
    const noteItems = page.getByTestId("notes-hub-item");
    await expect(noteItems).toHaveCount(1);
    await expect(page.getByText(/APPLIED/)).toBeVisible();
    await expect(page.getByText(/ON_RADAR/)).not.toBeVisible();
  });

  test("clicking note jumps to status panel", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Jump Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "ONSITE");
    await page.click('button[type="submit"]');

    await page.click('a:has-text("Jump Test")');
    await page.waitForTimeout(1000);

    // Add note to PHONE_SCREEN
    await page.getByTestId("timeline-PHONE_SCREEN").click();
    await page.getByTestId("notes-textarea").fill("Recruiter call scheduled");
    await page.waitForTimeout(1500);

    await page.getByLabel("Close timeline detail").click();

    // Open Global Notes
    await page.keyboard.press("g");

    // Click the note
    await page.getByTestId("notes-hub-item").click();

    // Should open PHONE_SCREEN detail panel
    await expect(page.getByTestId("status-detail-panel")).toBeVisible();
    await expect(page.getByText("Phone Screen Details")).toBeVisible();

    // Rail should close
    await expect(page.getByTestId("utility-rail-expanded")).not.toBeVisible();
  });

  test("export JSON copies all notes", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Export JSON Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "ON_RADAR");
    await page.click('button[type="submit"]');

    await page.click('a:has-text("Export JSON Test")');
    await page.waitForTimeout(1000);

    // Add notes
    await page.getByTestId("timeline-ON_RADAR").click();
    await page.getByTestId("notes-textarea").fill("Initial research done");
    await page.waitForTimeout(1500);

    // Open Global Notes
    await page.keyboard.press("g");

    // Export JSON
    page.once("dialog", (dialog) => {
      expect(dialog.message()).toContain("copied");
      dialog.accept();
    });

    await page.getByTestId("export-notes-json").click();

    // Verify clipboard
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain("jobId");
    expect(clipboardText).toContain("Initial research done");
  });
});

