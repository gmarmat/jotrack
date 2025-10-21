# E2E Testing Strategy - Data Pipeline (V1)

**Role**: Senior Principal QA Engineer  
**Date**: October 21, 2025  
**Scope**: Data Pipeline - Variant Extraction & Staleness Detection  
**Approach**: Google-grade quality assurance

---

## 🎯 Testing Objectives

### Primary Goals
1. **Staleness Logic Accuracy**: Verify change detection triggers correctly
2. **Extraction Quality**: Ensure AI-optimized maintains fidelity (no info added/lost)
3. **Token Optimization**: Verify AI-optimized is actually more efficient
4. **Integration Testing**: Ensure downstream sections consume variants correctly
5. **User Journey Coverage**: Test all paths from upload → extraction → analysis → viewing

### Success Criteria
- ✅ 0% false positives in staleness detection
- ✅ 0% information loss in AI-optimized variant
- ✅ 70%+ token reduction vs raw
- ✅ All analysis sections work with new variant format
- ✅ All edge cases handled gracefully

---

## 📊 Test Coverage Matrix

### Dimension 1: Document Types
- Resume (PDF, DOCX, TXT)
- Job Description (PDF, DOCX, TXT)
- Cover Letter (PDF, DOCX, TXT)

### Dimension 2: States
- New upload (no variants)
- Variants exist (fresh)
- Variants stale (document changed)
- Multiple versions (v1, v2, v3)
- No documents uploaded

### Dimension 3: Actions
- Upload document
- Mark version as active
- Click "Refresh Data"
- Click "Analyze All"
- View variants in modal
- Switch active versions

### Dimension 4: Downstream Integration
- Match Score analysis
- Company Intelligence
- Skills Match
- People Profiles
- Interview Coach

**Total Test Cases**: 3 doc types × 5 states × 6 actions × 5 integrations = **450 theoretical tests**

**Practical Approach**: Use equivalence partitioning and boundary value analysis to reduce to **~30 critical tests**

---

## 🏗️ Testing Architecture

### Layer 1: Unit Tests (Mock AI, Fast)
```
Test: Variant extraction functions
Mock: AI API calls (return fixture data)
Focus: Logic correctness
Speed: < 5 seconds total
Cost: $0.00
```

### Layer 2: Integration Tests (Real DB, Mock AI)
```
Test: Database operations, state transitions
Mock: AI API calls
Focus: Data persistence, staleness triggers
Speed: < 30 seconds total
Cost: $0.00
```

### Layer 3: E2E Tests (Real AI, Selective)
```
Test: Critical user paths only
Real: AI API calls (selective - 3-5 tests max)
Focus: End-to-end validation
Speed: ~5 minutes total
Cost: ~$0.10 (using cheap test data)
```

### Cost Optimization Strategy

**Reuse Test Data**:
1. **Create golden dataset**: Run AI extraction ONCE on test fixtures
2. **Save outputs**: Store AI responses as JSON fixtures
3. **Mock subsequent calls**: Return saved responses
4. **Real calls**: Only for regression testing (1x per release)

**Golden Dataset Structure**:
```
e2e/fixtures/golden-outputs/
├── resume-raw.txt (351 words)
├── resume-ai-optimized.txt (287 words) ← AI generated once
├── jd-raw.txt (542 words)
├── jd-ai-optimized.txt (501 words) ← AI generated once
└── metadata.json (costs, token counts, timestamps)
```

---

## 📝 Test Plan v1

### Phase 1: Setup & Fixtures (No API Calls)

**Test 1.1: Create Test Fixtures**
```
Action: Create realistic but small test documents
Files:
- short-resume.txt (150 words - minimal)
- standard-resume.txt (350 words - typical)
- long-resume.txt (800 words - detailed)
- short-jd.txt (200 words)
- standard-jd.txt (500 words)
- weird-format-resume.txt (with page numbers, artifacts)

Goal: Cover small/standard/large documents
```

