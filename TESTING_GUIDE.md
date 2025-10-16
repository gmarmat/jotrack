# 🧪 Testing Guide - All APIs Wired!

**Status**: All 5 main analysis APIs are now wired to the UI! Ready for testing.

---

## 🔑 **Step 1: Set Up Your API Key** (One-time)

1. Start the dev server if not running:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000

3. Click **⚙️ Settings** (top-right corner)

4. Go to **"AI & Privacy"** tab

5. Enter your OpenAI API key:
   - Get one at: https://platform.openai.com/api-keys
   - Paste it in the input field
   - Click **"Save Settings"**

6. Verify: You should see "✅ Key configured" message

---

## 📝 **Step 2: Create a Test Job**

1. Click **"+ New Job"** button

2. Fill in basic info:
   - **Position**: Product Manager (or any role)
   - **Company**: Google (or any company)
   - **Status**: Applied

3. Click **"Create"**

4. Job detail page opens automatically

---

## 📎 **Step 3: Upload Documents**

### Option A: Use Test Files (Recommended)

1. Click **"Attachments"** button in job header

2. Upload your own files:
   - **Resume** (PDF/DOCX): Drop in "Resume" zone
   - **Job Description** (PDF/DOCX/TXT): Drop in "Job Description" zone

3. Click **"X"** to close modal

### Option B: Upload Test PDFs

If you don't have files, create simple test docs:
- Create `test-resume.txt` with any resume text
- Create `test-jd.txt` with any job description
- Upload as Resume and JD

---

## 🔄 **Step 4: Extract Variants** (Required First Step)

**What This Does**: Extracts 3 variants (raw, ai_optimized, detailed) from your uploaded docs.

1. Look at the **Data Status Panel** (purple collapsible section)

2. You should see:
   - 🟣 Purple state: "No Variants - Upload docs and click Refresh"

3. Click **"Refresh Data"** button

4. Wait 5-10 seconds

5. Panel should turn 🔵 Blue: "Variants Fresh"

6. Check console logs:
   ```
   🔄 Starting raw text extraction...
   ✅ Saved raw variant (512 words)
   ✅ AI-optimized variant extracted (240 words)
   ✅ Detailed variant extracted (480 words)
   ```

---

## 🎯 **Step 5: Test Each Analysis Section**

### 1️⃣ Match Matrix

**Location**: Bottom section titled "Match Matrix"

**Test Steps**:
1. Find the "⚙️ Analyze" button (top-right of Match Matrix card)
2. Click it
3. Wait 10-20 seconds (first time is slower)
4. Check browser console (F12):
   ```
   🔄 Refreshing AI insights... match
   ✅ Match Matrix evaluation complete: {
     signals: 30,
     overallScore: "85%",
     jdVersion: 1,
     resumeVersion: 1
   }
   ```
5. UI should update:
   - Real match score (e.g., "85% Fit")
   - Real signals with evidence from your resume/JD
   - Category weights summing to 100%

**Cost**: ~$0.05 per analysis

---

### 2️⃣ Company Ecosystem

**Location**: Middle section titled "Company Ecosystem"

**Test Steps**:
1. Find the "⚙️ Analyze" button (top-right of Ecosystem card)
2. Click it
3. Wait 15-30 seconds (web research happens)
4. Check browser console:
   ```
   🔄 Refreshing AI insights... ecosystem
   ✅ Ecosystem analysis complete: {
     companies: 10,
     cost: "$0.15",
     cached: false
   }
   ```
5. UI should update:
   - 10 real companies in your company's ecosystem
   - Categories: Direct, Indirect, Tangential competitors
   - Relevance scores, insights

6. Click **"View Full Analysis"** to see detailed 13-column table

**Cost**: ~$0.15 first time, then cached for 7 days (~95% cost savings!)

---

### 3️⃣ Company Intelligence

**Location**: Top-left section titled "Company Intelligence"

**Test Steps**:
1. Find the "⚙️ Analyze" button (top-right of Company Intelligence card)
2. Click it
3. Wait 10-20 seconds (web search happens)
4. Check browser console:
   ```
   🔄 Refreshing AI insights... company
   ✅ Company intelligence complete: {
     cost: "$0.08",
     webSearchUsed: true
   }
   ```
5. UI should update:
   - **What They Do**: Real company description
   - **Key Facts**: Founded, size, location, funding
   - **Leadership**: Real CEO/founders
   - **Culture**: Work style, values
   - **Competitors**: Top 3-5 competitors

**Cost**: ~$0.08 per analysis

---

### 4️⃣ Match Score

**Location**: Top section titled "Match Score"

