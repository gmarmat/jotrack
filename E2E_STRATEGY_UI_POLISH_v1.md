# E2E Testing Strategy - UI Polish Features
**Version**: 1.0  
**Date**: October 18, 2025  
**Scope**: New UI features + Regression testing

---

## 🎯 **TEST OBJECTIVES**

1. Verify all 12 new UI features work correctly
2. Ensure no regressions in existing Coach Mode functionality
3. Test People Profiles end-to-end flow
4. Validate design compliance (all guides)
5. Performance benchmarking

---

## 📋 **TEST COVERAGE MATRIX**

### Category 1: New UI Features (12 tests)
| ID | Feature | Test | Priority |
|----|---------|------|----------|
| N1 | Company Intel Sources | Real URLs displayed (not example.com) | P0 |
| N2 | Document Status - Resume | Green checkmark + filename shown | P0 |
| N3 | Document Status - JD | Green checkmark + filename shown | P0 |
| N4 | Document Status - Cover Letter | "Not created" → "Generated" after Coach | P1 |
| N5 | Data Pipeline - Analyzed badge | Shows "Xm ago" / "Xh ago" / "Xd ago" | P0 |
| N6 | Data Pipeline - Explain section | Blue box with workflow explanation | P0 |
| N7 | Button Standardization | All buttons same height (visual check) | P1 |
| N8 | Coach Mode Locked State | Shows when no matchScore + no companyIntel | P0 |
| N9 | Progression Hint #1 | Shows "Upload Resume + JD", dismissible | P1 |
| N10 | Progression Hint #2 | Shows "Click Refresh Data", dismissible | P1 |
| N11 | Progression Hints Dismiss | One click dismisses all, persists in localStorage | P1 |
| N12 | Button Sizing | Attachments + Refresh buttons same width | P1 |

### Category 2: People Profiles (8 tests)
| ID | Feature | Test | Priority |
|----|---------|------|----------|
| PP1 | Manage People Button | Opens modal, shows count badge | P0 |
| PP2 | Modal Opens | Cyan gradient, proper structure | P0 |
| PP3 | Add Person Form | Fields render correctly | P0 |
| PP4 | LinkedIn URL Input | Can enter URL | P0 |
| PP5 | Test Fetch Button | Shows loading → success/failed state | P1 |
| PP6 | Manual Text Fallback | Textarea appears if fetch fails | P1 |
| PP7 | Role Selector | 4 options (recruiter/hiring_manager/peer/other) | P0 |
| PP8 | Save People | Saves to DB, count updates, modal closes | P0 |

### Category 3: Regression Tests (15 tests)
| ID | Feature | Test | Priority |
|----|---------|------|----------|
| R1 | Coach Mode Entry | Still works from Jobs page | P0 |
| R2 | Discovery Questions | Generate and display | P0 |
| R3 | Discovery Wizard | 4 batches, navigation works | P0 |
| R4 | Auto-save | Still triggers within 3s | P0 |
| R5 | Persistence | Answers survive refresh | P0 |
| R6 | Profile Analysis | Completes and unlocks Score tab | P0 |
| R7 | Score Recalculation | Shows before/after scores | P0 |
| R8 | Resume Generation | Generates and displays | P0 |
| R9 | Resume Finalization | Accept button works | P0 |
| R10 | Cover Letter | Generates correctly | P0 |
| R11 | Mark as Applied | Transitions to post-app phase | P0 |
| R12 | Interview Questions | Generate for recruiter | P1 |
| R13 | Match Score | Still analyzes correctly | P0 |
| R14 | Company Intelligence | Still analyzes correctly | P0 |
| R15 | Company Ecosystem | Still analyzes correctly | P1 |

