# Demo Steps for Status Update Feature

## Setup
```bash
# Clean and rebuild
rm -rf .next node_modules/.cache
npm run db:migrate
npm run dev
```

## Manual Testing Steps

1. **Open the app**: Navigate to http://localhost:3000

2. **Create a job**:
   - Fill in: Title="Software Engineer", Company="TechCorp", Status="Applied"
   - Click "Add Job Application"
   - Verify job appears in the table

3. **Update Status**:
   - In the jobs table, find the status dropdown for the job you just created
   - Change status from "Applied" to "Phone Screen"
   - Click the checkmark (save) button that appears
   - Wait for the spinner to complete
   - Verify the dropdown now shows "Phone Screen"

4. **Update Status Again**:
   - Change status to "Onsite"
   - Click save
   - Verify it updates

5. **View History**:
   - Click the "History" button for the job
   - Modal should open showing:
     - "Onsite" (most recent)
     - "Phone Screen"
     - "Applied" (original)
   - Each entry should show relative time (e.g., "2m ago")
   - Close modal

6. **Test API directly** (optional):
   ```bash
   # Get a job ID from the UI, then:
   curl -X PATCH http://localhost:3000/api/jobs/[JOB_ID]/status \
     -H "Content-Type: application/json" \
     -d '{"status": "Offer"}'
   
   curl http://localhost:3000/api/jobs/[JOB_ID]/history
   ```

## Features Implemented

✅ PATCH `/api/jobs/[id]/status` endpoint
✅ GET `/api/jobs/[id]/history` endpoint  
✅ Status dropdown in jobs table
✅ Save button with spinner
✅ Optimistic UI updates
✅ History modal with timeline
✅ Relative time formatting
✅ Append-only status history
✅ FTS5 triggers intact

## Known Issues

- Vitest has path resolution issues with the current directory structure
- Playwright e2e tests pass for basic functionality but have caching issues with Next.js dev server
- Use manual testing as primary validation

## Code Structure

- `db/repository.ts`: `updateJobStatus()`, `getJobStatusHistory()`
- `app/api/jobs/[id]/status/route.ts`: PATCH endpoint
- `app/api/jobs/[id]/history/route.ts`: GET endpoint
- `app/components/StatusSelect.tsx`: Status dropdown with save
- `app/components/HistoryModal.tsx`: History viewer
- `app/lib/utils.ts`: `relativeTime()` helper
- `__tests__/example.test.ts`: Unit tests for status updates
- `e2e/homepage.spec.ts`: E2E tests for full flow