**Test 1.2: Generate Golden Dataset** (ONE-TIME COST)
```
Action: Run real AI extraction on test fixtures
Save: AI responses as JSON
Cost: 6 files × $0.01 = $0.06 (one-time investment)
Reuse: For all future tests (cost: $0.00)
```

### Phase 2: Staleness Detection (Unit Tests)

**Test 2.1: Fresh Upload → No Variants**
```
Given: User uploads resume.txt (first time)
When: Check staleness
Then: 
  - severity = 'no_variants'
  - message = "Documents uploaded - click 'Refresh Data' (~$0.02)"
  - isStale = true
  - hasVariants = false
```

**Test 2.2: After Extraction → Variants Fresh**
```
Given: Variants created (Raw + AI-Optimized)
When: Check staleness
Then:
  - severity = 'variants_fresh'
  - message = "AI data ready - click 'Analyze All' (~$0.20)"
  - isStale = true
  - hasVariants = true
  - hasAnalysis = false
```

**Test 2.3: After Analysis → Fresh**
```
Given: Full analysis run, fingerprint saved
When: Check staleness
Then:
  - severity = 'fresh'
  - message = "Analysis is up to date"
  - isStale = false
  - hasAnalysis = true
```

**Test 2.4: Upload New Version → Stale (Major)**
```
Given: Analysis complete with Resume v1
When: User uploads Resume v2 (different content)
And: Marks v2 as active
Then:
  - severity = 'major'
  - message = "Key documents changed - re-analysis strongly recommended"
  - isStale = true
  - changedArtifacts = ['resume']
```

**Test 2.5: Switch to Identical Version → Fresh**
```
Given: Resume v1 and v2 have IDENTICAL content
When: User switches from v1 → v2
Then:
  - severity = 'fresh' (content hash unchanged!)
  - isStale = false
  
Edge Case: This tests content-based fingerprinting (not version-based)
```

**Test 2.6: Minor Change Detection**
```
Given: Resume v1 analyzed
When: User uploads v2 with only typo fixes (95% similarity)
Then:
  - severity = 'minor'
  - message = "Minor updates detected - consider re-analyzing"
```

### Phase 3: Extraction Quality (Mock AI)

**Test 3.1: Information Fidelity**
```
Given: Resume with 10 specific facts:
  - Name: John Doe
  - Email: john@example.com
  - Years exp: 8 years
  - Skills: Python, Django, AWS (3 items)
  - Companies: CompanyA, CompanyB (2 items)
  - Education: BS Computer Science

When: Extract AI-optimized variant (mocked)

Then: ALL 10 facts present in output
  - Name: ✓ "John Doe"
  - Email: ✓ "john@example.com"
  - Years: ✓ "8 years" or "8+ years"
  - Skills: ✓ All 3 present
  - Companies: ✓ Both present
  - Education: ✓ "BS" or "Bachelor" + "Computer Science"

Fail If: Any fact missing or changed (e.g., "7 years" instead of "8")
```

**Test 3.2: No Hallucination**
```
Given: Resume WITHOUT PhD

When: Extract AI-optimized

Then: Output should NOT contain:
  - ✗ "PhD" (not in source)
  - ✗ Additional companies not in resume
  - ✗ Skills not mentioned
  - ✗ Fabricated achievements

Verification: Compare source facts vs output facts
Pass If: 0 hallucinations detected
```

**Test 3.3: Formatting Cleanup**
```
Given: Resume with artifacts:
  "Page 1\\n\\n====\\nJOHN    DOE\\n\\nExperience\\n\\n\\nCompany A    2020-Present"

When: Extract AI-optimized

Then: Cleaned output:
  "John Doe\\n\\nExperience:\\nCompany A (2020-Present)"

Improvements:
  - ✓ Removed "Page 1", "===="
  - ✓ Fixed excessive whitespace
  - ✓ Standardized formatting
  - ✓ Preserved all meaningful content
```

