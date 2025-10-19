# Test People Profiles 2-Step Flow - 5 Minutes

**Quick testing guide for the new 2-step architecture**

---

## 🧪 Quick Test (5 min)

### Test 1: Add & Optimize (3 min)

1. **Go to any job page**
2. **Scroll to People Profiles section**
3. **Click "Manage People"**
4. **Click "Add Person"**
5. **Fill**:
   - Name: "Test Person"
   - Title: "Senior Engineer"
   - Role: Recruiter
   - Paste this sample LinkedIn text:
     ```
     I'm a passionate software engineer with 10 years of experience building scalable systems. I love mentoring junior developers and believe in code quality over speed. Previously led teams at Google and Amazon where I built payment processing systems serving millions of users daily.
     
     Experience:
     Senior Engineer at Tech Corp
     Jan 2020 - Present
     - Led team of 5 engineers
     - Reduced latency by 40%
     - Built microservices architecture
     
     Education:
     Stanford University
     BS Computer Science
     2010-2014
     
     Skills: Python, Go, Kubernetes, System Design
     ```
6. **Click "Save 1 Person"**

**CHECK**:
- ✅ See person in "Current Team (1)"
- ✅ Amber badge: "Not optimized ⚠️"
- ✅ Zap (⚡) button visible

7. **Click Zap (⚡) button**

**CHECK**:
- ✅ Button shows spinner
- ✅ After ~5s, badge turns green "Optimized ✓"
- ✅ Zap button disappears
- ✅ Eye (👁️) button appears

8. **Click Eye (👁️) button**

**CRITICAL CHECK**:
- ✅ Alert shows extracted data
- ✅ Open browser console
- ✅ Find logged JSON
- ✅ Check `aboutMe` field
- ✅ **Verify**: Exact same text as pasted (no summary!)

---

### Test 2: Analysis Block (2 min)

1. **Close modal** (don't optimize yet if you added another)
2. **Go back to jobs page**
3. **Check People Profiles section**

**If you have unoptimized**:
- ✅ Amber badge: "X Need Optimization"
- ✅ Amber message with instructions

4. **Click "Analyze People Profiles"**

**CHECK**:
- ✅ Error shown: "X profiles not optimized..."
- ✅ Analysis blocked (no API call)

5. **Go back to modal, optimize all**
6. **Return to jobs page**

**CHECK**:
- ✅ Green badge: "All Optimized - Ready"
- ✅ Green message: "All profiles optimized!"

7. **Click "Analyze People Profiles"**

**CHECK**:
- ✅ Analysis runs!
- ✅ Displays profile cards
- ✅ Shows overall insights

---

## 🎯 WHAT TO VERIFY

### Critical (Must Pass):
1. **Verbatim Preservation**: About text NOT summarized
2. **Analysis Block**: Can't analyze unoptimized profiles
3. **Optimize Button**: Appears/disappears correctly
4. **Status Badges**: Accurate (amber → green)

### Important (Should Pass):
1. **Eye Button**: Shows extracted data
2. **Priority Sorting**: Correct order (R > HM > P > O)
3. **Error Messages**: Clear and actionable
4. **Console Logs**: Helpful debugging info

### Nice to Have:
1. **Loader Animations**: Smooth transitions
2. **Dark Mode**: Everything looks good
3. **Multiple Profiles**: Priority works correctly

---

## 🐛 IF YOU FIND ISSUES

**Report Format**:
```
Issue: [Description]
Steps: [What you clicked]
Expected: [What should happen]
Actual: [What happened]
Console: [Any errors]
```

**Common Issues & Fixes**:

**Issue**: Zap button doesn't appear
- Check: Is rawText saved? (should be from paste)
- Fix: Re-save person with LinkedIn text

**Issue**: Extraction fails
- Check: Console error message
- Fix: Model might be wrong, check Settings

**Issue**: About text is summarized
- **CRITICAL**: This is a P0 bug, report immediately
- Expected: Exact preservation

**Issue**: Can analyze despite unoptimized
- **CRITICAL**: Block logic failed
- Expected: Error message shown

---

## ✅ SUCCESS LOOKS LIKE

```
✅ Add person with pasted text
✅ See "Not optimized" badge
✅ Click Zap → Optimizes in ~5s
✅ Badge turns green "Optimized"
✅ Eye shows extracted data
✅ aboutMe is VERBATIM (not summarized)
✅ All fields extracted correctly
✅ Parent analysis blocked until all optimized
✅ After all optimized, analysis works
✅ 2x2 grid displays with priority
✅ Overall insights shown
```

---

**Go test! Focus on verbatim preservation first!** 🎯

