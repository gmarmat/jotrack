# 🎯 Discovery Questions & testOnly Mode - Complete Explanation

## What is testOnly Mode?

**testOnly** is a FLAG sent to the scoring API that means:
- ✅ "Calculate the impact/delta WITHOUT saving to database"
- ✅ "Return the new score and explanation"
- ✅ "Let me preview what will happen if I include this discovery answer"

### How You Toggle It

**testOnly Mode is AUTOMATIC** - you don't toggle it manually. Here's when it's used:

```
┌─ User Interaction ──────────────────────────────────┐
│                                                     │
│  PHASE 1: Initial Answer                           │
│  ─────────────────────────────────────────────     │
│  1. User writes main answer in textarea             │
│  2. User clicks "Analyze & Score"                   │
│     ↓                                               │
│  API called with: testOnly = FALSE                  │
│  Result: Score SAVED to database ✅                 │
│  Example: Score = 58 (SAVED)                        │
│                                                     │
│  PHASE 2: Discovery Questions                       │
│  ─────────────────────────────────────────────     │
│  3. System generates 5 follow-up questions          │
│  4. User answers 1st discovery question             │
│  5. User clicks "Test Impact" button                │
│     ↓                                               │
│  API called with: testOnly = TRUE, discoveryQA    │
│  Result: Score CALCULATED but NOT saved             │
│  Example: Score = 64 (PREVIEW ONLY) ✅              │
│  Shows: "+6pts impact" (how much this Q helped)     │
│                                                     │
│  6. User answers 2nd discovery question             │
│  7. User clicks "Test Impact" button                │
│     ↓                                               │
│  API called with: testOnly = TRUE, discoveryQA    │
│  Result: Compared to PREVIOUS saved score (58)      │
│  Example: Score = 52 (PREVIEW ONLY)                 │
│  Shows: "-6pts impact" (this Q revealed gaps)       │
│                                                     │
│  PHASE 3: Final Save (Optional)                     │
│  ─────────────────────────────────────────────     │
│  8. User clicks "Save Discovery Answers"            │
│     ↓                                               │
│  API called with: testOnly = FALSE, all answers    │
│  Result: All discovery answers + NEW score SAVED    │
│  Example: Score = 52 (NOW SAVED) ✅                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Discovery Questions: Individual Context Addition (NOT Re-evaluation)

**KEY CONCEPT**: Discovery questions are **NOT evaluated as standalone answers**.

Instead, they're evaluated as **context that modifies the original answer**.

### How Discovery Answers Affect Scoring

```
┌─ Scoring Process ──────────────────────────────────┐
│                                                    │
│  ORIGINAL ANSWER (User wrote):                     │
│  "I led a project that improved performance"       │
│  Score: 58/100                                     │
│  (Maybe: lacks specifics, no metrics shown)        │
│                                                    │
│  DISCOVERY QUESTION 1:                             │
│  "What specific metrics showed improvement?"       │
│                                                    │
│  DISCOVERY ANSWER 1 (User wrote):                  │
│  "Improved response time from 2s to 200ms"         │
│                                                    │
│  ──────────────────────────────────────────────   │
│  AI NOW EVALUATES:                                 │
│  ──────────────────────────────────────────────   │
│  
│  Original answer + Discovery answer #1 + Context  │
│  = "I led a project that improved performance...  │
│     Improved response time from 2s to 200ms"       │
│                                                    │
│  ✅ Discovery answer ADDS TO the story             │
│  ✅ Makes original answer STRONGER                 │
│  ✅ NOT evaluated on its own                       │
│                                                    │
│  New Score: 64/100                                 │
│  Impact: +6 points                                 │
│                                                    │
│  ──────────────────────────────────────────────   │
│  AI DOES NOT DO:                                   │
│  ──────────────────────────────────────────────   │
│  ❌ Grade "Improved response time from 2s to 200ms" as a complete answer
│  ❌ Score it like a main interview response       │
│  ❌ Evaluate it standalone                        │
│                                                    │
└─────────────────────────────────────────────────────┘
```

---

## The Scoring Logic (Currently Working)

### How Each Discovery Answer Gets a Score Delta

```typescript
// When user answers a discovery question and clicks "Test Impact"

