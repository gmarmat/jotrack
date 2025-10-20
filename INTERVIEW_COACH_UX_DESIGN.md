# Interview Coach - UX/UI Design Specification
**Date**: October 20, 2025  
**Focus**: Interactive answer improvement workflow

---

## 🎯 Design Principles

1. **Conversational**: Feels like chatting with a coach, not filling forms
2. **Progressive**: Build answer iteratively, see improvement in real-time
3. **Visual Feedback**: Score bars, color-coded feedback, clear progress
4. **Context Preservation**: All iterations visible, nothing lost
5. **Low Friction**: Quick responses, auto-save, no page reloads
6. **Encouraging**: Positive tone, celebrate improvements

---

## 🎨 UI Layout - Question Practice Tab

### Overall Structure (Split View)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Interview Coach - Google - Senior Software Engineer                     │
│ [Recruiter ▼] [Hiring Manager] [Peer/Panel]                            │
└─────────────────────────────────────────────────────────────────────────┘
│ [Questions] [Practice] [Scoring] [Talk Tracks] [Core Stories] [Prep]   │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────┬──────────────────────────────────────────┐
│ LEFT: Question List (30%)    │ RIGHT: Active Question (70%)             │
│                              │                                          │
│ ┌──────────────────────────┐ │ ┌──────────────────────────────────────┐│
│ │ Q1: System design ✅ 85   │ │ │ Question: Tell me about...           ││
│ │ Q2: Leadership 🔄 45      │ │ │                                      ││
│ │ Q3: Conflict ⚪ --        │ │ │ [CONVERSATION VIEW]                  ││
│ │ Q4: Impact ⚪ --          │ │ │                                      ││
│ │ Q5: Technical ⚪ --       │ │ │ User Draft → AI Score → Follow-ups   ││
│ │ Q6: Career ⚪ --          │ │ │ → User Clarifies → Re-score → ✅     ││
│ │ Q7: Debugging ⚪ --       │ │ │                                      ││
│ │ Q8: Team work ⚪ --       │ │ │ [END: TALK TRACK READY]              ││
│ └──────────────────────────┘ │ └──────────────────────────────────────┘│
│                              │                                          │
│ Progress: 2/8 complete       │ [Save Draft] [Generate Talk Track]       │
└──────────────────────────────┴──────────────────────────────────────────┘
```

---

## 💬 Conversation View (Right Panel) - DETAILED DESIGN

### State 1: Initial (Empty)

```
┌────────────────────────────────────────────────────────────────┐
│ Question                                                       │
│ ────────────────────────────────────────────────────────────── │
│ Tell me about a time you led a team through a technical       │
│ challenge.                                                     │
│                                                               │
│ ────────────────────────────────────────────────────────────── │
│                                                               │
│ 💭 Your Draft Answer                                         │
│ ┌────────────────────────────────────────────────────────┐   │
│ │                                                        │   │
│ │  Start typing your answer here...                     │   │
│ │  Don't worry about format - just get your thoughts    │   │
│ │  down. We'll help you improve it!                     │   │
│ │                                                        │   │
│ │  Aim for 100-300 words.                               │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                               │
│ 📊 0 words | Est. 0 seconds                                  │
│                                                               │
│ [Save Draft]                       [Submit for Scoring 🎯]   │
└────────────────────────────────────────────────────────────────┘
```

---

### State 2: Draft Submitted → Scoring

```
┌────────────────────────────────────────────────────────────────┐
│ Question: Tell me about a time you led a team...              │
│ ────────────────────────────────────────────────────────────── │
│                                                               │
│ 💬 Your Answer (Iteration 1)                                 │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ I led a team to build a new feature. We used agile.   │   │
│ │ It was successful and users liked it.                 │   │
│ └────────────────────────────────────────────────────────┘   │
│ 📊 28 words | ~15 seconds                                    │
│ ────────────────────────────────────────────────────────────── │
│                                                               │
│ 🤖 AI Coach Feedback                                         │
│                                                               │
│ Overall Score: 45/100 ⚠️                                      │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ [███████████░░░░░░░░░░░] 45/100                        │   │
│ │                                                        │   │
│ │ Breakdown:                                             │   │
│ │ ✓ STAR Structure: 15/25 (missing clear S-T-A-R)      │   │
│ │ ⚠️ Specificity: 8/25 (too vague!)                     │   │
│ │ ❌ Quantification: 0/20 (no metrics!)                 │   │
│ │ ✓ Relevance: 15/20 (on topic)                         │   │
│ │ ✓ Clarity: 7/10 (clear but basic)                     │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                               │
│ 💡 Quick Wins:                                               │
│ • Add specific feature name and business context            │
│ • Include team size and your specific role                  │
│ • Quantify the impact with metrics                          │
│ • Explain what made it challenging                          │
│                                                               │
│ 🔍 Let me ask a few quick questions to help improve this:   │
│                                                               │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ Q1: What was the feature and why was it needed?        │   │
│ │ ┌──────────────────────────────────────────────────┐   │   │
│ │ │ [User types answer here...]                      │   │   │
│ │ └──────────────────────────────────────────────────┘   │   │
│ │                                                        │   │
│ │ Q2: How many people on the team? What was your role?  │   │
│ │ ┌──────────────────────────────────────────────────┐   │   │
│ │ │ [User types answer here...]                      │   │   │
│ │ └──────────────────────────────────────────────────┘   │   │
│ │                                                        │   │
│ │ Q3: What metrics improved? (users, revenue, time, %)   │   │
│ │ ┌──────────────────────────────────────────────────┐   │   │
│ │ │ [User types answer here...]                      │   │   │
│ │ └──────────────────────────────────────────────────┘   │   │
│ │                                                        │   │
│ │ [Submit Improvements 🚀]                              │   │
│ └────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

---

### State 3: After Follow-ups → Improved Score

