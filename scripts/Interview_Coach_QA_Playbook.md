# Interview Coach – QA Playbook
_Last updated: 2025-10-23 17:33 UTC_

This playbook lets you validate the **entire V2 Interview Coach loop** quickly and consistently, and gives you a lightweight bug triage template.

---

## 0) Prep
- Ensure app runs locally on port **3000**.
- Build and lint once:
  ```bash
  npm run dev:check || (npm run lint && npm run test:vitest)
  ```
- Confirm Playwright works:
  ```bash
  npm run e2e:ui
  ```

---

## 1) Feature Flag Matrix
Test both **legacy** and **V2**:
```bash
# Legacy OFF
INTERVIEW_V2=0 npm run dev

# V2 ON
INTERVIEW_V2=1 npm run dev
```

Expected:
- **OFF**: API returns legacy `{score}` only; minimal UI still renders.
- **ON**: API returns additive fields; UI shows **subscores, flags, confidence, prompts, stories**.

---

## 2) API Smoke (quick)
Use the provided script:
```bash
bash interview_coach_smoke.sh
```

Artifacts:
- `smoke/v2-score.json`, `smoke/v2-prompts.json`, `smoke/v2-stories.json`
- `smoke/legacy-score.json`, `smoke/legacy-prompts.json`

---

## 3) Golden & Property Tests
- Golden regression:
  ```bash
  npm run test:golden
  ```
  - Pass if **MAE ≤ 3**.
- Property tests:
  ```bash
  npm run test:vitest -- tests/unit/interview-coach/scoring.property.spec.ts
  ```

---

## 4) Full E2E
```bash
INTERVIEW_V2=1 npm run e2e:headed
npm run e2e:report
```
Pass when:
- Practice → **subscores** increase when adding metrics
- Follow-ups → **2–3 prompts**; content shifts when low dims change
- Questions → items include **sourceUrl/snippet/fetchedAt**
- Core stories → **3–4 stories**; **coverage ≥ 80%**

---

## 5) Telemetry/Logs Quick Check
In dev console, verify one structured event per route:
- `route`, `persona`, `durationMs`, `score`, `confidence`, `promptsCount`, `storiesCount`, `flags`
- No PII (answers are hashed; only length exposed)

---

## 6) Bug Triage Template

**Title:** [Area] Concise issue
**Area:** API | UI | Scoring | Prompts | Stories | Caching | Telemetry
**Env:** INTERVIEW_V2=[0/1], commit=SHA, node=18+, browser=Chrome vXX
**Steps to Repro:**
1. …
2. …
**Expected:** …
**Actual:** …
**Artifacts:** attach `smoke/*.json` or Playwright screenshots
**Severity:** (P0, P1, P2, P3)
- **P0:** data loss/crash/blocker
- **P1:** flow blocked or wrong results
- **P2:** degraded UX, but workaround exists
- **P3:** polish/low risk

**Owner:** …  **Status:** New → In Progress → Fixed → Verified

---

## 7) Go/No-Go Gate
All must be green:
- `npm run dev:check`
- `npm run test:golden` (MAE ≤ 3)
- `INTERVIEW_V2=1 npm run e2e:headed` (green)
- Evidence TTL and cache tests (green)
- Telemetry visible, no PII

---

## 8) Rollout Notes
- Keep `INTERVIEW_V2` default **off** for general users.
- Enable for your account; gather telemetry for a day.
- If stable, flip default to **on**.

---

## Appendix: Quick Commands
```bash
# Run only the interview-coach stable E2E
npm run e2e -- e2e/interview-coach.stable.spec.ts

# Rebuild & clean cache
npm run clean && npm run build
```
