import { test, expect } from "@playwright/test";

test("attachment API accepts and returns kind field", async ({ page, request }) => {
  await page.goto("/");

  // Wait for page to load
  await page.waitForSelector('h1:has-text("Jotrack")', { state: "visible" });

  const timestamp = Date.now();
  const jobTitle = `Kind Test Job ${timestamp}`;

  // Create a job first
  await page.fill('input[placeholder*="Senior React Developer"]', jobTitle);
  await page.fill('input[placeholder*="TechCorp"]', "Test Company");
  await page.selectOption("select", "APPLIED");

  const createJob = page.waitForResponse(
    (resp) => resp.url().includes("/api/jobs") && resp.request().method() === "POST"
  );
  await page.getByRole("button", { name: /add job application/i }).click();
  const jobResponse = await createJob;
  const jobData = await jobResponse.json();
  const jobId = jobData.job?.id;

  expect(jobId).toBeTruthy();

  // Create a test file blob
  const testFile = new File(["Test resume content"], "test-resume.txt", { type: "text/plain" });
  const formData = new FormData();
  formData.append("file", testFile);
  formData.append("kind", "resume");

  // Upload with kind='resume'
  const uploadResponse = await request.post(`http://localhost:3000/api/jobs/${jobId}/attachments`, {
    multipart: formData,
  });

  expect(uploadResponse.ok()).toBe(true);
  const uploadData = await uploadResponse.json();
  expect(uploadData.kind).toBe("resume");
  expect(uploadData.filename).toBeTruthy();

  // List attachments and verify kind is returned
  const listResponse = await request.get(`http://localhost:3000/api/jobs/${jobId}/attachments`);
  expect(listResponse.ok()).toBe(true);
  const listData = await listResponse.json();
  expect(Array.isArray(listData)).toBe(true);
  expect(listData.length).toBeGreaterThan(0);
  expect(listData[0].kind).toBe("resume");

  // Test with different kind values
  const testFile2 = new File(["JD content"], "test-jd.txt", { type: "text/plain" });
  const formData2 = new FormData();
  formData2.append("file", testFile2);
  formData2.append("kind", "jd");

  const upload2Response = await request.post(`http://localhost:3000/api/jobs/${jobId}/attachments`, {
    multipart: formData2,
  });
  expect(upload2Response.ok()).toBe(true);
  const upload2Data = await upload2Response.json();
  expect(upload2Data.kind).toBe("jd");

  // Test without kind (should default to 'other')
  const testFile3 = new File(["Other content"], "test-other.txt", { type: "text/plain" });
  const formData3 = new FormData();
  formData3.append("file", testFile3);

  const upload3Response = await request.post(`http://localhost:3000/api/jobs/${jobId}/attachments`, {
    multipart: formData3,
  });
  expect(upload3Response.ok()).toBe(true);
  const upload3Data = await upload3Response.json();
  expect(upload3Data.kind).toBe("other");

  // Test with invalid kind (should default to 'other')
  const testFile4 = new File(["Invalid content"], "test-invalid.txt", { type: "text/plain" });
  const formData4 = new FormData();
  formData4.append("file", testFile4);
  formData4.append("kind", "invalid_kind");

  const upload4Response = await request.post(`http://localhost:3000/api/jobs/${jobId}/attachments`, {
    multipart: formData4,
  });
  expect(upload4Response.ok()).toBe(true);
  const upload4Data = await upload4Response.json();
  expect(upload4Data.kind).toBe("other");
});

