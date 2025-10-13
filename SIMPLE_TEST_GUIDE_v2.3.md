# JoTrack v2.3 - Simple Testing Guide

**App URL**: http://localhost:3000  
**Test Duration**: 5-10 minutes  
**Build Status**: ✅ Clean & Ready

---

## 🧪 QUICK TEST CHECKLIST (3 Easy Tests)

### Test 1: Global Settings Modal (2 minutes)

**Steps**:
1. Open any page in the app
2. Look for ⚙️ gear icon in top-right header
3. Click the gear icon
4. Modal should open with 4 tabs: "AI & Privacy", "Data Management", "Preferences", "Developer"
5. Click through each tab
6. Click X or press Esc to close

**What to Look For**:
- ✅ Settings icon visible on ALL pages (home, job details, Coach Mode)
- ✅ Modal opens smoothly
- ✅ All 4 tabs clickable
- ✅ Can close with X or Esc

**If It Works**: Global settings successfully unified! 🎉

---

### Test 2: Coach Mode Auto-Fill & Auto-Save (3 minutes)

**Prerequisite**: Have a job with resume and/or JD attached (or create one and upload files)

**Steps**:
1. Navigate to any job
2. Click "Open Coach Mode" or visit Coach Mode
3. Look at the very top - should see green "Auto-Save: ON ✓" banner
4. Scroll to "Job Description" and "Resume" sections

**What to Look For - Auto-Fill**:
- If you uploaded a JD file: Text should appear pre-loaded in gray/read-only mode
- If you uploaded a Resume file: Text should appear pre-loaded in gray/read-only mode
- Should see a lock icon 🔒 and text "Read-only. Click 'Edit' to make changes"
- Click "Edit" button → Background turns white, text becomes editable
- Make a change → Should see "Revert to Baseline" and "Update Baseline" buttons
- Click "Revert" → Your edits disappear, back to original
- If NO files uploaded: Should see upload prompt + empty textarea (editable)

**What to Look For - Auto-Save**:
- Make ANY change (edit text, add a URL)
- Watch the green banner at top
- Should see "Saving..." (blue) for 1-2 seconds
- Then "Auto-Save: ON ✓ Last saved just now" (green)
- Refresh the page (F5)
- Your changes should still be there!

**If It Works**: Auto-fill and auto-save both working! 🎉

---

### Test 3: AI Branding & New Sections (2 minutes)

**Steps**:
1. Go to any Job detail page
2. Scroll to "AI Analysis" section
3. Look at the labels, badges, and buttons

**What to Look For - Branding**:
- Badge should say "AI Powered ●" (green dot) OR "Non-AI Powered ○" (gray dot)
- Button should say "Analyze with AI" (NOT "AInalyze")
- Should see Sparkles icon ✨ (not lightning bolt)

**What to Look For - New Sections**:
- Should see these sections in order:
  1. Match Score (with gauge)
  2. Skill Match (chart)
  3. **Company Intelligence** (NEW! - with company details)
  4. **Company Ecosystem Matrix** (NEW! - competitors table)
  5. Match Matrix (table)
  6. **People Profiles** (renamed from "People Insights")

- Company Intelligence should show:
  - Company name, founded date, employees
  - "What They Do" description
  - Key Facts, Culture & Values, Leadership
  - "Analyze" button (may show sample data if not run yet)

- People Profiles should show:
  - Only people (Recruiter, Hiring Manager)
  - NOT company info (that's now separate)
  - "What this means" interpretations

**If It Works**: All branding updated and new sections visible! 🎉

---

## 🐛 COMMON ISSUES & FIXES

### Issue: No gear icon in header
**Fix**: Refresh the page (server might still be hot-reloading)

### Issue: Resume/JD not auto-loading in Coach Mode
**Possible Cause**: No files uploaded yet
**Fix**: Upload a resume/JD in Job Settings → Files tab first

### Issue: Auto-save banner stays on "Saving..."
**Possible Cause**: API error
**Check**: Browser console (F12) for error messages

### Issue: Company Intelligence shows "Sample Data"
**Expected**: This is normal! Real data appears after clicking "Analyze" button (not implemented in this phase)

---

## ✅ SUCCESS CRITERIA

If all 3 tests pass:
- ✅ Settings unified and accessible
- ✅ Coach Mode smart and safe
- ✅ AI branding clear
- ✅ New sections rendering
- ✅ Ready for real usage!

---

## 🎯 BONUS TESTS (Optional)

### Bonus 1: Check Different Pages
- Home page → Settings icon visible?
- Job details → Settings icon visible?
- Coach Mode → Settings icon visible?
- Settings page → (Should still work if you navigate directly)

### Bonus 2: Test AI Status Indicators
- If you have NO API key configured:
  - Coach Mode Step 1 should show blue "Enable AI" link
- If you HAVE API key configured:
  - Coach Mode Step 1 should show green "AI Powered Analysis ●"
  - No more "Enable AI" link

### Bonus 3: Test Baseline Versioning
- Open Coach Mode
- If resume is pre-loaded, click "Edit"
- Change some text
- Click "Update Baseline"
- Refresh page
- Click "Edit" again
- Make NEW changes
- Click "Revert to Baseline"
- Should go back to what you saved as baseline (not original upload)

---

## 📊 WHAT CHANGED IN v2.3

**User-Visible**:
1. ⚙️ Global settings icon in header (all pages)
2. 🟢 "AI Powered" / ⚪ "Non-AI Powered" badges (clear branding)
3. ✨ "Analyze with AI" button (no more "AInalyze")
4. 💾 Auto-save banner in Coach Mode (green header)
5. 🔒 Smart pre-fill for Resume/JD with edit/revert
6. 🏢 Company Intelligence section (NEW!)
7. 📊 Company Ecosystem Matrix (NEW!)
8. 👥 People Profiles separated from company

**Technical**:
- New `coach_sessions` table for auto-save
- File extraction API for text pre-loading
- Baseline versioning system
- Settings modal with 4 tabs

---

**Total Test Time**: 5-10 minutes  
**If All Pass**: v2.3 is ready for daily use! 🚀

**Note**: Some features (3-level skills, modular AI, animations) are placeholders - they'll be completed in future phases based on your feedback on what we have so far.