```
┌────────────────────────────────────────────────────────────────┐
│ Question: Tell me about a time you led a team...              │
│ ────────────────────────────────────────────────────────────── │
│                                                               │
│ 📜 Iteration History (Expandable)                            │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ ▼ Iteration 1: 45/100 (see draft answer)              │   │
│ │ ▼ Your clarifications (see follow-up answers)         │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                               │
│ 💬 Enhanced Answer (Iteration 2)                             │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ I led a team of 5 engineers to build a real-time      │   │
│ │ analytics dashboard needed for our product-led growth  │   │
│ │ strategy. As tech lead, I architected the solution    │   │
│ │ using React and WebSocket, conducted code reviews,    │   │
│ │ and led sprint planning. The challenge was balancing  │   │
│ │ technical debt with a tight 6-week deadline. We       │   │
│ │ delivered on time, and the dashboard now serves 10K   │   │
│ │ daily users with 30% increase in feature adoption.    │   │
│ └────────────────────────────────────────────────────────┘   │
│ 📊 142 words | ~70 seconds                                   │
│ ────────────────────────────────────────────────────────────── │
│                                                               │
│ 🤖 AI Coach Feedback                                         │
│                                                               │
│ Overall Score: 83/100 ✅ GREAT IMPROVEMENT! (+38 points!)    │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ [████████████████████░░░░] 83/100                     │   │
│ │                                                        │   │
│ │ Breakdown:                                             │   │
│ │ ✅ STAR Structure: 22/25 (excellent!)                 │   │
│ │ ✅ Specificity: 23/25 (great details!)                │   │
│ │ ✅ Quantification: 18/20 (strong metrics!)            │   │
│ │ ✅ Relevance: 18/20 (perfect fit)                     │   │
│ │ ✅ Clarity: 9/10 (very clear)                         │   │
│ │                                                        │   │
│ │ 🎉 This is ready for professional formatting!         │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                               │
│ ✨ What You Can Do Next:                                     │
│                                                               │
│ [Keep Refining (ask more questions)]                         │
│ [Generate STAR Talk Track →] ← Primary CTA                  │
│                                                               │
└────────────────────────────────────────────────────────────────┘
```

---

### State 4: Talk Track Generated

```
┌────────────────────────────────────────────────────────────────┐
│ Question: Tell me about a time you led a team...              │
│ ────────────────────────────────────────────────────────────── │
│                                                               │
│ ✅ Talk Track Generated! Score: 83/100                       │
│                                                               │
│ [View Draft History] [Long Form] [Cheat Sheet] [Practice]    │
│                                                               │
│ ────────────────────────────────────────────────────────────── │
│ 📖 STAR Talk Track (Your Style + Company Culture)            │
│ ────────────────────────────────────────────────────────────── │
│                                                               │
│ Absolutely. At Google, we identified a gap in our product    │
│ analytics—we needed real-time insights to support our        │
│ product-led growth strategy, which aligns with Google's      │
│ focus on data-driven decision making. [Situation]            │
│                                                               │
│ I was asked to lead a team of 5 engineers (3 frontend, 2    │
│ backend) to build this from scratch, with a tight 6-week     │
│ deadline. [Task]                                             │
│                                                               │
│ As tech lead, I architected the solution using React for     │
│ the UI and WebSocket for real-time updates. I led sprint     │
│ planning, conducted code reviews, and made key architecture  │
│ decisions. The biggest challenge was balancing technical     │
│ debt with feature velocity. I addressed this by setting      │
│ clear "must-have vs nice-to-have" criteria and empowering    │
│ the team to make local decisions within that framework.      │
│ [Action]                                                     │
│                                                               │
│ We delivered on time, and the dashboard now serves 10K       │
│ daily active users. We saw a 30% increase in feature         │
│ adoption because PMs could make data-driven decisions in     │
│ real-time. This experience taught me that clear architecture │
│ upfront and team autonomy lead to better outcomes.           │
│ [Result]                                                     │
│                                                               │
│ 📊 218 words | ~110 seconds | Score: 83/100                  │
│                                                               │
│ ────────────────────────────────────────────────────────────── │
│ 📝 CHEAT SHEET (For Interview Day)                           │
│ ────────────────────────────────────────────────────────────── │
│                                                               │
│ 🎯 Memorable Stat: "30% feature adoption, 10K daily users"   │
│                                                               │
│ Context & Setup:                                             │
│ • Team: 5 engineers (3 FE, 2 BE)                             │
│ • Challenge: Real-time analytics for product-led growth      │
│ • Timeline: 6-week sprint                                    │
│                                                               │
│ My Actions:                                                  │
│ • Tech lead role (architecture, reviews, planning)           │
│ • Architected: React + WebSocket                             │
│ • Managed: Tech debt vs velocity tradeoff                    │
│ • Empowered: Team autonomy within framework                  │
│                                                               │
│ Results:                                                     │
│ • 10K daily active users                                     │
│ • 30% feature adoption increase                              │
│ • On-time delivery despite tight deadline                    │
│ • Learning: Architecture + autonomy = success                │
│                                                               │
│ Opening: "Absolutely. At Google, we identified a gap..."     │
│ Closing: "...taught me that clear architecture upfront..."   │
│                                                               │
│ [📋 Copy to Clipboard] [🖨️ Print] [💾 Save as PDF]          │
│                                                               │
└────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Interactive Conversation Flow

### Visual Design: Chat-like Thread

```
┌──────────────────────────────────────────────────────────────┐
│ 💭 Your Draft Answer                                         │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ I led a team to build a new feature. We used agile.     │ │
│ │ It was successful and users liked it.                   │ │
│ └──────────────────────────────────────────────────────────┘ │
│ 📊 28 words | Submitted 2 min ago                            │
└──────────────────────────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────────────────────────┐
│ 🤖 AI Coach Response                                         │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Good start! I can see you have leadership experience.   │ │
│ │ To make this interview-ready, we need more specifics.   │ │
│ │                                                          │ │
│ │ Score: 45/100 ⚠️                                         │ │
│ │ [███████████░░░░░░░░░░░] 45/100                         │ │
│ │                                                          │ │
│ │ What's Missing:                                          │ │
│ │ ❌ Specific feature name and business context           │ │
│ │ ❌ Team size and your specific role                     │ │
│ │ ❌ Metrics showing impact                               │ │
│ │ ❌ Clear challenge/obstacle                             │ │
│ │                                                          │ │
│ │ Let me ask a few quick questions to fill in the gaps:   │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────────────────────────┐
│ 🔍 Quick Clarifications                                      │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ 1️⃣ What was the feature and why was it needed?         │ │
│ │ ┌────────────────────────────────────────────────────┐   │ │
│ │ │ Real-time analytics dashboard, needed for          │   │ │
│ │ │ product-led growth strategy                        │   │ │
│ │ └────────────────────────────────────────────────────┘   │ │
│ │                                                          │ │
│ │ 2️⃣ How many people on the team? What was your role?    │ │
│ │ ┌────────────────────────────────────────────────────┐   │ │
│ │ │ 5 engineers (3 frontend, 2 backend). I was tech   │   │ │
│ │ │ lead - architecture, code reviews, sprint planning│   │ │
│ │ └────────────────────────────────────────────────────┘   │ │
│ │                                                          │ │
│ │ 3️⃣ What metrics improved?                               │ │
│ │ ┌────────────────────────────────────────────────────┐   │ │
│ │ │ 10K daily active users, 30% increase in feature   │   │ │
│ │ │ adoption                                          │   │ │
│ │ └────────────────────────────────────────────────────┘   │ │
│ │                                                          │ │
│ │ [Submit Clarifications 🚀]                              │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────────────────────────┐
│ 🤖 AI Coach Response                                         │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Excellent! Much better! 🎉                              │ │
│ │                                                          │ │
│ │ Score: 83/100 ✅ (+38 points!)                          │ │
│ │ [████████████████████░░░] 83/100                        │ │
│ │                                                          │ │
│ │ What Improved:                                           │ │
│ │ ✅ Specificity: 8 → 23 (+15)                            │ │
│ │ ✅ Quantification: 0 → 18 (+18)                         │ │
│ │ ✅ STAR Structure: 15 → 22 (+7)                         │ │
│ │                                                          │ │
│ │ You now have:                                            │ │
│ │ ✓ Clear context (real-time analytics, PLG strategy)    │ │
│ │ ✓ Your role (tech lead, 5 engineers)                   │ │
│ │ ✓ Strong metrics (10K users, 30% adoption)             │ │
│ │                                                          │ │
│ │ This is ready for professional STAR formatting! ✨      │ │
│ │                                                          │ │
│ │ [Ask More Questions] [Generate STAR Talk Track →] ✨    │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎨 Visual Design Elements

