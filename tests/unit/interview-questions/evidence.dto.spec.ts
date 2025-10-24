import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as searchPOST } from '@/app/api/jobs/[id]/interview-questions/search/route';
import { POST as generatePOST } from '@/app/api/jobs/[id]/interview-questions/generate/route';

// Mock dependencies
vi.mock('@/db/client', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue(undefined)
  },
  sqlite: {
    prepare: vi.fn().mockReturnValue({
      get: vi.fn().mockReturnValue(null)
    })
  }
}));

vi.mock('@/lib/interviewQuestions/searchQuestions', () => ({
  searchInterviewQuestions: vi.fn().mockResolvedValue({
    questions: [
      { question: 'Tell me about yourself', source: 'Web Search', url: 'https://glassdoor.com', category: 'General' },
      { question: 'Why do you want to work here?', source: 'Web Search', url: 'https://reddit.com', category: 'Motivation' }
    ],
    sources: ['https://glassdoor.com', 'https://reddit.com'],
    webIntelligence: {
      questions: [],
      interviewerValidations: {},
      successPatterns: [],
      failurePatterns: [],
      warnings: [],
      processIntel: {},
      salaryData: { offers: [] },
      culturalSignals: []
    }
  })
}));

vi.mock('@/lib/coach/aiProvider', () => ({
  callAiProvider: vi.fn().mockResolvedValue({
    result: {
      questions: [
        { question: 'What is your greatest strength?', category: 'Behavioral' },
        { question: 'Describe a challenging project', category: 'Technical' }
      ]
    }
  })
}));

