# Coach Mode Demo Steps

## Overview
Coach Mode is a 4-step wizard that helps candidates prepare for job applications by analyzing job descriptions and resumes, providing fit scores, and generating improvement suggestions or skill development plans.

## Prerequisites
1. Start the development server: `npm run dev`
2. Ensure the database is migrated: `npm run db:migrate`
3. Ensure seed data is loaded: `npm run db:seed`
4. Open browser to `http://localhost:3000`

## Demo Flow

### Part 1: Initial Setup (Settings)

**Step 1: Configure AI Settings**
1. Navigate to Settings page: `/settings`
2. Scroll to "Coach Mode AI & Privacy" section
3. Observe that Network is OFF by default (dry-run mode)
4. Note the privacy information showing local storage and PII redaction
5. Optional: Toggle Network ON and add an OpenAI API key for real AI calls
6. Click "Save Settings"

**Expected Result:**
- Settings saved successfully
- Green checkmark appears briefly
- Network status reflected in UI

---

### Part 2: Wizard Flow (Dry-Run Mode)

**Step 2: Create a Test Job**
1. Return to Dashboard (`/`)
2. Create a new job:
   - Title: "Senior React Engineer"
   - Company: "Demo Tech Corp"
   - Status: "APPLIED"
3. Note the job ID from the URL or UI

**Step 3: Enter Coach Mode**
1. Navigate to `/coach/{jobId}` (replace with actual job ID)
2. Observe the stepper at the top with 4 steps:
   - Gather (active)
   - Profile (pending)
   - Fit (pending)
   - Improve / Apply (pending)

---

### Part 3: Step 1 - Gather

**Step 4: Input Job Description**
1. In the "Job Description" section, paste:
   ```
   Senior React Engineer - Remote
   
   About Demo Tech Corp:
   We're a fast-growing startup building the next generation of developer tools.
   
   Role Description:
   We're looking for a Senior React Engineer with 5+ years of experience to join our frontend team.
   
   Requirements:
   - 5+ years of professional React development
   - Expert knowledge of TypeScript and modern JavaScript
   - Experience with Node.js and RESTful APIs
   - Familiarity with AWS, Docker, and Kubernetes
   - Strong communication and collaboration skills
   - Experience with GraphQL is a plus
   
   What We Offer:
   - Competitive salary and equity
   - Remote-first culture
   - Comprehensive health benefits
   ```

**Step 5: Input Resume**
1. In the "Your Resume" section, paste:
   ```
   JOHN DOE
   Senior Software Engineer
   San Francisco, CA | john.doe@email.com | 555-123-4567
   
   SUMMARY
   Software engineer with 6 years of experience building scalable web applications.
   Strong expertise in React and TypeScript.
   
   EXPERIENCE
   
   Senior Software Engineer | TechStart Inc | 2021-2024
   - Built and maintained 10+ production React applications serving 100K+ users
   - Led migration from JavaScript to TypeScript across entire frontend codebase
   - Architected reusable component library used by 5 teams
   - Mentored 3 junior engineers and conducted code reviews
   
   Software Engineer | WebCorp | 2018-2021
   - Developed customer-facing features in React and Node.js
   - Implemented RESTful APIs and integrated with AWS services
   - Improved application performance by 40% through optimization
   
   SKILLS
   React, TypeScript, JavaScript, Node.js, HTML/CSS, AWS, Docker, Git, Agile
   
   EDUCATION
   BS Computer Science | State University | 2018
   ```

**Step 6: Optional - Add LinkedIn Links**
1. Add a recruiter LinkedIn URL (optional):
   - Example: `https://linkedin.com/in/demo-recruiter`
2. Add a peer/team member LinkedIn URL (optional):
   - Example: `https://linkedin.com/in/demo-engineer`

**Step 7: Analyze**
1. Click "Analyze →" button
2. Observe navigation to Profile step (auto-triggers analysis)

**Expected Result:**
- Button is enabled after filling required fields
- Smooth transition to next step
- Loading indicator appears briefly

---

### Part 4: Step 2 - Profile

