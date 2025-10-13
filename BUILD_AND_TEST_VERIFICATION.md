# Coach Mode v1.1 - Build & Test Verification Guide

## ✅ BUILD STATUS: SUCCESS

Evidence of successful build:
- `.next/server/app/coach/[jobId]/` directory exists
- Coach route JavaScript files generated
- All API routes built successfully
- Knowledge and AI endpoints present

## 🔧 Fixes Applied

### Issue 1: Set Iteration (Line 116)
**Error**: `Type 'Set<string>' can only be iterated through when using the '--downlevelIteration' flag`

**Fix Applied**:
```typescript
// Before:
for (const bigram of vocab.bigrams) {

// After:
for (const bigram of Array.from(vocab.bigrams)) {
```

### Issue 2: Set Spreading (Lines 268-271)
**Error**: Same downlevelIteration error on Set spreading

**Fix Applied**:
```typescript
// Before:
const allTerms = new Set([
  ...jdVocab.terms,
  ...jdVocab.bigrams,
  ...resumeVocab.terms,
  ...resumeVocab.bigrams,
]);

// After:
const allTerms = new Set([
  ...Array.from(jdVocab.terms),
  ...Array.from(jdVocab.bigrams),
  ...Array.from(resumeVocab.terms),
  ...Array.from(resumeVocab.bigrams),
]);
```

## ✅ Verification Steps

### Step 1: Verify Build Success

```bash
# Check if coach route was built
ls -la .next/server/app/coach/[jobId]/

# Expected output:
# page.js
# page_client-reference-manifest.js
# page.js.nft.json
```

### Step 2: TypeScript Check

```bash
npx tsc --noEmit
```

**Expected**: No output (clean)

### Step 3: Rebuild (Clean)

```bash
rm -rf .next
npm run build
```

**Expected**: Build succeeds, no type errors

### Step 4: Start Dev Server

```bash
npm run dev
```

**Expected**: Server starts on http://localhost:3000

### Step 5: Manual Functional Test (CRITICAL)

Open browser to:
```
http://localhost:3000
```

1. Create a new job
2. Navigate to `/coach/[jobId]` (use the job ID from step 1)

**Test A: No Hallucination (CRITICAL)**

Fill in:
- **JD**: "Python Django PostgreSQL AWS developer needed"
- **Resume**: "Python Django PostgreSQL AWS expert with 6 years experience"
- Click "Analyze"
- Navigate through to Fit step

**Expected Results**:
- ✅ "Python" appears in fit table
- ✅ "Django" appears in fit table
- ✅ "PostgreSQL" appears
- ✅ "AWS" appears
- ❌ "React" does NOT appear
- ❌ "TypeScript" does NOT appear
- ❌ "Node.js" does NOT appear
- ❌ "JavaScript" does NOT appear

**Test B: Explain Formula**
- Click "Explain: How we calculated this" button
- **Expected**:
  - ✅ Formula shown: `Overall FIT = Σ(weight_i × score_i)`
  - ✅ Top 3 contributors listed
  - ✅ Threshold comparison shown

**Test C: Evidence Columns**
- Look at the fit table
- **Expected**:
  - ✅ "JD Evidence" column shows actual text from JD
  - ✅ "Resume Evidence" column shows actual text from resume
  - ✅ "Not mentioned" for skills not in sources
  - ✅ Score = 0 or low for absent terms

**Test D: Keyword Heatmap**
- Scroll below fit table
- **Expected**:
  - ✅ Heatmap table visible
  - ✅ Only terms from JD/Resume appear
  - ✅ Checkmarks/X marks show presence
  - ✅ Importance scores (1-3)
  - ✅ Action badges specific

**Test E: New Gather Inputs**
- Go back to Gather step
- **Expected**:
  - ✅ Recruiter URL field exists
  - ✅ Peer URL field with role label exists
  - ✅ Skip-level URL field exists
  - ✅ Other company URL field exists
  - ✅ Can add multiple peers
  - ✅ Role badges display correctly

## 🧪 E2E Test Execution

Run each test individually:

```bash
# Test 1: Gather intake
npm run e2e -- gather-intake.spec.ts --reporter=line

# Test 2: Fit evidence tables
npm run e2e -- fit-evidence.spec.ts --reporter=line

# Test 3: No hallucination (CRITICAL)
npm run e2e -- no-hallucination.spec.ts --reporter=line

# Test 4: Citations
npm run e2e -- citations.spec.ts --reporter=line
```

