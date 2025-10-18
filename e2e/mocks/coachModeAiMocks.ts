/**
 * Mock AI Responses for Coach Mode E2E Tests
 * 
 * These mocks allow tests to run without real AI API calls:
 * - No token costs
 * - No API rate limits
 * - Instant responses (sub-second)
 * - Predictable, reproducible results
 */

import { Page } from '@playwright/test';

/**
 * Mock AI responses for all Coach Mode endpoints
 */
export const COACH_MODE_MOCKS = {
  generateDiscovery: {
    success: true,
    questions: [
      {
        id: 'q1',
        category: 'Leadership',
        question: 'Tell me about a time when you led a team through a challenging technical project. What was your approach?',
      },
      {
        id: 'q2',
        category: 'Leadership',
        question: 'Describe a situation where you had to mentor or coach junior engineers. What was the outcome?',
      },
      {
        id: 'q3',
        category: 'Leadership',
        question: 'How do you handle conflicts within your team? Give a specific example.',
      },
      {
        id: 'q4',
        category: 'Leadership',
        question: 'What\'s your approach to delegating tasks and ensuring accountability?',
      },
      {
        id: 'q5',
        category: 'Technical',
        question: 'Describe your most complex technical achievement. What made it challenging?',
      },
      {
        id: 'q6',
        category: 'Technical',
        question: 'Tell me about a time you had to make a critical technical decision under pressure.',
      },
      {
        id: 'q7',
        category: 'Technical',
        question: 'How do you stay current with new technologies and industry trends?',
      },
      {
        id: 'q8',
        category: 'Technical',
        question: 'Describe a system architecture you designed. Why did you make those choices?',
      },
      {
        id: 'q9',
        category: 'Projects',
        question: 'Walk me through a project that didn\'t go as planned. How did you recover?',
      },
      {
        id: 'q10',
        category: 'Projects',
        question: 'Tell me about a time you delivered a project ahead of schedule. What contributed to your success?',
      },
      {
        id: 'q11',
        category: 'Projects',
        question: 'Describe a cross-functional project you worked on. How did you collaborate with other teams?',
      },
      {
        id: 'q12',
        category: 'Projects',
        question: 'What\'s the most impactful project you\'ve delivered? How did you measure success?',
      },
      {
        id: 'q13',
        category: 'Achievements',
        question: 'Tell me about a time you significantly improved system performance or efficiency.',
      },
      {
        id: 'q14',
        category: 'Achievements',
        question: 'Describe an innovation or process improvement you introduced. What was the result?',
      },
      {
        id: 'q15',
        category: 'Achievements',
        question: 'What professional accomplishment are you most proud of and why?',
      },
    ],
  },

  analyzeProfile: {
    success: true,
    profile: {
      technicalSkills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS'],
      leadership: ['Team lead experience', 'Mentored 5 junior engineers', 'Cross-functional collaboration'],
      projects: [
        'Led migration to microservices architecture',
        'Built real-time analytics dashboard',
        'Improved API performance by 60%',
      ],
      achievements: [
        'Reduced deployment time from 2 hours to 15 minutes',
        'Increased test coverage from 40% to 85%',
        'Led team of 8 engineers',
      ],
      yearsExperience: 7,
      hiddenStrengths: [
        'Strong problem-solving under pressure',
        'Excellent at breaking down complex problems',
        'Natural mentor and teacher',
      ],
    },
  },

  recalculateScore: {
    success: true,
    matchScore: {
      before: 0.72,
      after: 0.89,
      improvementPercent: 17,
      breakdown: {
        resumeScore: 0.72,
        profileScore: 0.17,
      },
    },
    improvements: [
      'Added 5 hidden technical skills',
      'Quantified 3 major achievements',
      'Highlighted leadership experience',
    ],
  },

  generateResume: {
    success: true,
    resume: `# John Doe
Senior Software Engineer

## Professional Summary
Results-driven Senior Software Engineer with 7+ years of experience leading high-impact projects and mentoring engineering teams. Proven track record of improving system performance, reducing deployment times, and delivering scalable solutions. Expert in React, TypeScript, Node.js, and cloud infrastructure.

## Technical Skills
- **Languages**: TypeScript, JavaScript, Python, SQL
- **Frontend**: React, Next.js, Redux, Tailwind CSS
- **Backend**: Node.js, Express, PostgreSQL, MongoDB
- **Cloud**: AWS (EC2, S3, Lambda), Docker, Kubernetes
- **Tools**: Git, CI/CD, Jest, Playwright, Datadog

## Professional Experience

### Senior Software Engineer | Tech Corp
*Jan 2021 - Present*

- Led migration to microservices architecture, reducing deployment time from 2 hours to 15 minutes (93% improvement)
- Built real-time analytics dashboard serving 50K+ users with sub-second latency
- Improved API performance by 60% through query optimization and caching strategies
- Mentored 5 junior engineers, with 3 promoted to mid-level roles within 18 months
- Increased test coverage from 40% to 85%, reducing production bugs by 70%

### Software Engineer | Startup Inc
*Jun 2018 - Dec 2020*

- Developed core features for B2B SaaS platform with 10K+ active users
- Implemented CI/CD pipeline, reducing release cycle from 2 weeks to 2 days
- Collaborated with product and design teams on user-facing features
- Participated in on-call rotation, maintaining 99.9% uptime

### Junior Software Engineer | Web Agency
*Jun 2017 - May 2018*

- Built responsive web applications using React and Node.js
- Worked with clients to gather requirements and deliver custom solutions
- Contributed to open-source projects and internal tools

## Education
**B.S. Computer Science** | University Name | 2017

## Certifications
- AWS Certified Solutions Architect
- Certified Kubernetes Administrator (CKA)`,
  },

  generateCoverLetter: {
    success: true,
    coverLetter: `Dear Hiring Manager,

I am excited to apply for the Senior Software Engineer position at your company. With over 7 years of experience leading high-impact projects and a proven track record of improving system performance and mentoring engineering teams, I am confident I can make immediate contributions to your team.

In my current role, I've led the migration to a microservices architecture that reduced deployment time by 93%, built real-time analytics systems serving 50K+ users, and improved API performance by 60%. These experiences have honed my ability to balance technical excellence with business impact—a skill I'm eager to bring to your organization.

What particularly excites me about this opportunity is your company's commitment to innovation and technical excellence. I'm impressed by your work in [specific company achievement] and would love to contribute my expertise in scalable architecture, performance optimization, and team leadership to help achieve your mission.

I look forward to discussing how my experience and passion for building robust, user-focused systems can benefit your team.

Best regards,
John Doe`,
  },

  generateQuestions: {
    success: true,
    questions: [
      {
        id: 'r1',
        question: 'Tell me about your experience and background',
        category: 'Background',
        rationale: 'Recruiter screen - understanding overall experience',
        tips: ['Be concise', 'Highlight relevant experience', 'Show enthusiasm'],
      },
      {
        id: 'r2',
        question: 'Why are you interested in this role?',
        category: 'Motivation',
        rationale: 'Understanding cultural fit and motivation',
        tips: ['Research the company', 'Connect to your goals', 'Be authentic'],
      },
      {
        id: 'r3',
        question: 'What are your salary expectations?',
        category: 'Logistics',
        rationale: 'Ensuring alignment on compensation',
        tips: ['Do market research', 'Give a range', 'Be flexible'],
      },
      {
        id: 'r4',
        question: 'When can you start?',
        category: 'Logistics',
        rationale: 'Understanding availability',
        tips: ['Be realistic', 'Show flexibility', 'Give notice period'],
      },
      {
        id: 'r5',
        question: 'Tell me about a challenging project you worked on',
        category: 'Experience',
        rationale: 'Assessing problem-solving skills',
        tips: ['Use STAR format', 'Quantify results', 'Show learning'],
      },
      {
        id: 'r6',
        question: 'How do you handle tight deadlines?',
        category: 'Work Style',
        rationale: 'Understanding work ethic and pressure management',
        tips: ['Give specific example', 'Show prioritization skills', 'Demonstrate calm under pressure'],
      },
      {
        id: 'r7',
        question: 'Describe your ideal work environment',
        category: 'Culture Fit',
        rationale: 'Ensuring alignment with company culture',
        tips: ['Be honest', 'Align with company values', 'Show flexibility'],
      },
      {
        id: 'r8',
        question: 'What are your career goals?',
        category: 'Future Plans',
        rationale: 'Understanding long-term fit',
        tips: ['Show ambition', 'Align with company path', 'Be realistic'],
      },
      {
        id: 'r9',
        question: 'Do you have any questions for me?',
        category: 'Engagement',
        rationale: 'Assessing interest and preparation',
        tips: ['Always have questions', 'Show research', 'Ask about role/team'],
      },
      {
        id: 'r10',
        question: 'Tell me about a time you worked in a team',
        category: 'Collaboration',
        rationale: 'Assessing teamwork skills',
        tips: ['Highlight collaboration', 'Show communication', 'Demonstrate leadership'],
      },
    ],
  },

  markAsApplied: {
    success: true,
    message: 'Job marked as applied',
    appliedAt: Date.now(),
  },
};

