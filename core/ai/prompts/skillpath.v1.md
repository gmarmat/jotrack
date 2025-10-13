# Skill Path Prompt v1
**Output Contract**: Return JSON with `skills`, `totalHours`, `talkTrack` keys

---

Create a fast upskilling plan for missing skills to prepare for a recruiter call.

**CRITICAL RULE**: Only recommend skills explicitly mentioned in the JD. Do NOT add skills not required by the job.

## Job Description
```
{{jdText}}
```

## Current Skills (from Resume)
{{currentSkills}}

## Missing Skills (from JD)
{{missingSkills}}

## Instructions

1. Select 3-5 high-priority skills from the missing list
2. For each skill, ensure time investment ≤6 hours (quick learning)
3. Prioritize based on:
   - Frequency mentioned in JD
   - Impact on overall fit score
   - Feasibility of quick learning
4. Create a confident talk track for the recruiter call
5. Total time budget: ≤20 hours

## Output Format

```json
{
  "skills": [
    {
      "skill": "Kubernetes",
      "priority": "high",
      "estimatedHours": 6,
      "resources": []
    }
  ],
  "totalHours": 15,
  "talkTrack": "I'm actively upskilling in Kubernetes and GraphQL to strengthen my DevOps expertise. I've completed the fundamentals and am working through hands-on projects to build production-ready knowledge."
}
```

Keep talk track confident and specific, avoiding excuses.

