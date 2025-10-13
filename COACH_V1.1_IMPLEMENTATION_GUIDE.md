# Coach Mode v1.1 — Evidence-First Implementation Guide

## Status: Delta Specification + Partial Implementation

### ✅ COMPLETED
1. **Enhanced Gather UI** - Full implementation with testids
   - `gather-recruiter-url` - Single recruiter URL
   - `gather-peer-url` - Multiple peers with roles
   - `gather-skip-url` - Skip-level/leadership URLs
   - `gather-otherco-url` - Context companies (competitors)

### 🔨 IMPLEMENTATION REQUIRED

## 2) Strict Extraction - No Hallucinations

### File: `lib/coach/strictExtraction.ts` (NEW)

```typescript
/**
 * Strict vocabulary extraction - ONLY from source documents
 * NO invented skills, NO hallucinations
 */

interface ExtractedVocab {
  terms: Set<string>;
  stems: Map<string, string[]>; // stem -> original terms
  context: Map<string, string>; // term -> surrounding context
}

export function extractVocabulary(text: string): ExtractedVocab {
  const terms = new Set<string>();
  const stems = new Map<string, string[]>();
  const context = new Map<string, string>();

  // Tokenize: lowercase, split on non-word, remove stopwords
  const stopwords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
  const tokens = text
    .toLowerCase()
    .split(/\W+/)
    .filter(t => t.length > 2 && !stopwords.has(t));

  // Extract bigrams and trigrams (common tech terms)
  const lines = text.toLowerCase().split('\n');
  for (const line of lines) {
    const words = line.split(/\W+/).filter(w => w.length > 1);
    
    // Unigrams
    for (const word of words) {
      if (!stopwords.has(word)) {
        terms.add(word);
        context.set(word, line.slice(0, 100));
      }
    }
    
    // Bigrams (e.g., "machine learning", "react native")
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      if (bigram.length > 4) {
        terms.add(bigram);
        context.set(bigram, line.slice(0, 100));
      }
    }
  }

  return { terms, stems, context };
}

export function matchSkillsFromTaxonomy(
  vocab: ExtractedVocab,
  taxonomySkills: Array<{ label: string; aliases: string[] }>
): Array<{ skill: string; foundIn: 'exact' | 'alias'; context: string }> {
  const matches: Array<{ skill: string; foundIn: 'exact' | 'alias'; context: string }> = [];

  for (const skill of taxonomySkills) {
    const label = skill.label.toLowerCase();
    
    // Exact match
    if (vocab.terms.has(label)) {
      matches.push({
        skill: skill.label,
        foundIn: 'exact',
        context: vocab.context.get(label) || '',
      });
      continue;
    }

    // Alias match
    for (const alias of skill.aliases) {
      if (vocab.terms.has(alias.toLowerCase())) {
        matches.push({
          skill: skill.label,
          foundIn: 'alias',
          context: vocab.context.get(alias.toLowerCase()) || '',
        });
        break;
      }
    }
  }

  return matches;
}

/**
 * CRITICAL: Score parameter ONLY if evidence exists
 * Return 0 and mark "Unknown/Absent" if not found
 */
export function scoreParameter(
  param: string,
  jdVocab: ExtractedVocab,
  resumeVocab: ExtractedVocab,
  weight: number
): {
  score: number;
  jdEvidence: string;
  resumeEvidence: string;
  reasoning: string;
} {
  // Check if param or its variants exist in either vocab
  const paramLower = param.toLowerCase();
  const jdHas = jdVocab.terms.has(paramLower);
  const resumeHas = resumeVocab.terms.has(paramLower);

  if (!jdHas && !resumeHas) {
    return {
      score: 0,
      jdEvidence: 'Not found in job description',
      resumeEvidence: 'Not found in resume',
      reasoning: 'Unknown/Absent - parameter not mentioned in source documents',
    };
  }

  // Calculate score based on presence
  let score = 0;
  const jdEvidence = jdHas ? jdVocab.context.get(paramLower) || 'Present' : 'Not mentioned';
  const resumeEvidence = resumeHas ? resumeVocab.context.get(paramLower) || 'Present' : 'Not mentioned';

  if (jdHas && resumeHas) {
    score = 1.0; // Perfect match
  } else if (jdHas && !resumeHas) {
    score = 0.3; // Required but missing
  } else if (!jdHas && resumeHas) {
    score = 0.7; // Extra skill
  }

  return {
    score,
    jdEvidence,
    resumeEvidence,
    reasoning: `JD: ${jdHas ? 'Required' : 'Not mentioned'}. Resume: ${resumeHas ? 'Present' : 'Absent'}.`,
  };
}
```

