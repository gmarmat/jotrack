# Match Matrix Architecture - Signal Deduplication & Score Calculation

## Overview
Match Matrix should drive Match Score calculation using a dual static + dynamic signal system with intelligent deduplication.

---

## Key Principles

1. ✅ **30 ATS Signals**: Static, pre-seeded, generic for all industries (stored in `ats_signals` table)
2. ✅ **Up to 30 Dynamic Signals**: AI-generated per job (stored in `job_dynamic_signals` table)
3. ✅ **Deduplication**: AI identifies which ATS signals are emphasized in JD vs truly new requirements
4. ✅ **Variable Signal Count**: Total signals = 30-60 (not fixed at 60)
5. ✅ **Single Source of Truth**: Match Score calculated from Match Matrix evaluations

---

## The Deduplication Problem

### ❌ Wrong Assumption:
```
30 ATS + 30 Dynamic = Always 60 signals
```

### ✅ Reality:
```
Some dynamic signals MATCH existing ATS signals
Example:
- ATS Signal: "Leadership Experience" 
- AI might identify: "Team Leadership" (SAME CONCEPT!)
- Should NOT create 2 separate signals
- Should MERGE and mark ATS signal as emphasized (show both icons ⚙️✨)

Actual Total: 30-60 signals (variable, not fixed)
```

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│         STEP 1: FETCH 30 ATS SIGNALS (Static)                │
│  • Query DB: SELECT * FROM ats_signals WHERE is_active = 1   │
│  • Result: 30 signals (generic, pre-seeded)                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│      STEP 2: AI GENERATES DYNAMIC SIGNALS + DEDUPLICATION    │
│  • AI analyzes JD and proposes up to 30 dynamic signals      │
│  • AI ALSO compares each to 30 ATS signals                   │
│  • AI returns TWO lists:                                     │
│    1. emphasizedAtsSignals: ["tech_1", "soft_1", ...]        │
│       → These ATS signals are emphasized in JD               │
│       → Mark with isInBothLists: true                        │
│       → Show both icons: ⚙️✨                                 │
│    2. newDynamicSignals: [{id, name, ...}, ...]              │
│       → ONLY truly new signals (not in ATS list)             │
│       → Show dynamic icon only: ✨                            │
│       → Could be 0-30 signals                                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│           STEP 3: BUILD MERGED SIGNAL LIST                   │
│  • Start with 30 ATS signals                                 │
│  • Mark emphasized ones with isInBothLists: true             │
│  • Add ONLY new dynamic signals                              │
│  • FINAL COUNT: 30 + (0-30) = 30-60 signals                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│        STEP 4: SAVE TO DATABASE                              │
│  • job_dynamic_signals table:                                │
│    - Save emphasized ATS signal IDs (FK reference)           │
│    - Save new dynamic signal definitions                     │
│  • Don't duplicate: If "Leadership" exists in ATS,           │
│    store reference, not new definition                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│       STEP 5: EVALUATE ALL UNIQUE SIGNALS                    │
│  • Evaluate 30-60 signals (variable count)                   │
│  • Each signal gets jd_score, resume_score, evidence         │
│  • Save to signal_evaluations table                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│        STEP 6: CALCULATE MATCH SCORE                         │
│  • Formula: Σ(signal.weight × signal.resumeScore)            │
│  • Weights normalized to 1.0 (handles variable count!)       │
│  • Works with 30, 45, or 60 signals equally                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema Updates

### Table: `job_dynamic_signals` (REVISED)

```sql
CREATE TABLE IF NOT EXISTS job_dynamic_signals (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  
  -- CASE 1: References existing ATS signal (emphasized)
  ats_signal_id TEXT,  -- FK to ats_signals.id (if matched)
  
  -- CASE 2: New dynamic signal definition
  dynamic_signal_name TEXT,
  dynamic_signal_description TEXT,
  dynamic_signal_category TEXT CHECK(category IN ('technical', 'experience', 'soft')),
  
  -- Common fields
  adjusted_weight REAL NOT NULL DEFAULT 0.5,
  reasoning TEXT,
  is_emphasized INTEGER DEFAULT 0,  -- 1 if this matched an ATS signal
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  
  FOREIGN KEY (job_id) REFERENCES jobs(id),
  FOREIGN KEY (ats_signal_id) REFERENCES ats_signals(id)
);

CREATE INDEX IF NOT EXISTS idx_job_dynamic_signals_job ON job_dynamic_signals(job_id);
CREATE INDEX IF NOT EXISTS idx_job_dynamic_signals_ats ON job_dynamic_signals(ats_signal_id);
```