### Score Progress Bar (Animated)

```tsx
<div className="space-y-2">
  {/* Overall Score */}
  <div className="flex items-center justify-between">
    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
      Overall Score
    </span>
    <span className={`text-2xl font-bold ${
      score >= 75 ? 'text-green-600' : 
      score >= 50 ? 'text-yellow-600' : 
      'text-red-600'
    }`}>
      {score}/100
    </span>
  </div>
  
  {/* Progress bar with gradient */}
  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
    <div 
      className={`h-full transition-all duration-1000 ease-out ${
        score >= 75 ? 'bg-gradient-to-r from-green-500 to-green-600' :
        score >= 50 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
        'bg-gradient-to-r from-red-500 to-red-600'
      }`}
      style={{ width: `${score}%` }}
    >
      {/* Shimmer effect on improvement */}
      <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
    </div>
  </div>
  
  {/* Score breakdown */}
  <div className="grid grid-cols-5 gap-2 mt-3">
    <ScoreItem label="STAR" score={22} max={25} />
    <ScoreItem label="Details" score={23} max={25} />
    <ScoreItem label="Metrics" score={18} max={20} />
    <ScoreItem label="Relevance" score={18} max={20} />
    <ScoreItem label="Clarity" score={9} max={10} />
  </div>
</div>
```

---

### Improvement Celebration (When Score Increases)

```tsx
{scoreImproved && (
  <div className="fixed top-4 right-4 z-50 animate-slide-in">
    <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-xl shadow-2xl">
      <div className="flex items-center gap-3">
        <div className="text-3xl">🎉</div>
        <div>
          <p className="font-bold">Great improvement!</p>
          <p className="text-sm opacity-90">+{scoreIncrease} points</p>
        </div>
      </div>
    </div>
  </div>
)}
```

---

## 📱 Responsive Design

### Mobile View (Stacked Layout)

```
┌─────────────────────────┐
│ Interview Coach         │
│ Google - SWE            │
│ [Recruiter ▼]          │
└─────────────────────────┘
│ Practice Tab            │
└─────────────────────────┘

┌─────────────────────────┐
│ Q1: System design ✅ 85 │
│ ▼ Expand              │
│                         │
│ [Question details...]   │
│ [Answer...]            │
│ [Score...]             │
│ [Talk Track...]        │
└─────────────────────────┘

┌─────────────────────────┐
│ Q2: Leadership 🔄 45    │
│ ► Collapsed            │
└─────────────────────────┘

[Continue to next Q →]
```

---

## 🎭 Question List Design (Left Sidebar)

### Status Icons