**Step 8: Review Company Profile**
1. Wait for analysis to complete (1-2 seconds in dry-run)
2. Review the generated company profile:
   - Company name and industry
   - Headquarters location
   - Size bucket
   - Core principles/values
   - Company summary

**Step 9: Review Recruiter Profile (if provided)**
1. If you added a recruiter link, review:
   - Name and title
   - Tech depth assessment
   - Summary
   - Communication persona

**Step 10: Review Peer Profiles (if provided)**
1. If you added peer links, review team member summaries

**Step 11: Navigate to Fit Analysis**
1. Click "Next: Fit Analysis →" button

**Expected Result:**
- All profiles displayed with [DRY RUN] markers
- Clean, readable cards
- Navigation button enabled
- Smooth transition to Fit step

---

### Part 5: Step 3 - Fit Analysis

**Step 12: Review Overall Fit Score**
1. Observe the overall fit score (0-100)
2. Note the score level badge (Low/Medium/Great)
3. Read the summary assessment

**Step 13: Explore Weighted Dimensions**
1. Click "Show Details" button
2. Review each dimension:
   - Technical Skills (30% weight)
   - Experience Level (25% weight)
   - Domain Knowledge (20% weight)
   - Education (15% weight)
   - Cultural Fit (10% weight)
3. Read the reasoning for each score
4. Observe the visual progress bars

**Step 14: Analyze Keywords**
1. Review "Found in Resume" keywords (green badges)
2. Review "Missing from Resume" keywords (red badges)
3. Note which skills need emphasis

**Step 15: Navigate to Improve/Apply**
1. Click the "Improve Further →" or "Get Improvement Plan →" button

**Expected Result:**
- Fit score displayed prominently (typically 70-75 in dry-run)
- All 5 dimensions shown with weighted scores
- Keyword analysis clearly separated (found vs missing)
- Each dimension has specific reasoning
- Visual feedback through colors and progress bars

---

### Part 6: Step 4A - Resume Improvement Path

**Step 16: Choose Improvement Path**
1. On the Improve step, click "Improve Resume" button

**Step 17: Review Suggestions**
1. Review 3-5 specific suggestions:
   - Section name (e.g., "Summary", "Experience")
   - Current text (struck through)
   - Suggested improvement (in green)
   - Reasoning for the change
2. Note the missing keywords to consider adding
3. Observe the estimated new score (typically +6-8 points)

**Step 18: Iterate (Optional)**
1. Click "Improve Again" button to generate new suggestions
2. Observe iteration counter (max 5 iterations)
3. Each iteration builds on previous suggestions

**Step 19: Apply**
1. Click "Apply with Changes" button when satisfied

**Expected Result:**
- Specific, actionable suggestions (not generic advice)
- Clear before/after comparison
- Quantified improvement estimate
- Iteration limit enforced (5 max)
- Each suggestion explains why it's better

---

### Part 6: Step 4B - Apply Anyway (Skill Path)

**Step 20: Choose Skill Path**
1. From Improve step, click "← Choose Different Path" if already in improve mode
2. Click "Apply Anyway" button

**Step 21: Review Skill Path**
1. Review 3-5 skills to develop:
   - Skill name
   - Priority (high/medium/low)
   - Estimated hours (≤6h each)
   - Color-coded by priority
2. Observe learning resources (if available)
3. Note total time investment (typically 10-15h)

**Step 22: Read Recruiter Talk Track**
1. Review the recruiter talk track
2. Note how it addresses missing skills proactively
3. Copy for use in phone screens

**Step 23: Apply**
1. Click "Apply with Plan" button

**Expected Result:**
- 3-5 skills listed in priority order
- Each skill ≤6 hours (fast upskilling)
- Total hours reasonable (≤20h)
- Talk track addresses gaps confidently
- Resources provided when Network ON
- [DRY RUN] marker visible in dry-run mode

---

### Part 7: Testing Keyboard Navigation

**Step 24: Test Arrow Keys**
1. At any completed step, press Left Arrow key
2. Observe navigation to previous step
3. Press Right Arrow key
4. Observe navigation to next step (if available)

**Expected Result:**
- Smooth keyboard navigation
- Only navigates between completed/active steps
- Visual focus indication
- No navigation beyond available steps