**Test 3.4: Token Efficiency**
```
Given: Raw resume = 2000 words = ~8000 tokens

When: Extract AI-optimized

Then:
  - Word count: 500-800 words
  - Token count: ~2400 tokens
  - Reduction: 70-75%
  
Pass If: Token reduction ≥ 65%
```

### Phase 4: Version Management (DB Tests)

**Test 4.1: Single Active Version Per Type**
```
Given: Resume v1, v2, v3 exist

When: Mark v2 as active

Then:
  SELECT is_active FROM attachments WHERE kind='resume'
  - v1: is_active = 0 ✓
  - v2: is_active = 1 ✓
  - v3: is_active = 0 ✓
  
Only ONE is_active=1 per kind
```

**Test 4.2: Refresh Data Uses Active Only**
```
Given:
  - Resume v1 (inactive)
  - Resume v2 (ACTIVE)
  - Resume v3 (inactive)

When: Click "Refresh Data"

Then:
  - Extracts ONLY v2
  - Creates variants for v2 only
  - Does NOT touch v1 or v3
  
Verification: Check terminal logs
Expected: "📎 Found 1 active attachments: resume: [v2 filename]"
```

**Test 4.3: Multiple Document Types**
```
Given:
  - Resume v2 (active)
  - JD v1 (active)
  - Cover Letter v1 (active)

When: Click "Refresh Data"

Then:
  - Extracts all 3 documents
  - Creates 6 variants total (2 per document)
  - Cost: ~$0.03 (3 × $0.01)
  
Verification:
SELECT COUNT(*) FROM artifact_variants WHERE is_active=1;
Expected: 6 (3 raw + 3 ai_optimized)
```

### Phase 5: Downstream Integration (Critical!)

**Test 5.1: Match Score Consumes AI-Optimized**
```
Setup: Create variants using mocked AI

Given: 
  - Resume Raw: 2000 words, messy format
  - Resume AI-Optimized: 600 words, clean

When: Click "Analyze" in Match Score section

Then:
  - Match Score uses AI-Optimized variant (verify in logs)
  - Analysis completes successfully
  - Score calculated correctly (72/100 example)
  - Skills extracted properly
  
Verification: Check API logs
Expected: "Using AI-optimized variant (600 words, 2400 tokens)"
NOT: "Using raw variant (2000 words, 8000 tokens)"
```

**Test 5.2: Company Intelligence Consumes JD Variants**
```
Given: JD with company info + formatting garbage

When: Run Company Intelligence analysis

Then:
  - Uses JD AI-Optimized (clean)
  - Extracts: Company name, culture, requirements
  - Ignores: Legal disclaimers, page numbers
  
Pass If: Extracted data is accurate
```

**Test 5.3: Interview Coach Uses Variants**
```
Given: Resume and JD variants exist

When: Generate interview questions

Then:
  - Uses AI-Optimized for both
  - Questions reference actual skills from resume
  - Questions align with actual JD requirements
  
Fail If: Questions reference skills NOT in resume
```

**Test 5.4: Variant Format Compatibility**
```
Test: All analysis sections handle new format

Old Format: JSON.parse(variant.content) = { skills: [], experience: [] }
New Format: JSON.parse(variant.content) = { text: "...", wordCount: 287 }

Each section must:
1. Check for .text property first
2. Extract text: variant.content.text
3. Parse as needed for their analysis
4. Gracefully handle old JSON format (backward compatibility)

Sections to test:
- Match Score (/api/jobs/[id]/analyze-match-score)
- Company Intel (/api/jobs/[id]/analyze-company)
- Skills Match (/api/jobs/[id]/analyze-skills)
- People Profiles (/api/jobs/[id]/people/analyze)
- Interview Coach (/api/jobs/[id]/coach/generate-questions)
```

