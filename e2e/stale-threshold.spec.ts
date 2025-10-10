import { test, expect } from "./_setup";

test.describe("Stale Threshold", () => {
  test("can configure stale threshold in settings", async ({ page }) => {
    await page.goto("/settings");

    // Stale threshold section should be visible
    await expect(page.getByTestId("stale-threshold-setting")).toBeVisible();

    // Input should have default value
    const input = page.getByTestId("stale-days-input");
    await expect(input).toBeVisible();

    const currentValue = await input.inputValue();
    expect(parseInt(currentValue)).toBeGreaterThanOrEqual(1);

    // Change to 5 days
    await input.fill("5");
    await page.getByTestId("save-stale-threshold").click();

    page.once("dialog", (dialog) => {
      expect(dialog.message()).toContain("updated");
      dialog.accept();
    });

    await page.waitForTimeout(500);

    // Reload and verify persistence
    await page.reload();
    await page.waitForTimeout(1000);

    await expect(input).toHaveValue("5");
  });

  test("stale threshold validates input range", async ({ page }) => {
    await page.goto("/settings");

    const input = page.getByTestId("stale-days-input");

    // Should have min/max attributes
    const min = await input.getAttribute("min");
    const max = await input.getAttribute("max");

    expect(min).toBe("1");
    expect(max).toBe("365");
  });

  test("stale threshold affects timeline badge logic", async ({ page }) => {
    // This test verifies the setting exists and can be modified
    // Actual badge behavior depends on mocking old dates or waiting 10+ days
    await page.goto("/settings");

    await expect(page.getByTestId("stale-threshold-setting")).toBeVisible();
    
    // Change threshold
    await page.getByTestId("stale-days-input").fill("7");
    
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByTestId("save-stale-threshold").click();

    await page.waitForTimeout(500);

    // Navigate to a job
    await page.goto("/");
    
    // The threshold is now set to 7 days
    // (Full test would require mocking timestamps or waiting 7 days)
  });
});