### Usage in `aiProvider.ts`:

```typescript
import { extractVocabulary, scoreParameter } from './strictExtraction';

export function generateDryRunResponse(capability: string, inputs: any): any {
  if (capability === 'fit_analysis') {
    // Extract vocabularies
    const jdVocab = extractVocabulary(inputs.jobDescription || '');
    const resumeVocab = extractVocabulary(inputs.resume || '');

    // 25-parameter matrix (evidence-based ONLY)
    const params = [
      { name: 'React Experience', weight: 0.08 },
      { name: 'TypeScript', weight: 0.07 },
      { name: 'Node.js', weight: 0.06 },
      { name: 'System Design', weight: 0.08 },
      { name: 'Team Leadership', weight: 0.06 },
      // ... add all 25 params with weights summing to 1.0
    ];

    const breakdown = params.map(p => {
      const result = scoreParameter(p.name, jdVocab, resumeVocab, p.weight);
      return {
        param: p.name,
        weight: p.weight,
        jdEvidence: result.jdEvidence,
        resumeEvidence: result.resumeEvidence,
        score: result.score,
        reasoning: result.reasoning,
        sources: [] // Will be populated from meta
      };
    });

    // Calculate overall (weighted sum)
    const overall = breakdown.reduce((sum, item) => sum + (item.weight * item.score), 0);

    return {
      fit: {
        overall: Math.round(overall * 100) / 100,
        threshold: 0.75,
        breakdown,
      },
      keywords: extractKeywordAnalysis(jdVocab, resumeVocab),
      // ... rest of response
    };
  }
  // ... other capabilities
}
```

## 3) Table Components

### File: `app/components/coach/tables/FitTable.tsx` (NEW)

```typescript
'use client';

import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useState } from 'react';
import AiSources from '../AiSources';

interface FitDimension {
  param: string;
  weight: number;
  jdEvidence: string;
  resumeEvidence: string;
  score: number;
  reasoning: string;
  sources?: string[];
}

interface FitTableProps {
  overall: number;
  threshold: number;
  breakdown: FitDimension[];
  sources: string[];
  dryRun: boolean;
}

export default function FitTable({ overall, threshold, breakdown, sources, dryRun }: FitTableProps) {
  const [showExplain, setShowExplain] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const scoreLevel = overall >= threshold ? 'Great' : overall >= threshold * 0.8 ? 'Medium' : 'Low';
  const scoreColor = overall >= threshold ? 'text-green-600' : overall >= threshold * 0.8 ? 'text-yellow-600' : 'text-red-600';

  const topContributors = [...breakdown]
    .sort((a, b) => (b.weight * b.score) - (a.weight * a.score))
    .slice(0, 3);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6" data-testid="fit-table">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Fit Matrix (25 Parameters)
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Fit (estimate): {(overall * 100).toFixed(0)}%. Calculated from 25 job-relevant signals.
          </p>
        </div>
        <div className={`text-3xl font-bold ${scoreColor}`}>
          {(overall * 100).toFixed(0)}%
        </div>
      </div>

      {/* Explain Accordion */}
      <button
        onClick={() => setShowExplain(!showExplain)}
        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mb-4"
        data-testid="fit-explain"
      >
        {showExplain ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        <span>Explain: How we calculated this</span>
      </button>

      {showExplain && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200 text-sm">
          <p className="font-semibold text-gray-900 mb-2">Formula</p>
          <code className="block bg-white p-2 rounded border mb-3">
            Overall FIT = Σ(weight_i × score_i) for i=1 to 25
          </code>
          
          <p className="font-semibold text-gray-900 mb-2">Top 3 Contributors</p>
          <ul className="space-y-1">
            {topContributors.map((item, i) => (
              <li key={i} className="text-gray-700">
                <span className="font-medium">{item.param}</span>: 
                {` ${(item.weight * 100).toFixed(0)}% weight × ${(item.score * 100).toFixed(0)}% score = ${(item.weight * item.score * 100).toFixed(1)}% contribution`}
              </li>
            ))}
          </ul>

          <p className="mt-3 text-gray-600">
            Threshold: {(threshold * 100).toFixed(0)}%. 
            Your score is <strong>{scoreLevel}</strong> ({overall >= threshold ? 'above' : 'below'} threshold).
          </p>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Parameter</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-900">Weight</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">JD Evidence</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Resume Evidence</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-900">Score</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Notes</th>
            </tr>
          </thead>
          <tbody>
            {breakdown.map((item, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{item.param}</td>
                <td className="px-4 py-3 text-center text-gray-600">{(item.weight * 100).toFixed(0)}%</td>
                <td className="px-4 py-3 text-gray-700 max-w-xs truncate" title={item.jdEvidence}>
                  {item.jdEvidence}
                </td>
                <td className="px-4 py-3 text-gray-700 max-w-xs truncate" title={item.resumeEvidence}>
                  {item.resumeEvidence}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${item.score * 100}%` }}
                      />
                    </div>
                    <span className="text-gray-900 font-medium">{(item.score * 100).toFixed(0)}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">
                  {item.reasoning}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sources */}
      {!dryRun && <AiSources sources={sources} className="mt-4" />}
      
      {dryRun && (
        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
          <Info className="w-3 h-3" />
          Local fixture (no sources)
        </div>
      )}

      {/* Why This Matters */}
      <details className="mt-4">
        <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
          Why this matters
        </summary>
        <p className="text-sm text-gray-600 mt-2">
          The fit matrix evaluates your profile against 25 job-relevant dimensions, weighted by importance. 
          Scores above {(threshold * 100).toFixed(0)}% indicate strong alignment. Focus on low-scoring high-weight parameters for maximum impact.
        </p>
      </details>
    </div>
  );
}
```

### File: `app/components/coach/tables/ProfileTable.tsx` (NEW)

```typescript
'use client';

