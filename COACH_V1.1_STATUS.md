# Coach Mode v1.1 — Implementation Status

## ✅ COMPLETED

### 1) Enhanced Gather UI (DONE - 100%)
**Files Modified**: `app/components/coach/steps/GatherStep.tsx`

**New Inputs Added**:
- ✅ `gather-recruiter-url` - Single recruiter URL input
- ✅ `gather-peer-url` - Multiple peers with role labels
- ✅ `gather-skip-url` - Skip-level/leadership URLs
- ✅ `gather-otherco-url` - Context companies (competitors, partners)

**Features**:
- Role labels for peers (e.g., "Senior Engineer")
- Helper text explaining each input's purpose
- Remove buttons for each added URL
- Visual badges showing roles
- Proper data structure: `{ url, role }` for peers

**Code Quality**:
- All testids in place for Playwright
- Type-safe state management
- Clean UI with icons from lucide-react

## 📋 REMAINING WORK

### 2) Strict Extraction Library (CRITICAL)
**File to Create**: `lib/coach/strictExtraction.ts`

**Purpose**: Prevent AI hallucinations by extracting vocab ONLY from source documents

**Key Functions**:
```typescript
extractVocabulary(text: string): ExtractedVocab
matchSkillsFromTaxonomy(vocab, taxonomySkills): Match[]
scoreParameter(param, jdVocab, resumeVocab, weight): Score
```

**Importance**: ⚠️ **CRITICAL** - Without this, AI can invent skills

**Est. Time**: 2 hours  
**Lines**: ~200

### 3) Table Components (HIGH PRIORITY)
**Files to Create**: 
- `app/components/coach/tables/FitTable.tsx` (~150 lines)
- `app/components/coach/tables/ProfileTable.tsx` (~80 lines)
- `app/components/coach/tables/HeatmapTable.tsx` (~100 lines)

**Purpose**: Replace "AI blob" with transparent, evidence-based tables

**Features**:
- FitTable: 25-param matrix with JD/Resume evidence columns
- ProfileTable: Entity, facts, sources in tabular format
- HeatmapTable: Keywords with importance and action recommendations
- Explain accordion showing formula
- Sources integration

**Importance**: 🔥 **HIGH** - Core UX upgrade for v1.1

**Est. Time**: 3 hours  
**Lines**: ~330 total

### 4) Update API Responses (MEDIUM)
**Files to Modify**:
- `app/api/ai/analyze/route.ts` - Return structured breakdown
- `lib/coach/aiProvider.ts` - Use strict extraction

**Changes**:
- Integrate `strictExtraction.ts` into dry-run responses
- Return structured JSON with breakdown array
- Include sources in meta

**Est. Time**: 1.5 hours  
**Lines**: ~80 modifications

### 5) Update Step Components (MEDIUM)
**Files to Modify**:
- `app/components/coach/steps/FitStep.tsx` - Use FitTable
- `app/components/coach/steps/ProfileStep.tsx` - Use ProfileTable

**Changes**:
- Replace current blob rendering with table components
- Pass structured data to tables
- Handle dry-run vs network states

**Est. Time**: 1 hour  
**Lines**: ~60 modifications

### 6) E2E Tests (MEDIUM)
**Files to Create**:
- `e2e/gather-intake.spec.ts` - Test new inputs
- `e2e/fit-evidence.spec.ts` - Test tables render
- `e2e/no-hallucination.spec.ts` - **CRITICAL TEST**
- `e2e/citations.spec.ts` - Test sources display

**Purpose**: Verify no hallucinations, tables work, sources show

**Est. Time**: 2 hours  
**Lines**: ~200 total

### 7) UX Polish (LOW PRIORITY)
- Add provider badges to headers
- Improve microcopy throughout
- Add refresh buttons
- Better timestamp display

**Est. Time**: 1 hour  
**Lines**: ~40 modifications

## 📊 Overall Status

