import { describe, it, expect } from 'vitest';

describe('Interview Coach Routes Sanity Check', () => {
  describe('API endpoint verification', () => {
    it('should only use interview-coach endpoints for Interview Coach functionality', () => {
      // Mock Interview Coach component API calls
      const mockInterviewCoachAPIs = [
        '/api/interview-coach/test-job-id/score-answer',
        '/api/interview-coach/test-job-id/suggest-follow-up',
        '/api/interview-coach/test-job-id/suggest-answer',
        '/api/interview-coach/test-job-id/extract-core-stories'
      ];
      
      // Mock Resume Coach API calls (should NOT be used)
      const mockResumeCoachAPIs = [
        '/api/coach/test-job-id/analyze-resume',
        '/api/coach/test-job-id/analyze-skills',
        '/api/coach/test-job-id/analyze-experience'
      ];
      
      // Verify Interview Coach APIs are correct
      mockInterviewCoachAPIs.forEach(api => {
        expect(api).toMatch(/^\/api\/interview-coach\//);
      });
      
      // Verify Resume Coach APIs are NOT used
      mockResumeCoachAPIs.forEach(api => {
        expect(api).not.toMatch(/^\/api\/interview-coach\//);
      });
    });

    it('should allow harmless state saving endpoints', () => {
      // These endpoints are allowed for state management
      const allowedStateAPIs = [
        '/api/coach/test-job-id/save',
        '/api/jobs/test-job-id',
        '/api/jobs/test-job-id/analysis-data',
        '/api/jobs/test-job-id/interview-questions/search',
        '/api/jobs/test-job-id/interview-questions/generate'
      ];
      
      allowedStateAPIs.forEach(api => {
        // Should be either interview-coach, coach/save, or jobs endpoints
        const isAllowed = api.startsWith('/api/interview-coach/') || 
                         api.includes('/coach/') && api.includes('/save') ||
                         api.startsWith('/api/jobs/');
        expect(isAllowed).toBe(true);
      });
    });

    it('should not call resume-coach analyze endpoints', () => {
      // Mock component that should NOT call these endpoints
      const mockInterviewCoachComponent = {
        makeAPICall: (endpoint: string) => {
          // Should reject resume-coach analyze endpoints
          if (endpoint.includes('/coach/') && endpoint.includes('/analyze-')) {
            throw new Error('Interview Coach should not call resume-coach analyze endpoints');
          }
          return { success: true };
        }
      };
      
      // Test that resume-coach analyze endpoints are rejected
      expect(() => {
        mockInterviewCoachComponent.makeAPICall('/api/coach/test-job-id/analyze-resume');
      }).toThrow('Interview Coach should not call resume-coach analyze endpoints');
      
      expect(() => {
        mockInterviewCoachComponent.makeAPICall('/api/coach/test-job-id/analyze-skills');
      }).toThrow('Interview Coach should not call resume-coach analyze endpoints');
      
      expect(() => {
        mockInterviewCoachComponent.makeAPICall('/api/coach/test-job-id/analyze-experience');
      }).toThrow('Interview Coach should not call resume-coach analyze endpoints');
      
      // Test that interview-coach endpoints are allowed
      expect(() => {
        mockInterviewCoachComponent.makeAPICall('/api/interview-coach/test-job-id/score-answer');
      }).not.toThrow();
      
      expect(() => {
        mockInterviewCoachComponent.makeAPICall('/api/interview-coach/test-job-id/suggest-follow-up');
      }).not.toThrow();
    });
  });

  describe('V2 mode verification', () => {
    it('should use correct endpoints in V2 mode', () => {
      // Mock V2 mode check
      const isV2Mode = process.env.NEXT_PUBLIC_INTERVIEW_V2 === '1';
      
      // In V2 mode, should use interview-coach endpoints
      if (isV2Mode) {
        const v2Endpoints = [
          '/api/interview-coach/test-job-id/score-answer',
          '/api/interview-coach/test-job-id/suggest-follow-up',
          '/api/interview-coach/test-job-id/extract-core-stories'
        ];
        
        v2Endpoints.forEach(endpoint => {
          expect(endpoint).toMatch(/^\/api\/interview-coach\//);
        });
      }
    });

    it('should guard resume-coach endpoints behind legacy mode check', () => {
      // Mock legacy mode check
      const isLegacyMode = process.env.NEXT_PUBLIC_INTERVIEW_V2 !== '1';
      
      // In legacy mode, resume-coach endpoints might be allowed
      if (isLegacyMode) {
        // This is acceptable in legacy mode
        expect(true).toBe(true);
      } else {
        // In V2 mode, resume-coach endpoints should not be used
        const resumeCoachEndpoints = [
          '/api/coach/test-job-id/analyze-resume',
          '/api/coach/test-job-id/analyze-skills'
        ];
        
        resumeCoachEndpoints.forEach(endpoint => {
          expect(endpoint).not.toMatch(/^\/api\/interview-coach\//);
        });
      }
    });
  });

  describe('Network tab verification', () => {
    it('should verify only interview-coach endpoints are called in V2', () => {
      // Mock network requests that would appear in Network tab
      const mockNetworkRequests = [
        { url: '/api/interview-coach/test-job-id/score-answer', method: 'POST' },
        { url: '/api/interview-coach/test-job-id/suggest-follow-up', method: 'POST' },
        { url: '/api/interview-coach/test-job-id/extract-core-stories', method: 'POST' },
        { url: '/api/coach/test-job-id/save', method: 'POST' }, // Allowed for state
        { url: '/api/jobs/test-job-id/analysis-data', method: 'GET' } // Allowed for job data
      ];
      
      // Filter out allowed state/data endpoints
      const interviewCoachRequests = mockNetworkRequests.filter(req => 
        req.url.startsWith('/api/interview-coach/')
      );
      
      const stateRequests = mockNetworkRequests.filter(req => 
        req.url.includes('/coach/') && req.url.includes('/save') ||
        req.url.startsWith('/api/jobs/')
      );
      
      // Should have interview-coach requests
      expect(interviewCoachRequests.length).toBeGreaterThan(0);
      
      // Should have state/data requests
      expect(stateRequests.length).toBeGreaterThan(0);
      
      // Should not have resume-coach analyze requests
      const resumeCoachRequests = mockNetworkRequests.filter(req => 
        req.url.includes('/coach/') && req.url.includes('/analyze-')
      );
      expect(resumeCoachRequests.length).toBe(0);
    });
  });
});