---

### Part 8: Testing with Network ON (Optional)

**Step 25: Enable Network Mode**
1. Go to Settings
2. Toggle Network ON
3. Add a valid OpenAI API key
4. Save settings

**Step 26: Run Through Wizard Again**
1. Create a new job or use existing
2. Navigate to Coach Mode
3. Complete all steps
4. Observe real AI responses (no [DRY RUN] markers)

**Expected Result:**
- More detailed, contextual analysis
- No [DRY RUN] markers
- Responses tailored to specific inputs
- Slightly longer processing time (2-5 seconds)

---

## Success Criteria

### Functional
- ✅ All 4 steps complete successfully
- ✅ Dry-run mode works without API key
- ✅ Data persists across step navigation
- ✅ Keyboard navigation works (Left/Right arrows)
- ✅ Required fields are validated
- ✅ Optional fields are truly optional

### Data Quality
- ✅ Fit analysis provides specific scores and reasoning
- ✅ Improvement suggestions are actionable (not generic)
- ✅ Skill path has 3-5 items, each ≤6h
- ✅ Talk track addresses missing skills
- ✅ Keyword analysis separates found/missing clearly

### UX
- ✅ Stepper shows progress clearly
- ✅ Loading states provide feedback
- ✅ Navigation buttons are appropriately enabled/disabled
- ✅ Colors and visual hierarchy are clear
- ✅ "Why this matters" expanders provide context
- ✅ Microcopy is helpful and non-technical

### Privacy & Security
- ✅ Network OFF by default
- ✅ Dry-run mode clearly indicated with [DRY RUN] markers
- ✅ API key stored encrypted
- ✅ Privacy notice explains data handling
- ✅ Settings saved successfully

### Accessibility
- ✅ Keyboard navigation works throughout
- ✅ Focus rings visible
- ✅ Labels present on all inputs
- ✅ ARIA attributes set correctly (aria-current on active step)
- ✅ Color not sole means of conveying information

---

## Troubleshooting

**Issue: Analyze button stays disabled**
- Check that both Job Description and Resume fields have content
- Verify fields are not just whitespace

**Issue: Profile step shows loading forever**
- Check browser console for errors
- Verify API endpoints are responding (check Network tab)

**Issue: [DRY RUN] marker doesn't appear**
- Verify Network is OFF in Settings
- Check that dry-run query param is being added to API calls

**Issue: Keyboard navigation doesn't work**
- Ensure focus is on the page (click anywhere first)
- Verify step is completed before trying to navigate back

**Issue: Network ON but getting errors**
- Verify API key is valid and has credits
- Check browser console for specific error messages
- Verify API endpoint is correct for chosen provider

---

## Notes for Reviewers

1. **Dry-run vs Network ON**: The main difference is response quality. Dry-run provides realistic mock data for testing without API costs.

2. **Data Persistence**: All inputs are stored in React state. Refreshing the page will lose data. In production, consider adding auto-save.

3. **History & Caching**: AI runs are cached by input hash. Same inputs = cached response. Change inputs to see new analysis.

4. **Privacy**: This implementation prioritizes privacy-first design. Network OFF is the default, and all processing can work locally.

5. **Extension Points**: 
   - Add more capabilities to analyze endpoint
   - Implement run history UI (pin/revert/compare)
   - Add export functionality for reports
   - Integrate with existing attachments system

---

## Performance Notes

- **Dry-run mode**: P95 < 1s for all analysis steps
- **Network mode**: 2-5s depending on prompt complexity and provider
- **Database queries**: Optimized with proper indexes
- **Caching**: Input hash-based caching reduces duplicate calls

---

## Future Enhancements

1. **Source Integration**: Connect to existing job attachments for JD/resume
2. **Run History UI**: Visual timeline of analysis iterations
3. **Comparison Mode**: Side-by-side diff of different runs
4. **Export Reports**: PDF generation with full analysis
5. **Collaborative Mode**: Share analysis with peers for feedback
6. **Interview Prep**: Extend to cover interview stages
7. **Offer Negotiation**: Add salary benchmark integration
8. **Multi-job Analysis**: Compare fit across multiple jobs

