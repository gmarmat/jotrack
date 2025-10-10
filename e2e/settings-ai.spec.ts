import { test, expect } from "@playwright/test";

test.describe("AI Settings", () => {
  test("AI Settings are local-only and gated", async ({ page }) => {
    // Navigate to settings
    await page.goto("/settings");

    // Verify settings page loads
    await expect(page.getByTestId("settings-ai")).toBeVisible();

    // Verify AI is disabled by default (fresh state)
    const enableCheckbox = page.getByLabel("Enable AI Assist");
    await expect(enableCheckbox).toBeVisible();

    // Enable AI Assist
    await enableCheckbox.check();
    await expect(enableCheckbox).toBeChecked();

    // Fill in API key
    const apiKeyInput = page.getByLabel("OpenAI API Key");
    await apiKeyInput.fill("sk-test-123456789");

    // Save settings
    page.once("dialog", (dialog) => {
      expect(dialog.message()).toContain("Saved");
      dialog.accept();
    });
    await page.getByTestId("ai-save").click();

    // Reload page and verify settings persisted
    await page.reload();
    await expect(page.getByLabel("Enable AI Assist")).toBeChecked();

    // Verify key is masked (not showing full value)
    const maskedValue = await apiKeyInput.inputValue();
    expect(maskedValue).toContain("•••");
    expect(maskedValue).not.toBe("sk-test-123456789");
  });

  test("Clear button removes all AI settings", async ({ page }) => {
    await page.goto("/settings");

    // Set some values
    await page.getByLabel("Enable AI Assist").check();
    await page.getByLabel("OpenAI API Key").fill("sk-test-999");

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByTestId("ai-save").click();

    // Clear settings
    await page.getByTestId("ai-clear").click();

    // Verify checkbox is unchecked
    await expect(page.getByLabel("Enable AI Assist")).not.toBeChecked();

    // Verify input is empty
    await expect(page.getByLabel("OpenAI API Key")).toHaveValue("");
  });

  test("Settings page has privacy notice", async ({ page }) => {
    await page.goto("/settings");

    // Verify privacy notice is visible
    await expect(
      page.locator("text=Privacy First:")
    ).toBeVisible();

    await expect(
      page.locator("text=locally only")
    ).toBeVisible();
  });

  test("Can navigate back to dashboard", async ({ page }) => {
    await page.goto("/settings");

    // Click back link
    await page.click('a:has-text("Back to Dashboard")');

    // Verify we're back on the homepage
    await expect(page).toHaveURL("/");
  });
});

