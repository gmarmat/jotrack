import { test, expect } from "./_setup";

test.describe("Copy for Email", () => {
  test("copies formatted status summary to clipboard", async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Copy Email Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "PHONE_SCREEN");
    await page.click('button[type="submit"]');

    await page.click('a:has-text("Copy Email Test")');
    await page.waitForTimeout(1000);

    // Open PHONE_SCREEN detail
    await page.getByTestId("timeline-PHONE_SCREEN").click();

    // Add some notes
    await page.getByTestId("notes-textarea").fill("Discussed React architecture");
    await page.waitForTimeout(1000);

    // Click copy for email
    page.once("dialog", (dialog) => {
      expect(dialog.message()).toContain("copied");
      dialog.accept();
    });
    
    await page.getByTestId("copy-for-email").click();

    // Verify clipboard content (if permissions granted)
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain("Job Application Update");
    expect(clipboardText).toContain("Phone Screen");
    expect(clipboardText).toContain("Discussed React architecture");
  });

  test("copy for email includes interviewer information", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Email Interviewer Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "ONSITE");
    await page.click('button[type="submit"]');

    await page.click('a:has-text("Email Interviewer Test")');
    await page.waitForTimeout(1000);

    await page.getByTestId("timeline-ONSITE").click();

    // Add interviewer
    await page.getByTestId("add-interviewer").click();
    await page.waitForTimeout(500);

    await page.fill('input[placeholder="Interviewer Name"]', "John Doe");
    await page.fill('input[placeholder="Title"]', "Tech Lead");
    await page.waitForTimeout(1000);

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByTestId("copy-for-email").click();

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain("Interviewers:");
    expect(clipboardText).toContain("John Doe");
    expect(clipboardText).toContain("Tech Lead");
  });
});