### Category 4: Integration Tests (5 tests)
| ID | Feature | Test | Priority |
|----|---------|------|----------|
| I1 | Sources Modal | Opens from Company Intel, shows real URLs | P0 |
| I2 | Variant Viewer | Opens from Column 2 quick buttons | P1 |
| I3 | Notes Section | Still scrollable and functional | P1 |
| I4 | Theme Toggle | All new features work in dark mode | P1 |
| I5 | Responsive Design | 3-column layout adapts to mobile | P1 |

---

## 🎬 **TEST SCENARIOS**

### Scenario 1: New User Flow (with Progression Hints)
1. Create new job (no attachments)
2. Verify Hint #1: "Upload Resume + JD" appears
3. Upload Resume + JD
4. Verify Hint #2: "Click Refresh Data" appears
5. Click "Refresh Data"
6. Dismiss hints (click X)
7. Refresh page - hints should NOT reappear
8. Clear localStorage - hints reappear

### Scenario 2: People Profiles Complete Flow
1. Navigate to job detail page
2. Scroll to People Profiles section
3. Click "Manage People" button
4. Verify modal opens with cyan gradient
5. Click "+ Add Person"
6. Fill name: "Samir Kumar"
7. Fill LinkedIn: https://www.linkedin.com/in/samirvkumar/
8. Select role: "Hiring Manager"
9. Click "Test Fetch" (should fail and show textarea)
10. Paste manual text in textarea
11. Repeat for Chelsea Powers (Recruiter) and Tushar Mathur (Peer)
12. Click "Save 3 People"
13. Verify count badge shows "3"
14. Click "Analyze People Profiles"
15. Verify AI generates insights
16. Verify sources show real LinkedIn URLs

### Scenario 3: Coach Mode Locked State
1. Create new job with NO analysis
2. Verify Coach Mode card shows locked state
3. Verify message: "Run Match Score or Company Intelligence first"
4. Run Match Score analysis
5. Verify Coach Mode card unlocks

### Scenario 4: Regression - Full Coach Mode Flow
1. Enter Coach Mode
2. Generate discovery questions (should use mocks)
3. Answer questions
4. Complete discovery
5. Verify profile analysis
6. Recalculate score
7. Generate resume
8. Accept resume
9. Generate cover letter
10. Mark as applied
11. Verify ALL steps still work

---

## 📊 **SELF-GRADING MATRIX**

### Coverage (40 points)
- [ ] All 12 new features tested (12 points)
- [ ] All 8 People Profiles features tested (8 points)
- [ ] All 15 regression tests included (15 points)
- [ ] Edge cases covered (5 points)

### Quality (30 points)
- [ ] Clear test descriptions (5 points)
- [ ] Proper assertions (5 points)
- [ ] Error handling tested (5 points)
- [ ] Performance benchmarks (5 points)
- [ ] Accessibility checks (5 points)
- [ ] Dark mode verification (5 points)

### Completeness (20 points)
- [ ] Data validation (5 points)
- [ ] UI state transitions (5 points)
- [ ] localStorage persistence (5 points)
- [ ] Database integrity (5 points)

### Documentation (10 points)
- [ ] Test steps documented (5 points)
- [ ] Expected results clear (5 points)

**TOTAL SCORE**: 0/100

---

## 🚨 **GAPS IDENTIFIED IN v1.0**

1. ❌ No localStorage testing strategy
2. ❌ No dark mode specific tests
3. ❌ No mobile responsiveness tests
4. ❌ No performance benchmarks
5. ❌ No accessibility checks (ARIA, keyboard nav)
6. ❌ No error state testing (API failures)
7. ❌ No concurrent user testing
8. ❌ No data race condition tests
9. ❌ Missing button alignment visual verification
10. ❌ No test for "Analyzed X ago" time format accuracy

**v1.0 GRADE**: D (40/100) - Needs significant improvement!

---

## 🔄 **ITERATION NEEDED**

Will create v2.0 with:
- Comprehensive edge case coverage
- Performance + accessibility tests
- Dark mode verification
- localStorage persistence tests
- Visual regression checks
- Error handling scenarios