```tsx
const QuestionItem = ({ question, status, score }) => {
  const getStatusIcon = () => {
    if (status === 'completed' && score >= 75) return '✅'; // Talk track ready
    if (status === 'in-progress') return '🔄'; // Working on it
    if (status === 'drafted' && score < 75) return '⚠️'; // Needs improvement
    return '⚪'; // Not started
  };
  
  const getStatusColor = () => {
    if (score >= 75) return 'bg-green-50 dark:bg-green-900/20 border-green-300';
    if (score >= 50) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300';
    if (score > 0) return 'bg-red-50 dark:bg-red-900/20 border-red-300';
    return 'bg-gray-50 dark:bg-gray-800 border-gray-300';
  };
  
  return (
    <button
      className={`w-full text-left p-3 rounded-lg border transition-all ${getStatusColor()} hover:shadow-md`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-lg">{getStatusIcon()}</span>
        {score > 0 && (
          <span className={`text-xs font-bold ${
            score >= 75 ? 'text-green-600' :
            score >= 50 ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {score}
          </span>
        )}
      </div>
      <p className="text-xs font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
        {question}
      </p>
    </button>
  );
};
```

---

## 💬 Follow-up Questions UI Pattern

### Expandable Quick Questions

```tsx
<div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
  <div className="flex items-start gap-3 mb-4">
    <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold text-sm">
      AI
    </div>
    <div className="flex-1">
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
        Let me ask a few quick questions to help improve your score:
      </p>
      <p className="text-xs text-gray-600 dark:text-gray-400">
        Answer briefly (10-50 words each). I'll incorporate your answers and re-score.
      </p>
    </div>
  </div>
  
  <div className="space-y-3">
    {followUpQuestions.map((q, idx) => (
      <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg p-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
          <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
            {idx + 1}
          </span>
          {q.question}
        </label>
        <textarea
          value={followUpAnswers[idx] || ''}
          onChange={(e) => updateFollowUpAnswer(idx, e.target.value)}
          className="w-full mt-2 p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
          placeholder="Type your answer here..."
          rows={2}
        />
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-500">
            {(followUpAnswers[idx] || '').split(/\s+/).filter(Boolean).length} words
          </span>
          {followUpAnswers[idx] && followUpAnswers[idx].trim().length > 10 && (
            <span className="text-xs text-green-600">✓ Good length</span>
          )}
        </div>
      </div>
    ))}
  </div>
  
  <button
    onClick={submitFollowUps}
    disabled={!allFollowUpsAnswered}
    className="mt-4 w-full py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
  >
    🚀 Submit & Re-Score
  </button>
</div>
```

---

## 📊 Score Breakdown Component

### Detailed Rubric Display

```tsx
<div className="grid grid-cols-5 gap-2">
  {/* STAR Structure */}
  <div className="text-center">
    <div className="mb-1">
      <CircularProgress value={22} max={25} color="blue" />
    </div>
    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">STAR</p>
    <p className="text-xs text-gray-500">22/25</p>
    {improvement && (
      <p className="text-xs text-green-600 font-bold">+7</p>
    )}
  </div>
  
  {/* Specificity */}
  <div className="text-center">
    <div className="mb-1">
      <CircularProgress value={23} max={25} color="purple" />
    </div>
    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Details</p>
    <p className="text-xs text-gray-500">23/25</p>
    {improvement && (
      <p className="text-xs text-green-600 font-bold">+15</p>
    )}
  </div>
  
  {/* ... repeat for other dimensions ... */}
</div>

{/* Expandable: What each dimension means */}
<button onClick={() => setShowRubric(!showRubric)} className="text-xs text-blue-600 mt-2">
  {showRubric ? '▼' : '▶'} What do these scores mean?
</button>

{showRubric && (
  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs space-y-2">
    <div>
      <strong>STAR Structure (25 pts):</strong>
      <p className="text-gray-600 dark:text-gray-400">
        Clear Situation, Task, Action, Result sections
      </p>
    </div>
    <div>
      <strong>Specificity (25 pts):</strong>
      <p className="text-gray-600 dark:text-gray-400">
        Concrete details (names, tech, timeline, team size)
      </p>
    </div>
    {/* ... etc ... */}
  </div>
)}
```

---

## 🎯 Core Stories Tab - Story Mapping UI

```
┌──────────────────────────────────────────────────────────────┐
│ Your Core Stories                                            │
│ ────────────────────────────────────────────────────────────── │
│                                                              │
│ 🏗️ STORY 1: Microservices Migration                         │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ One-liner: Led team to migrate monolith to microservices│   │
│ │ Memorable Stat: 60% faster deployments, $200K savings  │   │
│ │ Covers: 6/10 questions                                 │   │
│ │                                                        │   │
│ │ [📖 View Full Story] [📝 Cheat Sheet] [🎯 Practice]   │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                              │
│ Maps to these questions:                                    │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ Q1: System design experience                           │   │
│ │ 💡 Adaptation: Lead with architecture decisions        │   │
│ │                                                        │   │
│ │ Q3: Technical challenge                                │   │
│ │ 💡 Adaptation: Emphasize migration complexity          │   │
│ │                                                        │   │
│ │ Q4: Biggest impact                                     │   │
│ │ 💡 Adaptation: Lead with $200K savings stat            │   │
│ │                                                        │   │
│ │ Q6: Cloud architecture                                 │   │
│ │ 💡 Adaptation: Mention AWS, Kubernetes setup           │   │
│ │                                                        │   │
│ │ [+2 more questions...]                                │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                              │
│ ────────────────────────────────────────────────────────────── │
│                                                              │
│ 👥 STORY 2: Team Leadership                                 │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ One-liner: Led 5 engineers to build analytics dashboard│   │
│ │ Memorable Stat: 10K users, 30% adoption, 6-week sprint│   │
│ │ Covers: 5/10 questions                                 │   │
│ │                                                        │   │
│ │ [📖 View Full Story] [📝 Cheat Sheet] [🎯 Practice]   │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                              │
│ Maps to: Leadership, Mentoring, Collaboration, Tight deadlines│
│                                                              │
│ ────────────────────────────────────────────────────────────── │
│                                                              │
│ 💡 Coverage: 3 stories cover 11/10 questions (110%)        │
│ Some questions can use multiple stories!                    │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔄 State Management

### Data Structure

```typescript
interface InterviewCoachState {
  // Question selection
  selectedQuestions: string[]; // Question IDs
  
  // Answer iterations (preserves history!)
  answers: {
    [questionId: string]: {
      iterations: Array<{
        text: string;
        timestamp: number;
        wordCount: number;
      }>;
      currentIteration: number;
    }
  };
  
  // Scoring history
  scores: {
    [questionId: string]: {
      history: Array<{
        score: number;
        breakdown: {
          star: number;
          specificity: number;
          quantification: number;
          relevance: number;
          clarity: number;
        };
        feedback: string[];
        timestamp: number;
      }>;
      currentScore: number;
    }
  };
  
  // Follow-up Q&A
  followUps: {
    [questionId: string]: {
      questions: string[];
      answers: string[];
      timestamp: number;
    }
  };
  
  // Generated talk tracks
  talkTracks: {
    [questionId: string]: {
      longForm: { ... };
      cheatSheet: { ... };
      generatedAt: number;
    }
  };
  
  // Core stories
  coreStories: Array<{
    id: string;
    title: string;
    oneLiner: string;
    memorableStat: string;
    fullStory: string;
    cheatSheet: string[];
    coversQuestions: string[]; // Question IDs
  }>;
  
  // Story mapping
  storyMapping: {
    [questionId: string]: {
      coreStoryId: string;
      adaptationTips: string[];
      emphasisPoints: string[];
    }
  };
}
```