**Test Steps**:
1. Find the "⚙️ Analyze" button (top-right of Match Score card)
2. Click it
3. Wait 10-15 seconds
4. Check browser console:
   ```
   🔄 Refreshing AI insights... skills
   ✅ Match score analysis complete: {
     score: 0.85,
     cost: "$0.05"
   }
   ```
5. UI should update:
   - **Overall Score**: Real match percentage
   - **Top Highlights**: Your strongest points
   - **Critical Gaps**: What you're missing
   - **Skills Chart**: Required vs. Your skills

**Cost**: ~$0.05 per analysis

---

### 5️⃣ People Profiles

**Location**: Bottom section titled "People Profiles"

**Test Steps**:
1. Find the "⚙️ Analyze" button (top-right of People Profiles card)
2. Click it
3. Wait 10-15 seconds
4. Check browser console:
   ```
   🔄 Refreshing AI insights... people
   ✅ User profile analysis complete: {
     cost: "$0.03"
   }
   ```
5. UI should update:
   - Your background profile
   - Key expertise areas
   - Cultural fit insights
   - Team dynamics tips

**Cost**: ~$0.03 per analysis

---

## 🚀 **Step 6: Test "Analyze All"** (Optional)

**What This Does**: Runs all 5 analyses sequentially in one click.

1. Find **"Analyze All"** button (in Data Status Panel or job header)
2. Click it
3. Wait 60-90 seconds (all analyses run)
4. Check console:
   ```
   🔄 Refreshing AI insights... all
   ✅ Company intelligence complete...
   ✅ Match score analysis complete...
   ✅ Match Matrix evaluation complete...
   ✅ Ecosystem analysis complete...
   ✅ User profile analysis complete...
   ✅ All analyses complete!
   ```
5. All sections should update with real data!

**Total Cost**: ~$0.36 for all 5 analyses (first time)
**Subsequent**: ~$0.21 (ecosystem cached for 7 days)

---

## ✅ **What to Verify**

### Data Status Panel
- [ ] Shows correct state (Purple → Blue → Green)
- [ ] Displays token counts and costs
- [ ] "Refresh Data" button works
- [ ] Staleness detection works (change resume → panel turns Orange)

### Match Matrix
- [ ] Shows real signals (not "Technical Skills" sample)
- [ ] Evidence quotes match your actual resume/JD
- [ ] Overall score calculated correctly
- [ ] Expand/collapse works

### Company Ecosystem
- [ ] Shows 10 real companies (not "Acme Corp")
- [ ] Compact table displays correctly
- [ ] Full modal shows 13 columns
- [ ] Cache metadata displays (age, expiration)

### Company Intelligence
- [ ] Real company data (not "TechCorp")
- [ ] Web search results visible
- [ ] Leadership names are real
- [ ] Competitors are accurate

### Match Score
- [ ] Real highlights from your resume
- [ ] Real gaps based on JD requirements
- [ ] Skills chart shows your actual skills

### People Profiles
- [ ] Profile reflects your resume data
- [ ] Insights are personalized
- [ ] Not generic sample data

---

## 🐛 **Common Issues**

### "No API key configured"
- Go to Settings → AI & Privacy → Enter OpenAI key

### "No Job Description found"
- Upload a JD first, then click "Refresh Data"

### "Variants not found"
- Click "Refresh Data" button first to extract variants

### Analysis fails with error
- Check browser console (F12) for detailed error
- Verify API key is valid
- Check you have OpenAI credits

### Data doesn't update
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Check browser console for errors

---

## 💰 **Cost Tracking**

All costs are logged to browser console. Look for:

```
✅ Ecosystem analysis complete: { cost: "$0.15", cached: false }
✅ Company intelligence complete: { cost: "$0.08", webSearchUsed: true }
✅ Match score analysis complete: { cost: "$0.05" }
✅ Match Matrix evaluation complete: { overallScore: "85%" }
✅ User profile analysis complete: { cost: "$0.03" }
```

**Total for Full Job Analysis**:
- First time: ~$0.36
- Subsequent (ecosystem cached): ~$0.21
- Per year (50 jobs, 1x each): ~$10.50

---

## 📊 **Success Criteria**

✅ All 5 sections show REAL data (not sample)
✅ Console shows successful API calls with costs
✅ No errors in browser console
✅ Data persists after page reload
✅ Staleness detection works (orange state when docs change)
✅ Cache works (ecosystem costs $0.15 first time, then cached)

---

## 🎉 **You're Ready!**

All APIs are wired and functional. The app now:
- ✅ Extracts document variants (raw, ai_optimized, detailed)
- ✅ Runs real AI analyses with GPT-4o-mini
- ✅ Shows actual insights from your resume/JD
- ✅ Caches expensive research (95% cost savings)
- ✅ Updates UI without page reloads
- ✅ Tracks costs and tokens

**Next**: Use the app for real job applications! 🚀

