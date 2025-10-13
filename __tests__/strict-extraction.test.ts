import { describe, it, expect } from 'vitest';
import { extractVocabulary, scoreParameter, generate25ParameterBreakdown } from '@/lib/coach/strictExtraction';

describe('Strict Extraction', () => {
  it('should extract simple terms from text', () => {
    const text = 'Python Django developer needed';
    const vocab = extractVocabulary(text);
    
    console.log('Terms:', Array.from(vocab.terms));
    console.log('Bigrams:', Array.from(vocab.bigrams));
    
    expect(vocab.terms.has('python')).toBe(true);
    expect(vocab.terms.has('django')).toBe(true);
    expect(vocab.terms.has('developer')).toBe(true);
  });

  it('should score parameters when keywords exist', () => {
    const jdText = 'Senior Python Django developer needed. PostgreSQL and AWS required.';
    const resumeText = 'Python Django expert. PostgreSQL experience. AWS certified.';
    
    const jdVocab = extractVocabulary(jdText);
    const resumeVocab = extractVocabulary(resumeText);
    
    console.log('JD Terms:', Array.from(jdVocab.terms).slice(0, 10));
    console.log('Resume Terms:', Array.from(resumeVocab.terms).slice(0, 10));
    
    // This should find "python" keyword for "Programming Languages" parameter
    const result = scoreParameter('Programming Languages', jdVocab, resumeVocab, 0.07);
    
    console.log('Score result:', result);
    expect(result.score).toBeGreaterThan(0);
  });

  it('should generate 25-parameter breakdown', () => {
    const jdText = 'Python developer with 5 years experience. React and Django skills required.';
    const resumeText = 'Python developer with 6 years experience. React and Django expert.';
    
    const jdVocab = extractVocabulary(jdText);
    const resumeVocab = extractVocabulary(resumeText);
    
    const breakdown = generate25ParameterBreakdown(jdVocab, resumeVocab);
    
    expect(breakdown).toHaveLength(25);
    
    // At least some parameters should have scores > 0
    const nonZeroScores = breakdown.filter(p => p.score > 0);
    console.log('Non-zero scores:', nonZeroScores.length);
    console.log('Sample:', nonZeroScores.slice(0, 3));
    
    expect(nonZeroScores.length).toBeGreaterThan(0);
  });
});