---

## 🎨 Iteration History Timeline

### Visual Timeline of Improvements

```
┌──────────────────────────────────────────────────────────────┐
│ 📜 Iteration History                                         │
│ ────────────────────────────────────────────────────────────── │
│                                                              │
│ ● Iteration 1 (2 min ago) - Score: 45/100                   │
│   "I led a team to build a new feature..."                  │
│   [View Full Text ▼]                                        │
│                                                              │
│ │ AI asked 5 follow-up questions                            │
│ │ You provided clarifications                               │
│ ↓                                                            │
│                                                              │
│ ● Iteration 2 (Just now) - Score: 83/100 (+38!) 🎉          │
│   "I led a team of 5 engineers to build a real-time..."     │
│   [View Full Text ▼] [Current Version]                      │
│                                                              │
│ ────────────────────────────────────────────────────────────── │
│ 💡 You can revert to any version                            │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key UX Patterns

### 1. **Auto-Save Everything**
- Draft answers auto-save every 2 seconds
- Follow-up answers auto-save on blur
- No "Save" button needed (but show "Saved ✓" indicator)

### 2. **Inline Feedback**
- Score appears immediately below answer
- Green/yellow/red color coding
- Animated progress bar on improvement
- Celebration toast on +10 points or more

### 3. **Contextual Actions**
- Score < 50: Show "Need more details" + follow-up questions
- Score 50-74: Show "Almost there!" + optional refinements
- Score ≥ 75: Show "Ready for talk track!" + generate button

### 4. **Non-destructive Editing**
- All iterations preserved
- Can revert to previous version
- Timeline shows improvement journey

### 5. **Progressive Disclosure**
- Start simple (just question + text area)
- Reveal complexity as needed (score breakdown, rubric, follow-ups)
- Advanced features hidden until relevant

---

## 🎨 Design System Integration

### Colors (Coach Mode Inspired)

```scss
// Interview Coach gradient (different from App Coach)
background: linear-gradient(135deg, 
  rgba(139, 92, 246, 0.1) 0%,    // Purple
  rgba(59, 130, 246, 0.1) 100%   // Blue
);

// Score-based colors
✅ 75-100: Green gradient (from-green-500 to-green-600)
⚠️ 50-74:  Yellow gradient (from-yellow-500 to-yellow-600)
❌ 0-49:   Red gradient (from-red-500 to-red-600)

// Persona colors (same as Interview Questions)
Recruiter: Blue (bg-blue-100, text-blue-700)
HM: Purple (bg-purple-100, text-purple-700)
Peer: Green (bg-green-100, text-green-700)
```

### Typography

```scss
// Question text
font-size: 14px
font-weight: 600
color: gray-900 dark:gray-100

// Answer text (user's draft)
font-size: 14px
line-height: 1.6
font-family: system-ui (readable, comfortable)

// AI feedback
font-size: 13px
color: gray-700 dark:gray-300

// Cheat sheet
font-size: 12px
font-family: monospace (easy to scan)
```

---

## 🚀 Interaction Flows

### Flow 1: First-Time User (No Drafts Yet)

```
1. User enters Interview Coach → Practice tab
2. Sees empty state:
   "Ready to prepare? Select a question from the left to start."
3. Clicks Q1 from list
4. Right panel shows: Question + empty text area
5. User types draft answer
6. Auto-save indicator appears
7. User clicks "Submit for Scoring"
8. Loading spinner (3-5 seconds)
9. Score appears with animated progress bar
10. Follow-up questions expand below
11. User answers follow-ups
12. Re-score happens automatically
13. Score improves → Celebration toast!
14. "Generate Talk Track" button appears
```

---

### Flow 2: Iterative Improvement

```
Current score: 55/100

User sees:
┌────────────────────────────────────────┐
│ 🤖 Your score: 55/100                  │
│ You're halfway there! Here's what to add:│
│                                        │
│ ❌ Missing: Specific metrics           │
│ ❌ Missing: Clear challenge statement  │
│ ✅ Good: Relevant example              │
│ ✅ Good: Clear communication           │
│                                        │
│ [Answer Follow-ups (+20 pts) →]       │
│ [Edit Answer Manually]                │
└────────────────────────────────────────┘

User chooses "Answer Follow-ups":
1. 3 quick questions appear
2. User types short answers (20-50 words)
3. Submit → AI re-scores
4. New score: 75/100 (+20!)
5. Celebration: "Excellent! +20 points! 🎉"
6. "Generate Talk Track" button now enabled
```

---

### Flow 3: Talk Track Generation

```
Score: 83/100 ✅

User clicks "Generate STAR Talk Track"

Loading State:
┌────────────────────────────────────────┐
│ ✨ Crafting your talk track...        │
│                                        │
│ Using your writing style:              │
│ ✓ Vocabulary: Technical                │
│ ✓ Tone: Confident, Results-oriented    │
│ ✓ Integrating: Google's culture       │
│                                        │
│ [████████████░░░] 80%                  │
└────────────────────────────────────────┘

