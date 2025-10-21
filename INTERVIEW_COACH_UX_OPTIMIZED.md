# Interview Coach - Optimized UX Implementation

## Overview
Redesigned Interview Coach with cleaner 2-column layout, grid-based discovery questions, and smart placeholders.

## Key Features
1. **2-Column Layout**: Question list (30%) + Active workspace (70%)
2. **Grid Discovery Cards**: 2x2 or 2x3 responsive grid for discovery Q&A
3. **Smart Placeholders**: Each discovery question shows example answer in placeholder
4. **Compact Buttons**: Small, icon-first buttons to reduce clutter
5. **Persistent Questions**: Discovery questions locked after first generation (no regeneration)
6. **AI Suggest = Auto-Impact**: One click generates answer + shows impact immediately
7. **Test Impact**: Only for user-written text

## UI Layout

```
┌────────────────┬─────────────────────────────────────────────┐
│  Question List │           Active Workspace                  │
│     (30%)      │              (70%)                          │
│                │                                             │
│ ✅ Q1 (85)     │  Main Story Textarea (large)                │
│ 🟡 Q2 (68)     │  [Analyze & Score] button                   │
│ ⭕ Q3          │  Score breakdown                            │
│ ⭕ Q4          │                                             │
│                │  Discovery Questions (2x2 grid below)       │
│                │  ┌──────────┐ ┌──────────┐                 │
│                │  │ Card 1   │ │ Card 2   │                 │
│                │  └──────────┘ └──────────┘                 │
│                │  ┌──────────┐ ┌──────────┐                 │
│                │  │ Card 3   │ │ Card 4   │                 │
│                │  └──────────┘ └──────────┘                 │
└────────────────┴─────────────────────────────────────────────┘
```

## Discovery Card States

### 1. Empty State
```
┌─────────────────────────────────────┐
│ What metrics improved?              │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ e.g., "Reduced deployment time  │ │ ← Placeholder
│ │ by 60% and bug rate by 40%"     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [🪄 AI Suggest]      (empty badge)  │
└─────────────────────────────────────┘
```

### 2. AI-Generated State (Blue Border)
```
┌─────────────────────────────────────┐
│ What metrics improved?              │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ Reduced sprint time by 40% and  │ │ ← AI answer
│ │ delivery accuracy to 95%        │ │
│ └─────────────────────────────────┘ │
│ ↑ +8 | 76/100 "Adds quantification"│ ← Impact (immediate)
│ [✓ Looks Good] [✏️ Edit]            │
└─────────────────────────────────────┘
```

### 3. User-Written State (Purple Border)
```
┌─────────────────────────────────────┐
│ Who else was involved?              │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ PM Sarah, designer Mike, and 3  │ │ ← User typed
│ │ engineers from the platform team│ │
│ └─────────────────────────────────┘ │
│                                     │
│ [🧪 Test Impact]  [🪄 AI Suggest]   │
└─────────────────────────────────────┘
```

### 4. Tested State (Green Border)
```
┌─────────────────────────────────────┐
│ Who else was involved?              │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ PM Sarah, designer Mike, and 3  │ │
│ │ engineers from the platform team│ │
│ └─────────────────────────────────┘ │
│ ↑ +5 | 73/100 "Adds collaboration" │
│ [✓ Done]                            │
└─────────────────────────────────────┘
```

## Placeholder Examples by Question Type

### Metrics/Results
```
placeholder="e.g., 'Reduced deployment time by 60%, cut bug rate by 40%, increased team velocity by 25%'"
```

### People/Stakeholders
```
placeholder="e.g., 'Product Manager Sarah Chen, UX Designer Mike Park, and 3 platform engineers'"
```

### Obstacles/Challenges
```
placeholder="e.g., 'Tight deadline (2 weeks), legacy codebase with no tests, team had never used microservices'"
```

### Timeline
```
placeholder="e.g., 'Kicked off in Q3 2024, MVP in 6 weeks, full rollout by Q4'"
```

### Technical Details
```
placeholder="e.g., 'Migrated from monolith to microservices using Docker, Kubernetes, and AWS Lambda'"
```

## Button Sizes (Compact)

### Small Buttons (Discovery Cards)
```tsx
className="px-2 py-1 text-xs"  // Instead of px-4 py-2 text-sm
```

### Icon Sizes
```tsx
<Wand2 className="w-3 h-3" />  // 12px icons
<TestTube className="w-3 h-3" />
```

### Button Examples
```tsx
// AI Suggest (compact)
<button className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 
                   text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 transition-colors">
  <Wand2 className="w-3 h-3" />
  AI Suggest
</button>

// Test Impact (compact)
<button className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 
                   text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 transition-colors">
  <TestTube className="w-3 h-3" />
  Test Impact
</button>

// Done (compact, green)
<button className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 
                   text-green-700 dark:text-green-300 rounded">
  <Check className="w-3 h-3" />
  Done
</button>
```

## State Management

