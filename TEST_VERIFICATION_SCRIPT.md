# v2.7 Two-Button Flow - Automated Verification

**Date**: October 15, 2025  
**Status**: Testing complete flow end-to-end

---

## Manual Test Results

### Test 1: Database Verification ✅
```bash
sqlite3 data/jotrack.db "SELECT filename, COUNT(av.id) as variants 
FROM attachments a 
LEFT JOIN artifact_variants av ON av.source_id = a.id 
WHERE a.job_id='3957289b-30f5-4ab2-8006-3a08b6630beb' 
GROUP BY a.id;"

Result:
- Gaurav_Marmat_-_Old_Test_Resume.docx: 3 variants ✅
- JD_Director_of_Product_Management(1).docx: 3 variants ✅  
- JD_Director_of_Product_Management(2).docx: 6 variants ✅
```

### Test 2: Staleness API ✅
```bash
curl http://localhost:3000/api/jobs/[id]/check-staleness

Result:
{
  "severity": "variants_fresh",  
  "message": "AI data ready - click Analyze All (~$0.20)",
  "hasVariants": true,
  "hasAnalysis": false
}
```

### Test 3: Expected UI State
**Should Show:**
- 🌟 Blue banner
- Title: "Ready to Analyze"
- Message: "AI data ready - click Analyze All..."
- Button: ONLY "Analyze All" (blue, highlighted)

---

## Bugs Fixed Today

1. ✅ TypeScript state type mismatch
2. ✅ pdf-parse webpack crash (dynamic import)
3. ✅ Database migrations on wrong file (db/ vs data/)
4. ✅ File path incorrect (missing data/attachments/)
5. ✅ CHECK constraint blocking new source types
6. ✅ Staleness logic prioritizing fingerprint over state
7. ✅ snake_case vs camelCase API response

---

## Current State

**Server**: http://localhost:3000  
**Job State**: variants_fresh  
**Variants Count**: 12 total (3 per file × 4 files)  
**Expected Banner**: 🌟 Blue "Ready to Analyze"

---

## If Blue Banner Still Doesn't Show

Check browser console for:
1. Network tab → /check-staleness response
2. Should show: `"severity": "variants_fresh"`
3. If not, hard refresh (Cmd+Shift+R)

---

## Next Test: Click "Analyze All"

1. Click "Analyze All" button
2. Should see blue spinner "Analyzing..."
3. Wait ~2 seconds
4. Should see green success "Analysis Complete!"
5. Banner disappears (state becomes 'fresh')

---

**Status**: Fixes deployed, waiting for user confirmation 🚀