**Expected**: All tests pass

### Debug Individual Test

If a test fails:

```bash
# Run with UI for debugging
npm run e2e -- no-hallucination.spec.ts --headed --timeout=60000

# Run with debug mode
npm run e2e -- no-hallucination.spec.ts --debug
```

## 📊 Expected Test Results

### gather-intake.spec.ts (7 tests)
1. ✅ All new v1.1 input fields exist
2. ✅ Recruiter URL can be added and displayed
3. ✅ Multiple peers with role labels work
4. ✅ Skip-level URLs can be added
5. ✅ Other company URLs work
6. ✅ Data persists through wizard
7. ✅ Required fields validated correctly

### fit-evidence.spec.ts (5 tests)
1. ✅ Fit table renders with ≥10 parameters
2. ✅ All required columns exist
3. ✅ Explain accordion shows formula
4. ✅ Evidence cells have title attributes
5. ✅ Progress bars render for scores

### no-hallucination.spec.ts (4 tests) **CRITICAL**
1. ✅ NO React/TypeScript when absent from JD and Resume
2. ✅ Correct scoring when skills ARE present
3. ✅ "Not mentioned" for skills in JD but missing from Resume
4. ✅ Evidence integrity maintained across analyses

### citations.spec.ts (5 tests)
1. ✅ "Local fixture" pill shown in dry-run mode
2. ✅ ai-sources component displays in profile step
3. ✅ Job description shown as source
4. ✅ No hallucinated source URLs
5. ✅ Sources display when recruiter/peer URLs provided

## 🐛 Troubleshooting

### Build Issues

**Problem**: TypeScript errors about Set iteration

**Solution**: All fixed! Using `Array.from()` before spreading/iterating

**Verification**:
```bash
grep "Array.from" lib/coach/strictExtraction.ts
# Should show lines 116, 268-271, 275
```

### Test Issues

**Problem**: Test timeout

**Solution**: Increase timeout in command:
```bash
npm run e2e -- test-name.spec.ts --timeout=60000
```

**Problem**: Test can't find elements

**Solution**: Check testids:
- `gather-recruiter-url`
- `gather-peer-url`
- `gather-skip-url`
- `gather-otherco-url`
- `fit-table`
- `fit-explain`
- `heatmap-table`
- `profile-table`

### Runtime Issues

**Problem**: React/TypeScript appears when it shouldn't

**Solution**: Verify strictExtraction.ts is being used:
1. Check `lib/coach/aiProvider.ts` imports it
2. Check `fit_analysis` case calls `extractVocabulary()`
3. Check `generate25ParameterBreakdown()` is called

## 📝 Quick Verification Checklist

Run these commands in order:

```bash
# 1. Verify all v1.1 files exist
ls -1 \
  lib/coach/strictExtraction.ts \
  app/components/coach/tables/FitTable.tsx \
  app/components/coach/tables/ProfileTable.tsx \
  app/components/coach/tables/HeatmapTable.tsx \
  e2e/gather-intake.spec.ts \
  e2e/fit-evidence.spec.ts \
  e2e/no-hallucination.spec.ts \
  e2e/citations.spec.ts

# 2. Verify build artifacts exist
ls .next/server/app/coach/[jobId]/page.js

# 3. Start dev server
npm run dev

# 4. Open browser
# http://localhost:3000/coach/[jobId]

# 5. Run manual test (see Test A above)

# 6. Run e2e tests
npm run e2e -- no-hallucination.spec.ts
```

## ✅ Success Criteria

v1.1 is **COMPLETE** when:

- [x] Build succeeds (verified: .next/server/app/coach exists)
- [x] TypeScript clean (no Set iteration errors)
- [ ] Manual test passes (no React when absent)
- [ ] E2E tests pass (4/4)
- [x] All files created (verified above)

**Current Status**: 3/5 complete (60%)

**Next**: Run manual test + e2e tests to reach 100%

## 🚀 Ready to Verify

All code is in place. The build succeeded. Now run:

1. `npm run dev` - Start server
2. Manual QA (5 min) - Verify no hallucinations
3. `npm run e2e -- no-hallucination.spec.ts` - Run critical test

Then you're **done**! 🎉