### Phase 6: Edge Cases & Error Handling

**Test 6.1: Empty Document**
```
Given: Upload empty.txt (0 bytes)
When: Click "Refresh Data"
Then: Error shown, no variants created
```

**Test 6.2: Corrupted PDF**
```
Given: Upload corrupted.pdf
When: Click "Refresh Data"
Then: Clear error with suggestions (convert to .docx)
```

**Test 6.3: Very Large Document**
```
Given: Upload 50-page resume (10,000 words)
When: Extract AI-optimized
Then: 
  - Still condenses to 500-800 words
  - All key facts preserved
  - Cost acceptable (< $0.05)
```

**Test 6.4: Special Characters**
```
Given: Resume with unicode (Søren, resumé, 中文)
When: Extract variants
Then: Characters preserved correctly in both variants
```

**Test 6.5: API Failure**
```
Given: AI API returns 500 error
When: Click "Refresh Data"
Then:
  - Raw variant created (local, no API)
  - AI-optimized fails gracefully
  - Error shown: "AI extraction failed, using raw text"
  - User can still proceed with raw
```

---

## 🔬 Grading Matrix (100 Points)

### Category 1: Test Coverage (25 points)

| Criterion | Weight | Score | Notes |
|-----------|--------|-------|-------|
| State coverage (5 states × 3 doc types) | 10 | 8/10 | Missing: partial upload scenarios |
| Action coverage (6 key actions) | 5 | 5/5 | All actions covered ✓ |
| Integration coverage (5 sections) | 5 | 3/5 | Missing: Skills Match, People Profiles |
| Edge cases (5+ scenarios) | 5 | 4/5 | Missing: network timeout, rate limits |

**Subtotal: 20/25**

### Category 2: Test Quality (25 points)

| Criterion | Weight | Score | Notes |
|-----------|--------|-------|-------|
| Assertions specificity | 8 | 6/8 | Some vague checks ("works") |
| Independence (no test depends on another) | 5 | 5/5 | Each test self-contained ✓ |
| Repeatability (deterministic) | 5 | 4/5 | Time-based tests may flake |
| Clear failure messages | 4 | 4/4 | Good error descriptions ✓ |
| Setup/teardown (clean state) | 3 | 2/3 | Missing: DB cleanup between tests |

**Subtotal: 21/25**

### Category 3: Efficiency (20 points)

| Criterion | Weight | Score | Notes |
|-----------|--------|-------|-------|
| Mock usage (avoid unnecessary AI calls) | 8 | 5/8 | Could mock more aggressively |
| Golden dataset reuse | 5 | 3/5 | Good idea but not fully utilized |
| Parallel test execution | 4 | 2/4 | Sequential tests (could parallelize) |
| Cost optimization (< $0.20 total) | 3 | 3/3 | $0.10 budget, good ✓ |

**Subtotal: 13/20**

### Category 4: Real-World Scenarios (15 points)

| Criterion | Weight | Score | Notes |
|-----------|--------|-------|-------|
| Typical user journey | 5 | 5/5 | Upload → extract → analyze ✓ |
| Power user scenarios | 3 | 2/3 | Missing: bulk operations |
| Error recovery paths | 4 | 3/4 | Good but missing retry logic |
| Performance edge cases | 3 | 2/3 | Missing: concurrent requests |

**Subtotal: 12/15**

### Category 5: Automation & Maintenance (15 points)

| Criterion | Weight | Score | Notes |
|-----------|--------|-------|-------|
| CI/CD ready | 5 | 4/5 | Needs env var setup docs |
| Test data versioning | 3 | 2/3 | Fixtures not versioned |
| Flake resistance | 4 | 3/4 | Some time-dependent checks |
| Documentation | 3 | 3/3 | Excellent docs ✓ |

**Subtotal: 12/15**

---

## 📊 V1 SCORE: 78/100

**Grade**: C+ (Needs Improvement)

