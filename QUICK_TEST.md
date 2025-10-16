# ✅ Quick Test Checklist

**Goal**: Test all 5 wired APIs in 10 minutes!

---

## 🔑 **STEP 1: Setup (One-time)**

1. ✅ Dev server running? → Check http://localhost:3000
2. Click **⚙️ Settings** (top-right)
3. Go to **AI & Privacy** tab
4. Paste OpenAI key
5. Click **Save Settings**
6. Close modal

**✓ Success**: See "Key configured" message

---

## 📝 **STEP 2: Create Test Job**

1. Click **+ New Job**
2. Enter:
   - **Company**: Google
   - **Position**: Product Manager
3. Click **Create**

**✓ Success**: Job page opens

---

## 📎 **STEP 3: Upload Documents**

1. Click **Attachments** button (in job header)
2. Drop resume in "Resume" zone
3. Drop job description in "JD" zone
4. Close modal (X button)

**✓ Success**: See "2 attachments" in header

---

## 🔄 **STEP 4: Extract Variants**

1. Find **Data Status Panel** (purple collapsible box)
2. Click **Refresh Data** button
3. Wait 10 seconds

**✓ Success**: 
- Panel turns **Blue** ("Variants Fresh")
- Console shows: `✅ Variants saved for [filename]`

---

## 🎯 **STEP 5: Test Match Matrix**

1. Scroll to **Match Matrix** section (bottom)
2. Click **⚙️** button (top-right of card)
3. Wait 15 seconds
4. Check browser console (F12)

**✓ Success**: 
- Console: `✅ Match Matrix evaluation complete: { signals: 30, overallScore: "85%" }`
- UI shows real signals with your resume text

---

## 🏢 **STEP 6: Test Company Ecosystem**

1. Scroll to **Company Ecosystem** section
2. Click **⚙️** button
3. Wait 20 seconds
4. Check console

**✓ Success**: 
- Console: `✅ Ecosystem analysis complete: { companies: 10, cost: "$0.15" }`
- UI shows 10 real companies (not "Acme Corp")
- Click **View Full Analysis** → see detailed table

---

## 🔍 **STEP 7: Test Company Intelligence**

1. Scroll to **Company Intelligence** section (top-left)
2. Click **⚙️** button
3. Wait 15 seconds
4. Check console

**✓ Success**: 
- Console: `✅ Company intelligence complete: { cost: "$0.08", webSearchUsed: true }`
- UI shows real Google data (CEO, founded year, etc.)

---

## 💯 **STEP 8: Test Match Score**

1. Scroll to **Match Score** section (top)
2. Click **⚙️** button
3. Wait 10 seconds
4. Check console

**✓ Success**: 
- Console: `✅ Match score analysis complete: { score: 0.85 }`
- UI shows real highlights from your resume
- Real gaps based on JD

---

## 👥 **STEP 9: Test People Profiles**

1. Scroll to **People Profiles** section
2. Click **⚙️** button
3. Wait 10 seconds
4. Check console

**✓ Success**: 
- Console: `✅ User profile analysis complete: { cost: "$0.03" }`
- UI shows profile based on your resume

---

## 🚀 **BONUS: Test "Analyze All"**

1. Scroll back to **Data Status Panel**
2. Click **Analyze All** button
3. Wait 60 seconds
4. Watch console

**✓ Success**: 
- All 5 sections run sequentially
- Console: `✅ All analyses complete!`
- Total cost: ~$0.36 (first time)

---

## ❌ **Troubleshooting**

**"No API key configured"**
→ Go back to STEP 1, add key in Settings

**"No Job Description found"**
→ Go back to STEP 3, upload JD

**"Variants not found"**
→ Go back to STEP 4, click "Refresh Data"

**API fails with error**
→ Check console (F12) for error message
→ Verify API key is valid

**Data shows sample instead of real**
→ Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

---

## 📊 **Verify Everything Works**

After all tests, you should see:

- [ ] Match Matrix shows 30 real signals (not "Technical Skills" sample)
- [ ] Company Ecosystem shows 10 real companies (not "Acme Corp")
- [ ] Company Intelligence shows real company data (real CEO name)
- [ ] Match Score shows real highlights/gaps from your docs
- [ ] People Profiles shows profile based on your resume
- [ ] All costs logged in console
- [ ] Data persists after page refresh

---

## 🎉 **Done!**

**Total time**: ~10 minutes
**Total cost**: ~$0.36

All 5 APIs are working! The app is functional end-to-end. 🚀

**Next**: Use for real job applications or report any issues you found!

