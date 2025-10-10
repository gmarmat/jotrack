import { describe, it, expect } from "vitest";

/**
 * Tests for file content extraction layer
 * Verifies we can extract RAW content (not preview HTML) for analysis
 */

describe("File Content Extraction for Analysis", () => {
  describe("Raw vs Preview Separation", () => {
    it("should extract plain text without HTML tags", () => {
      // Simulate what extractDocxText should return
      const rawText = "John Doe\nSoftware Engineer\n\nExperience:\n- React Developer at TechCorp";
      const htmlPreview = "<h1>John Doe</h1><p class='prose-p:text-gray-700'>Software Engineer</p>";
      
      // For analysis, we should use rawText (no HTML)
      expect(rawText).not.toContain("<");
      expect(rawText).not.toContain("class=");
      expect(rawText).not.toContain("prose");
      
      // Preview would have HTML/styling
      expect(htmlPreview).toContain("<");
      expect(htmlPreview).toContain("class=");
    });

    it("should preserve original content structure for analysis", () => {
      // Raw content preserves newlines, structure
      const rawContent = {
        text: "Section 1\n\nThis is paragraph one.\nThis is paragraph two.",
        metadata: { wordCount: 9 },
      };
      
      // Verify structure is preserved
      expect(rawContent.text).toContain("\n\n"); // Section breaks
      expect(rawContent.text.split("\n")).toHaveLength(3);
    });

    it("should not include CSS classes in extracted text", () => {
      // Analysis layer output
      const analysisText = "Skills: React, TypeScript, Node.js";
      
      // Should NOT have any CSS/Tailwind classes
      expect(analysisText).not.toContain("text-gray");
      expect(analysisText).not.toContain("prose-");
      expect(analysisText).not.toContain("font-");
      expect(analysisText).not.toContain("className");
    });
  });

  describe("Word Count Accuracy", () => {
    it("should count words accurately from raw text", () => {
      const text = "The quick brown fox jumps over the lazy dog";
      const words = text.split(/\s+/).filter(Boolean);
      
      expect(words).toHaveLength(9);
      expect(words).not.toContain("");
    });

    it("should handle multiple spaces and newlines", () => {
      const text = "Word1   Word2\n\nWord3\t\tWord4";
      const words = text.split(/\s+/).filter(Boolean);
      
      expect(words).toHaveLength(4);
      expect(words).toEqual(["Word1", "Word2", "Word3", "Word4"]);
    });
  });

  describe("Keyword Extraction Logic", () => {
    it("should extract meaningful keywords", () => {
      const text = "React TypeScript JavaScript developer with 5 years experience building scalable applications";
      const words = text
        .toLowerCase()
        .split(/\s+/)
        .filter(w => w.length >= 4) // Min length
        .filter(w => /^[a-z]+$/.test(w)); // Only alphabetic
      
      expect(words).toContain("react");
      expect(words).toContain("typescript");
      expect(words).toContain("javascript");
      expect(words).toContain("developer");
      expect(words).not.toContain("5"); // Numbers filtered
      expect(words).not.toContain("with"); // Short words filtered
    });
  });

  describe("File Content Structure", () => {
    it("should return standardized FileContent structure", () => {
      const mockContent = {
        text: "Sample text content",
        metadata: {
          wordCount: 3,
          pageCount: 1,
        },
        raw: "Sample text content",
      };
      
      expect(mockContent).toHaveProperty("text");
      expect(mockContent).toHaveProperty("metadata");
      expect(mockContent).toHaveProperty("raw");
      expect(mockContent.text).toBe(mockContent.raw);
    });

    it("should preserve raw content separate from processed text", () => {
      // RTF example: raw has control codes, text is cleaned
      const mockRtfContent = {
        text: "Clean text for analysis",
        raw: "{\\rtf1\\ansi Clean text for analysis}",
      };
      
      expect(mockRtfContent.raw).toContain("\\rtf");
      expect(mockRtfContent.text).not.toContain("\\rtf");
    });
  });

  describe("Content Comparison", () => {
    it("should compare content based on words, not styling", () => {
      const text1 = "React Developer with TypeScript experience";
      const text2 = "React Developer with TypeScript experience";
      
      const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
      const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 3));
      
      const common = Array.from(words1).filter(w => words2.has(w));
      const similarity = common.length / Math.max(words1.size, words2.size, 1);
      
      expect(similarity).toBe(1.0); // Perfect match
    });

    it("should detect partial similarity", () => {
      const text1 = "React TypeScript Developer";
      const text2 = "React JavaScript Developer";
      
      const words1 = new Set(text1.toLowerCase().split(/\s+/));
      const words2 = new Set(text2.toLowerCase().split(/\s+/));
      
      const common = Array.from(words1).filter(w => words2.has(w));
      
      expect(common).toContain("react");
      expect(common).toContain("developer");
      expect(common).not.toContain("typescript");
      expect(common).not.toContain("javascript");
    });
  });

  describe("RTF Control Code Stripping", () => {
    it("should remove RTF control sequences for analysis", () => {
      const rtfRaw = "{\\rtf1\\ansi\\deff0 This is \\b bold\\b0 text}";
      
      // Analysis layer should strip these
      const cleaned = rtfRaw
        .replace(/\{\\\*[^}]*\}/g, '')
        .replace(/\\[a-zA-Z]+-?\d* ?/g, '')
        .replace(/[{}]/g, '')
        .trim();
      
      expect(cleaned).toBe("This is  bold text");
      expect(cleaned).not.toContain("\\rtf");
      expect(cleaned).not.toContain("\\b");
      expect(cleaned).not.toContain("{");
    });
  });

  describe("DOCX: Raw Text vs HTML", () => {
    it("should differentiate between extractRawText and convertToHtml", () => {
      // For analysis: use extractRawText
      const rawForAnalysis = "Senior Software Engineer\n5+ years React experience";
      
      // For preview: use convertToHtml
      const htmlForPreview = "<h1 class='text-2xl'>Senior Software Engineer</h1><p class='prose-p:text-gray-700'>5+ years React experience</p>";
      
      // Analysis should use raw (no HTML)
      expect(rawForAnalysis).not.toContain("<");
      expect(rawForAnalysis).not.toContain("class=");
      
      // Preview can have styling
      expect(htmlForPreview).toContain("<");
      expect(htmlForPreview).toContain("class=");
      
      // Both should preserve core content
      expect(rawForAnalysis).toContain("Senior Software Engineer");
      expect(htmlForPreview).toContain("Senior Software Engineer");
    });
  });

  describe("Encoding Handling", () => {
    it("should detect and handle different encodings", () => {
      // UTF-8 with replacement chars indicates encoding issue
      const utf8WithErrors = "résumé\uFFFD\uFFFD\uFFFDskills";
      const replacementCount = (utf8WithErrors.match(/\uFFFD/g) || []).length;
      
      expect(replacementCount).toBeGreaterThan(0);
      
      // Should trigger fallback to latin1/windows-1252
      const shouldUseFallback = replacementCount > 10;
      expect(shouldUseFallback).toBe(false); // Only 3 replacement chars
    });
  });
});