| Category | Status | Priority | Est. Time |
|----------|--------|----------|-----------|
| Gather UI | ✅ Complete | Critical | Done |
| Strict Extraction | ⚪ Not Started | Critical | 2h |
| Table Components | ⚪ Not Started | High | 3h |
| API Updates | ⚪ Not Started | Medium | 1.5h |
| Step Updates | ⚪ Not Started | Medium | 1h |
| E2E Tests | ⚪ Not Started | Medium | 2h |
| UX Polish | ⚪ Not Started | Low | 1h |
| **TOTAL** | **10% Done** | - | **10.5h** |

## 🎯 Critical Path

To deploy v1.1 with confidence:

1. **Strict Extraction** (2h) - MUST DO - prevents hallucinations
2. **Table Components** (3h) - Core UX improvement
3. **no-hallucination.spec.ts** (0.5h) - Verify #1 works
4. **API/Step Updates** (2.5h) - Wire everything together
5. **Other E2E Tests** (1.5h) - Full verification

**Total Critical Path**: 9.5 hours

## 🚀 Quick Start

```bash
# 1. Implement strict extraction
touch lib/coach/strictExtraction.ts
# (Copy from COACH_V1.1_IMPLEMENTATION_GUIDE.md)

# 2. Create table components
mkdir -p app/components/coach/tables
touch app/components/coach/tables/{FitTable,ProfileTable,HeatmapTable}.tsx

# 3. Update API
# Modify app/api/ai/analyze/route.ts to use strictExtraction

# 4. Create tests
touch e2e/{gather-intake,fit-evidence,no-hallucination,citations}.spec.ts

# 5. Run tests
pnpm playwright test --grep "v1.1|gather|hallucination"
```

## 📖 Documentation

- **Full Spec**: `COACH_V1.1_IMPLEMENTATION_GUIDE.md`
- **Code Examples**: All components fully specified in guide
- **Test Cases**: Complete Playwright tests with examples

## ⚠️ Important Notes

### Hallucination Prevention
The strict extraction library is **non-negotiable**. Without it:
- AI can invent skills not in JD/Resume
- Scores become meaningless
- User trust erodes
- Legal/compliance risk

**Test**: `no-hallucination.spec.ts` MUST pass before v1.1 ships.

### Evidence-Based UI
Moving from blob to tables is the core value prop of v1.1:
- **Before**: "AI says your fit is 78%" (black box)
- **After**: "78% based on these 25 parameters, here's the math" (transparent)

### Sources Everywhere
Every AI output must show sources:
- Profile tables: 3 sources per entity
- Fit matrix: Sources in meta
- Network OFF: Show "Local fixture" pill

## 🔍 Verification

Before marking v1.1 complete:

```bash
# 1. TypeScript check
pnpm tsc --noEmit
# ✅ Expected: Clean

# 2. Build
pnpm build
# ✅ Expected: Success

# 3. Critical test
pnpm playwright test no-hallucination.spec.ts
# ✅ Expected: PASS - no invented skills

# 4. All v1.1 tests
pnpm playwright test --grep "v1.1"
# ✅ Expected: 4/4 pass

# 5. Manual check
# Go to /coach/[jobId]
# Fill JD/Resume WITHOUT "React" or "TypeScript"
# Analyze
# Verify Fit table does NOT show React/TS
# Verify scores are evidence-based
```

## 🎯 Success Criteria

v1.1 is DONE when:

- [x] Gather UI has all 4 new input types ✅
- [ ] Strict extraction prevents hallucinations
- [ ] FitTable shows 25 params with evidence
- [ ] ProfileTable shows entities with sources
- [ ] HeatmapTable shows keyword analysis
- [ ] Explain accordion shows formula
- [ ] no-hallucination.spec.ts passes
- [ ] All 4 e2e tests pass
- [ ] Manual verification confirms no invented skills

## 💡 Quick Wins

If time-constrained, implement in this order:

1. **Strict Extraction** (2h) - Biggest risk mitigation
2. **FitTable only** (1.5h) - Biggest UX impact
3. **no-hallucination test** (0.5h) - Verify it works
4. **Ship v1.1-alpha** with just these 3

Then add ProfileTable, HeatmapTable, other tests in v1.1.1.

---

**Current Status**: 10% complete (Gather UI done)  
**Next Action**: Create `lib/coach/strictExtraction.ts`  
**Est. Completion**: 10.5 hours from now  
**Priority**: Strict extraction is CRITICAL for credibility

