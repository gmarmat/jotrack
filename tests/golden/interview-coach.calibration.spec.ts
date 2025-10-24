import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { scoreAnswer, ScoringContext } from '@/src/interview-coach/scoring/rules';
import { PersonaType, DimensionType } from '@/src/interview-coach/scoring/schema';

// ============================================================================
// GOLDEN SET CONFIGURATION
// ============================================================================

interface GoldenFixture {
  id: string;
  name: string;
  persona: PersonaType;
  theme: string;
  answer: string;
  expectedScores: {
    overall: number;
    subscores: Record<DimensionType, number>;
  };
  tolerance: {
    overall: number;
    subscores: number;
  };
  metadata: {
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    created: string;
    version: string;
  };
}

interface GoldenTestResult {
  fixtureId: string;
  passed: boolean;
  actualScores: {
    overall: number;
    subscores: Record<DimensionType, number>;
  };
  expectedScores: {
    overall: number;
    subscores: Record<DimensionType, number>;
  };
  errors: {
    overall: number;
    subscores: Record<DimensionType, number>;
  };
  withinTolerance: {
    overall: boolean;
    subscores: Record<DimensionType, boolean>;
  };
}

interface GoldenReport {
  timestamp: string;
  version: string;
  totalFixtures: number;
  passedFixtures: number;
  failedFixtures: number;
  mae: {
    overall: number;
    subscores: Record<DimensionType, number>;
  };
  results: GoldenTestResult[];
  summary: {
    overallMAE: number;
    worstDimension: DimensionType;
    bestDimension: DimensionType;
    personaBreakdown: Record<PersonaType, { passed: number; failed: number; mae: number }>;
  };
}

// ============================================================================
// GOLDEN SET LOADING
// ============================================================================

function loadGoldenFixtures(): GoldenFixture[] {
  const fixturesDir = join(__dirname, 'fixtures');
  const fixtures: GoldenFixture[] = [];
  
  // Load all fixture files
  const fixtureFiles = [
    'recruiter-technical.json',
    'recruiter-leadership.json',
    'recruiter-behavioral.json',
    'hiring-manager-technical.json',
    'hiring-manager-leadership.json',
    'hiring-manager-behavioral.json',
    'peer-technical.json',
    'peer-leadership.json',
    'peer-behavioral.json'
  ];
  
  for (const file of fixtureFiles) {
    const filePath = join(fixturesDir, file);
    if (existsSync(filePath)) {
      try {
        const content = readFileSync(filePath, 'utf-8');
        const fileFixtures = JSON.parse(content) as GoldenFixture[];
        fixtures.push(...fileFixtures);
      } catch (error) {
        console.warn(`⚠️ Failed to load fixture file ${file}:`, error);
      }
    }
  }
  
  return fixtures;
}

// ============================================================================
// SCORING VALIDATION
// ============================================================================

function chalculateErrors(actual: number, expected: number): number {
  return Math.abs(actual - expected);
}

function isWithinTolerance(actual: number, expected: number, tolerance: number): boolean {
  return Math.abs(actual - expected) <= tolerance;
}

function calculateMAE(errors: number[]): number {
  if (errors.length === 0) return 0;
  return errors.reduce((sum, error) => sum + error, 0) / errors.length;
}

function runGoldenTest(fixture: GoldenFixture): GoldenTestResult {
  // Build scoring context
  const context: ScoringContext = {
    answer: fixture.answer,
    persona: fixture.persona,
    jdCore: 'Sample job description requirements',
    companyValues: ['Innovation', 'Collaboration', 'Excellence'],
    userProfile: {
      level: 'senior',
      tenure: '5+ years',
      goals: 'Leadership role'
    },
    matchMatrix: {
      communityTopics: ['tech', 'leadership'],
      skills: ['javascript', 'react', 'nodejs']
    }
  };
  
  // Score the answer
  const scoringResult = scoreAnswer(context);
  
  // Calculate errors
  const overallError = chalculateErrors(scoringResult.overall, fixture.expectedScores.overall);
  const subscoreErrors: Record<DimensionType, number> = {} as Record<DimensionType, number>;
  
  for (const dimension of Object.keys(fixture.expectedScores.subscores) as DimensionType[]) {
    const actual = scoringResult.subscores[dimension] || 0;
    const expected = fixture.expectedScores.subscores[dimension];
    subscoreErrors[dimension] = chalculateErrors(actual, expected);
  }
  
  // Check tolerance
  const overallWithinTolerance = isWithinTolerance(
    scoringResult.overall, 
    fixture.expectedScores.overall, 
    fixture.tolerance.overall
  );
  
  const subscoreWithinTolerance: Record<DimensionType, boolean> = {} as Record<DimensionType, boolean>;
  for (const dimension of Object.keys(fixture.expectedScores.subscores) as DimensionType[]) {
    subscoreWithinTolerance[dimension] = isWithinTolerance(
      scoringResult.subscores[dimension] || 0,
      fixture.expectedScores.subscores[dimension],
      fixture.tolerance.subscores
    );
  }
  
  const passed = overallWithinTolerance && Object.values(subscoreWithinTolerance).every(Boolean);
  
  return {
    fixtureId: fixture.id,
    passed,
    actualScores: {
      overall: scoringResult.overall,
      subscores: scoringResult.subscores
    },
    expectedScores: fixture.expectedScores,
    errors: {
      overall: overallError,
      subscores: subscoreErrors
    },
    withinTolerance: {
      overall: overallWithinTolerance,
      subscores: subscoreWithinTolerance
    }
  };
}

