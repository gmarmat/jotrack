# Staleness Check System - Document Change Detection

## Purpose

The Staleness Check System monitors when active documents (Resume, JD, Cover Letter) have changed and alerts users to re-run the Data Pipeline to ensure all AI analysis uses the most up-to-date content.

## Why It Exists

**Problem**: Users might:
- Upload a new version of their resume
- Update the job description
- Modify uploaded documents

**Risk**: If we don't re-process these changes:
- Match Score analyzes OLD resume vs OLD JD
- Interview Questions generated from STALE job description
- Coach Mode uses OUTDATED profile information
- All downstream analysis is based on obsolete data

**Solution**: Track document changes and prompt users to refresh variants + re-analyze

---

## How It Works

### 1. **Fingerprint Calculation** (`lib/analysis/fingerprintCalculator.ts`)

Every analysis creates a "fingerprint" - a SHA256 hash of:
- Content hashes of all active document variants (ui, ai_optimized, detailed)
- User profile data
- Job metadata

```typescript
calculateAnalysisFingerprint(jobId) → "abc123def456..."
```

### 2. **State Tracking** (`jobs` table)

Each job stores:
- `analysisState`: Current state of analysis
  - `'pending'` - Never analyzed
  - `'variants_fresh'` - Variants ready, need analysis
  - `'fresh'` - Analysis up to date
  - `'stale'` - Documents changed, need refresh
- `analysisFingerprint`: Hash of last successful analysis

### 3. **Staleness Detection** (`checkAnalysisStaleness()`)

Compares:
- **Old Fingerprint**: `job.analysisFingerprint` (from last analysis)
- **New Fingerprint**: Current document state

**If different** → Documents have changed → Mark as STALE

### 4. **Severity Levels**

```typescript
type Severity = 
  | 'fresh'           // ✅ Everything up to date
  | 'never_analyzed'  // ⚠️  Never run analysis
  | 'no_variants'     // 🔄 Need to extract variants first (~$0.02)
  | 'variants_fresh'  // 📊 Variants ready, run analysis (~$0.20)
  | 'minor'           // 🟡 Small changes (e.g., cover letter)
  | 'major'           // 🔴 Critical changes (resume or JD changed)
```

### 5. **User-Facing Messages**

**Data Pipeline Section** shows context-appropriate actions:

| State | Message | Button(s) |
|-------|---------|-----------|
| `no_variants` | "Documents uploaded - click 'Refresh Data' to extract AI-optimized data (~$0.02)" | **Refresh Data** |
| `variants_fresh` | "AI data ready - click 'Analyze All' to generate insights (~$0.20)" | **Analyze All** |
| `major` | "Key documents changed - re-analysis strongly recommended" | **Refresh Data** + **Analyze All** (highlighted) |
| `minor` | "Minor updates detected - consider re-analyzing" | **Refresh Data** + **Analyze All** |
| `fresh` | Shows "Analyzed 5m ago" badge | **Analyze All** (maintenance) |

---

## Data Flow

### Upload Scenario
```
1. User uploads Resume v2 (replaces v1)
   ↓
2. Document marked as isActive=true
   ↓
3. Next page load: checkStaleness() runs
   ↓
4. New fingerprint calculated
   ↓
5. Compare: NEW ≠ OLD
   ↓
6. Set analysisState = 'stale'
   ↓
7. UI shows: "Key documents changed - re-analysis strongly recommended"
   ↓
8. User clicks "Refresh Data"
   ↓
9. Variants extracted for Resume v2
   ↓
10. analysisState = 'variants_fresh'
   ↓
11. UI shows: "AI data ready - click 'Analyze All'"
   ↓
12. User clicks "Analyze All"
   ↓
13. All sections re-analyze with Resume v2 data
   ↓
14. New fingerprint saved
   ↓
15. analysisState = 'fresh'
   ↓
16. Badge shows: "Analyzed just now"
```

---

## Change Detection Logic

### What Triggers STALE?

**Major Changes** (Severity: `major`):
- Resume content changed (any variant)
- Job Description content changed (any variant)
- Active document switched (e.g., Resume v1 → v2)

**Minor Changes** (Severity: `minor`):
- Cover Letter updated
- Notes modified
- Metadata changes (company name, title)

**No Change** (Severity: `fresh`):
- Same documents
- Same variants
- Same profile data

### Detection Method

```typescript
// OLD: Last analysis fingerprint
const oldFingerprint = job.analysisFingerprint; // "abc123..."

// NEW: Current state fingerprint
const newFingerprint = await calculateAnalysisFingerprint(jobId); // "xyz789..."

// Compare
if (oldFingerprint !== newFingerprint) {
  // STALE! Find what changed:
  const changes = await detectChanges(jobId, oldFingerprint, newFingerprint);
  
  if (changes.includes('resume') || changes.includes('jd')) {
    return { severity: 'major', changedArtifacts: changes };
  } else {
    return { severity: 'minor', changedArtifacts: changes };
  }
}

// Fingerprints match → Fresh!
return { severity: 'fresh' };
```

---

## API Endpoint

