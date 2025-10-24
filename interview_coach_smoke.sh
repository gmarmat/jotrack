#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
JOB_ID="${JOB_ID:-123}"
OUTDIR="smoke"
mkdir -p "$OUTDIR"

jq_cmd() {
  if command -v jq >/dev/null 2>&1; then jq; else cat; fi
}

echo "==> Legacy (flag off)"
export INTERVIEW_V2=0
curl -s -X POST "$BASE_URL/api/interview-coach/$JOB_ID/score-answer"   -H 'Content-Type: application/json'   -d '{"answer":"I collaborated with the team on a migration.","persona":"recruiter"}' | jq_cmd > "$OUTDIR/legacy-score.json"

curl -s -X POST "$BASE_URL/api/interview-coach/$JOB_ID/suggest-follow-up"   -H 'Content-Type: application/json'   -d '{"answer":"I collaborated with the team on a migration.","persona":"recruiter"}' | jq_cmd > "$OUTDIR/legacy-prompts.json"

echo "==> V2 (flag on)"
export INTERVIEW_V2=1
curl -s -X POST "$BASE_URL/api/interview-coach/$JOB_ID/score-answer"   -H 'Content-Type: application/json'   -d '{"answer":"I led a zero-downtime migration that cut P95 latency by 38% for 2.4M users.","persona":"hm","jdCore":"Own latency and reliability","companyValues":["Customer Obsession"]}' | jq_cmd > "$OUTDIR/v2-score.json"

curl -s -X POST "$BASE_URL/api/interview-coach/$JOB_ID/suggest-follow-up"   -H 'Content-Type: application/json'   -d '{"answer":"I led a zero-downtime migration that cut P95 latency by 38% for 2.4M users.","persona":"hm","jdCore":"Own latency and reliability"}' | jq_cmd > "$OUTDIR/v2-prompts.json"

curl -s -X POST "$BASE_URL/api/interview-coach/$JOB_ID/extract-core-stories"   -H 'Content-Type: application/json'   -d '{"answers":[{"id":"a1","text":"I led a migration cutting P95 latency by 38%."},{"id":"a2","text":"I unblocked a cross-team launch under a 2-week deadline; +12% conversion."},{"id":"a3","text":"Reduced costs by $420k/yr via reserved instance strategy."}],"themes":["impact","ownership","ambiguity_resolution","cost"],"persona":"hm"}' | jq_cmd > "$OUTDIR/v2-stories.json"

echo "Wrote smoke outputs to $OUTDIR/"