```typescript
interface DiscoveryAnswer {
  question: string;
  answer: string;
  source: 'ai' | 'user' | null;
  impact: number | null;
  newScore: number | null;
  explanation: string | null;
  status: 'empty' | 'ai-filled' | 'user-filled' | 'tested' | 'done';
  placeholder: string;  // Dynamic placeholder per question
}

const [interviewCoachState, setInterviewCoachState] = useState({
  activeQuestionId: 'q2',
  answers: {
    q2: {
      mainStory: "I led a team...",
      iteration: 2,
      score: 68,
      scoreHistory: [42, 68],
      breakdown: { star: 22, specificity: 20, relevance: 15, clarity: 11 },
      
      // Discovery questions (LOCKED - don't regenerate!)
      discoveryQuestions: [
        "What metrics improved?",
        "Who else was involved?",
        "What obstacles did you face?",
        "What was the timeline?"
      ],
      
      // Discovery answers with full metadata
      discoveryAnswers: {
        0: {
          question: "What metrics improved?",
          answer: "Reduced sprint time by 40%...",
          source: 'ai',
          impact: +8,
          newScore: 76,
          explanation: "Adds quantification",
          status: 'ai-filled',
          placeholder: "e.g., 'Reduced deployment time by 60%, cut bug rate by 40%...'"
        },
        1: {
          question: "Who else was involved?",
          answer: "",
          source: null,
          impact: null,
          newScore: null,
          explanation: null,
          status: 'empty',
          placeholder: "e.g., 'Product Manager Sarah Chen, UX Designer Mike Park...'"
        },
        // ...
      }
    }
  }
});
```

## API Updates

### `/api/interview-coach/[jobId]/suggest-follow-up`
**Returns answer + impact in ONE call**

```typescript
export async function POST(request, context) {
  const { questionId, followUpIndex, followUpQuestion } = await request.json();
  
  // Generate answer
  const suggestedAnswer = await callAiProvider('suggest-follow-up', {
    originalAnswer,
    followUpQuestion,
    jdContext: shortContext
  });
  
  // Immediately test impact (lightweight, same call)
  const impactPrediction = await callAiProvider('test-impact-lightweight', {
    originalAnswer,
    newFollowUpQA: `${followUpQuestion}\n${suggestedAnswer}`,
    otherFollowUps: existingAnswers
  });
  
  return NextResponse.json({
    success: true,
    answer: suggestedAnswer,
    impact: impactPrediction.scoreDelta,  // e.g., +8
    newScore: impactPrediction.predictedScore,
    explanation: impactPrediction.reasoning,
    placeholder: generatePlaceholder(followUpQuestion)  // Smart placeholder
  });
}
```

### Placeholder Generation Logic
```typescript
function generatePlaceholder(question: string): string {
  const q = question.toLowerCase();
  
  if (q.includes('metric') || q.includes('result') || q.includes('improve')) {
    return "e.g., 'Reduced deployment time by 60%, cut bug rate by 40%, increased velocity by 25%'";
  }
  
  if (q.includes('who') || q.includes('stakeholder') || q.includes('involve')) {
    return "e.g., 'Product Manager Sarah Chen, UX Designer Mike Park, and 3 platform engineers'";
  }
  
  if (q.includes('obstacle') || q.includes('challenge') || q.includes('difficult')) {
    return "e.g., 'Tight deadline (2 weeks), legacy codebase, team unfamiliar with microservices'";
  }
  
  if (q.includes('timeline') || q.includes('when') || q.includes('how long')) {
    return "e.g., 'Kicked off Q3 2024, MVP in 6 weeks, full rollout by Q4'";
  }
  
  if (q.includes('technical') || q.includes('technology') || q.includes('how did')) {
    return "e.g., 'Migrated to microservices using Docker, Kubernetes, deployed on AWS Lambda'";
  }
  
  return "e.g., 'Be specific with names, numbers, and concrete details (20-50 words)'";
}
```

## Grid Responsive Layout

```css
/* Desktop: 2 columns */
@media (min-width: 1024px) {
  .discovery-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
}

/* Tablet/Mobile: 1 column */
@media (max-width: 1023px) {
  .discovery-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
}
```

## Implementation Checklist

- [ ] Update `AnswerPracticeWorkspace.tsx` layout (2-column with grid)
- [ ] Add discovery card component with 4 states
- [ ] Implement placeholder generation logic
- [ ] Update `/suggest-follow-up` to return impact immediately
- [ ] Update button styles (compact: px-2 py-1 text-xs)
- [ ] Add icon imports (Wand2, TestTube, Check, Edit)
- [ ] Lock discovery questions after first generation
- [ ] Add state colors (blue=AI, purple=user, green=tested)
- [ ] Implement "Save All & Re-score" button
- [ ] Test responsive grid (desktop 2 cols, mobile 1 col)

## Token Optimization

1. **AI Suggest = 1 call** (generates answer + tests impact)
2. **User Test = 1 call** (only when user types)
3. **Re-score = 1 call** (combines all for final score)
4. **No regeneration** of discovery questions (locked after first)

**Estimated savings**: 60% fewer API calls vs. separate generate/test/score approach

