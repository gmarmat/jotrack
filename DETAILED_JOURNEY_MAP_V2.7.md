# Detailed Journey Map v2.7

**Complete User Journey with Technical Details**

---

## 🎯 **THE COMPLETE DATA JOURNEY**

```
═══════════════════════════════════════════════════════════════════════════════
                          PHASE 1: DOCUMENT UPLOAD
═══════════════════════════════════════════════════════════════════════════════

┌───────────────────────────────────────────────────────────────────────────┐
│  👤 USER ACTION: Create Job & Upload Documents                            │
├───────────────────────────────────────────────────────────────────────────┤
│  1. Navigate to homepage                                                   │
│  2. Click "Add New Job Application"                                       │
│  3. Enter: Title, Company, Status                                         │
│  4. Click "Create Job"                                                    │
│  5. Navigate to job page                                                  │
│  6. Click "Attachments" button (in header, second row)                   │
│  7. Upload files:                                                         │
│     • 📄 Resume.docx (350 KB)                                            │
│     • 💼 JobDescription.pdf (125 KB)                                     │
│     • ✉️ CoverLetter.docx (80 KB)                                        │
├───────────────────────────────────────────────────────────────────────────┤
│  ⚙️ SYSTEM ACTIONS:                                                       │
│  • Validate file types (.docx, .pdf, .txt)                               │
│  • Check size limits (10 MB per file, 100 MB per job)                    │
│  • Generate UUID for each attachment                                      │
│  • Save to: /data/attachments/[jobId]/[uuid].[ext]                       │
│  • Insert records into 'attachments' table:                              │
│     - id, job_id, filename, path, size, kind, version,                  │
│       is_active, created_at                                              │
│  • Mark as active (is_active = true, version = 1)                        │
├───────────────────────────────────────────────────────────────────────────┤
│  💾 DATABASE STATE:                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ attachments table:                                               │    │
│  │ ┌────────────┬─────────┬──────────┬──────┬─────────┬────────┐  │    │
│  │ │ id         │ job_id  │ filename │ kind │ version │ active │  │    │
│  │ ├────────────┼─────────┼──────────┼──────┼─────────┼────────┤  │    │
│  │ │ 841d17ee.. │ 3957... │ Resume.. │ resume│   1    │  true  │  │    │
│  │ │ 7f3a82bc.. │ 3957... │ JD.pdf   │ jd   │   1    │  true  │  │    │
│  │ │ 9e2c55ab.. │ 3957... │ Cover..  │ cover│   1    │  true  │  │    │
│  │ └────────────┴─────────┴──────────┴──────┴─────────┴────────┘  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
├───────────────────────────────────────────────────────────────────────────┤
│  💰 COST: FREE                                                            │
│  ⏱️ TIME: ~1-2 seconds total                                              │
│  📊 TOKENS: 0 (no AI used)                                                │
└───────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                    PHASE 2: AUTO LOCAL TEXT EXTRACTION
═══════════════════════════════════════════════════════════════════════════════

┌───────────────────────────────────────────────────────────────────────────┐
│  ⚙️ SYSTEM ACTION: Background Text Extraction (Automatic)                 │
├───────────────────────────────────────────────────────────────────────────┤
│  Triggered: Immediately after each file upload                            │
│  Code: app/api/jobs/[id]/attachments/route.ts (POST handler)            │
│  Function: saveRawVariant() from lib/extraction/extractionEngine.ts     │
├───────────────────────────────────────────────────────────────────────────┤
│  🔄 PROCESS FOR EACH FILE:                                                │
│                                                                           │
│  📄 Resume.docx:                                                          │
│  ┌───────────────────────────────────────────────────────────┐          │
│  │ 1. Detect file type: .docx                                │          │
│  │ 2. Call: mammoth.extractRawText({path: filePath})        │          │
│  │ 3. Get plain text: "John Smith\nSenior Product..."       │          │
│  │ 4. Count words: 2,450 words                              │          │
│  │ 5. Calculate contentHash: SHA-256(text)                  │          │
│  │    → "a7f3c8e2b4d1..."                                   │          │
│  │ 6. Estimate tokens: ~2,500 tokens                        │          │
│  │ 7. Check if variant exists with same hash                │          │
│  │ 8. If new: Insert into artifact_variants table:          │          │
│  │    - source_id: 841d17ee... (attachment id)             │          │
│  │    - source_type: 'resume'                               │          │
│  │    - variant_type: 'raw'                                 │          │
│  │    - content: {text: "...", metadata: {wordCount: 2450}} │          │
│  │    - content_hash: "a7f3c8e2b4d1..."                    │          │
│  │    - token_count: 2500                                   │          │
│  │    - extraction_model: 'local'                           │          │
│  │    - is_active: true                                     │          │
│  │    - created_at: 1697123456789                           │          │
│  └───────────────────────────────────────────────────────────┘          │
│                                                                           │
│  💼 JD.pdf:                                                               │
│  ┌───────────────────────────────────────────────────────────┐          │
│  │ 1. Detect file type: .pdf                                │          │
│  │ 2. Call: pdf-parse (dynamic import)                      │          │
│  │ 3. Get plain text: "We are seeking a Senior Product..."  │          │
│  │ 4. Count words: 825 words, 3 pages                       │          │
│  │ 5. Calculate contentHash: "b9e1f7a3c2..."               │          │
│  │ 6. Estimate tokens: ~850 tokens                          │          │
│  │ 7. Insert into artifact_variants (same process)          │          │
│  └───────────────────────────────────────────────────────────┘          │
│                                                                           │
│  ✉️ Cover.docx:                                                           │
│  ┌───────────────────────────────────────────────────────────┐          │
│  │ Same process as Resume.docx                               │          │
│  │ Word count: 512 words → ~550 tokens                      │          │
│  └───────────────────────────────────────────────────────────┘          │
├───────────────────────────────────────────────────────────────────────────┤
│  💾 DATABASE STATE (After Extraction):                                    │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ artifact_variants table:                                         │    │
│  │ ┌────────────┬──────────┬────────┬──────────┬──────┬─────────┐ │    │
│  │ │ source_id  │ source   │variant │ content  │tokens│  hash   │ │    │
│  │ │            │ _type    │_type   │          │      │         │ │    │
│  │ ├────────────┼──────────┼────────┼──────────┼──────┼─────────┤ │    │
│  │ │ 841d17ee.. │ resume   │ raw    │ "John.." │ 2500 │ a7f3c8..│ │    │
│  │ │ 7f3a82bc.. │ job_desc │ raw    │ "We are" │  850 │ b9e1f7..│ │    │
│  │ │ 9e2c55ab.. │ cover_le │ raw    │ "Dear.." │  550 │ c2d4e8..│ │    │
│  │ └────────────┴──────────┴────────┴──────────┴──────┴─────────┘ │    │
│  └─────────────────────────────────────────────────────────────────┘    │
├───────────────────────────────────────────────────────────────────────────┤
│  💰 COST: FREE (local computation only)                                   │
│  ⏱️ TIME: ~500ms per file = ~1.5 seconds total                            │
│  📊 TOKENS USED: 0 (no AI calls)                                          │
│  📊 TOKENS STORED: 3,900 (raw text for all 3 files)                      │
└───────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
              PHASE 3: UI SHOWS "DATA PIPELINE STATUS" PANEL
═══════════════════════════════════════════════════════════════════════════════

┌───────────────────────────────────────────────────────────────────────────┐
│  👁️ USER SEES: Purple Banner (Collapsible Panel)                         │
├───────────────────────────────────────────────────────────────────────────┤
│  [↓] 📄 Documents Ready · Click "Extract Data" to create AI-ready        │
│           variants from your uploads (~$0.02)                             │
│                                                                           │
│  Button: [Extract Data ~$0.02]  ← User clicks this                       │
├───────────────────────────────────────────────────────────────────────────┤
│  📊 PANEL STATE:                                                          │
│  • severity: 'no_variants'                                               │
│  • isStale: true                                                         │
│  • hasVariants: false                                                    │
│  • hasAnalysis: false                                                    │
│  • message: "Documents uploaded - click Extract Data..."                │
├───────────────────────────────────────────────────────────────────────────┤
│  💡 USER CAN:                                                             │
│  • Click expand (↓) to see uploaded documents list                       │
│  • Click "View Variants" → See only 'raw' column (other 2 empty)        │
│  • Click "Extract Data" to start AI processing                          │
└───────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                    PHASE 4: AI VARIANT EXTRACTION
═══════════════════════════════════════════════════════════════════════════════

┌───────────────────────────────────────────────────────────────────────────┐
│  👤 USER ACTION: Click "Extract Data" Button                              │
├───────────────────────────────────────────────────────────────────────────┤
│  API Endpoint: POST /api/jobs/[id]/refresh-variants                      │
│  Code: app/api/jobs/[id]/refresh-variants/route.ts                      │
├───────────────────────────────────────────────────────────────────────────┤
│  🔄 SYSTEM PROCESS (For Each Document):                                   │
│                                                                           │
│  DOCUMENT 1/3: Resume                                                     │
│  ┌────────────────────────────────────────────────────────────┐         │
│  │ Step 1: Fetch 'raw' variant from database                 │         │
│  │   SELECT * FROM artifact_variants                          │         │
│  │   WHERE source_id='841d17ee' AND variant_type='raw'       │         │
│  │   → Get: {text: "John Smith\nSenior PM...", ...}          │         │
│  │                                                            │         │
│  │ Step 2: Prepare AI extraction prompt                      │         │
│  │   Prompt: "Extract structured data from this resume..."   │         │
│  │   + Raw text (2,500 tokens)                               │         │
│  │   Total input: ~2,700 tokens                              │         │
│  │                                                            │         │
│  │ Step 3: Call GPT-4o Mini API                              │         │
│  │   Model: gpt-4o-mini                                       │         │
│  │   Temperature: 0.3 (consistent structured output)         │         │
│  │   Max tokens: 2,000                                        │         │
│  │                                                            │         │
│  │ Step 4: AI returns structured JSON                        │         │
│  │   {                                                        │         │
│  │     "name": "John Smith",                                 │         │
│  │     "role": "Senior Product Manager",                     │         │
│  │     "contact": {                                           │         │
│  │       "email": "john@example.com",                        │         │
│  │       "phone": "(555) 123-4567",                          │         │
│  │       "location": "San Francisco, CA"                     │         │
│  │     },                                                     │         │
│  │     "skills": [                                            │         │
│  │       "Product Management", "Agile", "SQL",               │         │
│  │       "Python", "Tableau", "User Research"                │         │
│  │     ],                                                     │         │
│  │     "experience": [                                        │         │
│  │       {                                                    │         │
│  │         "company": "Google Inc.",                          │         │
│  │         "role": "Senior Product Manager",                 │         │
│  │         "duration": "3 years",                            │         │
│  │         "dates": "2020-2023",                             │         │
│  │         "key_achievements": [                             │         │
│  │           "Launched search feature with 10M+ DAU",        │         │
│  │           "Increased engagement by 35%"                   │         │
│  │         ]                                                  │         │
│  │       }                                                    │         │
│  │     ],                                                     │         │
│  │     "education": {                                         │         │
│  │       "degree": "MBA",                                     │         │
│  │       "school": "Stanford University",                    │         │
│  │       "year": 2018                                         │         │
│  │     }                                                      │         │
│  │   }                                                        │         │
│  │   Output tokens: ~600 (compact version)                   │         │
│  │                                                            │         │
│  │ Step 5: Create 'ai_optimized' variant                     │         │
│  │   • Remove unnecessary fields                             │         │
│  │   • Keep only essential data for prompts                  │         │
│  │   • Result: ~500 tokens (83% reduction!)                  │         │
│  │   • Store in artifact_variants:                           │         │
│  │     - source_id: 841d17ee...                              │         │
│  │     - variant_type: 'ai_optimized'                        │         │
│  │     - content: {compact JSON above}                       │         │
│  │     - token_count: 500                                    │         │
│  │     - content_hash: SHA-256(JSON)                         │         │
│  │                                                            │         │
│  │ Step 6: Create 'detailed' variant                         │         │
│  │   • Include ALL extracted fields                          │         │
│  │   • Add extended metadata                                 │         │
│  │   • Result: ~1,500 tokens (full structured)               │         │
│  │   • Store in artifact_variants:                           │         │
│  │     - source_id: 841d17ee...                              │         │
│  │     - variant_type: 'detailed'                            │         │
│  │     - content: {extended JSON}                            │         │
│  │     - token_count: 1500                                   │         │
│  │                                                            │         │
│  │ Step 7: Compare with previous version (if exists)         │         │
│  │   • Fetch previous ai_optimized variant                   │         │
│  │   • Call AI for semantic comparison                       │         │
│  │   • Return: {similarity: 0.95, changes: [...],           │         │
│  │              significance: 'minor'}                       │         │
│  └────────────────────────────────────────────────────────────┘         │
│                                                                           │
│  SAME PROCESS FOR:                                                        │
│  • JD.pdf (input: 850 tokens → ai_opt: 300, detailed: 900)              │
│  • Cover.docx (input: 550 tokens → ai_opt: 200, detailed: 600)          │
├───────────────────────────────────────────────────────────────────────────┤
│  💾 DATABASE STATE (After AI Extraction):                                 │
│  ┌──────────────────────────────────────────────────────────────┐       │
│  │ artifact_variants table now has 9 total records:            │       │
│  │ ┌────────────┬──────────┬────────────┬────────┬──────────┐ │       │
│  │ │ source_id  │ source   │ variant    │ tokens │   hash   │ │       │
│  │ │            │ _type    │ _type      │        │          │ │       │
│  │ ├────────────┼──────────┼────────────┼────────┼──────────┤ │       │
│  │ │ 841d17ee.. │ resume   │ raw        │  2500  │ a7f3c8.. │ │       │
│  │ │ 841d17ee.. │ resume   │ ai_optimiz │   500  │ d4e8f2.. │ │       │
│  │ │ 841d17ee.. │ resume   │ detailed   │  1500  │ f9a2c5.. │ │       │
│  │ │ 7f3a82bc.. │ job_desc │ raw        │   850  │ b9e1f7.. │ │       │
│  │ │ 7f3a82bc.. │ job_desc │ ai_optimiz │   300  │ e3f7a9.. │ │       │
│  │ │ 7f3a82bc.. │ job_desc │ detailed   │   900  │ c1d5e9.. │ │       │
│  │ │ 9e2c55ab.. │ cover_le │ raw        │   550  │ c2d4e8.. │ │       │
│  │ │ 9e2c55ab.. │ cover_le │ ai_optimiz │   200  │ a8b3c7.. │ │       │
│  │ │ 9e2c55ab.. │ cover_le │ detailed   │   600  │ d2e6f1.. │ │       │
│  │ └────────────┴──────────┴────────────┴────────┴──────────┘ │       │
│  └──────────────────────────────────────────────────────────────┘       │
├───────────────────────────────────────────────────────────────────────────┤
│  💰 COST CALCULATION:                                                     │
│  Resume:  (2,700 in × $0.15/1M) + (2,100 out × $0.60/1M) = $0.0017      │
│  JD:      (1,050 in × $0.15/1M) + (1,200 out × $0.60/1M) = $0.0009      │
│  Cover:   (750 in × $0.15/1M) + (800 out × $0.60/1M) = $0.0006          │
│  Semantic Compare (×3): ~$0.0018                                         │
│  ───────────────────────────────────────────────────────────────         │
│  TOTAL: ~$0.005 (about half a cent!)                                     │
│                                                                           │
│  ⏱️ TIME: ~2-3 seconds per file = ~6-9 seconds total                      │
│  📊 AI TOKENS USED: ~10,000 tokens (input + output + comparison)         │
│  📊 TOKENS SAVED: Variants ready for reuse (no re-processing!)           │
└───────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
           PHASE 5: UI UPDATES TO "DATA EXTRACTED - START ANALYSIS"
═══════════════════════════════════════════════════════════════════════════════

┌───────────────────────────────────────────────────────────────────────────┐
│  👁️ USER SEES: Blue Banner (Data Pipeline Status Panel)                  │
├───────────────────────────────────────────────────────────────────────────┤
│  [↓] 🌟 Data Extracted - Start Analysis · AI variants ready · Scroll to │
│           sections below and trigger analysis for each (~$0.05-0.10)     │
│                                                                           │
│  [EXPANDED VIEW]                                                         │
│  ┌──────────────────────────────────────────────────────────────┐       │
│  │ 📎 Input Documents (3)                                       │       │
│  │                                                               │       │
│  │ ┌───────────────────────────────────┬──────────────────┐    │       │
│  │ │ 📄 Resume.docx • v1 • Active     │ [View Variants]  │    │       │
│  │ └───────────────────────────────────┴──────────────────┘    │       │
│  │ ┌───────────────────────────────────┬──────────────────┐    │       │
│  │ │ 💼 JD.pdf • v1 • Active          │ [View Variants]  │    │       │
│  │ └───────────────────────────────────┴──────────────────┘    │       │
│  │ ┌───────────────────────────────────┬──────────────────┐    │       │
│  │ │ ✉️ Cover.docx • v1                │ [View Variants]  │    │       │
│  │ └───────────────────────────────────┴──────────────────┘    │       │
│  │                                                               │       │
│  │ Ready: [🎯 Match] [🏢 Company] [🌐 Ecosystem] [👤 Profile]  │       │
│  │        ↑ Click any badge to scroll to that section           │       │
│  └──────────────────────────────────────────────────────────────┘       │
├───────────────────────────────────────────────────────────────────────────┤
│  💡 USER ACTIONS AVAILABLE:                                               │
│  1. Click "View Variants" on any document                                │
│     → Opens modal with 3 columns side-by-side:                          │
│       [📄 Raw] [🤖 AI-Optimized] [📋 Detailed]                          │
│     → Can verify extraction quality                                      │
│                                                                           │
│  2. Click any badge (🎯/🏢/🌐/👤)                                       │
│     → Smooth scroll to that section                                      │
│     → Find "Analyze" button in section                                   │
│     → Trigger analysis for that specific section                        │
└───────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
              PHASE 6: INDIVIDUAL SECTION ANALYSIS (User Choice)
═══════════════════════════════════════════════════════════════════════════════

User scrolls to a section and clicks "Analyze" button.
Each section is independent, triggered separately.


┌─────────────────────────────────────────────────────────────────────────────┐
│  SECTION 1: 🎯 MATCH SCORE ANALYSIS                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  User scrolls to Match section → Clicks "Analyze Match Score" button       │
│  API: POST /api/jobs/[id]/analyze-match-score                              │
│  Prompt: prompts/matchScore.v1.md                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  📥 INPUTS FETCHED:                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐     │
│  │ 1. Resume ai_optimized variant (500 tokens)                      │     │
│  │    SELECT content FROM artifact_variants                         │     │
│  │    WHERE source_id='841d17ee' AND variant_type='ai_optimized'  │     │
│  │    → {"name":"John", "skills":[...], "experience":[...]}       │     │
│  │                                                                  │     │
│  │ 2. JD ai_optimized variant (300 tokens)                         │     │
│  │    SELECT content FROM artifact_variants                         │     │
│  │    WHERE source_id='7f3a82bc' AND variant_type='ai_optimized'  │     │
│  │    → {"requirements":[...], "responsibilities":[...]}          │     │
│  │                                                                  │     │
│  │ 3. Company name from job record                                 │     │
│  │    → "TechCorp Inc."                                            │     │
│  └──────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│  🤖 AI PROCESSING:                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐     │
│  │ Input Assembly:                                                  │     │
│  │ • Load matchScore.v1.md prompt template                          │     │
│  │ • Replace {{resumeVariant}} with 500-token JSON                 │     │
│  │ • Replace {{jdVariant}} with 300-token JSON                     │     │
│  │ • Replace {{companyName}} with "TechCorp Inc."                  │     │
│  │ • Total prompt: ~1,200 tokens                                    │     │
│  │                                                                  │     │
│  │ AI Call:                                                         │     │
│  │ • Model: GPT-4o Mini                                             │     │
│  │ • System: "You are an expert career advisor..."                 │     │
│  │ • User message: [assembled prompt]                              │     │
│  │ • Temperature: 0.3                                               │     │
│  │ • Max tokens: 4000                                               │     │
│  │                                                                  │     │
│  │ AI Response (JSON):                                              │     │
│  │ {                                                                │     │
│  │   "overallScore": 0.85,                                         │     │
│  │   "categoryBreakdown": {                                        │     │
│  │     "technical": {"score": 0.82, "weight": 0.40},              │     │
│  │     "experience": {"score": 0.88, "weight": 0.35},             │     │
│  │     "softSkills": {"score": 0.85, "weight": 0.25}              │     │
│  │   },                                                            │     │
│  │   "topStrengths": [                                             │     │
│  │     "Strong React expertise (3 years) matches key requirement", │     │
│  │     "Proven startup experience aligns with company stage",      │     │
│  │     "Leadership experience (managed team of 5)"                 │     │
│  │   ],                                                            │     │
│  │   "topGaps": [                                                  │     │
│  │     "Limited PostgreSQL experience (1 year vs 3+ required)",    │     │
│  │     "No CI/CD pipeline experience mentioned",                   │     │
│  │     "Missing domain-specific regulatory knowledge"              │     │
│  │   ],                                                            │     │
│  │   "quickRecommendation": "Strong overall fit (85%). Highlight  │     │
│  │     React projects and startup adaptability. Address PostgreSQL│     │
│  │     gap in cover letter or prepare learning plan.",            │     │
│  │   "confidence": 0.90                                            │     │
│  │ }                                                                │     │
│  │ Output: ~1,000 tokens                                            │     │
│  └──────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│  💾 STORAGE (TODO - Not Yet Implemented):                                  │
│  • Store in match_score_analysis table (future)                           │
│  • For now: Returned to UI directly                                       │
│                                                                             │
│  📺 UI DISPLAY:                                                             │
│  • Match Score card shows: 85%                                             │
│  • Category breakdown chart renders                                       │
│  • Strengths/Gaps lists display                                           │
│  • Recommendation shown prominently                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  💰 COST: ~$0.05                                                            │
│  ⏱️ TIME: ~3-5 seconds                                                      │
│  📊 TOKENS: Input 1,200 + Output 1,000 = 2,200 total                       │
│  💰 SAVINGS: Would have been ~$0.18 without variants (500 vs 2,500 tokens!)│
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│  SECTION 2: 🏢 COMPANY INTELLIGENCE                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  User clicks [🏢 Company] badge → Scrolls to Company section               │
│  User clicks "Analyze Company" button                                       │
│  API: POST /api/jobs/[id]/analyze-company                                  │
│  Prompt: prompts/company.v1.md                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  📥 INPUTS:                                                                 │
│  • JD ai_optimized variant (300 tokens)                                    │
│  • Company name: "TechCorp Inc." (extracted from JD or job record)         │
│  • WEB SEARCH PERMISSION: ✅ GRANTED (up to 5 searches)                    │
│                                                                             │
│  🌐 WEB RESEARCH PROCESS:                                                   │
│  ┌──────────────────────────────────────────────────────────────────┐     │
│  │ AI performs up to 5 web searches:                               │     │
│  │ 1. Search: "TechCorp Inc company overview"                      │     │
│  │    → Finds: techcorp.com/about                                  │     │
│  │    → Extracts: Founded 2018, 250+ employees                     │     │
│  │                                                                  │     │
│  │ 2. Search: "TechCorp Inc funding news"                          │     │
│  │    → Finds: TechCrunch article                                  │     │
│  │    → Extracts: Series B $75M led by Sequoia                     │     │
│  │                                                                  │     │
│  │ 3. Search: "TechCorp Inc LinkedIn"                              │     │
│  │    → Finds: linkedin.com/company/techcorp                       │     │
│  │    → Extracts: 5,000+ employees, rapid growth                   │     │
│  │                                                                  │     │
│  │ 4. Search: "TechCorp Inc culture Glassdoor"                     │     │
│  │    → Finds: Reviews mentioning fast-paced, innovative           │     │
│  │    → Extracts: Culture values                                   │     │
│  │                                                                  │     │
│  │ 5. Search: "TechCorp Inc leadership team"                       │     │
│  │    → Finds: CEO Jane Doe (ex-Google), CTO John Smith (ex-Meta) │     │
│  │    → Extracts: Leadership backgrounds                           │     │
│  └──────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│  🤖 AI ANALYSIS:                                                            │
│  • Combines JD requirements with web research                              │
│  • Identifies: competitors, culture, leadership, key facts                 │
│  • Returns structured JSON (see prompt for full schema)                    │
│  • Output: ~2,000 tokens                                                   │
│                                                                             │
│  💾 STORAGE (TODO):                                                         │
│  • Store in company_intelligence table                                     │
│                                                                             │
│  📺 UI DISPLAY:                                                             │
│  • Company overview card                                                   │
│  • Key facts list                                                          │
│  • Culture & values                                                        │
│  • Leadership profiles                                                     │
│  • Competitor analysis                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  💰 COST: ~$0.10 (prompt $0.05 + web searches $0.05)                       │
│  ⏱️ TIME: ~5-10 seconds (web searches add latency)                         │
│  📊 TOKENS: ~3,500 total (input + searches + output)                       │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│  SECTION 3: 🌐 COMPANY ECOSYSTEM MATRIX                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  User clicks [🌐 Ecosystem] badge → Clicks "Analyze Ecosystem"             │
│  API: POST /api/jobs/[id]/analyze-ecosystem                                │
│  Prompt: prompts/companyEcosystem.v1.md                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  📥 INPUTS:                                                                 │
│  • JD ai_optimized variant (300 tokens)                                    │
│  • Company name: "TechCorp Inc."                                           │
│  • Company intelligence (optional, if Step 2 was run first)                │
│                                                                             │
│  🤖 AI ANALYSIS:                                                            │
│  • Identifies 15-25 related companies                                      │
│  • Categorizes: direct/adjacent/upstream/downstream/complementary          │
│  • Scores relevance (0-100)                                                │
│  • Flags career opportunities                                              │
│  • Marks interview relevance                                               │
│  • Returns structured JSON with ecosystem matrix                           │
│  • Output: ~1,500 tokens                                                   │
│                                                                             │
│  📺 UI DISPLAY:                                                             │
│  • Grid of related companies                                               │
│  • Color-coded by category                                                 │
│  • Relevance scores                                                        │
│  • Career opportunity indicators                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  💰 COST: ~$0.05                                                            │
│  ⏱️ TIME: ~3-5 seconds                                                      │
│  📊 TOKENS: ~2,500 total                                                    │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│  SECTION 4: 👤 USER PROFILE BUILDING                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  User clicks [👤 Profile] badge → Clicks "Analyze Profile"                 │
│  API: POST /api/jobs/[id]/analyze-user-profile                             │
│  Prompt: prompts/userProfile.v1.md                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  📥 INPUTS:                                                                 │
│  • Resume ai_optimized variant (500 tokens)                                │
│  • JD ai_optimized variant (300 tokens)                                    │
│  • Existing global profile (if any)                                        │
│  • Match analysis results (optional, if Step 1 ran first)                  │
│                                                                             │
│  🤖 AI ANALYSIS:                                                            │
│  ┌──────────────────────────────────────────────────────────────────┐     │
│  │ TWO PROFILES BUILT:                                              │     │
│  │                                                                  │     │
│  │ A. JOB-SPECIFIC PROFILE:                                         │     │
│  │    • Key strengths for THIS role                                │     │
│  │    • Relevant achievements (filtered for THIS job)              │     │
│  │    • STAR stories (5-7 stories, 2-3 min each)                  │     │
│  │    • Skills categorized (strong/developing/missing)             │     │
│  │    • Gap closing plans (actionable steps)                       │     │
│  │    • Interview prep (topics, keywords)                          │     │
│  │    • Unique value props (what makes you stand out)              │     │
│  │                                                                  │     │
│  │ B. GLOBAL INSIGHTS (for future jobs):                           │     │
│  │    • Generic skills (applicable to all PM roles)                │     │
│  │    • Universal achievements (10M DAU launch)                    │     │
│  │    • Career patterns (startup → scale-up → enterprise)          │     │
│  │    • Transferable experiences                                   │     │
│  │    • Marked: applicableToFutureJobs = true                      │     │
│  └──────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│  💾 STORAGE:                                                                │
│  ┌──────────────────────────────────────────────────────────────────┐     │
│  │ 1. Job-Specific Profile:                                         │     │
│  │    • Store in job_profiles table (TODO)                         │     │
│  │    • Linked to this job ID                                      │     │
│  │    • Versioned (can update as user improves resume)             │     │
│  │                                                                  │     │
│  │ 2. Global Profile Update:                                        │     │
│  │    • Fetch existing user_profile record (singleton)             │     │
│  │    • Merge new globalInsights                                   │     │
│  │    • Deduplicate (don't store same insight twice)               │     │
│  │    • Update version number                                      │     │
│  │    • Store back to user_profile table                           │     │
│  └──────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│  📺 UI DISPLAY:                                                             │
│  • Profile card in section                                                 │
│  • Available at: /profile page                                             │
│  • Shows: Skills, stories, gaps, recommendations                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  💰 COST: ~$0.05                                                            │
│  ⏱️ TIME: ~4-6 seconds                                                      │
│  📊 TOKENS: Input 1,300 + Output 2,000 = 3,300 total                       │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│  SECTION 5: 🎯 MATCH MATRIX (50 Signals)                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  User clicks "Analyze Match Matrix" button in Match section                │
│  API: POST /api/jobs/[id]/evaluate-signals (already exists!)               │
│  Prompt: prompts/matchSignals.v1.md                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  📥 INPUTS:                                                                 │
│  • Resume ai_optimized (500 tokens)                                        │
│  • JD ai_optimized (300 tokens)                                            │
│  • 30 ATS Standard Signals (pre-defined)                                   │
│  • 20 Dynamic Signals (AI generates based on JD)                           │
│                                                                             │
│  🤖 AI PROCESSING:                                                          │
│  • Evaluates each of 50 signals                                            │
│  • Scores 0.0-1.0 for each signal                                          │
│  • Provides evidence from resume/JD                                        │
│  • Explains reasoning                                                      │
│  • Calculates category weights                                             │
│  • Computes overall score                                                  │
│  • Output: ~3,000 tokens (50 signals × 60 tokens each)                    │
│                                                                             │
│  💾 STORAGE:                                                                │
│  • Already implemented: signal_evaluations table                           │
│  • Records inserted for each signal                                        │
│                                                                             │
│  📺 UI DISPLAY:                                                             │
│  • FitTable component (expandable by category)                             │
│  • Shows all 50 signals with scores                                        │
│  • Color-coded icons (⚙️ ATS, ✨ Dynamic)                                  │
│  • Evidence and reasoning per signal                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  💰 COST: ~$0.08                                                            │
│  ⏱️ TIME: ~5-8 seconds                                                      │
│  📊 TOKENS: ~5,000 total                                                    │
└─────────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                PHASE 7: ALL ANALYSIS COMPLETE - GREEN STATE
═══════════════════════════════════════════════════════════════════════════════

┌───────────────────────────────────────────────────────────────────────────┐
│  ⚙️ SYSTEM UPDATES:                                                        │
├───────────────────────────────────────────────────────────────────────────┤
│  1. Update jobs table:                                                    │
│     UPDATE jobs SET                                                       │
│       analysis_state = 'fresh',                                           │
│       analysis_fingerprint = SHA-256(all_variant_hashes),                │
│       last_full_analysis_at = NOW()                                       │
│     WHERE id = [jobId]                                                    │
│                                                                           │
│  2. Staleness check returns:                                              │
│     {                                                                     │
│       "isStale": false,                                                   │
│       "severity": "fresh",                                                │
│       "message": "Analysis is up to date",                               │
│       "hasVariants": true,                                                │
│       "hasAnalysis": true                                                 │
│     }                                                                     │
└───────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│  👁️ USER SEES: Green Banner                                               │
├───────────────────────────────────────────────────────────────────────────┤
│  [↓] ✅ Analysis Complete · All data and analysis current · System will  │
│           alert when significant changes detected                         │
│                                                                           │
│  [EXPANDED VIEW]                                                         │
│  ┌──────────────────────────────────────────────────────────────┐       │
│  │ 📎 Input Documents (3)                                       │       │
│  │ [📄 Resume] [💼 JD] [✉️ Cover] with [View Variants] buttons │       │
│  │                                                               │       │
│  │ Ready: [🎯 Match] [🏢 Company] [🌐 Ecosystem] [👤 Profile]  │       │
│  │        ↑ Click to jump to that section's results             │       │
│  └──────────────────────────────────────────────────────────────┘       │
├───────────────────────────────────────────────────────────────────────────┤
│  💡 USER CAN NOW:                                                         │
│  • View all analysis results                                             │
│  • Click badges to navigate to sections                                  │
│  • View variants (3-column comparison)                                   │
│  • Edit notes                                                            │
│  • Upload new document version → Orange banner → Re-extract              │
│  • Navigate to /profile to see global insights                           │
└───────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
           PHASE 8: DOCUMENT UPDATE & CHANGE DETECTION (Optional)
═══════════════════════════════════════════════════════════════════════════════

┌───────────────────────────────────────────────────────────────────────────┐
│  👤 USER ACTION: Upload Updated Resume (v2)                                │
├───────────────────────────────────────────────────────────────────────────┤
│  1. Click "Attachments" button in header                                  │
│  2. Upload Resume_v2.docx                                                │
│  3. System creates new attachment record (version = 2)                    │
│  4. System extracts 'raw' variant (auto background)                       │
│  5. Triggers SQL trigger on attachments table                            │
├───────────────────────────────────────────────────────────────────────────┤
│  ⚙️ DATABASE TRIGGER FIRES:                                                │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │ Trigger: staleness_on_attachment_update                          │    │
│  │                                                                  │    │
│  │ UPDATE jobs                                                      │    │
│  │ SET analysis_state = 'stale'                                    │    │
│  │ WHERE id = [jobId]                                              │    │
│  └──────────────────────────────────────────────────────────────────┘    │
├───────────────────────────────────────────────────────────────────────────┤
│  👁️ USER SEES: Orange Banner                                              │
│  [↓] ⚠️ Documents Changed · Documents updated · Click "Extract Data"     │
│           to refresh AI variants before analyzing                         │
│                                                                           │
│  Buttons: [Extract Data ~$0.02] (highlighted)                            │
│                                                                           │
│  User clicks → Returns to Phase 4 (AI extraction)                        │
│  → New variants created with contentHash                                 │
│  → AI compares old vs new                                                │
│  → Shows changelog: "Added 3 skills: AWS, Docker, K8s"                   │
└───────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                         TOTAL COST & TIME SUMMARY
═══════════════════════════════════════════════════════════════════════════════

┌───────────────────────────────────────────────────────────────────────────┐
│  COMPLETE ANALYSIS (All Sections)                                         │
├───────────────────────────────────────────────────────────────────────────┤
│  Phase 1: Upload                           FREE        Instant            │
│  Phase 2: Local Extract (raw)              FREE        ~1.5s              │
│  Phase 3: UI Update                        FREE        Instant            │
│  Phase 4: AI Extract (variants)            $0.02       ~6-9s              │
│  Phase 5: UI Update (blue banner)          FREE        Instant            │
│  Phase 6a: Match Score                     $0.05       ~4s                │
│  Phase 6b: Company Intel                   $0.10       ~8s                │
│  Phase 6c: Ecosystem                       $0.05       ~4s                │
│  Phase 6d: User Profile                    $0.05       ~5s                │
│  Phase 6e: Match Matrix                    $0.08       ~7s                │
│  Phase 7: UI Update (green banner)         FREE        Instant            │
│  ─────────────────────────────────────────────────────────────────────    │
│  GRAND TOTAL:                             ~$0.35      ~45-55 seconds      │
│                                                                           │
│  vs. OLD WAY (without variants):          ~$1.50      ~60-90 seconds      │
│                                                                           │
│  SAVINGS:                                77% cost      20% time faster    │
│                                         reduction!                        │
└───────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                      TOKEN FLOW & REUSE VISUALIZATION
═══════════════════════════════════════════════════════════════════════════════

                         ┌─────────────────────┐
                         │   RESUME            │
                         │   (Original File)   │
                         └──────────┬──────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
          ┌──────────────────┐          ┌──────────────────┐
          │ raw              │          │ (File stored)    │
          │ 2,500 tokens     │          │ /data/attachments│
          │ FREE to create   │          └──────────────────┘
          └─────────┬────────┘
                    │ $0.01 AI call
                    ▼
          ┌─────────────────────────────────────┐
          │                                     │
          ▼                                     ▼
┌──────────────────┐              ┌──────────────────┐
│ ai_optimized     │              │ detailed         │
│ 500 tokens       │              │ 1,500 tokens     │
│ (Compact)        │              │ (Complete)       │
└─────────┬────────┘              └─────────┬────────┘
          │                                  │
          │ REUSED IN:                       │ USED FOR:
          ├─→ Match Score                    ├─→ Job Profile
          ├─→ Match Matrix                   ├─→ Global Profile
          ├─→ Company Intel (JD)             ├─→ Future Data Mining
          ├─→ Ecosystem (JD)                 └─→ Extended Analysis
          └─→ User Profile
          
          5 sections × 500 tokens = 2,500 tokens TOTAL
          
          vs. WITHOUT variants:
          5 sections × 2,500 tokens = 12,500 tokens
          
          SAVINGS: 10,000 tokens = ~$0.75! 💰
```

---

## 🎯 **KEY TECHNICAL DECISIONS**

### **1. Why 3 Variants?**
```
raw (2,500 tok)     → Backup, debugging, re-extraction
ai_optimized (500)  → Used in ALL prompts, SAVES MONEY
detailed (1,500)    → Profile building, future features
```

### **2. When Does Analysis Run?**
```
❌ NOT automatic after "Extract Data"
✅ User triggers EACH section individually
Why: User control, cost transparency, flexibility
```

### **3. Change Detection Strategy:**
```
Content-based (SHA-256 hash):
• Hash ai_optimized variant content
• Compare with previous hash
• If different → Orange banner
• SQL triggers auto-detect changes
```

### **4. Profile Accumulation:**
```
Job-Specific:      Stored per job, role-tailored
Global Insights:   Merged to singleton, deduplicated
Why Both:          Specific prep + reusable knowledge
```

---

**This is the complete, accurate, detailed journey map!** 🎉