### Example Data:

| id | job_id | ats_signal_id | dynamic_signal_name | is_emphasized | adjusted_weight | reasoning |
|----|--------|---------------|---------------------|---------------|-----------------|-----------|
| dyn_1 | job_123 | soft_1 | NULL | 1 | 0.95 | "Leadership heavily emphasized - requires leading 5+ engineers" |
| dyn_2 | job_123 | NULL | Python Programming | 0 | 0.90 | "JD mentions Python 8 times, core tech stack" |
| dyn_3 | job_123 | tech_2 | NULL | 1 | 0.88 | "Core competencies match: React, AWS, TypeScript" |
| dyn_4 | job_123 | NULL | HIPAA Compliance | 0 | 0.85 | "Healthcare industry requirement" |

**Interpretation:**
- Row 1: ATS signal "Leadership Experience" is emphasized → Show ⚙️✨
- Row 2: New dynamic signal "Python Programming" → Show ✨ only
- Row 3: ATS signal "Core Competencies" is emphasized → Show ⚙️✨
- Row 4: New dynamic signal "HIPAA Compliance" → Show ✨ only

**Total for this job: 30 ATS + 2 new dynamic = 32 signals**

---

## AI Prompt Structure

### Phase 1: Generate Dynamic Signals WITH Deduplication

```typescript
const prompt = `
You are analyzing a job description to identify key evaluation signals.

INPUT:
1. Job Description:
${jdText}

2. Resume:
${resumeText}

3. 30 Standard ATS Signals (already defined):
${JSON.stringify(atsSignals, null, 2)}

TASK:
Analyze the JD and identify up to 30 job-specific requirements.

For EACH requirement you identify:
1. Check if it MATCHES any of the 30 ATS signals above
   - Match by semantic similarity (e.g., "Team Leadership" matches "Leadership Experience")
   - Consider category (technical, experience, soft skills)
   
2. If MATCH found:
   - Add to "emphasizedAtsSignals" array
   - Provide reasoning for why it's emphasized
   - Suggest adjusted weight (higher if critical to role)
   
3. If NO MATCH (truly new requirement):
   - Add to "newDynamicSignals" array
   - Provide name, description, category, weight

OUTPUT FORMAT (JSON):
{
  "emphasizedAtsSignals": [
    {
      "atsSignalId": "soft_1",
      "atsSignalName": "Leadership Experience",
      "reasoning": "JD requires 'leading teams of 5+ engineers' - critical for this role",
      "adjustedWeight": 0.95,
      "jdEvidence": "Lead a team of 5-7 engineers..."
    }
  ],
  "newDynamicSignals": [
    {
      "id": "dyn_tech_python",
      "name": "Python Programming",
      "category": "technical",
      "description": "Expert-level Python for backend development",
      "baseWeight": 0.90,
      "reasoning": "JD mentions Python 8 times, core tech stack"
    }
  ],
  "summary": {
    "totalSignals": 35,  // 30 ATS + 5 new
    "emphasizedCount": 8,
    "newCount": 5
  }
}

RULES:
- Be conservative with matches (only match if truly similar)
- Prefer matching to ATS signals over creating new ones
- Total signals should be 30-60 (not less than 30)
- If you identify fewer than 30 total, that's OK
- Don't force matches that don't make sense
`;
```

### Phase 2: Evaluate All Signals

```typescript
const evaluatePrompt = `
For EACH of the ${totalSignals} signals, evaluate:
1. jdScore: How well does JD require/mention this? (0-1)
2. resumeScore: How well does resume demonstrate this? (0-1)
3. Extract exact quotes as evidence
4. Provide reasoning

OUTPUT:
{
  "evaluations": [
    {
      "signalId": "tech_1",
      "jdScore": 0.92,
      "resumeScore": 0.78,
      "jdEvidence": "Required: 5+ years Python, Django, Flask",
      "resumeEvidence": "6 years Python, built Django apps at...",
      "reasoning": "Strong match on Python, missing Flask"
    }
  ],
  "overallScore": 0.83
}
`;
```

---

## Backend Implementation

### File: `lib/evaluateSignals.ts`

