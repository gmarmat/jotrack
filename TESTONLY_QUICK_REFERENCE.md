# testOnly Mode & Discovery Questions - Quick Reference

## Visual Quick Reference

### What is testOnly?

```
testOnly = true  → 🔍 PREVIEW MODE (calculate, don't save)
testOnly = false → 💾 SAVE MODE (calculate AND save)
```

---

## When It's Used (3 Phases)

### Phase 1: Main Answer (Save)
```
User writes answer → Clicks "Analyze & Score"
  ↓
API Call:
  {
    questionId: "Why Fortive?",
    answerText: "I'm excited about...",
    testOnly: false  ← SAVE to database
  }
  ↓
Result: Score 58 SAVED 💾
```

### Phase 2: Discovery Questions (Preview)
```
User answers discovery Q → Clicks "Test Impact"
  ↓
API Call:
  {
    questionId: "Why Fortive?",
    answerText: "I'm excited about...",
    testOnly: true,  ← DON'T save, just preview
    followUpQA: {
      question: "What metrics?",
      answer: "Response time improved 2s→200ms"
    }
  }
  ↓
Process:
  1. Combine: original + discovery
  2. Score combined answer
  3. Calculate delta: new - old = impact
  4. Return result (NOT saved) 🔍
  ↓
Result: "+6pts! Discovery answers strengthened..." (NOT saved)
```

### Phase 3: Save All (Save)
```
User clicks "Save Discovery Answers"
  ↓
API Call:
  {
    questionId: "Why Fortive?",
    answerText: "Full text with all discoveries...",
    testOnly: false  ← SAVE to database
  }
  ↓
Result: Everything SAVED 💾
```

---

## Discovery Questions: Context Addition

### The Key Concept

```
DISCOVERY QUESTION = Small context snippet
NOT = Complete interview answer

Example:

MAIN ANSWER (58/100):
  "I led a project that improved performance"
  
DISCOVERY Q: "What metrics?"
DISCOVERY A: "Response time 2s → 200ms"

✅ CORRECT EVALUATION:
  Score("I led a project that improved performance.
         Response time 2s → 200ms.") = 64/100
  
❌ WRONG EVALUATION:
  Score("Response time 2s → 200ms") = 45/100
  ^ Scoring snippet as if it's a full answer
```

---

## Individual Impact Numbers

```
Discovery Q1 "What metrics?"
└─ Answer: "2s → 200ms"
   └─ Impact: +6pts ✅
   
Discovery Q2 "Any concerns?"
└─ Answer: "Unfamiliar with tech X"
   └─ Impact: -4pts ⚠️
   
Discovery Q3 "Team size?"
└─ Answer: "3 engineers"
   └─ Impact: 0pts ➡️

User sees ALL impacts and chooses which to include
```

---

## Code Flow

### Frontend (AnswerPracticeWorkspace.tsx)

```typescript
// When user clicks "Test Impact"
const handleTestImpact = async (discoveryIndex, question, answer) => {
  const res = await fetch(`/api/interview-coach/${jobId}/score-answer`, {
    method: 'POST',
    body: JSON.stringify({
      questionId: selectedQuestion,     // Original Q
      answerText: draftAnswer,          // Original answer
      testOnly: true,                   // ← Key: Preview only
      followUpQA: { question, answer }  // Discovery context
    })
  });
  
  const result = await res.json();
  
  // Calculate delta for display
  const impact = result.score.overall - latestScore.overall;
  // e.g., 64 - 58 = +6
  
  // Update UI with impact
  setDiscoveryAnswer(discoveryIndex, {
    impact,
    explanation: result.explanation,
    status: 'tested'
  });
};
```

### Backend (score-answer/route.ts)