**Strengths**:
- ✅ Good test coverage breadth
- ✅ Clear documentation
- ✅ Cost-conscious approach
- ✅ Real-world scenarios included

**Weaknesses**:
- ❌ Missing downstream integration tests
- ❌ Not leveraging golden dataset fully
- ❌ Some tests are not specific enough
- ❌ Missing concurrent/performance tests

---

## 🔄 Improvements for V2

### Fix #1: Add Downstream Integration Tests
```
Test: Each analysis section with new variant format
Mock: AI extraction (use golden dataset)
Verify: Each section extracts .text correctly
```

### Fix #2: Create Comprehensive Golden Dataset
```
Generate once:
- All test documents → AI-optimized variants
- Save AI responses as fixtures
- Document expected outputs
- Version control in git
```

### Fix #3: More Specific Assertions
```
Instead of: expect(result).toBeTruthy()
Use: expect(result.text).toContain('John Doe')
     expect(result.wordCount).toBeGreaterThan(200)
     expect(result.wordCount).toBeLessThan(400)
```

### Fix #4: Add Performance Tests
```
Test: Concurrent "Refresh Data" clicks
Test: Very large documents (10,000 words)
Test: Rapid version switching
```

---

## 📝 REVISED Test Plan V2

### Critical Path Tests (Must Pass)

**CP-1: First-Time Upload → Extract → Analyze**
```
Scenario: New user, first job
Steps:
  1. Create job
  2. Upload resume.txt + jd.txt
  3. Check: severity = 'no_variants'
  4. Click "Refresh Data"
  5. Verify: 4 variants created (2 per doc)
  6. Check: severity = 'variants_fresh'
  7. Click "Analyze All"
  8. Verify: Match Score completes
  9. Check: severity = 'fresh'

Assertions:
  - ✓ Each step shows correct staleness message
  - ✓ Variants created with correct format
  - ✓ AI-optimized is 70%+ shorter
  - ✓ All facts preserved
  - ✓ Match Score uses AI-optimized
  - ✓ Total cost < $0.25
```

**CP-2: Update Resume → Detect Change → Re-Analyze**
```
Scenario: User improves resume based on feedback
Steps:
  1. Start with analyzed job (severity='fresh')
  2. Upload resume-v2.txt (added AWS skill)
  3. Mark v2 as active
  4. Check: severity = 'major', message mentions "changed"
  5. Click "Refresh Data"
  6. Verify: Comparison shows "Added: AWS"
  7. Check: severity = 'variants_fresh'
  8. Click "Analyze All"
  9. Verify: Match Score increased (72 → 78)

Assertions:
  - ✓ Change detected automatically
  - ✓ Comparison accurate ("Added: AWS")
  - ✓ Re-analysis uses new variant
  - ✓ Score reflects improvements
```

**CP-3: Multi-Document Workflow**
```
Scenario: Upload all 3 document types
Steps:
  1. Upload resume.txt
  2. Upload jd.txt
  3. Upload cover-letter.txt
  4. Click "Refresh Data"
  5. Verify: 6 variants (2 × 3 docs)
  6. Check variants in viewer modal
  7. Verify: Each doc has Raw + AI-Optimized

Assertions:
  - ✓ All 3 documents extracted
  - ✓ Each has 2 variants
  - ✓ Viewer shows all 3 tabs
  - ✓ Cost: ~$0.03 (3 × $0.01)
```

### Integration Tests (Mock AI)

**INT-1: Match Score Integration**
```
Mock: AI extraction returns golden dataset
Test: /api/jobs/[id]/analyze-match-score

Verify:
  1. Fetches ai_optimized variant (not raw)
  2. Extracts .text property correctly
  3. Passes text to Match Score AI
  4. Returns valid score (0-100)
  5. Skills array populated
```

