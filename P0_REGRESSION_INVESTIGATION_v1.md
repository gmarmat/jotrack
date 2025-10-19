# P0 Test Regression - Investigation Plan v1.0
**Date**: October 18, 2025, 10:30 PM  
**Situation**: P0 tests dropped from 85% (17/20) → 75% (15/20)  
**Goal**: Identify root cause and fix WITHOUT introducing new bugs

---

## 📊 **PROBLEM STATEMENT**

### Before Our Changes (Historical)
```
P0 Tests: 85% (17/20)
Status: 3 skipped, 17 passing
```

### After Our Changes (Current)
```
P0 Tests: 75% (15/20)
Status: 1 skipped, 15 passing, 4 FAILING
```

### Delta
```
Regression: -10% (-2 tests)
New Failures: 4 tests
Impact: CRITICAL (P0-07 is most important test!)
```

---

## ❌ **FAILING TESTS ANALYSIS**

### Test #1: P0-07 - Page Refresh Preserves Answers (CRITICAL!)
**What it tests**: Discovery wizard auto-save + persistence  
**Failure**: Unknown (need to check error details)  
**Impact**: If persistence is broken, users lose all their work!

### Test #2: P0-10 - Score Recalculation Works
**What it tests**: Profile analysis → Score tab unlocks → Recalculate  
**Failure**: Score tab stays locked  
**Impact**: Users can't proceed past discovery phase

### Test #3: P0-12 - Resume Generation Works
**What it tests**: Resume tab unlocks → Generate resume → Split view  
**Failure**: Resume tab likely locked (Score tab prerequisite)  
**Impact**: Users can't generate resume

### Test #4: P0-13 - Cover Letter Generates
**What it tests**: Cover Letter tab unlocks → Generate letter  
**Failure**: Tab likely locked (Resume prerequisite)  
**Impact**: Users can't complete pre-app flow

---

## 🔍 **ROOT CAUSE HYPOTHESES**

### Hypothesis #1: Database Schema Change
**What**: Added `updatedAt` field to peopleProfiles inserts  
**Where**: `db/peopleRepository.ts`, `db/coachRepository.ts`  
**Impact**: Could break Coach Mode if it uses peopleProfiles  
**Likelihood**: LOW (Coach Mode uses job_profiles table, not peopleProfiles)

### Hypothesis #2: Modal Close Logic
**What**: Added `onClose()` call in ManagePeopleModal  
**Where**: `app/components/people/ManagePeopleModal.tsx`  
**Impact**: Shouldn't affect Coach Mode (different component)  
**Likelihood**: VERY LOW

### Hypothesis #3: Page Layout Changes
**What**: Added data-testids to job detail page  
**Where**: `app/jobs/[id]/page.tsx`  
**Impact**: Pure HTML attribute, shouldn't affect functionality  
**Likelihood**: ZERO

### Hypothesis #4: CompanyIntelligenceCard Fix
**What**: Changed `companyData` → `localCompany`  
**Where**: `app/components/ai/CompanyIntelligenceCard.tsx`  
**Impact**: Fixed crash, shouldn't break Coach Mode  
**Likelihood**: VERY LOW

### Hypothesis #5: Test Timing/State Issues
**What**: Tests run after ui-polish tests, might have state pollution  
**Where**: Test execution order  
**Impact**: Could cause failures if state not cleaned  
**Likelihood**: HIGH (we saw test pollution earlier!)

### Hypothesis #6: Pre-Existing Failures
**What**: These tests were already failing before our session  
**Where**: N/A  
**Impact**: Not our regression, but still need to fix  
**Likelihood**: MEDIUM (terminal shows mixed results)

---

## 🎯 **INVESTIGATION STRATEGY v1.0**

### Step 1: Verify Test Baseline (10 min)
1. Check git history for last successful P0 test run
2. Compare commit SHAs to identify when tests broke
3. Confirm if regression is from our changes or pre-existing

### Step 2: Examine Test Failures (15 min)
1. Read error-context.md for all 4 failures
2. Look at screenshots to see actual UI state
3. Identify common failure pattern
4. Check server logs for API errors

### Step 3: Test Isolation Check (5 min)
1. Run ONLY P0 tests (skip ui-polish)
2. Run with fresh DB state (beforeAll cleanup)
3. Compare results

### Step 4: Code Review (10 min)
1. Review all 5 files we changed
2. Look for any Coach Mode dependencies
3. Check if any changes affect discovery/profile flow

### Step 5: Targeted Fix (20 min)
1. Based on findings, implement fix
2. Add additional waits if timing issue
3. Fix state cleanup if pollution issue
4. Revert change if introduced regression

### Step 6: Verification (10 min)
1. Re-run P0 tests
2. Re-run ui-polish tests
3. Confirm both at >90%

**Total Time**: 70 minutes

---

## 📊 **SELF-GRADING MATRIX v1.0**

### Thoroughness (30 points)
- [ ] Check git history (5)
- [ ] Examine all error contexts (10)
- [ ] Test isolation (5)
- [ ] Code review all changes (5)
- [ ] Check for side effects (5)

### Accuracy (30 points)
- [ ] Identify root cause correctly (15)
- [ ] No false positives (5)
- [ ] No missed dependencies (5)
- [ ] Consider all hypotheses (5)

### Efficiency (20 points)
- [ ] Minimize debugging time (10)
- [ ] Use screenshots effectively (5)
- [ ] Targeted fixes (5)

### Risk Management (20 points)
- [ ] Don't break ui-polish (10)
- [ ] Don't introduce new bugs (5)
- [ ] Verify both suites after fix (5)

**SCORE v1.0**: 0/100 (not executed yet)

---

## 🚨 **GAPS IN v1.0**

1. ❌ No clear priority order (which hypothesis to test first?)
2. ❌ No rollback plan if fix fails
3. ❌ No mention of checking coachRepository.ts change impact
4. ❌ Missing: Check if P0-07 uses auto-save (which we didn't touch)
5. ❌ No plan to check API mock responses
6. ❌ Doesn't consider if tests themselves have bugs
7. ❌ No parallel investigation paths

**v1.0 GRADE**: C- (60/100) - Needs improvement!

---

## 🔄 **ITERATION NEEDED**

Will create v2.0 with:
- Prioritized hypothesis testing (most likely first)
- Parallel investigation tracks
- Rollback scenarios
- Mock API verification
- Test code review (not just app code)