```typescript
export async function POST(request, context) {
  const { questionId, answerText, testOnly, followUpQA } = await request.json();
  
  // ✅ Combine if discovery test
  let enhancedAnswer = answerText;
  if (testOnly && followUpQA?.question && followUpQA?.answer) {
    enhancedAnswer = `${answerText}\n\nAdditional context:\nQ: ${followUpQA.question}\nA: ${followUpQA.answer}`;
  }
  
  // 🤖 Score the (possibly combined) answer
  const scoreData = await callAiProvider('answer-scoring', {
    answerText: enhancedAnswer,  // ← Original OR combined
    // ... other context
  });
  
  // 📊 Calculate impact explanation
  const previousScore = loadPreviousScore(questionId);
  const impactExplanation = generateScoringExplanation({
    oldScore: previousScore.overall,
    newScore: scoreData.overall,
    delta: scoreData.overall - previousScore.overall
  });
  
  // 💾 Conditional save
  if (testOnly) {
    return { score: scoreData, impactExplanation };  // 🔍 Preview only
  } else {
    saveToDatabase(scoreData);  // 💾 Save
    return { score: scoreData, impactExplanation };
  }
}
```

---

## Truth Table

| Scenario | testOnly | Combined? | Saved? | Display |
|----------|----------|-----------|--------|---------|
| Initial answer | false | No | ✅ Yes | Score 58 |
| Test discovery #1 | true | ✅ Yes | ❌ No | +6pts (preview) |
| Test discovery #2 | true | ✅ Yes | ❌ No | -4pts (preview) |
| Save all | false | ✅ Yes | ✅ Yes | Score saved |

---

## UI Status for Discovery Questions

```
[1] Q: "What metrics?"
    Status: EMPTY          Impact: —
    └─ Waiting for user to answer

[2] Q: "Team size?"
    Status: USER-FILLED    Impact: —
    └─ User typed, but haven't tested impact yet

[3] Q: "Concerns?"
    Status: USER-FILLED    Impact: +4pts ✅
    └─ User typed AND tested impact

[4] Q: "Success metrics?"
    Status: AI-FILLED      Impact: —
    └─ AI generated suggestion, user hasn't accepted

[5] Q: "Why leave current?"
    Status: TESTED         Impact: -2pts ⚠️
    └─ User answered AND tested (ready to save)
```

---

## Testing Checklist

```
✅ Score main answer → see score 58 (saved)
✅ Answer discovery Q1 → click Test Impact
   └─ See +6pts (NOT saved)
✅ Reload page → original score 58 still there
   └─ Confirm preview wasn't saved
✅ Answer discovery Q2 → click Test Impact
   └─ See -4pts (different delta)
✅ Click "Save Discovery Answers"
   └─ See confirmation
✅ Reload page → final score and answers saved
```

---

## Common Mistakes (DON'T DO THIS)

```
❌ Score discovery alone:
   Score("Response time 2s → 200ms") = 45
   
❌ Save testOnly=true results:
   if (testOnly) saveToDatabase(score);  // WRONG!
   
❌ Forget to combine:
   scoreData = await scoreAnswer(discoveryAnswer);  // WRONG!
   
❌ Calculate delta wrong:
   delta = newScore  // WRONG! Should be: newScore - oldScore
   
❌ Show raw score instead of delta:
   Display: "Score: 64"  // WRONG! Should be: "+6pts"
```

---

## One-Sentence Summaries

- **testOnly mode**: Calculate without saving (preview)
- **Discovery answers**: Context snippets combined with original
- **Impact**: Delta between combined score and previous score
- **Phase 1**: Score main answer (save)
- **Phase 2**: Preview discovery impacts (don't save)
- **Phase 3**: Save all together (save)

---

## The Magic ✨

When everything works together:

1. User writes main answer → AI scores it → Gets 58
2. User adds discovery context → AI scores combined → Gets 64 or 52
3. User sees: "+6pts with discovery Q1" or "-6pts with discovery Q2"
4. User picks best combination → Saves everything
5. User can reload and see exactly what they saved

**Result**: User has complete control over what helps their narrative!