### `GET /api/jobs/[id]/check-staleness`

**Returns**:
```json
{
  "isStale": true,
  "severity": "major",
  "message": "Key documents changed - re-analysis strongly recommended",
  "changedArtifacts": ["resume", "jd"],
  "hasVariants": true,
  "hasAnalysis": true,
  "variantsAnalyzedAt": 1761019247
}
```

**Called**:
- On page load (job detail page)
- After document upload
- After "Refresh Data" completes
- After "Analyze All" completes

---

## UI Integration

### Data Pipeline Header (`app/jobs/[id]/page.tsx`)

```tsx
<div className="flex items-center gap-2">
  {/* Timestamp Badge */}
  {stalenessInfo?.variantsAnalyzedAt && (
    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
      Analyzed {formatTimeAgo(stalenessInfo.variantsAnalyzedAt)}
    </span>
  )}
  
  {/* Action Button */}
  <AnalyzeButton
    onAnalyze={stalenessInfo?.severity === 'no_variants' ? handleRefreshVariants : handleGlobalAnalyze}
    isAnalyzing={refreshing || analyzing}
    label={stalenessInfo?.severity === 'no_variants' ? "Extract Variants" : "Analyze All"}
    estimatedCost={stalenessInfo?.severity === 'no_variants' ? 0.02 : 0.05}
  />
</div>
```

---

## Benefits

### 1. **Cost Efficiency**
- Don't re-run $0.20 analysis if nothing changed
- Only extract variants ($0.02) when documents actually change

### 2. **Data Accuracy**
- All sections always use latest document versions
- No risk of analyzing old resume with new JD

### 3. **User Awareness**
- Clear indication when re-analysis needed
- Timestamp shows data freshness ("Analyzed 5m ago")
- Visual cues (badges, button states)

### 4. **Workflow Optimization**
- Two-step process: Refresh Data → Analyze All
- Skip Refresh if variants already exist
- Skip Analyze if content hasn't changed

---

## Edge Cases Handled

### Case 1: Toggle Between Versions
**Scenario**: User switches Resume v1 → v2 → v1 (same content)
**Handling**: Uses content hash, not version number. No false positives!

### Case 2: First Upload
**Scenario**: User uploads documents for first time
**Handling**: `analysisState = 'pending'`, no fingerprint yet. Shows "Extract Variants" button.

### Case 3: Document Deletion
**Scenario**: User deletes Resume
**Handling**: Fingerprint changes (document missing). Shows STALE. Need to re-process.

### Case 4: Metadata-Only Change
**Scenario**: User updates job title (no document changes)
**Handling**: Fingerprint includes metadata, but marked as `minor` change (not critical).

---

## Future Enhancements

### Potential Improvements:
1. **Granular Timestamps**: Track when each section was last analyzed
2. **Partial Re-Analysis**: Only re-run sections affected by changes
3. **Change Preview**: Show diff of what changed in documents
4. **Auto-Refresh**: Option to automatically refresh variants when documents change
5. **Variant Comparison**: Side-by-side view of old vs new variants

---

## Technical Implementation

### Database Schema
```sql
-- jobs table
ALTER TABLE jobs ADD COLUMN analysis_state TEXT DEFAULT 'pending';
ALTER TABLE jobs ADD COLUMN analysis_fingerprint TEXT;
ALTER TABLE jobs ADD COLUMN last_full_analysis_at INTEGER;
```

### Key Files
- `lib/analysis/fingerprintCalculator.ts` - Core logic
- `app/api/jobs/[id]/check-staleness/route.ts` - API endpoint
- `app/jobs/[id]/page.tsx` - UI integration
- `db/schema.ts` - Database schema

### Dependencies
- `crypto` - SHA256 hashing
- `drizzle-orm` - Database queries
- `artifact_variants` table - Variant content hashes

---

## Monitoring & Debugging

### Check Staleness State
```bash
sqlite3 data/jotrack.db "SELECT id, title, analysis_state, analysis_fingerprint FROM jobs WHERE id = '[job-id]'"
```

### View Fingerprint History
```sql
SELECT 
  j.title,
  j.analysis_state,
  j.analysis_fingerprint,
  COUNT(av.id) as variant_count,
  MAX(av.created_at) as latest_variant
FROM jobs j
LEFT JOIN attachments a ON a.job_id = j.id AND a.is_active = 1
LEFT JOIN artifact_variants av ON av.source_id = a.id AND av.is_active = 1
WHERE j.id = '[job-id]'
GROUP BY j.id;
```

### Debug Fingerprint Calculation
```typescript
// In browser console:
const response = await fetch('/api/jobs/[id]/check-staleness');
const staleness = await response.json();
console.log('Current State:', staleness);
```

---

## Summary

The Staleness Check System ensures **data freshness** and **cost efficiency** by:
- ✅ Detecting when documents change
- ✅ Alerting users to refresh variants
- ✅ Preventing analysis of stale data
- ✅ Showing clear timestamps and status
- ✅ Providing appropriate action buttons

**Key Principle**: Always analyze the most current data, but don't waste money re-analyzing unchanged documents.

