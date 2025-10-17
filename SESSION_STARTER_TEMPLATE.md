# Session Starter Template - Copy & Paste This!

## 📋 **For Starting New Sessions with AI Assistant**

Copy and paste this template at the start of each session to give AI proper context:

---

### **Quick Context Prompt (Use This)**

```
Hi! Continuing work on JoTrack (AI-powered job tracking app).

CRITICAL REFERENCES (read these first):
1. CURRENT_STATE.md - What works, what's in progress, immediate next steps
2. TERMINOLOGY_GUIDE.md - Correct names (Refresh Data, Match Matrix, Settings UI)
3. QUICK_REFERENCE.md - API endpoints, data structures, common tasks

KEY FACTS:
- Button is "Refresh Data" NOT "Extract Data"
- FitTable displays as "Match Matrix" NOT "FitTable"  
- API keys via Settings UI (⚙️ top-right) NOT .env.local
- Settings → AI & Privacy tab → Add Claude key (primary) + Tavily (web search)
- **Company Ecosystem & Intelligence WIRED and working with real AI!**
- Models auto-load on Settings open

CURRENT PRIORITY:
[Insert your goal: e.g., "Wire People Profiles" or "Test Match Score analysis"]

TECH STACK:
- Next.js 14, React 18, TypeScript, Tailwind
- SQLite (better-sqlite3) + Drizzle ORM
- **Claude 3.5 Sonnet (primary)** + OpenAI (fallback)
- **Tavily Search API** for real-time web research
- Encrypted API key storage in database

Please check CURRENT_STATE.md before starting work!
```

---

## 🎯 **When to Use Different Prompts**

### **For UI/UX Work:**
```
Working on UI for [Component Name].

Check:
- UI_DESIGN_SYSTEM.md for component patterns
- Section gradients and dark mode standards
- AnalysisExplanation positioning (2nd last)

Current section colors:
- Match Score: Purple-blue
- Skill Match: Amber-yellow  
- Company Intelligence: Indigo-blue
- Ecosystem: Emerald-green
- People Profiles: Cyan-blue
```

### **For API Integration:**
```
Wiring [Section Name] to API.

Check:
- QUICK_REFERENCE.md for API endpoints
- CURRENT_STATE.md for API status (exists vs needs creation)
- File: app/components/ai/[ComponentName].tsx
- Look for onRefresh prop to wire

Existing APIs (WIRED):
- /api/jobs/[id]/analyze-ecosystem ✅ WORKING
- /api/jobs/[id]/analyze-company ✅ WORKING
- /api/jobs/[id]/evaluate-signals ✅ Ready
- /api/jobs/[id]/analyze-match-score ✅ Ready
- /api/jobs/[id]/analyze-user-profile ✅ Ready (needs UI wiring)
```

### **For Documentation:**
```
Updating documentation.

Current public docs (keep updated):
- README.md
- CURRENT_STATE.md
- TERMINOLOGY_GUIDE.md
- QUICK_REFERENCE.md
- UI_DESIGN_SYSTEM.md
- CHANGELOG.md
- KNOWN_ISSUES.md
- ARCHITECTURE.md
- SIGNAL_LEGEND.md
- PREVIEW_SYSTEM_GUIDE.md

Don't create new *_PLAN.md or *_STATUS.md files!
Update existing public docs instead.
```

---

## ⚡ **Quick Start Checklist for AI**

Before starting ANY task, AI should:

- [ ] Read CURRENT_STATE.md (understand project status)
- [ ] Check TERMINOLOGY_GUIDE.md (use correct names)
- [ ] Review relevant section in QUICK_REFERENCE.md
- [ ] Verify which APIs exist vs need creation
- [ ] Understand what's sample data vs real
- [ ] Know which components are wired vs not

---

## 🚨 **Red Flags (AI Assistant Should Catch)**

If AI says these, correct immediately:

❌ "Click Extract Data" → ✅ "Click Refresh Data"
❌ "Create .env.local" → ✅ "Use Settings → AI & Privacy"
❌ "FitTable component" → ✅ "Match Matrix"
❌ "prompts/ecosystem.v1.md" → ✅ "core/ai/prompts/ecosystem.v1.md"
❌ "All APIs work" → ✅ "Check CURRENT_STATE.md API status"