Result:
┌────────────────────────────────────────┐
│ ✅ Talk Track Ready!                   │
│                                        │
│ [Long Form] [Cheat Sheet] ← Tabs      │
│                                        │
│ [Formatted STAR answer shown...]       │
│                                        │
│ 💡 This is saved and ready to practice│
│ [Practice Mode] [Export PDF]          │
└────────────────────────────────────────┘
```

---

## 🎯 Core Stories Tab - Detailed Design

```
┌──────────────────────────────────────────────────────────────┐
│ 🎓 Your Core Stories                                         │
│ ────────────────────────────────────────────────────────────── │
│ Based on your 8 answers, I identified 3 core stories that    │
│ cover 90% of your interview questions. Master these 3 and    │
│ you'll be ready for anything!                                │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ 📘 STORY 1: Microservices Migration                         │
│ ────────────────────────────────────────────────────────────── │
│                                                              │
│ 🎯 One-Liner:                                               │
│ Led team to architect and migrate monolith to microservices │
│                                                              │
│ 💫 Memorable Stats:                                         │
│ • 60% faster deployments                                    │
│ • $200K annual cost savings                                 │
│ • Reduced downtime from 4hrs to 30min                       │
│                                                              │
│ 📊 Coverage:                                                │
│ Answers 6/10 questions (60%)                                │
│ [████████████░░░░░░░] 6 questions                          │
│                                                              │
│ 🎭 Themes:                                                   │
│ System Design • Architecture • Scalability • Technical Depth│
│ Tradeoffs • Team Leadership • Business Impact               │
│                                                              │
│ ────────────────────────────────────────────────────────────── │
│ 📝 Full Story (300 words)                        [Expand ▼] │
│ ────────────────────────────────────────────────────────────── │
│                                                              │
│ 🗺️ Question Mapping                             [Expand ▼] │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ Q1: "Tell me about system design experience"          │   │
│ │ 💡 Lead with: Architecture decisions                  │   │
│ │ 💡 Emphasize: Monolith → Microservices tradeoffs      │   │
│ │ 💡 Stat: "60% faster deployments"                     │   │
│ │ 💡 Opening: "Great question. At {Company}, we faced..." │  │
│ │                                                        │   │
│ │ Q3: "Describe a technical challenge"                  │   │
│ │ 💡 Lead with: The migration complexity                │   │
│ │ 💡 Emphasize: Technical decisions (Docker, K8s)       │   │
│ │ 💡 Stat: "Reduced downtime from 4hrs to 30min"        │   │
│ │                                                        │   │
│ │ [+4 more questions...]                                │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                              │
│ [🎯 Practice This Story] [📋 Copy Cheat Sheet]              │
│                                                              │
└──────────────────────────────────────────────────────────────┘

[Similar cards for Story 2 and Story 3...]

┌──────────────────────────────────────────────────────────────┐
│ 📊 Coverage Summary                                          │
│                                                              │
│ 11/10 questions covered (110%)                              │
│ [███████████████████████] Complete!                         │
│                                                              │
│ 1 question can use multiple stories - pick best fit!        │
│                                                              │
│ [🎯 Start Final Practice Mode →]                           │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎮 Practice Mode Design

### Full-Screen Immersive Mode

```
┌──────────────────────────────────────────────────────────────┐
│                     🎯 PRACTICE MODE                         │
│                                                              │
│ Question 3 of 10                              [Exit Practice]│
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                                                              │
│              Tell me about a time you led a team             │
│              through a technical challenge.                  │
│                                                              │
│                                                              │
│                    [Think... then reveal]                    │
│                                                              │
│                                                              │
│            ┌────────────────────────────┐                    │
│            │   Reveal Cheat Sheet  👁️   │                    │
│            └────────────────────────────┘                    │
│                                                              │
│                                                              │
│           Use: 🏗️ Story 1 (Microservices Migration)         │
│           Stat: "60% faster deployments"                     │
│           Opening: "Great question. At Google, we faced..."  │
│                                                              │
│                                                              │
│                [← Previous] [Next →] [Skip]                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

When user clicks "Reveal":
- Cheat sheet slides in from bottom
- Question dims slightly
- Can hide again for repeated practice
- Track practice count: "Practiced 3 times ✓"

---

## 📱 Mobile Considerations

### Single Column, Swipe Navigation

```
┌─────────────────────────┐
│ Interview Coach         │
│ ─────────────────────── │
│ Q3: Leadership          │
│ Score: 83/100 ✅        │
└─────────────────────────┘

[Swipe left/right to navigate questions]

┌─────────────────────────┐
│ Your Answer             │
│ ─────────────────────── │
│ [Full text...]          │
│                         │
│ [Expand for score ▼]    │
└─────────────────────────┘

[Bottom sheet for actions]
```

---

## 🎯 Gamification Elements

### Progress Indicators

```tsx
// Overall progress card
<div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-2xl shadow-lg mb-6">
  <div className="flex items-center justify-between mb-4">
    <div>
      <h3 className="text-2xl font-bold">Interview Prep Progress</h3>
      <p className="text-sm opacity-90">Recruiter Screen</p>
    </div>
    <div className="text-right">
      <div className="text-4xl font-bold">80%</div>
      <div className="text-xs opacity-75">Ready to interview!</div>
    </div>
  </div>
  
  <div className="grid grid-cols-4 gap-3 text-center text-sm">
    <div>
      <div className="text-2xl font-bold">8/10</div>
      <div className="text-xs opacity-75">Questions</div>
    </div>
    <div>
      <div className="text-2xl font-bold">6/8</div>
      <div className="text-xs opacity-75">High Scores</div>
    </div>
    <div>
      <div className="text-2xl font-bold">3</div>
      <div className="text-xs opacity-75">Core Stories</div>
    </div>
    <div>
      <div className="text-2xl font-bold">12</div>
      <div className="text-xs opacity-75">Practice Runs</div>
    </div>
  </div>
</div>
```

### Achievements/Milestones

```tsx
{achievements.map(achievement => (
  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
    <div className="text-3xl">{achievement.emoji}</div>
    <div>
      <p className="font-semibold text-sm text-green-900 dark:text-green-100">
        {achievement.title}
      </p>
      <p className="text-xs text-green-700 dark:text-green-300">
        {achievement.description}
      </p>
    </div>
  </div>
))}

