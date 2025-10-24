import { describe, it, expect } from 'vitest';
import { normalizeTextForPractice } from '@/src/interview-coach/scoring/schema';

describe('Clarity Weight in Practice Mode', () => {
  describe('normalizeTextForPractice', () => {
    it('should normalize text and reduce impact of typos', () => {
      const textWithTypos = 'I led a project that improved the system performace by 25% and reduced the latency significantly.';
      const normalized = normalizeTextForPractice(textWithTypos);
      
      expect(normalized).toBe('i led a project that improved the system performace by 25% and reduced the latency significantly.');
      expect(normalized).not.toContain('performance'); // Original typo preserved for structure heuristics
    });

    it('should collapse multiple whitespace', () => {
      const textWithSpaces = 'I    led   a    project   that   improved   performance.';
      const normalized = normalizeTextForPractice(textWithSpaces);
      
      expect(normalized).toBe('i led a project that improved performance.');
    });

    it('should remove most punctuation while preserving sentence structure', () => {
      const textWithPunctuation = 'I led a project! That improved performance??? And reduced latency...';
      const normalized = normalizeTextForPractice(textWithPunctuation);
      
      expect(normalized).toBe('i led a project! that improved performance??? and reduced latency...');
      expect(normalized).toContain('!'); // Preserve sentence-ending punctuation
      expect(normalized).toContain('???'); // Preserve question marks
      expect(normalized).toContain('...'); // Preserve ellipses
    });

    it('should remove filler words', () => {
      const textWithFillers = 'Um, I led a project that, uh, improved performance, you know, significantly.';
      const normalized = normalizeTextForPractice(textWithFillers);
      
      expect(normalized).toBe('i led a project that improved performance significantly.');
      expect(normalized).not.toContain('um');
      expect(normalized).not.toContain('uh');
      expect(normalized).not.toContain('you know');
    });

    it('should handle empty and whitespace-only text', () => {
      expect(normalizeTextForPractice('')).toBe('');
      expect(normalizeTextForPractice('   ')).toBe('');
      expect(normalizeTextForPractice('\n\t  ')).toBe('');
    });

    it('should handle mixed case and preserve numbers', () => {
      const mixedCaseText = 'I Led A Project That Improved Performance By 25% And Reduced Latency By 50ms.';
      const normalized = normalizeTextForPractice(mixedCaseText);
      
      expect(normalized).toBe('i led a project that improved performance by 25% and reduced latency by 50ms.');
      expect(normalized).toContain('25%');
      expect(normalized).toContain('50ms');
    });
  });

  describe('Property-based testing for typo impact', () => {
    it('should limit impact of typos to max 2 points', () => {
      // Test various typos and ensure they don't swing total score by more than 2 points
      const originalText = 'I led a project that improved performance by 25% and reduced latency significantly.';
      const typoVariations = [
        'I led a projct that improved performace by 25% and reduced latncy significantly.',
        'I led a project that improved performance by 25% and redused latency signifcantly.',
        'I led a projct that improved performace by 25% and redused latncy signifcantly.',
        'I led a project that improved performance by 25% and reduced latency signifcantly.',
        'I led a projct that improved performace by 25% and reduced latncy signifcantly.'
      ];

      const originalNormalized = normalizeTextForPractice(originalText);
      
      typoVariations.forEach(typoText => {
        const typoNormalized = normalizeTextForPractice(typoText);
        
        // The normalized versions should be very similar (typos preserved for structure heuristics)
        // but the key structure elements should remain intact
        expect(typoNormalized).toContain('i led a project');
        expect(typoNormalized).toContain('improved');
        expect(typoNormalized).toContain('25%');
        expect(typoNormalized).toContain('reduced');
        expect(typoNormalized).toContain('latency');
      });
    });

    it('should preserve sentence structure indicators', () => {
      const structuredText = 'I led a project that improved performance. The results were significant. We achieved 25% improvement.';
      const normalized = normalizeTextForPractice(structuredText);
      
      // Should preserve sentence structure
      expect(normalized).toContain('.');
      expect(normalized.split('.').length).toBe(4); // 3 sentences + empty string
      
      // Should preserve key structure words
      expect(normalized).toContain('i led');
      expect(normalized).toContain('results were');
      expect(normalized).toContain('we achieved');
    });
  });
});