---

## 📊 **Decision Tree: Which Doc to Check?**

```
What are you trying to do?

├─ Understand project status?
│  └─> CURRENT_STATE.md
│
├─ Check correct naming?
│  └─> TERMINOLOGY_GUIDE.md
│
├─ Find API endpoint?
│  └─> QUICK_REFERENCE.md
│
├─ Build new UI component?
│  └─> UI_DESIGN_SYSTEM.md
│
├─ Understand system design?
│  └─> ARCHITECTURE.md
│
├─ Check if something works?
│  └─> CURRENT_STATE.md → "What Works" section
│
├─ Find file location?
│  └─> QUICK_REFERENCE.md → "Where Things Are"
│
├─ See what's broken?
│  └─> KNOWN_ISSUES.md
│
└─ Quick task lookup?
   └─> QUICK_REFERENCE.md → "Common Tasks"
```

---

## 💡 **Pro Tips**

### **For You (User):**

1. **Start each session** with the Quick Context Prompt above
2. **Reference docs** when asking questions:
   - "Check CURRENT_STATE.md - can we wire Ecosystem now?"
   - "Per TERMINOLOGY_GUIDE, what's the correct button name?"
3. **Point to specific sections**:
   - "Update CURRENT_STATE.md after wiring this API"
   - "Add this to KNOWN_ISSUES.md"

### **For AI Assistant:**

1. **Always** read CURRENT_STATE.md at session start
2. **Check TERMINOLOGY_GUIDE** before using names
3. **Verify** API status before suggesting work
4. **Update docs** after completing tasks
5. **Ask clarifying questions** if unsure (better than guessing!)

---

## 🎯 **Session Types & Best Practices**

### **Quick Fix Session (< 30 min)**
```
Prompt: "Quick fix: [specific issue]. Check CURRENT_STATE.md first."

AI should:
1. Read CURRENT_STATE → "Known Issues"
2. Fix the issue
3. Update KNOWN_ISSUES.md
4. Commit and push
```

### **Feature Development (1-2 hours)**
```
Prompt: "Build [feature]. Follow UI_DESIGN_SYSTEM.md patterns."

AI should:
1. Check CURRENT_STATE.md (dependencies)
2. Follow UI_DESIGN_SYSTEM.md (if UI work)
3. Use QUICK_REFERENCE.md (API patterns)
4. Update CURRENT_STATE.md (mark feature complete)
5. Update CHANGELOG.md
```

### **API Integration (2-4 hours)**
```
Prompt: "Wire [Section] to API. Check which endpoints exist in CURRENT_STATE.md."

AI should:
1. CURRENT_STATE.md → API Endpoints section
2. Check if API exists or needs creation
3. Create API if needed (use existing as template)
4. Wire UI to API
5. Test and verify
6. Update CURRENT_STATE.md
```

### **Documentation Update**
```
Prompt: "Update docs after [change]. Which files need updates?"

AI should update:
1. CURRENT_STATE.md (if status changed)
2. TERMINOLOGY_GUIDE.md (if new terms)
3. QUICK_REFERENCE.md (if new APIs/patterns)
4. CHANGELOG.md (if user-facing change)
5. KNOWN_ISSUES.md (if bugs fixed)
```

---

## 📖 **Documentation Hierarchy**

```
Level 1: Quick Reference (check first)
├─ CURRENT_STATE.md       → "Where are we?"
├─ TERMINOLOGY_GUIDE.md   → "What's it called?"
└─ QUICK_REFERENCE.md     → "How do I do X?"

Level 2: Detailed Guides (when building)
├─ UI_DESIGN_SYSTEM.md    → "How to build components"
├─ ARCHITECTURE.md        → "How does the system work?"
└─ PREVIEW_SYSTEM_GUIDE.md → "How do features work?"

Level 3: Specific Domains
├─ SIGNAL_LEGEND.md       → "ATS signal system"
└─ KNOWN_ISSUES.md        → "What's broken?"

Level 4: Project Management
├─ CHANGELOG.md           → "What changed when?"
└─ README.md              → "Overall project intro"
```

