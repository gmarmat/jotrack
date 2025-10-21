# People Profiles Data Persistence - Root Cause & Fix

## Investigation Summary

### ✅ What I Found

1. **Migration exists**: `db/migrations/0021_company_people_analyses.sql` ✅
2. **Table created**: `people_analyses` table exists ✅
3. **Column exists**: `jobs.people_profiles_analyzed_at` exists ✅
4. **API saves data**: `/api/ai/people-analysis` does save to DB (line 251-261) ✅
5. **API loads data**: `/api/jobs/[id]/analysis-data` does load from DB (line 205-247) ✅
6. **Component receives data**: `PeopleProfilesCard` props include `profiles`, `overallInsights`, `analyzedAt` ✅

### ❌ Root Cause

**The table is empty!** - No data has been saved yet.

**Why?**
- User added people profiles in modal (stored in `people_profiles` table)
- User clicked "AI Analysis" button
- AI analysis may have:
  - A) Not run at all (button didn't trigger)
  - B) Run but failed (error not visible to user)
  - C) Run successfully but save failed silently

### 🔍 Verification Needed

Let me check the terminal logs for People Profiles analysis...

**From terminal (line 838-841)**:
```
📋 Loading people for job 3957289b-30f5-4ab2-8006-3a08b6630beb...
✅ Found 3 people linked to job
```

**But NO analysis logs!** No:
```
✅ People analysis saved and timestamp updated for job...
```

**Conclusion**: Analysis button was NOT clicked, or analysis failed before saving.

---

## Fix Strategy

### Option A: Verify Current State (Non-Invasive)

1. Check if `people_profiles_analyzed_at` is set for user's job
2. Check if data exists in `people_analyses` table
3. If NOT: User simply hasn't run AI analysis yet
4. Guide user to click [Analyze] button

### Option B: Debug Analysis Endpoint (If Needed)

1. Add more logging to `/api/ai/people-analysis`
2. Check if optimized profiles exist (endpoint requires `isOptimized = 1`)
3. Verify AI call completes successfully
4. Verify save succeeds

### Option C: Test with Mock Data (Quick Win)

1. Manually insert test data into `people_analyses`
2. Verify it loads correctly
3. Confirms infrastructure works, just needs real analysis run

---

## Recommended Action

**Option C + Option A**: Quick test, then guide user

### Step 1: Insert Test Data

```sql
-- For job 3957289b-30f5-4ab2-8006-3a08b6630beb
INSERT INTO people_analyses (job_id, result_json, created_at)
VALUES (
  '3957289b-30f5-4ab2-8006-3a08b6630beb',
  '{"profiles":[{"name":"Test Person","role":"Recruiter","background":["Test background"],"expertise":["Test skill"],"whatThisMeans":"Test insight"}],"overallInsights":{"teamDynamics":"Test dynamics","culturalFit":"Test fit","preparationTips":["Tip 1"]}}',
  strftime('%s', 'now') * 1000
);

-- Update timestamp
UPDATE jobs
SET people_profiles_analyzed_at = strftime('%s', 'now')
WHERE id = '3957289b-30f5-4ab2-8006-3a08b6630beb';
```

### Step 2: Refresh Page

User should see:
- ✅ "Analyzed X min ago" badge
- ✅ Profiles display (not sample data)
- ✅ Insights section populated

### Step 3: If It Works

Infrastructure is fine! User just needs to:
1. Ensure all profiles are optimized (Zap button)
2. Click [Analyze People Profiles] button
3. Wait 30-45 seconds
4. Data will persist!

---

## Implementation

Let me insert test data and verify it loads correctly, then guide user.