**INT-2: Company Intelligence Integration**
```
Mock: AI extraction + company analysis
Test: /api/jobs/[id]/analyze-company

Verify:
  1. Uses JD ai_optimized variant
  2. Extracts company name from variant
  3. Runs Tavily search (mocked)
  4. Returns company intelligence
```

**INT-3: Interview Coach Integration**
```
Mock: All extractions
Test: /api/jobs/[id]/coach/generate-questions

Verify:
  1. Uses Resume ai_optimized
  2. Uses JD ai_optimized
  3. Generates questions (10-30)
  4. Questions reference actual resume content
```

**INT-4: Skills Match Integration**
```
Mock: Extractions
Test: /api/jobs/[id]/analyze-skills

Verify:
  1. Extracts skills from resume variant
  2. Extracts skills from JD variant
  3. Compares and scores
  4. Returns matched/missing/bonus skills
```

**INT-5: People Profiles Integration**
```
Mock: Extractions + LinkedIn data
Test: /api/jobs/[id]/people/analyze

Verify:
  1. Uses Resume ai_optimized for candidate profile
  2. Uses JD ai_optimized for role requirements
  3. Matches candidates to role
  4. Returns profiles with fit scores
```

### Edge Case Tests

**EDGE-1: Switch Between Identical Versions**
```
Setup: Upload resume.txt as v1 and v2 (identical content)
Test: Switch active from v1 → v2
Expect: Fingerprint unchanged, severity stays 'fresh'
```

**EDGE-2: Partial Extraction Failure**
```
Setup: Upload resume.txt (works) + corrupted.pdf (fails)
Test: Click "Refresh Data"
Expect:
  - Resume: 2 variants created ✓
  - JD: Error shown ✗
  - User can proceed with resume-only analysis
  - Clear error message for JD
```

**EDGE-3: API Timeout During Extraction**
```
Mock: AI API takes > 30 seconds
Test: Click "Refresh Data"
Expect:
  - Timeout error after 30s
  - Raw variant still created (local)
  - Error: "AI optimization timed out, using raw text"
  - User can retry or proceed with raw
```

**EDGE-4: Delete Active Version**
```
Setup: Resume v1 (active), v2 (inactive)
Test: Delete v1
Expect:
  - v1 marked deleted
  - v2 automatically becomes active
  - OR: No active version, user must select
```

---

## 🎯 V2 SCORE PREDICTION: 92/100

**Improvements**:
- ✅ Added all 5 downstream integration tests (+15 points)
- ✅ More specific assertions (+5 points)
- ✅ Golden dataset fully utilized (+4 points)
- ✅ Edge cases comprehensive (+3 points)

**Still Missing** (to get 100/100):
- Performance/load tests (concurrent users)
- Security tests (file upload validation)
- Accessibility tests (screen reader compatibility)

---

## 🚀 EXECUTION PLAN

I will now execute V2 plan in this order:

### Step 1: Generate Golden Dataset (ONE REAL API CALL)
- Use test-resume.txt
- Call real AI to create ai_optimized
- Save response as fixture
- Cost: ~$0.01 (one-time)

### Step 2: Create Comprehensive Fixtures
- 6 test documents (small/standard/large × resume/jd)
- Expected outputs documented
- Save as e2e/fixtures/golden-dataset/

### Step 3: Write Unit Tests (Mock AI)
- Staleness detection (6 tests)
- Version management (4 tests)
- Cost: $0.00

### Step 4: Write Integration Tests (Mock AI)
- 5 downstream sections
- Use golden dataset
- Cost: $0.00

### Step 5: Write E2E Tests (Real AI - Selective)
- Critical path only (3 tests)
- Use smallest test data
- Cost: ~$0.05

### Step 6: Run & Debug
- Fix any failures
- Document actual vs expected
- Create bug report

**Total Estimated Cost**: $0.06  
**Total Time**: 2-3 hours  
**Expected Bugs Found**: 5-10

---

**Shall I proceed with execution?**

