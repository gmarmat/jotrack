# Resume Comparison Prompt v1
**Output Contract**: Return JSON with `improvements`, `regressions`, `unchanged`, `recommendation` keys

---

Compare two versions of analysis or resume to identify changes.

## Original Version
```json
{{original}}
```

## New Version
```json
{{updated}}
```

## Instructions

1. Identify improvements (scores increased, new skills added)
2. Identify regressions (scores decreased, skills removed)
3. Note unchanged areas
4. Provide recommendation: adopt new version, revert, or merge

## Output Format

```json
{
  "improvements": [
    {
      "field": "Programming Languages score",
      "oldValue": "70%",
      "newValue": "85%",
      "impact": "+15 points - Added TypeScript examples"
    }
  ],
  "regressions": [],
  "unchanged": ["Overall structure", "Education section"],
  "recommendation": "Adopt new version - significant improvements with no regressions"
}
```

