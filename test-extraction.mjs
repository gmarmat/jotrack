// Simple test of strict extraction
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
  'can', 'could', 'may', 'might', 'must', 'shall',
]);

function extractVocabulary(text) {
  const terms = new Set();
  const bigrams = new Set();
  const context = new Map();

  const lines = text.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;

    const tokens = trimmed
      .toLowerCase()
      .split(/[\s,\.;:\(\)\[\]{}]+/) // Split on whitespace and punctuation
      .map(t => t.trim())
      .filter(t => t.length > 1 && /\w/.test(t)); // Keep tokens with word characters

    console.log('Tokens from line:', tokens);

    for (const token of tokens) {
      if (!STOPWORDS.has(token) && token.length > 2) {
        terms.add(token);
        if (!context.has(token)) {
          context.set(token, trimmed.slice(0, 150));
        }
      }
    }

    for (let i = 0; i < tokens.length - 1; i++) {
      const bigram = `${tokens[i]} ${tokens[i + 1]}`;
      if (bigram.length > 4 && !STOPWORDS.has(tokens[i])) {
        bigrams.add(bigram);
      }
    }
  }

  return { terms, bigrams, context };
}

// Test
const jd = 'Python Django developer needed';
const resume = 'Python Django expert';

const jdVocab = extractVocabulary(jd);
const resumeVocab = extractVocabulary(resume);

console.log('\n=== JD Vocabulary ===');
console.log('Terms:', Array.from(jdVocab.terms));
console.log('Bigrams:', Array.from(jdVocab.bigrams));

console.log('\n=== Resume Vocabulary ===');
console.log('Terms:', Array.from(resumeVocab.terms));
console.log('Bigrams:', Array.from(resumeVocab.bigrams));

console.log('\n=== Checks ===');
console.log('JD has "python":', jdVocab.terms.has('python'));
console.log('JD has "django":', jdVocab.terms.has('django'));
console.log('Resume has "python":', resumeVocab.terms.has('python'));
console.log('Resume has "django":', resumeVocab.terms.has('django'));