```typescript
export async function analyzeJob(jobId: string, jdText: string, resumeText: string) {
  // Step 1: Get 30 ATS signals from DB
  const atsSignals = getAllAtsSignals(); // 30 signals
  
  // Step 2: AI generates dynamic signals + identifies emphasized ATS signals
  const aiResponse = await callAi('generate-signals', {
    jdText,
    resumeText,
    atsSignals
  });
  
  const { emphasizedAtsSignals, newDynamicSignals } = aiResponse;
  
  // Step 3: Build merged signal list
  const allSignals: Signal[] = [];
  
  // Add all ATS signals
  for (const ats of atsSignals) {
    const emphasized = emphasizedAtsSignals.find(e => e.atsSignalId === ats.id);
    
    allSignals.push({
      ...ats,
      type: 'ats_standard',
      isInBothLists: !!emphasized,
      adjustedWeight: emphasized?.adjustedWeight || ats.baseWeight,
      jdEvidence: emphasized?.jdEvidence
    });
  }
  
  // Add ONLY new dynamic signals
  for (const dynamic of newDynamicSignals) {
    allSignals.push({
      ...dynamic,
      type: 'dynamic',
      isInBothLists: false
    });
  }
  
  console.log(`Total signals: ${allSignals.length} (30 ATS + ${newDynamicSignals.length} new)`);
  
  // Step 4: Save to DB
  await saveJobDynamicSignals(jobId, {
    emphasizedAtsSignals,
    newDynamicSignals
  });
  
  // Step 5: Evaluate all unique signals
  const evaluations = await evaluateSignals(jobId, allSignals, jdText, resumeText);
  
  // Step 6: Calculate overall score (handles variable count!)
  const matchScore = calculateMatchScore(evaluations);
  
  return {
    matchScore,
    totalSignals: allSignals.length,
    atsCount: 30,
    emphasizedAtsCount: emphasizedAtsSignals.length,
    newDynamicCount: newDynamicSignals.length,
    evaluations
  };
}

function calculateMatchScore(evaluations: SignalEvaluation[]): number {
  // Normalize weights to sum to 1.0 (handles any count!)
  const totalWeight = evaluations.reduce((sum, e) => sum + e.weight, 0);
  
  const weightedScore = evaluations.reduce((sum, e) => 
    sum + (e.weight / totalWeight) * (e.resumeScore || 0),
    0
  );
  
  return weightedScore; // 0-1
}
```

---

## UI Display Logic

### Match Score Section (`MatchScoreGauge`)

```tsx
<div className="text-5xl font-bold">
  {(matchScore * 100).toFixed(0)}%
</div>
<p className="text-sm text-gray-600">
  Based on {totalSignals} signals 
  ({atsCount} standard, {emphasizedCount} emphasized, {newDynamicCount} job-specific)
</p>
```

### Match Matrix Section (`FitTable`)

```tsx
{allSignals.map(signal => (
  <tr key={signal.id}>
    <td>
      {/* Show icons based on signal type */}
      {signal.isInBothLists ? (
        // ATS signal that's also emphasized in JD
        <div className="flex gap-0.5" title="ATS Standard + Emphasized in JD">
          <Settings size={12} className="text-blue-600" />
          <Sparkles size={12} className="text-purple-600" />
        </div>
      ) : signal.type === 'ats_standard' ? (
        // Regular ATS signal (not emphasized)
        <Settings size={12} className="text-blue-600" title="ATS Standard" />
      ) : (
        // New dynamic signal
        <Sparkles size={12} className="text-purple-600" title="Job-Specific Signal" />
      )}
      <span>{signal.name}</span>
    </td>
    <td>{(signal.adjustedWeight * 100).toFixed(0)}%</td>
    <td>{(signal.jdScore * 100).toFixed(0)}%</td>
    <td>{(signal.resumeScore * 100).toFixed(0)}%</td>
    <td>{signal.jdEvidence}</td>
    <td>{signal.resumeEvidence}</td>
  </tr>
))}
```

---

## Example Scenario

### Job: Senior Product Manager at B2B SaaS Startup

**After AI Analysis:**

**Emphasized ATS Signals (8)** - Show ⚙️✨:
- Leadership Experience (soft_1) - weight: 0.95
- Communication Skills (soft_2) - weight: 0.88
- Years of Experience (exp_1) - weight: 0.90
- Industry Experience (exp_2) - weight: 0.85
- Customer Focus (soft_7) - weight: 0.82
- Results Orientation (soft_10) - weight: 0.87
- Adaptability (soft_6) - weight: 0.78
- Problem Solving (soft_4) - weight: 0.83

**Regular ATS Signals (22)** - Show ⚙️ only:
- All other ATS signals with default weights

