# Coach Mode - Bugs Discovered During Testing

**Date**: October 18, 2025  
**Testing Method**: Manual persona journey testing  
**Personas Tested**: Sarah (Low), Marcus (Medium), Elena (High)  

---

## 🚨 Critical (P0) - Breaks Core Functionality

### Bug #1: Next.js Build Error - Cannot find module './vendor-chunks/@swc.js'
**Severity**: Critical  
**Persona**: All  
**Step**: Page loading (Coach Mode, Jobs, Home)  
**Symptom**: Pages return 500 error  
**Expected**: Pages load successfully  
**Actual**: Error: Cannot find module './vendor-chunks/@swc.js'  
**Root Cause**: Next.js build cache corruption or dependency issue  
**Fix Priority**: P0  
**Fix Estimate**: 10 min  
**Fix**: Clear .next cache and rebuild  
**Commands**:
```bash
rm -rf .next
npm run dev
```
**Status**: ⏳ Pending fix

---

### Bug #2: coach_status Column Query Errors  
**Severity**: Critical  
**Persona**: All  
**Step**: Loading job data, analysis data  
**Symptom**: `SqliteError: no such column: "coach_status"`  
**Expected**: Column exists after migration  
**Actual**: Migration didn't apply ALTER TABLE commands  
**Root Cause**: Migration 010 ALTER statements need to be idempotent  
**Fix Priority**: P0  
**Fix Estimate**: 5 min  
**Fix**: Already manually fixed with ALTER TABLE commands  
**Status**: ✅ Fixed (manually added columns)

---

### Bug #3: Continuous API Polling Prevents Page Loading
**Severity**: Critical  
**Persona**: All  
**Step**: Any page load  
**Symptom**: Pages timeout, never reach 'networkidle'  
**Expected**: Page loads in < 5s  
**Actual**: Continuous API calls prevent load completion  
**Likely Sources**:
- `/api/jobs/[id]/check-staleness` polling
- `/api/coach/[jobId]/save` auto-save
- useEffect hooks without cleanup  
**Fix Priority**: P0  
**Fix Estimate**: 30 min  
**Fix**:
1. Audit all useEffect hooks
2. Add cleanup functions: `return () => clearInterval(interval)`
3. Increase polling intervals (1s → 30s)
4. Only poll when necessary (not on every page)  
**Status**: ⏳ Pending investigation

---

## 🔴 High (P1) - Major UX Issues

### Bug #4: Invalid Job ID Doesn't Redirect to Home
**Severity**: High  
**Persona**: All  
**Step**: Navigating to /coach/invalid-id  
**Symptom**: Stays on invalid URL, shows error page  
**Expected**: Alert shown, redirect to home  
**Actual**: No redirect happens (alert may appear but redirect fails)  
**Fix Priority**: P1  
**Fix Estimate**: 10 min  
**Fix**: Check if `router.push('/')` is working in error handler  
**Status**: ⏳ Pending investigation

---

### Bug #5: Home Page "Jobs" Text Not Found
**Severity**: High  
**Persona**: All  
**Step**: Loading home page  
**Symptom**: Test can't find "Jobs" text on home  
**Expected**: Jobs list or "Jobs" heading visible  
**Actual**: Text may be different or page structure changed  
**Fix Priority**: P1  
**Fix Estimate**: 5 min  
**Fix**: Update home page to have clear "Jobs" heading or use data-testid  
**Status**: ⏳ Needs investigation

---

## 🟡 Medium (P2) - Minor Functional Issues

(To be discovered during persona testing)

---

## 🟢 Low (P3) - Polish & Nice-to-Have

(To be discovered during persona testing)

---

## ✨ Enhancements (Not Bugs)

### Enhancement #1: Recommendations Engine Not Implemented
**Note**: This is expected - recommendations are a future feature
**Priority**: Future  
**For**: Sarah persona (low match score)

### Enhancement #2: Interview Prep Tabs Show Placeholders
**Note**: This is expected - interview prep APIs not yet built
**Priority**: High (next sprint)  
**For**: Elena persona (high match, needs interview prep)

---

## 📊 Bug Statistics

| Priority | Count | Status |
|----------|-------|--------|
| P0 (Critical) | 3 | 1 fixed, 2 pending |
| P1 (High) | 2 | 2 pending |
| P2 (Medium) | 0 | To be discovered |
| P3 (Low) | 0 | To be discovered |
| Enhancements | 2 | Expected/planned |

**Total Bugs**: 5 discovered (before persona testing)  
**Fixed**: 1  
**Remaining**: 4  

---

## 🎯 Next Steps

1. **Fix P0 Bugs** (Critical blockers):
   - Clear .next cache (Bug #1)
   - Investigate API polling (Bug #3)
   - Restart dev server

2. **Begin Persona Testing**:
   - Start with Marcus (most realistic)
   - Document new bugs as discovered
   - Screenshot each bug
   - Update this document continuously

3. **After Testing**:
   - Prioritize all bugs
   - Create fix plan
   - Estimate effort
   - Ship fixes

---

## 📝 Bug Report Template

**For new bugs discovered**:
```markdown
### Bug #X: [Short Title]
**Severity**: Critical / High / Medium / Low  
**Persona**: Sarah / Marcus / Elena / All  
**Step**: Which journey step  
**Symptom**: What user sees  
**Expected**: What should happen  
**Actual**: What actually happens  
**Screenshot**: [Link or description]  
**Fix Priority**: P0 / P1 / P2 / P3  
**Fix Estimate**: X minutes  
**Fix**: How to fix  
**Status**: ⏳ Pending / 🔧 In Progress / ✅ Fixed / ❌ Won't Fix
```

---

**Testing will continue and this document will be updated live!**

