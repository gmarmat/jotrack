# Exhaustive E2E Test Suite - Data Pipeline

**After User Testing**: Found 3 bugs that initial strategy missed  
**New Strategy**: More comprehensive, scenario-based testing  
**Focus**: Real user actions, UI verification, edge cases

---

## 🎯 Why Previous Strategy Missed Bugs

### Gap Analysis

**What We Missed**:
1. ❌ UI visual verification (3-column vs 2-column)
2. ❌ PDF format corner case testing
3. ❌ Old variant format migration testing
4. ❌ Error message user-friendliness
5. ❌ Cross-job testing (different jobs, different states)

**Why We Missed Them**:
- Too focused on unit/integration (not enough UI)
- Assumed PDF would work (didn't test failure path)
- Didn't test with real existing data (used fresh test data)
- Didn't verify user-facing messages

---

## 🏗️ New Exhaustive Strategy

### Test Matrix (Expanded)

**Dimensions**:
1. **Jobs**: Fresh vs Existing data
2. **File Formats**: PDF vs DOCX vs TXT
3. **States**: All 6 staleness states
4. **UI Elements**: All buttons, modals, badges
5. **Error Paths**: Every possible failure
6. **Cross-Feature**: Downstream integration

**Total Scenarios**: 100+ theoretical → 50 critical tests

---

## 📋 EXHAUSTIVE TEST SUITE

### CATEGORY A: File Format Testing (12 tests)

**A1: TXT Resume Extraction**
```
Given: Upload test-resume.txt
When: Click "Refresh Data"
Then:
  ✓ Raw variant created (local, free)
  ✓ AI-optimized variant created (~$0.01)
  ✓ Cost shown: ~$0.01
  ✓ "Analyzed X seconds ago" appears
  ✓ No errors shown
```

**A2: DOCX Resume Extraction**
```
Given: Upload resume.docx
When: Click "Refresh Data"
Then:
  ✓ Mammoth extracts text successfully
  ✓ Raw variant has content
  ✓ AI-optimized created
  ✓ Word count reasonable (300-500)
```

**A3: PDF Resume Extraction (Expected Failure)**
```
Given: Upload resume.pdf
When: Click "Refresh Data"
Then:
  ✓ Error shown: "🖼️ Cannot extract text from this PDF"
  ✓ Suggests: "Convert to .docx or .txt"
  ✓ No AI variant created
  ✓ Cost: $0.00 (no wasted AI call)
  ✓ User can still proceed with other formats
```

**A4: TXT JD Extraction**
**A5: DOCX JD Extraction**
**A6: PDF JD Extraction (Expected Failure)**
**A7: TXT Cover Letter Extraction**
**A8: DOCX Cover Letter Extraction**
**A9: PDF Cover Letter Extraction (Expected Failure)**

**A10: Mixed Formats (Resume=DOCX, JD=TXT)**
```
Given: Upload resume.docx + jd.txt
When: Click "Refresh Data"
Then:
  ✓ Both extracted successfully
  ✓ 4 variants total (2 per doc)
  ✓ Cost: ~$0.02
```

**A11: All PDF (Expected Partial Failure)**
```
Given: Upload resume.pdf + jd.pdf
When: Click "Refresh Data"
Then:
  ✓ Both fail with clear messages
  ✓ Suggests converting all to DOCX
  ✓ No variants created
  ✓ Cost: $0.00
```

**A12: Corrupted File**
```
Given: Upload corrupted.docx
When: Click "Refresh Data"
Then:
  ✓ Error: "Failed to extract..."
  ✓ Suggests re-saving or converting
  ✓ Doesn't crash entire extraction
```

---

### CATEGORY B: UI Verification (10 tests)

**B1: Variant Viewer Column Count**
```
Given: Any extracted document
When: Open variant viewer
Then:
  ✓ Shows ONLY 2 columns (Raw, AI-Optimized)
  ✓ NO Detailed column shown
  ✓ Grid is grid-cols-2 (not cols-3)
```

**B2: Active Badge Visibility**
```
Given: Job with multiple resume versions
When: Open Attachments modal
Then:
  ✓ Active version has GREEN "ACTIVE" badge
  ✓ Badge has checkmark icon
  ✓ Badge is prominent (not subtle text)
  ✓ Inactive versions have NO badge
  ✓ Inactive versions have "Make Active" button
```

**B3: Variant Text Display**
```
Given: AI-optimized variant exists
When: Open variant viewer, select AI-Optimized
Then:
  ✓ Shows PLAIN TEXT (not JSON stringify)
  ✓ Text is readable (no formatting artifacts)
  ✓ Contains actual content (name, skills, etc.)
  ✓ NOT showing: {"text":"...","wordCount":287}
```

**B4: Token Count Display**
```
Given: Variants created
When: View variant viewer headers
Then:
  ✓ Raw shows: "XXX tokens"
  ✓ AI-Optimized shows: "XXX tokens" (lower than raw)
  ✓ Token count is NUMBER not "undefined"
```

**B5: Staleness Banner**
```
Given: Documents changed
When: View job page
Then:
  ✓ Orange/yellow banner shown
  ✓ Message: "Key documents changed - re-analysis recommended"
  ✓ Banner dismissable or persistent (design choice)
```

**B6: Refresh Data Button States**
```
States:
  - No documents: Disabled + tooltip "Upload documents first"
  - Documents but no variants: Enabled + "Extract data (~$0.02)"
  - Variants exist, fresh: Enabled + "Re-extract if needed"
  - Extracting: Disabled + spinner + "Extracting..."
  - Error: Enabled + "Retry" + error message shown
```

**B7-B10**: Footer text, empty states, loading spinners, error displays

---

### CATEGORY C: Staleness Logic (12 tests)

**C1: Initial Upload → No Variants**
```
Test: checkAnalysisStaleness()
Input: Job with attachments, no variants
Output:
  severity: 'no_variants'
  message: "Documents uploaded - click 'Refresh Data' (~$0.02)"
  isStale: true
  hasVariants: false
```

**C2: After Refresh → Variants Fresh**
```
Test: After refresh-variants success
Output:
  severity: 'variants_fresh'
  message: "AI data ready - click 'Analyze All' (~$0.20)"
  hasVariants: true
  hasAnalysis: false
```

**C3: After Analyze All → Fresh**
```
Test: After full analysis
Output:
  severity: 'fresh'
  message: "Analysis is up to date"
  isStale: false
  hasAnalysis: true
```

**C4: Upload New Version (Different Content) → Major Stale**
```
Test: Upload resume v2 with new skills
Trigger: Database trigger fires
Output:
  severity: 'major'
  message: "Key documents changed - re-analysis strongly recommended"
  changedArtifacts: ['resume']
```

**C5: Upload New Version (Identical Content) → Stays Fresh**
```
Test: Upload resume v2 identical to v1
Fingerprint: Content hash unchanged
Output:
  severity: 'fresh' (doesn't change!)
  message: "Analysis is up to date"
```

**C6: Switch Active Version (Different) → Stale**
```
Test: Mark resume v2 as active (different from v1)
Trigger: Attachment update trigger
Output:
  severity: 'major'
  changedArtifacts: ['resume']
```

**C7: Switch Active Version (Identical) → Stays Fresh**
```
Test: Mark resume v2 as active (same content as v1)
Fingerprint: Unchanged
Output:
  severity: 'fresh'
```

**C8: Delete Active Version → No Variants (Edge Case)**
```
Test: Delete the only active resume
Result: No active attachments
Output:
  severity: 'no_variants' OR 'never_analyzed'
```

**C9-C12**: Partial uploads, multiple changes, rapid succession, concurrent actions

---

### CATEGORY D: Version Management (8 tests)

**D1: Single Active Per Type Enforcement**
```
Test: Database constraint
Given: Resume v1, v2, v3 all uploaded
When: Mark v2 as active
Verify in DB:
  SELECT is_active FROM attachments WHERE kind='resume'
  v1: 0
  v2: 1  ← Only this one
  v3: 0
```

**D2: Active Badge Switches Correctly**
```
Given: Resume v1 (active), v2 (inactive)
When: Click "Make Active" on v2
Then:
  ✓ v1 badge disappears
  ✓ v2 gets GREEN "ACTIVE" badge
  ✓ v1 now shows "Make Active" button
  ✓ Database updated correctly
```

**D3: Refresh Data Processes Active Only**
```
Given: Resume v1 (inactive), v2 (active), v3 (inactive)
When: Click "Refresh Data"
Verify Terminal:
  "📎 Found 1 active attachments:"
  "   - resume: [v2 filename] (v2, isActive=1)"
  NOT showing v1 or v3
```

**D4: Drag-to-Reorder Versions**
```
Test: VersionsPanel drag functionality
Given: v1, v2, v3
When: Drag v3 to top
Then:
  ✓ Visual order changes
  ✓ is_active status unchanged
  ✓ Only visual preference saved (localStorage)
```

**D5-D8**: Delete active, restore deleted, bulk operations

---

### CATEGORY E: Downstream Integration (10 tests)

**E1: Match Score Consumes AI-Optimized**
```
Setup: Fortive job with variants
When: Click "Analyze" in Match Score
Monitor: API request to /analyze-match-score
Verify:
  ✓ Uses ai_optimized variant (not raw)
  ✓ Extracts .text property correctly
  ✓ Match score calculated (0-100)
  ✓ Skills extracted properly
  ✓ No errors about missing fields
```

**E2: Company Intel Uses JD Variant**
```
When: Click "Analyze" in Company Intelligence
Verify:
  ✓ Fetches JD ai_optimized variant
  ✓ Extracts company name from text
  ✓ Runs Tavily search
  ✓ Returns company intelligence
```

**E3: Skills Match Works**
```
When: Click "Analyze" in Skills
Verify:
  ✓ Uses both resume and JD ai_optimized
  ✓ Extracts skills from text
  ✓ Returns matched/missing/bonus
```

**E4: Interview Coach Generates Questions**
```
When: Generate interview questions
Verify:
  ✓ Uses resume ai_optimized
  ✓ Uses JD ai_optimized
  ✓ Questions reference actual resume content
  ✓ Questions align with JD requirements
```

**E5: People Profiles Analysis**
```
When: Analyze people profiles
Verify:
  ✓ Uses resume variant for candidate context
  ✓ Uses JD variant for role requirements
  ✓ Matching works correctly
```

**E6: Bundle System Updated**
```
When: Variants created
Verify:
  ✓ saveAnalysisBundle() called
  ✓ Extracts .text from variants
  ✓ Saves to bundle table
  ✓ Fingerprint calculated correctly
```

**E7-E10**: Cross-feature scenarios

---

### CATEGORY F: Edge Cases & Errors (15 tests)

**F1: Empty File Upload**
```
Given: empty.txt (0 bytes)
When: Upload + Refresh Data
Then:
  ✓ Raw extraction: Success but empty
  ✓ AI call: Skipped (validation catches it)
  ✓ Error: "File is empty, no content to extract"
```

**F2: Very Large File (10,000 words)**
```
Given: huge-resume.txt (10,000 words)
When: Refresh Data
Then:
  ✓ Raw extraction: Success
  ✓ AI-optimized: Condenses to 500-800 words
  ✓ All key facts preserved
  ✓ Cost: ~$0.02 (acceptable)
  ✓ Time: < 30 seconds
```

**F3: Special Characters (Unicode)**
```
Given: Resume with: Søren, résumé, 中文, emoji 🚀
When: Extract variants
Then:
  ✓ Characters preserved in raw
  ✓ Characters preserved in AI-optimized
  ✓ No encoding errors
```

**F4: Rapid Clicking (Concurrency)**
```
Given: Job with documents
When: Click "Refresh Data" 5 times rapidly
Then:
  ✓ Doesn't create duplicate variants
  ✓ Queue or lock prevents race conditions
  ✓ All requests complete successfully
  ✓ Final state correct (2 variants per doc)
```

**F5: Network Failure During AI Call**
```
Simulate: AI API returns 500 error
When: Refresh Data
Then:
  ✓ Raw variant still created (local)
  ✓ AI-optimized fails gracefully
  ✓ Error: "AI extraction failed, retry or use raw text"
  ✓ User can retry
```

**F6: API Timeout**
```
Simulate: AI takes > 30 seconds
Then:
  ✓ Request times out
  ✓ Error shown: "Extraction timed out, please retry"
  ✓ Raw variant saved
  ✓ Can retry AI extraction
```

**F7: Missing API Key**
```
Given: No OpenAI/Claude API key
When: Refresh Data
Then:
  ✓ Raw variant created ✓
  ✓ AI-optimized fails with clear error
  ✓ Error: "AI API key not configured. Add in Settings."
  ✓ Link to Settings page
```

**F8: Multiple Jobs Same Time**
```
Given: 3 jobs open in different tabs
When: Click "Refresh Data" in all 3 simultaneously
Then:
  ✓ All complete successfully
  ✓ No cross-contamination (correct variants to correct jobs)
  ✓ Costs tracked separately
```

**F9: Delete During Extraction**
```
Given: Extraction in progress
When: User deletes the attachment
Then:
  ✓ Extraction completes or cancels gracefully
  ✓ No orphaned variants
  ✓ Database consistent
```

**F10: Switch Active During Extraction**
```
Given: Extracting resume v1
When: User marks v2 as active mid-extraction
Then:
  ✓ v1 extraction completes
  ✓ v2 marked as active
  ✓ Next extraction uses v2
```

**F11-F15**: Browser refresh, offline mode, low memory, slow network, large batch

---

### CATEGORY G: Real User Journeys (15 tests)

**G1: First-Time User - Happy Path**
```
Scenario: Brand new user, first job application

Steps:
1. User creates job "Senior Engineer at Google"
2. Uploads resume.docx (300 words)
3. Uploads jd.txt (500 words)
4. Sees "Documents uploaded - click Refresh Data"
5. Hovers Refresh Data button → sees "~$0.02"
6. Clicks Refresh Data
7. Waits 10 seconds
8. Sees "Analyzed 3 seconds ago"
9. Opens variant viewer
10. Sees 2 columns: Raw (clean) + AI-Optimized (cleaner)
11. Closes modal
12. Clicks "Analyze All"
13. Sees Match Score, Company Intel populate
14. Status changes to "Fresh"

Verify at each step:
  ✓ Appropriate UI feedback
  ✓ No confusing messages
  ✓ Clear next steps
  ✓ Costs transparent
```

**G2: Experienced User - Resume Iteration**
```
Scenario: User improving resume based on feedback

Steps:
1. User has analyzed job (state: fresh)
2. Downloads resume, edits in Word (adds AWS skill)
3. Uploads resume v2
4. Sees "v2" badge appear
5. Sees orange banner: "Key documents changed"
6. Clicks "Make Active" on v2 (if not auto-active)
7. Clicks "Refresh Data"
8. Sees comparison: "Added: AWS" in changes
9. Clicks "Analyze All"
10. Match score increases (72 → 78)
11. Sees improvement highlighted

Verify:
  ✓ Change detected automatically
  ✓ Comparison accurate
  ✓ Score improvement visible
  ✓ User feels progress
```

**G3: Power User - Multi-Job Workflow**
```
Scenario: Applying to 5 jobs simultaneously

Steps:
1. Create 5 jobs
2. Upload same resume to all 5 (reuse)
3. Upload different JDs to each
4. Click "Refresh Data" on each
5. All extract successfully
6. Variants not duplicated (smart caching)
7. Each job has independent analysis
8. Resume improvements apply across all jobs

Verify:
  ✓ Efficient (resume variants reused where possible)
  ✓ Independent (JD variants unique per job)
  ✓ Cost optimized (not 5x extraction for same resume)
```

**G4: User Encounters PDF Issue**
```
Scenario: User tries to upload PDF resume

Steps:
1. Uploads resume.pdf
2. Clicks "Refresh Data"
3. Sees error: "🖼️ Cannot extract... likely scanned"
4. Sees suggestions: "Convert to .docx"
5. User converts PDF to DOCX using Word
6. Uploads resume-converted.docx
7. Marks as active (replaces PDF)
8. Clicks "Refresh Data"
9. Extraction succeeds!

Verify:
  ✓ Error message helpful (not technical jargon)
  ✓ Clear actionable steps
  ✓ User can recover without support
  ✓ Workflow continues smoothly
```

**G5: User Switches Between Versions**
```
Scenario: Comparing two resume versions

Steps:
1. Has resume v1 and v2 (both analyzed)
2. Viewing job page with v1 active (match: 72)
3. Clicks Attachments modal
4. Clicks "Make Active" on v2
5. Sees badge switch (v1 → v2)
6. Sees "Documents changed" banner
7. Clicks "Analyze All"
8. Sees v2 match score (78)
9. Compares: v2 is better!
10. Keeps v2 active

Verify:
  ✓ Easy to switch versions
  ✓ Clear which is active
  ✓ Re-analysis automatic
  ✓ Can compare scores
```

**G6-G15**: More complex scenarios

---

### CATEGORY H: Cross-Job Testing (5 tests)

**H1: Same Resume, Different Jobs**
```
Given: Upload same resume to Job A and Job B
When: Refresh Data on both
Then:
  ✓ Resume variants created once (reused)
  ✓ JD variants unique per job
  ✓ Cost: ~$0.02 total (not $0.04)
  ✓ Fingerprints different (different JDs)
```

**H2: Different Resumes, Same Company**
```
Test: Two different roles at same company
Verify: Company intel reused, resumes independent
```

**H3-H5**: Migration scenarios, data cleanup, bulk operations

---

## 🚀 EXECUTION PLAN

I'll now execute the most critical tests:

### Phase 1: Fix Current Bugs (10 min)
- [x] Remove Detailed column from viewer
- [ ] Verify text display (not JSON)
- [ ] Test FuelCell with PDF error

### Phase 2: Critical Path Tests (20 min)
- [ ] Test A1, A2, A3 (TXT, DOCX, PDF)
- [ ] Test B1, B3 (UI verification)
- [ ] Test C1-C4 (Staleness)
- [ ] Test E1 (Match Score integration)

### Phase 3: Edge Cases (15 min)
- [ ] Test F3 (Special characters)
- [ ] Test F4 (Rapid clicking)
- [ ] Test F7 (Missing API key)

### Phase 4: Bug Report (5 min)
- [ ] Document all findings
- [ ] Categorize severity
- [ ] Create fix list

**Total: 50 minutes of testing**

Shall I proceed with execution?

