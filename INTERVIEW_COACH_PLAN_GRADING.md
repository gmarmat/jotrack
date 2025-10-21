# Interview Coach Implementation Plan - Grading Matrix

## Grading Criteria (100 points total)

### 1. Data Integrity & Reuse (25 points)
- [ ] Uses existing coach_state table (not new table) - 5 pts
- [ ] Reuses writingStyleProfile from Application Coach - 5 pts
- [ ] Reuses analysis bundle (JD + Resume) - no re-extraction - 5 pts
- [ ] Reuses company intelligence, people profiles - 5 pts
- [ ] All data preserved (no overwrites, no loss) - 5 pts

### 2. Naming Consistency (20 points)
- [ ] Database: snake_case (created_at, job_id, data_json) - 5 pts
- [ ] TypeScript: camelCase (createdAt, jobId, dataJson) - 5 pts
- [ ] Follows TERMINOLOGY_GUIDE.md (correct button labels) - 5 pts
- [ ] File naming matches existing patterns - 5 pts

### 3. Standards Compliance (20 points)
- [ ] UI_DESIGN_SPEC.md: Correct gradients, colors, spacing - 5 pts
- [ ] Uses existing components (AnalyzeButton, no reinvention) - 5 pts
- [ ] Follows established prompt template format - 5 pts
- [ ] API response format matches existing patterns - 5 pts

### 4. Risk Mitigation (15 points)
- [ ] No breaking changes to existing coach mode - 5 pts
- [ ] Graceful fallbacks if data missing - 5 pts
- [ ] Error handling at every API call - 5 pts

### 5. Testing Strategy (10 points)
- [ ] Manual testing checklist included - 3 pts
- [ ] E2E test outline - 3 pts
- [ ] Rollback plan if issues found - 4 pts

### 6. Implementation Clarity (10 points)
- [ ] Step-by-step order (no circular dependencies) - 4 pts
- [ ] Clear file paths and locations - 3 pts
- [ ] Code snippets for critical parts - 3 pts

---

## Scoring Thresholds

- **90-100**: Excellent - Ready to execute
- **80-89**: Good - Minor refinements needed
- **70-79**: Acceptable - Some risks remain
- **<70**: Needs significant improvement

---

## Plan Iteration Process

1. Create initial plan
2. Grade against matrix
3. Identify weak areas
4. Refine plan
5. Re-grade
6. Repeat until score ≥ 90