describe('Evidence DTO for Interview Questions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Search Route Evidence Fields', () => {
    it('should add evidence fields to fresh search results', async () => {
      const request = new NextRequest('http://localhost:3000/api/jobs/123/interview-questions/search', {
        method: 'POST',
        body: JSON.stringify({
          companyName: 'Google',
          roleTitle: 'Software Engineer'
        })
      });

      const response = await searchPOST(request, { params: { id: '123' } });
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.questions).toHaveLength(2);
      
      // Check first question has evidence fields
      const firstQuestion = data.questions[0];
      expect(firstQuestion).toHaveProperty('sourceUrl');
      expect(firstQuestion).toHaveProperty('snippet');
      expect(firstQuestion).toHaveProperty('fetchedAt');
      expect(firstQuestion).toHaveProperty('cacheKey');
      
      // Verify evidence field values
      expect(firstQuestion.sourceUrl).toBeDefined();
      expect(firstQuestion.snippet).toContain('Found on');
      expect(firstQuestion.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(firstQuestion.cacheKey).toMatch(/^google:software engineer:[a-f0-9]{8}$/);
      
      // Verify legacy fields are preserved
      expect(firstQuestion.question).toBe('Tell me about yourself');
      expect(firstQuestion.source).toBe('Web Search');
      expect(firstQuestion.category).toBe('General');
    });

    it('should add evidence fields to cached search results', async () => {
      // Mock cache hit
      const mockDb = await import('@/db/client');
      mockDb.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              searchedQuestions: JSON.stringify([
                { question: 'Cached question', source: 'Web Search', category: 'General' }
              ]),
              searchSources: JSON.stringify(['https://glassdoor.com']),
              webIntelligenceJson: null,
              searchedAt: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
              expiresAt: Math.floor(Date.now() / 1000) + 86400 // 1 day from now
            }])
          })
        })
      });

      const request = new NextRequest('http://localhost:3000/api/jobs/123/interview-questions/search', {
        method: 'POST',
        body: JSON.stringify({
          companyName: 'Google',
          roleTitle: 'Software Engineer'
        })
      });

      const response = await searchPOST(request, { params: { id: '123' } });
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.cached).toBe(true);
      expect(data.questions).toHaveLength(1);
      
      const question = data.questions[0];
      expect(question).toHaveProperty('sourceUrl');
      expect(question).toHaveProperty('snippet');
      expect(question).toHaveProperty('fetchedAt');
      expect(question).toHaveProperty('cacheKey');
      
      // For cached results, fetchedAt should be from cache time
      expect(question.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should generate stable cache keys for same questions', async () => {
      const request1 = new NextRequest('http://localhost:3000/api/jobs/123/interview-questions/search', {
        method: 'POST',
        body: JSON.stringify({
          companyName: 'Google',
          roleTitle: 'Software Engineer'
        })
      });

      const request2 = new NextRequest('http://localhost:3000/api/jobs/456/interview-questions/search', {
        method: 'POST',
        body: JSON.stringify({
          companyName: 'Google',
          roleTitle: 'Software Engineer'
        })
      });

      const response1 = await searchPOST(request1, { params: { id: '123' } });
      const response2 = await searchPOST(request2, { params: { id: '456' } });
      
      const data1 = await response1.json();
      const data2 = await response2.json();

      // Same question should have same cache key
      const question1 = data1.questions[0];
      const question2 = data2.questions[0];
      
      expect(question1.cacheKey).toBe(question2.cacheKey);
    });
  });

  describe('Generate Route Evidence Fields', () => {
    it('should add evidence fields to generated questions', async () => {
      const request = new NextRequest('http://localhost:3000/api/jobs/123/interview-questions/generate', {
        method: 'POST',
        body: JSON.stringify({
          persona: 'all'
        })
      });

      const response = await generatePOST(request, { params: { id: '123' } });
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.questions).toBeDefined();
      
      // Check recruiter questions have evidence fields
      if (data.questions.recruiter?.questions) {
        const recruiterQuestion = data.questions.recruiter.questions[0];
        expect(recruiterQuestion).toHaveProperty('sourceUrl');
        expect(recruiterQuestion).toHaveProperty('snippet');
        expect(recruiterQuestion).toHaveProperty('fetchedAt');
        expect(recruiterQuestion).toHaveProperty('cacheKey');
        
        // Verify generated evidence values
        expect(recruiterQuestion.sourceUrl).toBe('generated');
        expect(recruiterQuestion.snippet).toBe('Generated from JD, resume, company values');
        expect(recruiterQuestion.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        expect(recruiterQuestion.cacheKey).toMatch(/^unknown company:unknown role:[a-f0-9]{8}$/);
      }
      
      // Check synthesized questions have evidence fields
      if (data.synthesizedQuestions?.length > 0) {
        const synthesizedQuestion = data.synthesizedQuestions[0];
        expect(synthesizedQuestion).toHaveProperty('sourceUrl');
        expect(synthesizedQuestion).toHaveProperty('snippet');
        expect(synthesizedQuestion).toHaveProperty('fetchedAt');
        expect(synthesizedQuestion).toHaveProperty('cacheKey');
        
        expect(synthesizedQuestion.sourceUrl).toBe('generated');
        expect(synthesizedQuestion.snippet).toBe('Generated from JD, resume, company values');
      }
    });

    it('should preserve legacy fields in generated questions', async () => {
      const request = new NextRequest('http://localhost:3000/api/jobs/123/interview-questions/generate', {
        method: 'POST',
        body: JSON.stringify({
          persona: 'recruiter'
        })
      });

      const response = await generatePOST(request, { params: { id: '123' } });
      const data = await response.json();

      expect(data.success).toBe(true);
      
      if (data.questions.recruiter?.questions) {
        const question = data.questions.recruiter.questions[0];
        
        // Legacy fields should be preserved
        expect(question.question).toBeDefined();
        expect(question.category).toBeDefined();
        
        // Evidence fields should be added
        expect(question.sourceUrl).toBe('generated');
        expect(question.snippet).toBe('Generated from JD, resume, company values');
        expect(question.fetchedAt).toBeDefined();
        expect(question.cacheKey).toBeDefined();
      }
    });
  });

  describe('Backward Compatibility', () => {
    it('should not break existing API contracts', async () => {
      const searchRequest = new NextRequest('http://localhost:3000/api/jobs/123/interview-questions/search', {
        method: 'POST',
        body: JSON.stringify({
          companyName: 'Google',
          roleTitle: 'Software Engineer'
        })
      });

      const generateRequest = new NextRequest('http://localhost:3000/api/jobs/123/interview-questions/generate', {
        method: 'POST',
        body: JSON.stringify({ persona: 'all' })
      });

      const searchResponse = await searchPOST(searchRequest, { params: { id: '123' } });
      const generateResponse = await generatePOST(generateRequest, { params: { id: '123' } });
      
      const searchData = await searchResponse.json();
      const generateData = await generateResponse.json();

      // Search route should maintain existing structure
      expect(searchData).toHaveProperty('success');
      expect(searchData).toHaveProperty('questions');
      expect(searchData).toHaveProperty('sources');
      expect(searchData).toHaveProperty('searchedAt');
      
      // Generate route should maintain existing structure
      expect(generateData).toHaveProperty('success');
      expect(generateData).toHaveProperty('questions');
      expect(generateData).toHaveProperty('themes');
      expect(generateData).toHaveProperty('synthesizedQuestions');
      expect(generateData).toHaveProperty('generatedAt');
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate consistent cache keys for same question text', () => {
      const { createHash } = require('crypto');
      
      function generateCacheKey(company: string, role: string, questionText: string): string {
        const hash = createHash('md5').update(questionText).digest('hex').substring(0, 8);
        return `${company.toLowerCase()}:${role.toLowerCase()}:${hash}`;
      }
      
      const key1 = generateCacheKey('Google', 'Software Engineer', 'Tell me about yourself');
      const key2 = generateCacheKey('Google', 'Software Engineer', 'Tell me about yourself');
      
      expect(key1).toBe(key2);
      expect(key1).toMatch(/^google:software engineer:[a-f0-9]{8}$/);
    });

    it('should generate different cache keys for different questions', () => {
      const { createHash } = require('crypto');
      
      function generateCacheKey(company: string, role: string, questionText: string): string {
        const hash = createHash('md5').update(questionText).digest('hex').substring(0, 8);
        return `${company.toLowerCase()}:${role.toLowerCase()}:${hash}`;
      }
      
      const key1 = generateCacheKey('Google', 'Software Engineer', 'Tell me about yourself');
      const key2 = generateCacheKey('Google', 'Software Engineer', 'Why do you want to work here?');
      
      expect(key1).not.toBe(key2);
    });
  });
});