// ============================================================================
// REPORTING
// ============================================================================

function generateGoldenReport(results: GoldenTestResult[], fixtures: GoldenFixture[]): GoldenReport {
  const totalFixtures = fixtures.length;
  const passedFixtures = results.filter(r => r.passed).length;
  const failedFixtures = totalFixtures - passedFixtures;
  
  // Calculate MAE
  const overallErrors = results.map(r => r.errors.overall);
  const overallMAE = calculateMAE(overallErrors);
  
  const subscoreMAE: Record<DimensionType, number> = {} as Record<DimensionType, number>;
  const dimensions: DimensionType[] = ['structure', 'specificity', 'outcome', 'role', 'company', 'persona', 'risks'];
  
  for (const dimension of dimensions) {
    const errors = results.map(r => r.errors.subscores[dimension] || 0);
    subscoreMAE[dimension] = calculateMAE(errors);
  }
  
  // Find worst and best dimensions
  const dimensionMAEs = Object.entries(subscoreMAE);
  const worstDimension = dimensionMAEs.reduce((worst, current) => 
    current[1] > worst[1] ? current : worst
  )[0] as DimensionType;
  
  const bestDimension = dimensionMAEs.reduce((best, current) => 
    current[1] < best[1] ? current : best
  )[0] as DimensionType;
  
  // Persona breakdown
  const personaBreakdown: Record<PersonaType, { passed: number; failed: number; mae: number }> = {
    recruiter: { passed: 0, failed: 0, mae: 0 },
    'hiring-manager': { passed: 0, failed: 0, mae: 0 },
    peer: { passed: 0, failed: 0, mae: 0 }
  };
  
  for (const persona of ['recruiter', 'hiring-manager', 'peer'] as PersonaType[]) {
    const personaResults = results.filter(r => {
      const fixture = fixtures.find(f => f.id === r.fixtureId);
      return fixture?.persona === persona;
    });
    
    personaBreakdown[persona].passed = personaResults.filter(r => r.passed).length;
    personaBreakdown[persona].failed = personaResults.length - personaBreakdown[persona].passed;
    personaBreakdown[persona].mae = calculateMAE(personaResults.map(r => r.errors.overall));
  }
  
  return {
    timestamp: new Date().toISOString(),
    version: '2.0',
    totalFixtures,
    passedFixtures,
    failedFixtures,
    mae: {
      overall: overallMAE,
      subscores: subscoreMAE
    },
    results,
    summary: {
      overallMAE,
      worstDimension,
      bestDimension,
      personaBreakdown
    }
  };
}