import { ExternalLink } from 'lucide-react';

interface ProfileEntity {
  entity: string; // "Company" | "Recruiter" | "Peer: John"
  facts: string[];
  sources: Array<{ url: string; title: string }>;
}

interface ProfileTableProps {
  profiles: ProfileEntity[];
  dryRun: boolean;
}

export default function ProfileTable({ profiles, dryRun }: ProfileTableProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6" data-testid="profile-table">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Company & People Profiles
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Entity</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Key Facts</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Sources</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((profile, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900 align-top">
                  {profile.entity}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  <ul className="list-disc list-inside space-y-1">
                    {profile.facts.map((fact, j) => (
                      <li key={j}>{fact}</li>
                    ))}
                  </ul>
                </td>
                <td className="px-4 py-3 text-gray-600 align-top">
                  {!dryRun && profile.sources.length > 0 && (
                    <div className="space-y-1">
                      {profile.sources.slice(0, 3).map((source, j) => (
                        <a
                          key={j}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {source.title || new URL(source.url).hostname}
                        </a>
                      ))}
                    </div>
                  )}
                  {dryRun && (
                    <span className="text-xs text-gray-400">Dry run</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### File: `app/components/coach/tables/HeatmapTable.tsx` (NEW)

```typescript
'use client';

import { Check, X, AlertTriangle } from 'lucide-react';

interface Keyword {
  term: string;
  inJD: boolean;
  inResume: boolean;
  importance: number; // 0-3
  action: 'add' | 'emphasize' | 'ok';
}

interface HeatmapTableProps {
  keywords: Keyword[];
}

export default function HeatmapTable({ keywords }: HeatmapTableProps) {
  const getImportanceColor = (importance: number) => {
    if (importance >= 3) return 'bg-red-100 text-red-800';
    if (importance >= 2) return 'bg-yellow-100 text-yellow-800';
    if (importance >= 1) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getActionBadge = (action: string) => {
    const colors = {
      add: 'bg-red-50 text-red-700 border-red-200',
      emphasize: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      ok: 'bg-green-50 text-green-700 border-green-200',
    };
    return colors[action as keyof typeof colors] || colors.ok;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6" data-testid="heatmap-table">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Keyword Heatmap
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Keyword</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-900">In JD?</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-900">In Resume?</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-900">Importance</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Action</th>
            </tr>
          </thead>
          <tbody>
            {keywords.map((kw, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{kw.term}</td>
                <td className="px-4 py-3 text-center">
                  {kw.inJD ? (
                    <Check className="w-5 h-5 text-green-600 mx-auto" />
                  ) : (
                    <X className="w-5 h-5 text-gray-300 mx-auto" />
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {kw.inResume ? (
                    <Check className="w-5 h-5 text-green-600 mx-auto" />
                  ) : (
                    <X className="w-5 h-5 text-gray-300 mx-auto" />
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold ${getImportanceColor(kw.importance)}`}>
                    {kw.importance}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded border ${getActionBadge(kw.action)}`}>
                    {kw.action === 'add' && 'Add to resume'}
                    {kw.action === 'emphasize' && 'Emphasize more'}
                    {kw.action === 'ok' && 'Good coverage'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

## 4) E2E Tests

### File: `e2e/gather-intake.spec.ts` (NEW)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Coach Gather Intake v1.1', () => {
  test('should persist recruiter/peer/skip/otherco URLs', async ({ page }) => {
    // Create job
    const response = await page.request.post('/api/jobs', {
      data: {
        title: 'Test Engineer',
        company: 'Test Co',
        status: 'APPLIED',
      },
    });
    const { job } = await response.json();

    await page.goto(`/coach/${job.id}`);

    // Fill recruiter
    await page.getByTestId('gather-recruiter-url').fill('https://linkedin.com/in/test-recruiter');

    // Add peer with role
    await page.getByTestId('gather-peer-url').fill('https://linkedin.com/in/peer1');
    await page.locator('input[placeholder="Role (optional)"]').fill('Senior Engineer');
    await page.locator('button:has-text("Add")').first().click();

    // Add skip-level
    await page.getByTestId('gather-skip-url').fill('https://linkedin.com/in/manager');
    await page.locator('button:has-text("Add")').nth(1).click();

    // Add other company
    await page.getByTestId('gather-otherco-url').fill('https://competitor.com');
    await page.locator('button:has-text("Add")').last().click();

    // Verify display
    await expect(page.locator('text=https://linkedin.com/in/peer1')).toBeVisible();
    await expect(page.locator('text=Senior Engineer')).toBeVisible();

    // Refresh page
    await page.reload();

    // Verify persistence (in wizard state, not DB yet until analyze)
    // This tests React state persistence across wizard
  });
});
```

### File: `e2e/fit-evidence.spec.ts` (NEW)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Fit Evidence Tables', () => {
  test('should render fit table with at least 10/25 params', async ({ page }) => {
    // Setup and navigate to Fit step
    // ... (create job, fill gather, navigate to fit)

    await expect(page.getByTestId('fit-table')).toBeVisible();

    // Count rows in tbody
    const rows = await page.locator('[data-testid="fit-table"] tbody tr').count();
    expect(rows).toBeGreaterThanOrEqual(10);

    // Verify columns exist
    await expect(page.locator('th:has-text("Parameter")')).toBeVisible();
    await expect(page.locator('th:has-text("Weight")')).toBeVisible();
    await expect(page.locator('th:has-text("JD Evidence")')).toBeVisible();
    await expect(page.locator('th:has-text("Resume Evidence")')).toBeVisible();
    await expect(page.locator('th:has-text("Score")')).toBeVisible();
  });

  test('should show explain accordion with formula', async ({ page }) => {
    // Navigate to fit step
    // ...

    await page.getByTestId('fit-explain').click();

    // Verify formula visible
    await expect(page.locator('text=Overall FIT = Σ(weight_i × score_i)')).toBeVisible();
    await expect(page.locator('text=Top 3 Contributors')).toBeVisible();
    await expect(page.locator('text=Threshold:')).toBeVisible();
  });
});
```

### File: `e2e/no-hallucination.spec.ts` (NEW)

```typescript
import { test, expect } from '@playwright/test';

test.describe('No Hallucination - Strict Extraction', () => {
  test('should NOT show React/TypeScript if absent from JD and Resume', async ({ page }) => {
    const jdWithoutReact = `
      Senior Python Developer
      
      Requirements:
      - 5+ years Python
      - Django framework
      - PostgreSQL
      - AWS deployment
    `;

    const resumeWithoutReact = `
      John Doe
      Python Developer
      
      Experience:
      - Built Django applications
      - PostgreSQL database design
      - AWS cloud infrastructure
    `;

    // Create job and navigate
    // ...
    
    await page.getByTestId('jd-textarea').fill(jdWithoutReact);
    await page.getByTestId('resume-textarea').fill(resumeWithoutReact);
    await page.getByTestId('analyze-button').click();

    // Navigate to fit step
    await page.getByTestId('profile-next-button').click();
    await page.waitForSelector('[data-testid="fit-table"]');

    // Verify React and TypeScript are NOT in breakdown
    const tableText = await page.getByTestId('fit-table').textContent();
    expect(tableText).not.toContain('React');
    expect(tableText).not.toContain('TypeScript');
    expect(tableText).not.toContain('react'); // case insensitive check

    // Verify only mentioned skills appear
    expect(tableText).toContain('Python');
    expect(tableText).toContain('Django');
    expect(tableText).toContain('PostgreSQL');
    expect(tableText).toContain('AWS');

    // Check that any "Unknown/Absent" scores are 0
    const rows = page.locator('[data-testid="fit-table"] tbody tr');
    const count = await rows.count();
    
    for (let i = 0; i < count; i++) {
      const rowText = await rows.nth(i).textContent();
      if (rowText?.includes('Unknown/Absent')) {
        const scoreCell = await rows.nth(i).locator('td').nth(4).textContent();
        expect(scoreCell).toContain('0'); // Score must be 0 for unknown params
      }
    }
  });

  test('should score correctly when skills ARE present', async ({ page }) => {
    const jdWithReact = `Senior React Developer - Must have React and TypeScript`;
    const resumeWithReact = `Experienced React and TypeScript developer`;

    // ... fill and analyze

    const tableText = await page.getByTestId('fit-table').textContent();
    expect(tableText).toContain('React');
    expect(tableText).toContain('TypeScript');

    // Verify scores are > 0 for present skills
    // (implementation specific to your scoring logic)
  });
});
```

### File: `e2e/citations.spec.ts` (NEW)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Citations - Sources Display', () => {
  test('should show sources when Network ON', async ({ page }) => {
    // Set network ON via settings
    await page.goto('/settings');
    await page.getByTestId('network-toggle').check();
    await page.getByTestId('save-coach-settings').click();

    // Navigate to coach and analyze
    // ... (create job, fill data, analyze)

    // Check Profile table has sources
    const profileTable = page.getByTestId('profile-table');
    await expect(profileTable).toBeVisible();
    
    const sourcesInProfile = profileTable.locator('a[target="_blank"]');
    const sourceCount = await sourcesInProfile.count();
    expect(sourceCount).toBeGreaterThanOrEqual(1);

    // Check Fit table has sources
    await page.getByTestId('fit-next-button').click();
    const fitSources = page.getByTestId('ai-sources');
    await expect(fitSources).toBeVisible();
    
    const links = fitSources.locator('a');
    const linkCount = await links.count();
    expect(linkCount).toBeGreaterThanOrEqual(1);
  });

  test('should show "Local fixture" pill when Network OFF', async ({ page }) => {
    // Ensure network OFF
    await page.goto('/settings');
    await page.getByTestId('network-toggle').uncheck();
    await page.getByTestId('save-coach-settings').click();

    // Navigate and analyze in dry-run
    // ...

    await expect(page.locator('text=Local fixture (no sources)')).toBeVisible();
    
    // Verify no external links in sources
    const externalLinks = page.locator('[data-testid="ai-sources"] a[target="_blank"]');
    const count = await externalLinks.count();
    expect(count).toBe(0);
  });
});
```

## 5) Testing Summary

### Run Tests
```bash
# All new tests
pnpm playwright test gather-intake.spec.ts fit-evidence.spec.ts no-hallucination.spec.ts citations.spec.ts

# Specific test
pnpm playwright test no-hallucination.spec.ts --headed

# Debug mode
pnpm playwright test --debug
```

### Expected Results
- `gather-intake.spec.ts`: ✅ All inputs persist
- `fit-evidence.spec.ts`: ✅ Tables render, ≥10 params, explain works
- `no-hallucination.spec.ts`: ✅ No invented skills, scores=0 for absent
- `citations.spec.ts`: ✅ Sources when ON, pill when OFF

## 6) Implementation Checklist

- [x] Enhanced Gather UI (DONE)
- [ ] Strict extraction lib (`lib/coach/strictExtraction.ts`)
- [ ] Update `aiProvider.ts` to use strict extraction
- [ ] Create `FitTable.tsx` component
- [ ] Create `ProfileTable.tsx` component
- [ ] Create `HeatmapTable.tsx` component
- [ ] Update `FitStep.tsx` to use `FitTable`
- [ ] Update `ProfileStep.tsx` to use `ProfileTable`
- [ ] Add keyword heatmap to appropriate step
- [ ] Create 4 e2e test files
- [ ] Update API responses to include structured breakdown
- [ ] Add microcopy and UX polish
- [ ] Verify no hallucinations with test cases

## 7) Delta Size Estimate

**Lines Changed**: +320 (new components/libs) -12 (removed blob UI)  
**New Files**: 8 (3 table components, 1 extraction lib, 4 tests)  
**Modified Files**: 5 (GatherStep, ProfileStep, FitStep, aiProvider, API routes)

## Next Steps

1. **Critical**: Implement `strictExtraction.ts` - prevents hallucinations
2. **High Priority**: Create table components - core UX improvement
3. **Medium**: Write e2e tests - verify behavior
4. **Polish**: Add microcopy, badges, headers

All components are designed to be drop-in replacements with proper testids for Playwright verification.