Examples:
🎯 "First Answer Scored!" - Submitted your first draft
📈 "Score Improver!" - Increased score by 20+ points
✨ "Talk Track Master!" - Generated 5 talk tracks
🏆 "Interview Ready!" - All questions scored 75+
🎓 "Core Stories Complete!" - Identified 3 core stories
```

---

## 🔄 Real-Time Feedback Loop

### As User Types (Live Indicators)

```
┌────────────────────────────────────────────────────────────┐
│ Your Draft Answer                                          │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ I led a team of 5 engineers to build a real-time      │ │
│ │ analytics dashboard. As tech lead, I architected...    │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ Live Indicators (update as they type):                    │
│ ───────────────────────────────────────────────────────────│
│ 📊 142 words          ✅ Good length (100-200 ideal)       │
│ ⏱️  ~70 seconds       ✅ Good pace (60-90 ideal)           │
│ 🔢 3 metrics found    ✅ "10K users", "30%", "6 weeks"     │
│ 📝 STAR detected      ⚠️  Partial (missing Result clarity) │
│ 💼 Tech terms: 8      ✅ React, WebSocket, Sprint planning │
│                                                            │
│ 💡 Quick Tip: Add business impact in last paragraph        │
└────────────────────────────────────────────────────────────┘
```

---

## 🎨 Component Hierarchy

```tsx
<InterviewCoachPage jobId={jobId}>
  
  {/* Header */}
  <InterviewCoachHeader 
    companyName={company}
    roleTitle={role}
    interviewType={type}
    progress={progress}
  />
  
  {/* Tabs */}
  <InterviewCoachTabs activeTab={activeTab} onTabChange={setActiveTab}>
    
    {/* Tab 1: Questions */}
    <QuestionsTab>
      <QuestionSelector 
        availableQuestions={allQuestions}
        selectedQuestions={selectedQuestions}
        onToggle={handleQuestionToggle}
      />
    </QuestionsTab>
    
    {/* Tab 2: Practice (MAIN INTERACTIVE TAB) */}
    <PracticeTab>
      <SplitLayout>
        
        {/* Left: Question List */}
        <QuestionList 
          questions={selectedQuestions}
          scores={scores}
          activeQuestion={activeQuestionId}
          onSelect={setActiveQuestionId}
        />
        
        {/* Right: Active Question Workspace */}
        <QuestionWorkspace>
          
          {/* Question Header */}
          <QuestionHeader question={activeQuestion} />
          
          {/* Conversation Thread */}
          <ConversationThread>
            
            {/* User's drafts (all iterations) */}
            {iterations.map(iter => (
              <UserMessage 
                text={iter.text}
                timestamp={iter.timestamp}
                iteration={iter.number}
              />
            ))}
            
            {/* AI feedback */}
            {scores.map(score => (
              <AIFeedback
                score={score.overall}
                breakdown={score.breakdown}
                feedback={score.feedback}
                followUpQuestions={score.followUps}
              />
            ))}
            
            {/* Follow-up Q&A */}
            {followUps.map(fu => (
              <FollowUpQuestions
                questions={fu.questions}
                answers={fu.answers}
                onAnswerChange={handleFollowUpAnswer}
                onSubmit={handleFollowUpSubmit}
              />
            ))}
            
            {/* Talk track (if generated) */}
            {talkTrack && (
              <TalkTrackDisplay
                longForm={talkTrack.longForm}
                cheatSheet={talkTrack.cheatSheet}
                coachingTips={talkTrack.coachingTips}
              />
            )}
            
          </ConversationThread>
          
          {/* Action Bar (Bottom) */}
          <ActionBar>
            {score < 75 && (
              <button>Ask AI for More Help</button>
            )}
            {score >= 75 && !talkTrack && (
              <button className="primary-gradient">
                Generate STAR Talk Track →
              </button>
            )}
            {talkTrack && (
              <button>Mark as Complete ✓</button>
            )}
          </ActionBar>
          
        </QuestionWorkspace>
        
      </SplitLayout>
    </PracticeTab>
    
    {/* Tab 3: Scoring Dashboard */}
    <ScoringTab>
      <ScoreOverview questions={selectedQuestions} scores={scores} />
      <ProgressChart improvements={improvements} />
    </ScoringTab>
    
    {/* Tab 4: Talk Tracks */}
    <TalkTracksTab>
      <TalkTracksDisplay talkTracks={talkTracks} />
    </TalkTracksTab>
    
    {/* Tab 5: Core Stories */}
    <CoreStoriesTab>
      <CoreStoriesDisplay 
        stories={coreStories}
        storyMapping={storyMapping}
      />
    </CoreStoriesTab>
    
    {/* Tab 6: Final Prep */}
    <FinalPrepTab>
      <PracticeMode stories={coreStories} />
      <CheatSheets stories={coreStories} />
      <ExportOptions />
    </FinalPrepTab>
    
  </InterviewCoachTabs>
  
</InterviewCoachPage>
```

---

## 💾 Data Persistence Strategy

### Auto-Save Points

1. **Draft text**: Auto-save every 2 seconds (debounced)
2. **Follow-up answers**: Auto-save on blur (each input)
3. **Scores**: Save immediately after AI response
4. **Talk tracks**: Save immediately after generation
5. **Core stories**: Save immediately after identification

### Storage Location

```sql
-- All in one JSON blob for fast access
interview_coach_sessions.state_json = {
  "questionId_1": {
    "question": "Tell me about...",
    "iterations": [
      { "text": "...", "timestamp": 123, "wordCount": 28 },
      { "text": "...", "timestamp": 456, "wordCount": 142 }
    ],
    "scores": [
      { "overall": 45, "breakdown": {...}, "feedback": [...] },
      { "overall": 83, "breakdown": {...}, "feedback": [...] }
    ],
    "followUps": [
      { "questions": [...], "answers": [...] }
    ],
    "talkTrack": { "longForm": {...}, "cheatSheet": {...} },
    "status": "completed" // 'draft' | 'scored' | 'talk-track-ready' | 'completed'
  },
  // ... other questions
}
```

---

## 🎯 Key UX Decisions

### 1. **Conversation-Style (Not Form-Style)**
✅ **DO**: Show answers as chat bubbles in a thread  
❌ **DON'T**: Show as form fields with labels

### 2. **Preserve All Context**
✅ **DO**: Show iteration history, all previous answers  
❌ **DON'T**: Replace old text with new text (loses context)

### 3. **Inline Scoring**
✅ **DO**: Score appears right after answer in thread  
❌ **DON'T**: Score in separate panel (breaks flow)

### 4. **Progressive Follow-ups**
✅ **DO**: Ask 3-5 quick questions inline  
❌ **DON'T**: Open modal or new page for follow-ups

### 5. **Contextual Actions**
✅ **DO**: Show relevant next action based on score  
❌ **DON'T**: Show all buttons all the time

### 6. **Visual Celebration**
✅ **DO**: Animate score increase, show toast, use emojis  
❌ **DON'T**: Dry numerical feedback only

---

## 📏 Spacing & Layout

```scss
// Container
max-width: 1400px (wider than normal for split view)
padding: 2rem