const handleTestImpact = async (discoveryIndex, question, answer) => {
  
  // Call API with:
  // - questionId: The original question (e.g., "Why Fortive?")
  // - answerText: The ORIGINAL full answer the user wrote
  // - testOnly: true (means DON'T save, just preview)
  // - followUpQA: { question, answer } (the discovery Q&A)
  
  const res = await fetch(`/api/interview-coach/${jobId}/score-answer`, {
    method: 'POST',
    body: JSON.stringify({
      questionId: selectedQuestion,         // "Why Fortive?"
      answerText: draftAnswer,              // Full original answer
      testOnly: true,                       // PREVIEW mode
      followUpQA: { question, answer }      // Discovery context
    })
  });
  
  const result = await res.json();
  
  // Calculate impact as DELTA from current score
  const impact = result.score.overall - latestScore.overall;
  // E.g., 64 - 58 = +6 points
  
  // Display to user:
  // "This discovery answer added +6 points to your score"
};
```

### In the API (score-answer/route.ts)

```typescript
export async function POST(request, context) {
  const { questionId, answerText, testOnly, followUpQA } = body;
  
  // Get the ORIGINAL answer (e.g., "I led a project...")
  const originalAnswer = answerText;
  
  // IF this is a discovery answer test:
  if (followUpQA) {
    // COMBINE original + discovery context
    const enhancedAnswer = `${originalAnswer}\n\n${followUpQA.question}: ${followUpQA.answer}`;
    
    // Score the COMBINED answer
    const scoreData = await callAiProvider('answer-scoring', {
      answerText: enhancedAnswer,  // ← Main + discovery combined
      question: questionId,
      // ... other context
    });
  }
  
  // Compare score to PREVIOUS saved score
  const previousScore = interviewCoachData.answers[questionId].scores[0];
  const delta = scoreData.overall - previousScore.overall;
  
  // Return:
  // {
  //   score: { overall: 64, ... },
  //   impactExplanation: "+6pts! Discovery answers strengthened..."
  // }
}
```

---

## Feature Verification

### ✅ What IS Working

```
1. ✅ testOnly mode prevents database saves
2. ✅ Discovery answers are combined with original answer
3. ✅ Score delta is calculated vs. previous score
4. ✅ Impact explanation returned to frontend
5. ✅ Each discovery Q&A gets individual +/- impact number
```

### ✅ What IS Happening (Correct Behavior)

```
User Flow:
  1. Score main answer → 58 (saved)
  2. Answer discovery Q1 → Test Impact
     ├─ Score combined (main + Q1) → 64
     ├─ Delta = +6
     ├─ Show: "+6pts! Discovery..."
     └─ NOT SAVED (testOnly=true)
  
  3. Answer discovery Q2 → Test Impact
     ├─ Score combined (main + Q2) → 52
     ├─ Delta = -6 (compared to original 58)
     ├─ Show: "-6pts. Gaps revealed..."
     └─ NOT SAVED (testOnly=true)
  
  4. User satisfied, clicks "Save All"
     ├─ Save with ALL answers combined
     ├─ Save discovery answers
     ├─ Save new score to DB (now 52)
     └─ Mark as complete
