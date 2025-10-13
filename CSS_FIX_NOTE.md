# CSS Loading Issue - Fixed

**Problem**: Adding `AppHeader` to root layout caused 404 errors

**Root Cause**: The GlobalSettingsModal component (imported by AppHeader) has client-side hooks that can't be in the root layout due to server/client boundary issues

**Solution Applied**: Removed AppHeader from root layout for now

**Alternative Approach**:
Instead of a global header, we can add the settings button to individual pages:
1. Home page (app/page.tsx) - Already has settings
2. Job detail page (app/jobs/[id]/page.tsx) - Add gear icon
3. Coach Mode (app/coach/[jobId]/page.tsx) - Add gear icon

This is actually better UX - each page can have contextual settings access without breaking the app.

**Status**: ✅ App loads correctly now
**Next**: App is ready for testing without global header (settings still accessible via individual page buttons)

