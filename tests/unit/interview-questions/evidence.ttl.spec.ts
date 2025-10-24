import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as searchPOST } from '@/app/api/jobs/[id]/interview-questions/search/route';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Mock dependencies
vi.mock('@/db/client', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([])
  },
  sqlite: {
    prepare: vi.fn().mockReturnValue({
      get: vi.fn().mockReturnValue(null),
      run: vi.fn().mockReturnValue({ changes: 0, lastInsertRowid: 0 })
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

// Mock time functions
const mockNow = vi.fn();
const originalDateNow = Date.now;
const originalDate = Date;

describe('Evidence TTL Invariants', () => {
  let testResults: any[] = [];
  let cacheEntries: Map<string, any> = new Map();

  beforeEach(() => {
    vi.clearAllMocks();
    testResults = [];
    cacheEntries.clear();
    
    // Mock Date.now and Date constructor
    mockNow.mockReturnValue(1700000000000); // Fixed timestamp for testing
    vi.stubGlobal('Date', class extends originalDate {
      constructor(...args: any[]) {
        if (args.length === 0) {
          return new originalDate(mockNow());
        }
        return new originalDate(...args);
      }
      static now() {
        return mockNow();
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('Cache TTL Behavior', () => {
    it('should set fetchedAt on first call', async () => {
      // Mock fresh cache (no existing entry)
      const mockDb = await import('@/db/client');
      mockDb.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([])
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
      expect(data.questions).toHaveLength(2);
      
      const firstQuestion = data.questions[0];
      expect(firstQuestion.fetchedAt).toBeDefined();
      expect(firstQuestion.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      
      // Record test result
      testResults.push({
        test: 'first_call_sets_fetchedAt',
        passed: true,
        fetchedAt: firstQuestion.fetchedAt,
        timestamp: mockNow()
      });
    });

    it('should return identical fetchedAt within TTL', async () => {
      const originalFetchedAt = '2024-01-01T12:00:00.000Z';
      const cachedTimestamp = Math.floor(new Date(originalFetchedAt).getTime() / 1000);
      
      // Mock cache hit with fresh data (within TTL)
      const mockDb = await import('@/db/client');
      mockDb.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              searchedQuestions: JSON.stringify([
                { question: 'Tell me about yourself', source: 'Web Search', category: 'General' }
              ]),
              searchSources: JSON.stringify(['https://glassdoor.com']),
              webIntelligenceJson: null,
              searchedAt: cachedTimestamp,
              expiresAt: cachedTimestamp + (21 * 24 * 60 * 60) // 21 days from cached time
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
      expect(question.fetchedAt).toBe(originalFetchedAt);
      
      // Record test result
      testResults.push({
        test: 'identical_fetchedAt_within_ttl',
        passed: true,
        originalFetchedAt,
        returnedFetchedAt: question.fetchedAt,
        timestamp: mockNow()
      });
    });

    it('should return newer fetchedAt after TTL expiration', async () => {
      const originalFetchedAt = '2024-01-01T12:00:00.000Z';
      const cachedTimestamp = Math.floor(new Date(originalFetchedAt).getTime() / 1000);
      
      // Mock cache hit with expired data (past TTL)
      const mockDb = await import('@/db/client');
      mockDb.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              searchedQuestions: JSON.stringify([
                { question: 'Tell me about yourself', source: 'Web Search', category: 'General' }
              ]),
              searchSources: JSON.stringify(['https://glassdoor.com']),
              webIntelligenceJson: null,
              searchedAt: cachedTimestamp,
              expiresAt: cachedTimestamp + (21 * 24 * 60 * 60) // 21 days from cached time
            }])
          })
        })
      });

      // Set current time to be after TTL expiration
      mockNow.mockReturnValue(cachedTimestamp * 1000 + (22 * 24 * 60 * 60 * 1000)); // 22 days later

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
      expect(data.cached).toBe(false); // Should not be cached due to expiration
      expect(data.questions).toHaveLength(2);
      
      const question = data.questions[0];
      expect(question.fetchedAt).toBeDefined();
      expect(question.fetchedAt).not.toBe(originalFetchedAt);
      
      // Verify the new fetchedAt is newer
      const newFetchedAt = new Date(question.fetchedAt);
      const originalDate = new Date(originalFetchedAt);
      expect(newFetchedAt.getTime()).toBeGreaterThan(originalDate.getTime());
      
      // Record test result
      testResults.push({
        test: 'newer_fetchedAt_after_ttl',
        passed: true,
        originalFetchedAt,
        newFetchedAt: question.fetchedAt,
        timestamp: mockNow()
      });
    });
  });

  describe('Cache Key Stability', () => {
    it('should generate stable cache keys for same inputs', async () => {
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

      // Mock fresh cache for both requests
      const mockDb = await import('@/db/client');
      mockDb.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([])
          })
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
      expect(question1.cacheKey).toMatch(/^google:software engineer:[a-f0-9]{8}$/);
      
      // Record test result
      testResults.push({
        test: 'stable_cache_keys',
        passed: true,
        cacheKey1: question1.cacheKey,
        cacheKey2: question2.cacheKey,
        timestamp: mockNow()
      });
    });

    it('should generate different cache keys for different inputs', async () => {
      const request1 = new NextRequest('http://localhost:3000/api/jobs/123/interview-questions/search', {
        method: 'POST',
        body: JSON.stringify({
          companyName: 'Google',
          roleTitle: 'Software Engineer'
        })
      });

      const request2 = new NextRequest('http://localhost:3000/api/jobs/123/interview-questions/search', {
        method: 'POST',
        body: JSON.stringify({
          companyName: 'Microsoft',
          roleTitle: 'Software Engineer'
        })
      });

      // Mock fresh cache for both requests
      const mockDb = await import('@/db/client');
      mockDb.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([])
          })
        })
      });

      const response1 = await searchPOST(request1, { params: { id: '123' } });
      const response2 = await searchPOST(request2, { params: { id: '123' } });
      
      const data1 = await response1.json();
      const data2 = await response2.json();

      // Different companies should have different cache keys
      const question1 = data1.questions[0];
      const question2 = data2.questions[0];
      
      expect(question1.cacheKey).not.toBe(question2.cacheKey);
      expect(question1.cacheKey).toMatch(/^google:software engineer:[a-f0-9]{8}$/);
      expect(question2.cacheKey).toMatch(/^microsoft:software engineer:[a-f0-9]{8}$/);
      
      // Record test result
      testResults.push({
        test: 'different_cache_keys',
        passed: true,
        cacheKey1: question1.cacheKey,
        cacheKey2: question2.cacheKey,
        timestamp: mockNow()
      });
    });
  });

  describe('Evidence Fields Preservation', () => {
    it('should preserve all evidence fields across cache operations', async () => {
      const originalFetchedAt = '2024-01-01T12:00:00.000Z';
      const cachedTimestamp = Math.floor(new Date(originalFetchedAt).getTime() / 1000);
      
      // Mock cache hit with fresh data
      const mockDb = await import('@/db/client');
      mockDb.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              searchedQuestions: JSON.stringify([
                { 
                  question: 'Tell me about yourself', 
                  source: 'Web Search', 
                  category: 'General',
                  sourceUrl: 'https://glassdoor.com',
                  snippet: 'Found on glassdoor.com',
                  fetchedAt: originalFetchedAt,
                  cacheKey: 'google:software engineer:abc12345'
                }
              ]),
              searchSources: JSON.stringify(['https://glassdoor.com']),
              webIntelligenceJson: null,
              searchedAt: cachedTimestamp,
              expiresAt: cachedTimestamp + (21 * 24 * 60 * 60)
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
      expect(data.questions).toHaveLength(1);
      
      const question = data.questions[0];
      
      // All evidence fields should be preserved
      expect(question).toHaveProperty('sourceUrl');
      expect(question).toHaveProperty('snippet');
      expect(question).toHaveProperty('fetchedAt');
      expect(question).toHaveProperty('cacheKey');
      
      // Verify field values
      expect(question.sourceUrl).toBe('https://glassdoor.com');
      expect(question.snippet).toBe('Found on glassdoor.com');
      expect(question.fetchedAt).toBe(originalFetchedAt);
      expect(question.cacheKey).toBe('google:software engineer:abc12345');
      
      // Legacy fields should also be preserved
      expect(question.question).toBe('Tell me about yourself');
      expect(question.source).toBe('Web Search');
      expect(question.category).toBe('General');
      
      // Record test result
      testResults.push({
        test: 'evidence_fields_preserved',
        passed: true,
        preservedFields: {
          sourceUrl: question.sourceUrl,
          snippet: question.snippet,
          fetchedAt: question.fetchedAt,
          cacheKey: question.cacheKey
        },
        timestamp: mockNow()
      });
    });

    it('should maintain evidence field consistency across multiple calls', async () => {
      // Mock fresh cache for first call
      const mockDb = await import('@/db/client');
      mockDb.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([])
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

      // First call
      const response1 = await searchPOST(request, { params: { id: '123' } });
      const data1 = await response1.json();
      
      const question1 = data1.questions[0];
      const originalCacheKey = question1.cacheKey;
      const originalSourceUrl = question1.sourceUrl;
      const originalSnippet = question1.snippet;
      
      // Second call with same parameters
      const response2 = await searchPOST(request, { params: { id: '123' } });
      const data2 = await response2.json();
      
      const question2 = data2.questions[0];
      
      // Evidence fields should be consistent
      expect(question2.cacheKey).toBe(originalCacheKey);
      expect(question2.sourceUrl).toBe(originalSourceUrl);
      expect(question2.snippet).toBe(originalSnippet);
      
      // Record test result
      testResults.push({
        test: 'evidence_consistency_across_calls',
        passed: true,
        consistentFields: {
          cacheKey: question2.cacheKey === originalCacheKey,
          sourceUrl: question2.sourceUrl === originalSourceUrl,
          snippet: question2.snippet === originalSnippet
        },
        timestamp: mockNow()
      });
    });
  });

  describe('TTL Boundary Testing', () => {
    it('should handle TTL boundary conditions correctly', async () => {
      const originalFetchedAt = '2024-01-01T12:00:00.000Z';
      const cachedTimestamp = Math.floor(new Date(originalFetchedAt).getTime() / 1000);
      const ttlSeconds = 21 * 24 * 60 * 60; // 21 days
      
      // Test exactly at TTL boundary (should be expired)
      mockNow.mockReturnValue(cachedTimestamp * 1000 + ttlSeconds * 1000);
      
      const mockDb = await import('@/db/client');
      mockDb.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              searchedQuestions: JSON.stringify([
                { question: 'Tell me about yourself', source: 'Web Search', category: 'General' }
              ]),
              searchSources: JSON.stringify(['https://glassdoor.com']),
              webIntelligenceJson: null,
              searchedAt: cachedTimestamp,
              expiresAt: cachedTimestamp + ttlSeconds
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
      expect(data.cached).toBe(false); // Should be expired at boundary
      expect(data.questions).toHaveLength(2); // Should fetch fresh data
      
      // Record test result
      testResults.push({
        test: 'ttl_boundary_handling',
        passed: true,
        ttlBoundary: cachedTimestamp + ttlSeconds,
        currentTime: mockNow(),
        wasExpired: !data.cached,
        timestamp: mockNow()
      });
    });
  });

  afterEach(() => {
    // Generate JSON report after all tests
    if (testResults.length > 0) {
      const report = {
        timestamp: new Date().toISOString(),
        testSuite: 'Evidence TTL Invariants',
        totalTests: testResults.length,
        passedTests: testResults.filter(t => t.passed).length,
        failedTests: testResults.filter(t => !t.passed).length,
        results: testResults,
        summary: {
          cacheKeyStability: testResults.some(t => t.test === 'stable_cache_keys') ? 'PASSED' : 'NOT_TESTED',
          ttlBehavior: testResults.some(t => t.test === 'identical_fetchedAt_within_ttl') ? 'PASSED' : 'NOT_TESTED',
          evidencePreservation: testResults.some(t => t.test === 'evidence_fields_preserved') ? 'PASSED' : 'NOT_TESTED',
          boundaryConditions: testResults.some(t => t.test === 'ttl_boundary_handling') ? 'PASSED' : 'NOT_TESTED'
        }
      };

      // Ensure reports directory exists
      const reportsDir = join(process.cwd(), 'reports');
      if (!existsSync(reportsDir)) {
        mkdirSync(reportsDir, { recursive: true });
      }

      // Write report
      const reportPath = join(reportsDir, 'evidence.ttl.json');
      writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`📊 Evidence TTL report saved to: ${reportPath}`);
    }
  });
});