/**
 * Setup route mocking for Coach Mode AI endpoints
 */
export async function setupCoachModeApiMocks(page: Page) {
  console.log('🎭 Setting up Coach Mode API mocks...');

  // Mock generate-discovery
  await page.route('**/api/jobs/*/coach/generate-discovery', async (route) => {
    console.log('  ✅ Mocked: generate-discovery');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(COACH_MODE_MOCKS.generateDiscovery),
    });
  });

  // Mock analyze-profile
  await page.route('**/api/jobs/*/coach/analyze-profile', async (route) => {
    console.log('  ✅ Mocked: analyze-profile');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(COACH_MODE_MOCKS.analyzeProfile),
    });
  });

  // Mock recalculate-score
  await page.route('**/api/jobs/*/coach/recalculate-score', async (route) => {
    console.log('  ✅ Mocked: recalculate-score');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(COACH_MODE_MOCKS.recalculateScore),
    });
  });

  // Mock generate-resume
  await page.route('**/api/jobs/*/coach/generate-resume', async (route) => {
    console.log('  ✅ Mocked: generate-resume');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(COACH_MODE_MOCKS.generateResume),
    });
  });

  // Mock optimize-resume
  await page.route('**/api/jobs/*/coach/optimize-resume', async (route) => {
    console.log('  ✅ Mocked: optimize-resume');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(COACH_MODE_MOCKS.generateResume), // Same format
    });
  });

  // Mock generate-cover-letter
  await page.route('**/api/jobs/*/coach/generate-cover-letter', async (route) => {
    console.log('  ✅ Mocked: generate-cover-letter');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(COACH_MODE_MOCKS.generateCoverLetter),
    });
  });

  // Mock generate-questions
  await page.route('**/api/jobs/*/coach/generate-questions', async (route) => {
    console.log('  ✅ Mocked: generate-questions');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(COACH_MODE_MOCKS.generateQuestions),
    });
  });

  // Mock mark-applied
  await page.route('**/api/jobs/*/coach/mark-applied', async (route) => {
    console.log('  ✅ Mocked: mark-applied');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(COACH_MODE_MOCKS.markAsApplied),
    });
  });

  // Mock save (coach state)
  await page.route('**/api/coach/*/save', async (route) => {
    console.log('  ✅ Mocked: save coach state');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  console.log('✅ All Coach Mode API mocks active!');
}