// Left sidebar (Question list)
width: 30% (400px min)
gap: 0.75rem between questions

// Right panel (Active question)
width: 70%
padding: 2rem
max-width: 900px (for comfortable reading)

// Conversation thread
max-height: calc(100vh - 300px)
overflow-y: auto
scroll-behavior: smooth (auto-scroll to latest message)

// Message bubbles
user-message: bg-blue-50, max-width: 90%, margin-right
ai-message: bg-gray-50, max-width: 90%, margin-left
padding: 1rem
border-radius: 1rem

// Follow-up questions
background: bg-blue-50 (distinct from messages)
border: 2px dashed blue-300
padding: 1.5rem
```

---

## 🎯 Success States & CTAs

### Score-Based CTAs

```tsx
// Score < 50
<div className="bg-red-50 border border-red-200 p-4 rounded-lg">
  <p className="text-sm font-semibold text-red-900 mb-2">
    ⚠️ This needs work
  </p>
  <p className="text-xs text-red-700 mb-3">
    Let's add more details to make this interview-ready.
  </p>
  <button className="bg-red-600 text-white">
    Answer Follow-up Questions (+20-30 pts)
  </button>
</div>

// Score 50-74
<div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
  <p className="text-sm font-semibold text-yellow-900 mb-2">
    👍 Almost there!
  </p>
  <p className="text-xs text-yellow-700 mb-3">
    A few clarifications and you'll be ready for the talk track.
  </p>
  <button className="bg-yellow-600 text-white">
    Quick Improvements (+10-15 pts)
  </button>
</div>

// Score ≥ 75
<div className="bg-green-50 border border-green-200 p-4 rounded-lg">
  <p className="text-sm font-semibold text-green-900 mb-2">
    ✅ Interview-ready!
  </p>
  <p className="text-xs text-green-700 mb-3">
    This answer is strong. Let's format it into a polished STAR talk track.
  </p>
  <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold shadow-lg">
    ✨ Generate STAR Talk Track →
  </button>
</div>
```

---

## 🎨 Animation & Micro-interactions

### Score Improvement Animation

```tsx
// When score increases
1. Old score fades out
2. Progress bar animates from old → new (1 second duration)
3. New score fades in with slight bounce
4. Green "+38" appears and floats up, then fades
5. Confetti particles if score crosses 75 threshold
6. Toast notification: "Great improvement! +38 points 🎉"
```

### Follow-up Questions Reveal

```tsx
// Smooth expansion
1. "Let me ask some questions..." appears
2. Container expands with smooth height animation
3. Questions fade in one by one (100ms delay each)
4. Focus auto-jumps to first input field
5. Submit button pulses gently when all answered
```

### Talk Track Generation Loading

```tsx
// Engaging loading state
<div className="text-center py-12">
  <div className="inline-block">
    <Sparkles className="w-12 h-12 text-purple-600 animate-pulse" />
  </div>
  <p className="text-lg font-semibold mt-4">Crafting your talk track...</p>
  <p className="text-sm text-gray-600 mt-2">Using your writing style</p>
  
  <div className="mt-6 space-y-2 text-xs text-gray-500">
    <div className="flex items-center justify-center gap-2">
      <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '0s'}} />
      <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
      <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '0.4s'}} />
    </div>
    <p>Analyzing your answer structure...</p>
    <p>Integrating company culture...</p>
    <p>Formatting with STAR framework...</p>
  </div>
</div>
```

---

## 🎯 Summary: Key UX Innovations

1. **Conversation Thread**: All interactions in chronological order
2. **Iteration Preservation**: Never lose old versions
3. **Inline Scoring**: Feedback appears in context
4. **Quick Follow-ups**: 3-5 short questions inline
5. **Real-time Indicators**: Word count, time, metrics detected
6. **Score-based CTAs**: Different actions for different score ranges
7. **Visual Celebration**: Animations, toasts, emojis on improvement
8. **Split View**: Question list + active question (desktop)
9. **Practice Mode**: Full-screen immersive rehearsal
10. **Core Stories Tab**: See reusable stories + question mapping

---

## 📝 Implementation Priority

### Phase 1: Core Interaction (Build First)
- ✅ Question list (left sidebar)
- ✅ Active question workspace (right panel)
- ✅ Draft answer text area
- ✅ Submit for scoring button
- ✅ Score display with breakdown
- ✅ Follow-up questions inline
- ✅ Re-scoring after follow-ups

### Phase 2: Talk Tracks (Build Second)
- ✅ Generate talk track button (when score ≥ 75)
- ✅ Talk track display (long-form + cheat sheet tabs)
- ✅ Coaching tips section

### Phase 3: Core Stories (Build Third)
- ✅ Core stories extraction
- ✅ Story mapping display
- ✅ Practice mode

### Phase 4: Polish (Build Last)
- ✅ Animations
- ✅ Achievements
- ✅ Export/print
- ✅ Mobile responsive

---

**Status**: UX/UI Design Complete! ✅  
**Next**: Resume with P3.5 & P3.6, then implement Interview Coach  
**Estimate**: 18-20 hours for full implementation