**New Dynamic Signals (12)** - Show ✨ only:
- Python Programming (0.90)
- B2B SaaS Experience (0.88)
- Product Analytics Tools (0.85)
- Roadmap Planning (0.82)
- SQL Querying (0.80)
- Figma Proficiency (0.75)
- A/B Testing (0.83)
- 0-to-1 Product Launch (0.86)
- Pricing Strategy (0.78)
- Stakeholder Management (0.84)
- Data-Driven Decisions (0.81)
- Executive Communication (0.79)

**Total: 30 ATS + 12 new = 42 signals**

**Category Breakdown:**
- Technical: 10 ATS + 6 new = 16 signals
- Experience: 10 ATS + 4 new = 14 signals
- Soft Skills: 10 ATS + 2 new = 12 signals

---

## Benefits

| Benefit | Why |
|---------|-----|
| **No Duplication** | Each concept evaluated once (not twice) |
| **Flexible Count** | Works with 30-60 signals seamlessly |
| **Clear Visual** | Users see which ATS signals matter for THIS job |
| **Accurate Scoring** | Weight normalization handles variable counts |
| **Transparent** | "Leadership" showing ⚙️✨ tells user "this standard signal is critical here" |
| **Consistency** | Match Score and Match Matrix show same data |
| **Efficiency** | 30 ATS signals seeded once, not regenerated per job |

---

## Edge Cases Handled

1. ✅ **AI finds 0 new signals**: Total = 30 (all ATS, some emphasized)
2. ✅ **AI finds 30 new signals**: Total = 60 (30 ATS + 30 dynamic)
3. ✅ **AI emphasizes 15 ATS + adds 10 new**: Total = 40
4. ✅ **Fuzzy matching**: "Team Leadership" matches "Leadership Experience"
5. ✅ **Weight normalization**: Score calculation works regardless of count
6. ✅ **Conservative matching**: AI prefers matching to ATS over creating duplicates

---

## Implementation Checklist

### Backend:
- [ ] Update `job_dynamic_signals` table schema (add `ats_signal_id`, `is_emphasized`, `dynamic_signal_*` fields)
- [ ] Create migration for schema update
- [ ] Update `db/signalRepository.ts` to handle both emphasized and new signals
- [ ] Implement `lib/evaluateSignals.ts` with merging logic
- [ ] Create AI prompt for Phase 1 (deduplication)
- [ ] Create AI prompt for Phase 2 (evaluation)
- [ ] Implement `calculateMatchScore()` with weight normalization
- [ ] Update API route `/api/jobs/[id]/evaluate-signals`

### Frontend:
- [ ] Update `MatchScoreGauge` to show variable signal counts
- [ ] Update `FitTable` to display ⚙️, ✨, or ⚙️✨ icons correctly
- [ ] Update category grouping to handle variable counts
- [ ] Add tooltips explaining icon meanings

### Admin:
- [ ] Create Settings tab for ATS Signals Management
- [ ] Add CRUD operations for ATS signals
- [ ] Add "Regenerate All" button with confirmation
- [ ] Add version tracking for ATS signal changes

### Testing:
- [ ] Unit test: Weight normalization with 30, 45, 60 signals
- [ ] Unit test: Signal deduplication logic
- [ ] Unit test: Match score calculation
- [ ] E2E test: Full analysis workflow with variable signal counts
- [ ] E2E test: Verify icons display correctly for each signal type

---

## Open Questions

1. **Fuzzy matching threshold**: How similar should signals be to match? (Use semantic similarity score > 0.8?)
2. **Weight adjustment**: Should emphasized ATS signals always get higher weights, or case-by-case?
3. **UI sorting**: Show emphasized ATS signals first, then regular ATS, then dynamic?
4. **Admin regeneration**: If ATS signals change, should we re-evaluate all existing jobs?

---

## Related Files

- `/db/migrations/008_ats_signals.sql` - Current schema
- `/db/signalRepository.ts` - Database access layer
- `/lib/matchSignals.ts` - Signal definitions
- `/lib/evaluateSignals.ts` - Evaluation logic (TO BE UPDATED)
- `/app/components/coach/tables/FitTable.tsx` - UI component
- `/app/components/ai/MatchScoreGauge.tsx` - Score display

---

## References

- Session notes: October 15, 2024
- Original implementation: `SIGNAL_SYSTEM_COMPLETE.md`
- User guide: `SIGNAL_LEGEND.md`

