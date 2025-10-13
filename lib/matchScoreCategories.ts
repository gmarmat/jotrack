export type MatchScoreCategory = 'poor' | 'good' | 'excellent';

export interface MatchScoreCategoryInfo {
  category: MatchScoreCategory;
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
  textColor: string;
  description: string;
  insights: string[];
  recommendations: string[];
}

export function getMatchScoreCategory(score: number): MatchScoreCategoryInfo {
  // Normalize score to 0-100 if it's in 0-1 range
  const normalizedScore = score > 1 ? score : score * 100;
  
  if (normalizedScore <= 50) {
    return {
      category: 'poor',
      label: 'Poor Match',
      emoji: '🔴',
      color: '#ef4444', // red
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      description: 'This role may not align with your current profile.',
      insights: [
        'Missing 60%+ of core requirements',
        'Consider roles better suited to your skills',
        'Use this as learning: what skills to develop?',
      ],
      recommendations: [
        'Browse similar roles with better matches',
        'Identify skill gaps for future growth',
        'Don\'t invest heavy effort here',
      ],
    };
  } else if (normalizedScore <= 75) {
    return {
      category: 'good',
      label: 'Good Match',
      emoji: '🟡',
      color: '#f59e0b', // amber
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      description: 'You\'re a viable candidate with some gaps to bridge.',
      insights: [
        'You meet 50-75% of requirements',
        'Gaps are closeable with focused effort',
        'May need to emphasize relevant experience',
      ],
      recommendations: [
        'Tailor resume to highlight matching skills',
        'Take short courses to fill skill gaps',
        'Coach Mode can help surface hidden matches',
        'Consider applying with strong cover letter',
      ],
    };
  } else {
    return {
      category: 'excellent',
      label: 'Excellent Match',
      emoji: '🟢',
      color: '#10b981', // green
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      description: 'You\'re highly qualified for this role!',
      insights: [
        'You exceed 75%+ of requirements',
        'Strong alignment with role expectations',
        'High chance of progressing to interviews',
      ],
      recommendations: [
        'Apply immediately',
        'Emphasize your standout strengths',
        'Prepare for behavioral interviews',
        'Network with the hiring team',
      ],
    };
  }
}

export function getMatchScoreThresholds() {
  return {
    poor: { min: 0, max: 50 },
    good: { min: 51, max: 75 },
    excellent: { min: 76, max: 100 },
  };
}