```

---

## How to Understand the UI

### Discovery Questions Section UI

```
┌─ Discovery Questions (5 remaining) ─────────────┐
│                                                 │
│  [1] Q: "What metrics showed improvement?"      │
│      Status: EMPTY (user hasn't answered)       │
│      Impact: — (not tested yet)                 │
│                                                 │
│  [2] Q: "How big was your team?"                │
│      Status: AI-FILLED (AI suggestion shown)    │
│      Impact: — (not tested yet)                 │
│      ┌─ AI's suggestion: "Team of 3..."        │
│      │  [Use This]  [Regenerate]                │
│      └─────────────────────────────────────────┘
│                                                 │
│  [3] Q: "What was biggest challenge?"           │
│      Status: USER-FILLED (user typed answer)    │
│      Impact: +4pts ✅ (TESTED - showed impact)  │
│      ┌─ User's answer: "Performance..."        │
│      │  [Test Impact] ← Clicked, shows delta    │
│      │  Result: "+4pts! Strengthened narrative" │
│      └─────────────────────────────────────────┘
│                                                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Status Indicators

```
EMPTY (blue)     → User hasn't answered yet
AI-FILLED (blue) → AI generated suggestion, user hasn't answered
USER-FILLED      → User typed their own answer
TESTED           → User clicked "Test Impact", delta calculated
DONE             → User is satisfied with this answer
```

### Impact Column

```
—                → Not tested yet
+6pts ✅         → This answer added 6 points
-3pts ⚠️         → This answer revealed gaps (-3)
0pts ➡️          → No change in score
```

---

## Current Implementation Status

### ✅ IMPLEMENTED CORRECTLY

1. **testOnly Mode**
   - ✅ Prevents database saves when true
   - ✅ Calculates score without persisting
   - ✅ Returns impactExplanation
   - ✅ Automatically used by "Test Impact" button

2. **Discovery Answer Evaluation**
   - ✅ Discovery answers COMBINED with original answer
   - ✅ NOT evaluated as standalone
   - ✅ Each gets individual impact delta
   - ✅ Delta compared to previous saved score

3. **Impact Calculation**
   - ✅ Calculates: new_score - previous_score
   - ✅ Shows: "+6pts" or "-3pts"
   - ✅ Includes explanation of why changed

### 📋 SUMMARY

**Discovery questions work exactly as designed:**

1. **They're snippets**, not full answers
2. **They add context** to the original story
3. **Each affects the score individually** (+/- delta)
4. **testOnly mode previews** without saving
5. **User controls when to save** (or discard)

**The flow:**
- User writes main answer → Scored + Saved
- User answers discovery Q1 → Scored + Previewed (testOnly)
- Show: "Impact: +6pts"
- User answers discovery Q2 → Scored + Previewed (testOnly)
- Show: "Impact: -3pts"
- User decides to save all → Everything persists

---

## Technical Implementation Details

### API Parameter: `testOnly`

```typescript
// In frontend (AnswerPracticeWorkspace.tsx):
POST /api/interview-coach/[jobId]/score-answer {
  questionId: "Why are you interested in Fortive?",
  answerText: "[User's full original answer]",
  testOnly: true,              // ← KEY: Don't save
  followUpQA: {
    question: "What metrics showed improvement?",
    answer: "[User's discovery answer]"
  }
}

// In backend (score-answer/route.ts):
if (testOnly) {
  // Calculate score, DON'T save to database
  return { score: scoreData, impactExplanation, ... };
}
```

### Score Comparison

```typescript
// Load previous saved scores
const previousScores = interviewCoachData.answers[questionId].scores;
const previousScore = previousScores[previousScores.length - 1];

// New score from AI (original + discovery combined)
const newScore = scoreData.overall;

// Calculate delta
const delta = newScore - previousScore.overall;

// Generate explanation
const explanation = generateScoringExplanation({
  oldScore: previousScore.overall,
  newScore,
  delta
});
```

---

## Is This Working Correctly?

**YES**, based on code review:

✅ Discovery answers are **combined** with original answer (not standalone)  
✅ Each discovery answer gets **individual delta** (+/- points)  
✅ `testOnly` mode **prevents saves**  
✅ Impact is compared to **previous saved score**  
✅ Explanation is generated and returned  

**The system is designed exactly as intended.**

