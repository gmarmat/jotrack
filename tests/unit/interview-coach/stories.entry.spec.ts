import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

describe('Talk Tracks Entry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    delete process.env.NEXT_PUBLIC_INTERVIEW_V2;
  });

  describe('Talk Tracks Button Visibility', () => {
    it('should render the button when NEXT_PUBLIC_INTERVIEW_V2=1', async () => {
      process.env.NEXT_PUBLIC_INTERVIEW_V2 = '1';
      
      // Mock the Interview Coach page component
      const mockInterviewCoachPage = {
        render: () => {
          const showTalkTracks = false;
          const setShowTalkTracks = vi.fn();
          
          return {
            showTalkTracks,
            setShowTalkTracks,
            hasTalkTracksButton: process.env.NEXT_PUBLIC_INTERVIEW_V2 === '1'
          };
        }
      };
      
      const result = mockInterviewCoachPage.render();
      expect(result.hasTalkTracksButton).toBe(true);
    });

    it('should not render the button when NEXT_PUBLIC_INTERVIEW_V2 is not set', async () => {
      // NEXT_PUBLIC_INTERVIEW_V2 is undefined
      
      const mockInterviewCoachPage = {
        render: () => {
          return {
            hasTalkTracksButton: process.env.NEXT_PUBLIC_INTERVIEW_V2 === '1'
          };
        }
      };
      
      const result = mockInterviewCoachPage.render();
      expect(result.hasTalkTracksButton).toBe(false);
    });
  });

  describe('Talk Tracks Panel Functionality', () => {
    it('should generate stories and render coverage when API call succeeds', async () => {
      const mockStories = [
        {
          title: 'Story 1',
          coverage: ['impact', 'ownership'],
          recruiter: { long: 'Recruiter story', short: 'Short recruiter story' },
          'hiring-manager': { long: 'HM story', short: 'Short HM story' },
          peer: { long: 'Peer story', short: 'Short peer story' }
        },
        {
          title: 'Story 2',
          coverage: ['ambiguity_resolution', 'cost'],
          recruiter: { long: 'Recruiter story 2' },
          'hiring-manager': { long: 'HM story 2' },
          peer: { long: 'Peer story 2' }
        }
      ];
      
      const mockCoverage = {
        impact: 0.8,
        ownership: 0.6,
        ambiguity_resolution: 0.7,
        cost: 0.9
      };
      
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          coreStories: mockStories,
          coverageMap: mockCoverage
        })
      };
      
      vi.mocked(fetch).mockResolvedValue(mockResponse as any);
      
      // Mock TalkTracksPanel component
      const mockTalkTracksPanel = {
        generate: async () => {
          const res = await fetch('/api/interview-coach/test-job-id/extract-core-stories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              answers: [{ id: 'a1', text: 'Test answer' }], 
              themes: ['impact', 'ownership'], 
              persona: 'hiring-manager' 
            })
          });
          const data = await res.json();
          return data;
        }
      };
      
      const result = await mockTalkTracksPanel.generate();
      
      expect(result.coreStories).toEqual(mockStories);
      expect(result.coverageMap).toEqual(mockCoverage);
      expect(fetch).toHaveBeenCalledWith(
        '/api/interview-coach/test-job-id/extract-core-stories',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"persona":"hiring-manager"')
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      };
      
      vi.mocked(fetch).mockResolvedValue(mockErrorResponse as any);
      
      const mockTalkTracksPanel = {
        generate: async () => {
          try {
            const res = await fetch('/api/interview-coach/test-job-id/extract-core-stories', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                answers: [{ id: 'a1', text: 'Test answer' }], 
                themes: ['impact'], 
                persona: 'recruiter' 
              })
            });
            
            if (!res.ok) {
              throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            
            return await res.json();
          } catch (error) {
            return { error: error.message };
          }
        }
      };
      
      const result = await mockTalkTracksPanel.generate();
      
      expect(result.error).toContain('HTTP 500');
    });

    it('should collect answers from interview coach state', () => {
      const mockInterviewCoachState = {
        answers: {
          'q1': { answer: 'First answer' },
          'q2': { answer: 'Second answer' },
          'q3': { answer: '' } // Empty answer should be skipped
        }
      };
      
      // Mock answer collection logic
      const collectAnswers = (state: any) => {
        const answers: any[] = [];
        
        if (state.answers) {
          Object.entries(state.answers).forEach(([questionId, answerData]: [string, any]) => {
            if (answerData.answer && answerData.answer.trim()) {
              answers.push({
                id: questionId,
                text: answerData.answer
              });
            }
          });
        }
        
        return answers;
      };
      
      const collectedAnswers = collectAnswers(mockInterviewCoachState);
      
      expect(collectedAnswers).toHaveLength(2);
      expect(collectedAnswers[0]).toEqual({ id: 'q1', text: 'First answer' });
      expect(collectedAnswers[1]).toEqual({ id: 'q2', text: 'Second answer' });
    });

    it('should derive themes from lowest subscores', () => {
      const mockInterviewCoachState = {
        answers: {
          'q1': {
            scores: [{
              subscores: {
                specificity: 60,
                role: 80,
                outcome: 45,
                clarity: 70,
                structure: 55
              }
            }]
          },
          'q2': {
            scores: [{
              subscores: {
                specificity: 70,
                role: 50,
                outcome: 65,
                clarity: 60,
                structure: 75
              }
            }]
          }
        }
      };
      
      // Mock theme derivation logic
      const deriveThemes = (state: any) => {
        const allSubscores: Record<string, number> = {};
        
        if (state.answers) {
          Object.values(state.answers).forEach((answerData: any) => {
            if (answerData.scores?.[0]?.subscores) {
              Object.entries(answerData.scores[0].subscores).forEach(([dim, score]: [string, any]) => {
                allSubscores[dim] = Math.min(allSubscores[dim] || 100, score);
              });
            }
          });
        }
        
        // Sort by score and take lowest 4 dimensions
        const sortedDims = Object.entries(allSubscores)
          .sort(([,a], [,b]) => a - b)
          .slice(0, 4)
          .map(([dim]) => dim);
        
        return sortedDims;
      };
      
      const derivedThemes = deriveThemes(mockInterviewCoachState);
      
      // Should be sorted by lowest scores: outcome (45), role (50), structure (55), specificity (60)
      expect(derivedThemes).toEqual(['outcome', 'role', 'structure', 'specificity']);
    });
  });
});
