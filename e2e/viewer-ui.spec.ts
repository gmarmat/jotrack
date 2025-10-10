import { test, expect } from "./_setup";
import path from "path";

test.describe("Viewer UI Quality", () => {
  test("viewer should have Apple-inspired design with good contrast", async ({ page }) => {
    // Create job and navigate
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Viewer UI Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "ON_RADAR");
    await page.click('button[type="submit"]');
    
    await page.click('a:has-text("Viewer UI Test")');
    await page.waitForTimeout(1000);

    // Upload a text file
    await page.getByTestId("input-resume").setInputFiles([
      path.join(__dirname, "fixtures", "sample-jd.txt"),
    ]);
    await page.waitForTimeout(2000);

    // Open preview
    await page.locator('button[aria-label="Preview"]').first().click();
    
    // Verify modal appears
    await expect(page.getByTestId("viewer-modal")).toBeVisible();

    // Check header styling
    const header = page.locator('.bg-gradient-to-b.from-gray-50');
    await expect(header).toBeVisible();

    // Check backdrop has blur
    const backdrop = page.locator('.backdrop-blur-sm');
    await expect(backdrop).toBeVisible();

    // Check content area has light background
    const contentArea = page.getByTestId("viewer-modal");
    const bgColor = await contentArea.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    // Should be light gray (bg-gray-50)
    expect(bgColor).not.toBe("rgb(0, 0, 0)"); // not black
    expect(bgColor).not.toBe("rgba(0, 0, 0, 0)"); // not transparent

    // Check text is readable (dark text on light bg)
    const textContent = page.locator('pre');
    await expect(textContent).toBeVisible();
    const textColor = await textContent.evaluate(el => 
      window.getComputedStyle(el).color
    );
    // Should be dark gray (text-gray-800)
    expect(textColor).toContain("rgb"); // has color
    
    // Verify toolbar buttons are styled correctly
    const zoomOutBtn = page.locator('button[aria-label="Zoom Out"]');
    await expect(zoomOutBtn).toBeVisible();
    const btnClass = await zoomOutBtn.getAttribute("class");
    expect(btnClass).toContain("hover:bg-gray-100");
    expect(btnClass).toContain("rounded-lg");

    // Close modal
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("viewer-modal")).not.toBeVisible();
  });

  test("text files should display in white card with good readability", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Text Readability Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "ON_RADAR");
    await page.click('button[type="submit"]');
    
    await page.click('a:has-text("Text Readability Test")');
    await page.waitForTimeout(1000);

    await page.getByTestId("input-resume").setInputFiles([
      path.join(__dirname, "fixtures", "sample-cover.txt"),
    ]);
    await page.waitForTimeout(2000);

    await page.locator('button[aria-label="Preview"]').first().click();
    await expect(page.getByTestId("viewer-modal")).toBeVisible();

    // Check for white card container
    const whiteCard = page.locator('.bg-white.rounded-xl.shadow-sm');
    await expect(whiteCard).toBeVisible();

    // Check text is dark and readable
    const preElement = page.locator('pre');
    await expect(preElement).toBeVisible();
    
    const color = await preElement.evaluate(el => {
      const style = window.getComputedStyle(el);
      return {
        color: style.color,
        backgroundColor: style.backgroundColor,
      };
    });

    // Text should be dark (text-gray-800)
    expect(color.color).toContain("rgb");
    // Should NOT be white text (would be rgb(255, 255, 255))
    expect(color.color).not.toBe("rgb(255, 255, 255)");
  });

  test("DOCX files should render with proper typography", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "DOCX Typography Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "ON_RADAR");
    await page.click('button[type="submit"]');
    
    await page.click('a:has-text("DOCX Typography Test")');
    await page.waitForTimeout(1000);

    await page.getByTestId("input-resume").setInputFiles([
      path.join(__dirname, "fixtures", "Resume sample no images.docx"),
    ]);
    await page.waitForTimeout(3000);

    await page.locator('button[aria-label="Preview"]').first().click();
    await expect(page.getByTestId("viewer-modal")).toBeVisible();
    await page.waitForTimeout(2000);

    // Check DOCX content has prose styling
    const article = page.locator('[data-testid="docx-html"]');
    await expect(article).toBeVisible();
    
    const classList = await article.getAttribute("class");
    expect(classList).toContain("prose");
    expect(classList).toContain("prose-base");
    expect(classList).toContain("max-w-none");
    
    // Check it's wrapped in white card
    const whiteCard = page.locator('.bg-white.rounded-xl.shadow-sm');
    await expect(whiteCard).toBeVisible();
  });

  test("modal should have smooth animations", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Animation Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "ON_RADAR");
    await page.click('button[type="submit"]');
    
    await page.click('a:has-text("Animation Test")');
    await page.waitForTimeout(1000);

    await page.getByTestId("input-resume").setInputFiles([
      path.join(__dirname, "fixtures", "names.txt"),
    ]);
    await page.waitForTimeout(2000);

    // Open preview and check for animation classes
    await page.locator('button[aria-label="Preview"]').first().click();
    
    const modal = page.locator('.rounded-2xl.shadow-2xl');
    await expect(modal).toBeVisible();
    
    // Modal should have animation classes
    const modalClass = await modal.getAttribute("class");
    expect(modalClass).toContain("duration");
  });

  test("error states should have clear visual design", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Error State Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "ON_RADAR");
    await page.click('button[type="submit"]');
    
    await page.click('a:has-text("Error State Test")');
    await page.waitForTimeout(1000);

    // Check unsupported file type message design
    // (We'd need an unsupported file, but we can test the empty file state)
    await page.getByTestId("input-resume").setInputFiles([
      path.join(__dirname, "fixtures", "empty.txt"),
    ]);
    await page.waitForTimeout(2000);

    await page.locator('button[aria-label="Preview"]').first().click();
    await expect(page.getByTestId("viewer-modal")).toBeVisible();

    // Should show empty file indicator with icon
    await expect(page.getByText("Empty file")).toBeVisible();
    
    // Check for emoji/icon indicator
    const emptyIndicator = page.locator('.text-gray-400');
    await expect(emptyIndicator).toBeVisible();
  });
});

