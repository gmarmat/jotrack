import { describe, it, expect } from 'vitest';
import { getNormalizedPathFromVersion } from '@/src/interview-coach/attachments/variantPath';

describe('getNormalizedPathFromVersion', () => {
  it('should return normalized path when available', () => {
    const version = {
      variants: {
        normalized: { path: '/path/to/normalized.txt' },
        raw: { path: '/path/to/raw.docx' }
      }
    };
    
    expect(getNormalizedPathFromVersion(version)).toBe('/path/to/normalized.txt');
  });

  it('should return ai_optimized path as fallback', () => {
    const version = {
      variants: {
        ai_optimized: { path: '/path/to/ai_optimized.txt' },
        raw: { path: '/path/to/raw.docx' }
      }
    };
    
    expect(getNormalizedPathFromVersion(version)).toBe('/path/to/ai_optimized.txt');
  });

  it('should return normalized_txt path as fallback', () => {
    const version = {
      variants: {
        normalized_txt: { path: '/path/to/normalized_txt.txt' },
        raw: { path: '/path/to/raw.docx' }
      }
    };
    
    expect(getNormalizedPathFromVersion(version)).toBe('/path/to/normalized_txt.txt');
  });

  it('should find path with normalized in name', () => {
    const version = {
      variants: {
        some_normalized_variant: { path: '/path/to/some_normalized.txt' },
        raw: { path: '/path/to/raw.docx' }
      }
    };
    
    expect(getNormalizedPathFromVersion(version)).toBe('/path/to/some_normalized.txt');
  });

  it('should return undefined when no normalized path exists', () => {
    const version = {
      variants: {
        raw: { path: '/path/to/raw.docx' }
      }
    };
    
    expect(getNormalizedPathFromVersion(version)).toBeUndefined();
  });

  it('should handle empty variants', () => {
    const version = { variants: {} };
    expect(getNormalizedPathFromVersion(version)).toBeUndefined();
  });

  it('should handle null version', () => {
    expect(getNormalizedPathFromVersion(null)).toBeUndefined();
  });
});
