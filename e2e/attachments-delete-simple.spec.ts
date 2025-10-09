import { test, expect } from "@playwright/test";
import path from "path";

test("delete button visible by default", async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector('h1:has-text("Jotrack")', { state: "visible", timeout: 10000 });

  const timestamp = Date.now();
  const jobTitle = `Simple Delete Test ${timestamp}`;

  // Create a job
  await page.fill('input[placeholder*="Senior React Developer"]', jobTitle);
  await page.fill('input[placeholder*="TechCorp"]', "Test Co");
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
  await expect(page.getByTestId("attachments-panel")).toBeVisible();

  // Upload a file
  const coverPath = path.join(__dirname, "fixtures", "sample-cover.txt");
  const uploadPromise = page.waitForResponse(
    (resp) => resp.url().includes(`/api/jobs/${jobId}/attachments`) && resp.request().method() === "POST",
    { timeout: 10000 }
  );
  
  const coverInput = page.locator('input[type="file"]').nth(2);
  await coverInput.setInputFiles(coverPath);
  await uploadPromise;

  // Wait for file to appear
  await expect(page.locator('text=sample-cover.txt')).toBeVisible({ timeout: 5000 });
  
  // Debug: Take a screenshot
  await page.screenshot({ path: 'test-results/debug-after-upload.png', fullPage: true });

  // Wait a bit for component to render
  await page.waitForTimeout(2000);

  // Check if delete button exists - try multiple selectors
  console.log("Looking for delete button...");
  
  const deleteByTestId = page.getByTestId(/^delete-/);
  console.log("Delete buttons found:", await deleteByTestId.count());
  
  const deleteByText = page.getByRole('button', { name: /delete/i });
  console.log("Delete buttons by text found:", await deleteByText.count());

  const allButtons = page.locator('button');
  console.log("All buttons found:", await allButtons.count());

  const allLinks = page.locator('a');
  console.log("All links found:", await allLinks.count());

  const downloadLink = page.getByTestId(/^download-/);
  console.log("Download links found:", await downloadLink.count());
  
  // Get the page HTML
  const pageHTML = await page.content();
  console.log("Page HTML length:", pageHTML.length);
  console.log("Contains 'sample-cover':", pageHTML.includes('sample-cover'));
  console.log("Contains 'Delete':", pageHTML.includes('Delete'));
  console.log("Contains 'button':", pageHTML.includes('button'));
  
  // Extract HTML around "Delete"
  const deleteIndex = pageHTML.indexOf('Delete');
  if (deleteIndex !== -1) {
    const snippet = pageHTML.substring(Math.max(0, deleteIndex - 200), Math.min(pageHTML.length, deleteIndex + 200));
    console.log("HTML around 'Delete':", snippet);
  }

  // Check browser console for errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Browser console error:', msg.text());
    }
  });

  // Check for the attachments panel container
  const attachmentsPanel = page.getByTestId('attachments-panel');
  const panelHTML = await attachmentsPanel.innerHTML();
  console.log("Attachments panel HTML length:", panelHTML.length);
  console.log("Panel contains 'Delete':", panelHTML.includes('Delete'));
  console.log("Panel contains '<button':", panelHTML.includes('<button'));

  // Verify delete button is visible
  await expect(deleteByText.first()).toBeVisible({ timeout: 5000 });
});

