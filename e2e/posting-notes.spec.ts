import { test, expect } from "@playwright/test";

test("posting link + notes (autosave + FTS)", async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector('h1:has-text("Jotrack")', { state: "visible", timeout: 10000 });

  const timestamp = Date.now();
  const jobTitle = `Posting Notes Test ${timestamp}`;
  const uniquePhrase = `unique-notes-phrase-${timestamp}`;

  // Create a job
  await page.fill('input[placeholder*="Senior React Developer"]', jobTitle);
  await page.fill('input[placeholder*="TechCorp"]', "Posting Notes Test Co");
  await page.selectOption("select", "APPLIED");

  const createJobPromise = page.waitForResponse(
    (resp) => resp.url().includes("/api/jobs") && resp.request().method() === "POST",
    { timeout: 10000 }
  );
  await page.getByRole("button", { name: /add job application/i }).click();
  const jobResponse = await createJobPromise;
  const jobData = await jobResponse.json();
  const jobId = jobData.job?.id;

  expect(jobId).toBeTruthy();

  // Navigate to job detail page
  await page.goto(`/jobs/${jobId}`);
  await expect(page.getByTestId("job-title")).toBeVisible();

  // Set posting URL
  const postingUrl = "https://example.com/job-posting";
  await page.fill('[data-testid="posting-url"]', postingUrl);
  await page.waitForTimeout(700); // Wait for debounce

  // Click Open button and verify popup
  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByTestId("posting-open").click()
  ]);
  await expect(popup).toHaveURL(postingUrl);
  await popup.close();

  // Type unique phrase into Notes
  await page.fill('[data-testid="notes-area"]', uniquePhrase);
  await page.waitForTimeout(1100); // Wait for autosave

  // Verify saved indicator appears
  await expect(page.getByTestId("notes-saved")).toBeVisible();

  // Reload page and verify notes persist
  await page.reload();
  await expect(page.getByTestId("notes-area")).toHaveValue(uniquePhrase);

  // Navigate to home and search for the unique phrase
  await page.goto("/");
  await page.fill('input[placeholder*="Search jobs"]', uniquePhrase);
  await page.waitForTimeout(500); // Wait for search

  // Verify job appears in search results
  await expect(page.getByRole("link", { name: jobTitle })).toBeVisible();
});