function saveGoldenReport(report: GoldenReport): void {
  const reportsDir = join(process.cwd(), 'reports');
  if (!existsSync(reportsDir)) {
    require('fs').mkdirSync(reportsDir, { recursive: true });
  }
  
  const reportPath = join(reportsDir, 'golden.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📊 Golden report saved to: ${reportPath}`);
}

function printMAETable(report: GoldenReport): void {
  console.log('\n📊 GOLDEN SET CALIBRATION RESULTS');
  console.log('=====================================');
  console.log(`Total Fixtures: ${report.totalFixtures}`);
  console.log(`Passed: ${report.passedFixtures} (${Math.round((report.passedFixtures / report.totalFixtures) * 100)}%)`);
  console.log(`Failed: ${report.failedFixtures} (${Math.round((report.failedFixtures / report.totalFixtures) * 100)}%)`);
  console.log(`Overall MAE: ${report.mae.overall.toFixed(2)}`);
  console.log('');
  
  console.log('📈 DIMENSION MAE BREAKDOWN:');
  console.log('---------------------------');
  for (const [dimension, mae] of Object.entries(report.mae.subscores)) {
    const status = mae <= 3 ? '✅' : '❌';
    console.log(`${status} ${dimension.padEnd(12)}: ${mae.toFixed(2)}`);
  }
  console.log('');
  
  console.log('👥 PERSONA BREAKDOWN:');
  console.log('---------------------');
  for (const [persona, stats] of Object.entries(report.summary.personaBreakdown)) {
    const passRate = Math.round((stats.passed / (stats.passed + stats.failed)) * 100);
    const status = stats.mae <= 3 ? '✅' : '❌';
    console.log(`${status} ${persona.padEnd(15)}: ${stats.passed}/${stats.passed + stats.failed} passed (${passRate}%), MAE: ${stats.mae.toFixed(2)}`);
  }
  console.log('');
  
  console.log('🎯 SUMMARY:');
  console.log('-----------');
  console.log(`Best Dimension:  ${report.summary.bestDimension} (MAE: ${report.mae.subscores[report.summary.bestDimension].toFixed(2)})`);
  console.log(`Worst Dimension: ${report.summary.worstDimension} (MAE: ${report.mae.subscores[report.summary.worstDimension].toFixed(2)})`);
  console.log(`Overall Status:  ${report.summary.overallMAE <= 3 ? '✅ PASSED' : '❌ FAILED'} (MAE: ${report.summary.overallMAE.toFixed(2)})`);
  console.log('');
}

// ============================================================================
// GOLDEN TESTS
// ============================================================================

describe('Golden Set Calibration', () => {
  let fixtures: GoldenFixture[] = [];
  let results: GoldenTestResult[] = [];
  let report: GoldenReport | null = null;
  
  beforeAll(() => {
    fixtures = loadGoldenFixtures();
    console.log(`📋 Loaded ${fixtures.length} golden fixtures`);
  });
  
  afterAll(() => {
    if (results.length > 0 && report) {
      saveGoldenReport(report);
      printMAETable(report);
    }
  });
  
  it('should load golden fixtures', () => {
    expect(fixtures.length).toBeGreaterThan(0);
    console.log(`✅ Loaded ${fixtures.length} golden fixtures`);
  });
  
  it('should have fixtures for all personas', () => {
    const personas = new Set(fixtures.map(f => f.persona));
    expect(personas.has('recruiter')).toBe(true);
    expect(personas.has('hiring-manager')).toBe(true);
    expect(personas.has('peer')).toBe(true);
  });
  
  it('should have fixtures for multiple themes', () => {
    const themes = new Set(fixtures.map(f => f.theme));
    expect(themes.size).toBeGreaterThanOrEqual(3);
  });
  
  describe('Individual Fixture Tests', () => {
    fixtures.forEach(fixture => {
      it(`should score ${fixture.id} (${fixture.persona}/${fixture.theme}) within tolerance`, () => {
        const result = runGoldenTest(fixture);
        results.push(result);
        
        // Assert overall score tolerance
        expect(result.withinTolerance.overall).toBe(true);
        
        // Assert Overall MAE tolerance
        expect(result.errors.overall).toBeLessThanOrEqual(fixture.tolerance.overall);
        
        // Assert subscores tolerance
        for (const [dimension, withinTolerance] of Object.entries(result.withinTolerance.subscores)) {
          expect(withinTolerance).toBe(true);
        }
        
        // Assert subscores MAE tolerance
        for (const [dimension, error] of Object.entries(result.errors.subscores)) {
          expect(error).toBeLessThanOrEqual(fixture.tolerance.subscores);
        }
        
        console.log(`✅ ${fixture.id}: Overall ${result.actualScores.overall} (expected ${result.expectedScores.overall}, error ${result.errors.overall.toFixed(2)})`);
      });
    });
  });
  
  describe('Golden Set Validation', () => {
    it('should pass all golden tests', () => {
      const passedCount = results.filter(r => r.passed).length;
      const totalCount = results.length;
      
      expect(passedCount).toBe(totalCount);
      console.log(`✅ All ${totalCount} golden tests passed`);
    });
    
    it('should have overall MAE ≤ 3', () => {
      if (results.length === 0) return;
      
      const overallErrors = results.map(r => r.errors.overall);
      const overallMAE = calculateMAE(overallErrors);
      
      expect(overallMAE).toBeLessThanOrEqual(3);
      console.log(`✅ Overall MAE: ${overallMAE.toFixed(2)} ≤ 3`);
    });
    
    it('should have subscores MAE ≤ 3 for all dimensions', () => {
      if (results.length === 0) return;
      
      const dimensions: DimensionType[] = ['structure', 'specificity', 'outcome', 'role', 'company', 'persona', 'risks'];
      
      for (const dimension of dimensions) {
        const errors = results.map(r => r.errors.subscores[dimension] || 0);
        const mae = calculateMAE(errors);
        
        expect(mae).toBeLessThanOrEqual(3);
        console.log(`✅ ${dimension} MAE: ${mae.toFixed(2)} ≤ 3`);
      }
    });
    
    it('should generate golden report', () => {
      report = generateGoldenReport(results, fixtures);
      
      expect(report.totalFixtures).toBe(fixtures.length);
      expect(report.results.length).toBe(results.length);
      expect(report.summary.overallMAE).toBeLessThanOrEqual(3);
      
      console.log(`✅ Generated golden report with ${report.totalFixtures} fixtures`);
    });
  });
});