**Rule of thumb**: Start at Level 1, drill down as needed.

---

## 🔄 **Keeping Docs Fresh**

### **After Each Session:**

Update these files:
```bash
# If status changed:
CURRENT_STATE.md → Update relevant sections

# If terminology introduced:
TERMINOLOGY_GUIDE.md → Add new entries

# If new API/pattern:
QUICK_REFERENCE.md → Add to lookup tables

# If user-facing change:
CHANGELOG.md → Add entry with date
```

### **Monthly Audit:**

1. Review CURRENT_STATE.md accuracy
2. Update percentage completions
3. Remove completed items from "What Needs Work"
4. Update "Last Updated" dates
5. Verify all links still work

---

## 🎓 **Example Session Flows**

### **Example 1: User wants to wire Ecosystem**

**User says:**
> "Let's wire the Company Ecosystem to the real API. Check CURRENT_STATE to see what's ready."

**AI should:**
1. ✅ Read CURRENT_STATE.md → "API Endpoints" → See `/analyze-ecosystem` exists
2. ✅ Read QUICK_REFERENCE.md → "Where to Wire APIs" → See example code
3. ✅ Check CompanyEcosystemTableCompact.tsx → Find `onRefresh` prop
4. ✅ Trace to AiShowcase.tsx → Wire the API call
5. ✅ Test and verify
6. ✅ Update CURRENT_STATE.md → Mark "Company Ecosystem" as "✅ Wired"

### **Example 2: User wants to add a new section**

**User says:**
> "Add a 'Salary Research' section with gradient background."

**AI should:**
1. ✅ Read UI_DESIGN_SYSTEM.md → Copy section template
2. ✅ Check TERMINOLOGY_GUIDE.md → Choose unused gradient color
3. ✅ Follow standard structure (header, content, AnalysisExplanation, why this matters)
4. ✅ Add to CURRENT_STATE.md → "UI Components" table
5. ✅ Add to TERMINOLOGY_GUIDE.md → New section entry
6. ✅ Update CHANGELOG.md

---

## 📝 **Suggested Workflow**

### **Your Side (User):**

1. **Session Start:**
   - Paste Quick Context Prompt
   - State your goal clearly
   - Reference relevant docs (e.g., "Check CURRENT_STATE.md")

2. **During Work:**
   - Ask AI to verify against docs
   - Point to specific sections when clarifying
   - Request doc updates for changes

3. **Session End:**
   - Ask AI to update relevant docs
   - Review CURRENT_STATE.md accuracy
   - Check git commits for completeness

### **AI Side:**

1. **Session Start:**
   - Read CURRENT_STATE.md first
   - Check TERMINOLOGY_GUIDE for names
   - Review QUICK_REFERENCE for context

2. **During Work:**
   - Reference docs when explaining
   - Use correct terminology consistently
   - Follow UI_DESIGN_SYSTEM patterns

3. **Session End:**
   - Update CURRENT_STATE.md
   - Update other relevant docs
   - Summarize what changed

---

## 🎯 **Sample Prompts for Common Tasks**

### **Task: Test a feature**
```
Test the Refresh Data flow. Steps per CURRENT_STATE.md:
1. Open Settings → Add API key
2. Upload resume  
3. Click "Refresh Data"
4. Check terminal logs
5. Report what happened
```

### **Task: Fix a bug**
```
Fix: [describe bug]

Check KNOWN_ISSUES.md first. If listed, follow the workaround.
If new bug, add to KNOWN_ISSUES.md after fixing.
```

### **Task: Add a feature**
```
Add [feature name] following UI_DESIGN_SYSTEM.md patterns.

Requirements:
- Match existing gradient style
- Include AnalysisExplanation
- Full dark mode support
- Update CURRENT_STATE.md when done
```

---

**Last Updated**: Oct 16, 2024  
**Purpose**: Maximize documentation value  
**Update**: Whenever new patterns emerge

