#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(pwd)"
ROUTE_FILE="app/api/jobs/[id]/status/route.ts"
REPO_FILE="db/repository.ts"

pass() { printf "✅ %s\n" "$1"; }
fail() { printf "❌ %s\n" "$1"; }

echo "== Jotrack 2.1a audit ($(date)) =="
echo "Project: $PROJECT_ROOT"
echo

# 1) Route file presence
if [[ -f "$ROUTE_FILE" ]]; then pass "Route file exists: $ROUTE_FILE"; else fail "Missing route: $ROUTE_FILE"; fi

# 2) PATCH handler present
if [[ -f "$ROUTE_FILE" ]] && grep -qE 'export\s+async\s+function\s+PATCH' "$ROUTE_FILE"; then
  pass "PATCH handler exported in route"
else
  fail "PATCH handler not found in route"
fi

# 3) Zod status schema contains all allowed values
if [[ -f "$ROUTE_FILE" ]] && grep -Eq "'Applied'|'Phone Screen'|'Onsite'|'Offer'|'Rejected'" "$ROUTE_FILE"; then
  pass "Zod status schema includes required values"
else
  fail "Zod status schema values incomplete/missing"
fi

# 4) Repository function
if [[ -f "$REPO_FILE" ]] && grep -q "updateJobStatus" "$REPO_FILE"; then
  pass "Repository function updateJobStatus present"
else
  fail "updateJobStatus not found in $REPO_FILE"
fi

# 5) status_history table somewhere in db/ (schema/migrations)
if grep -Rqs --include="*.ts" "status_history" db; then
  pass "status_history references found in db/"
else
  fail "No status_history references detected in db/"
fi

echo
echo "== Runtime smoke tests (server must be running at http://localhost:3000) =="
SERVER_OK=0
HTTP_CODE="$(curl -sS -o /dev/null -w "%{http_code}" http://localhost:3000/api/jobs || true)"
if [[ "$HTTP_CODE" == "200" ]]; then
  pass "GET /api/jobs reachable (200)"
  SERVER_OK=1
else
  fail "GET /api/jobs not reachable (got $HTTP_CODE). Start dev server to run live test."
fi

# 6) Live PATCH test (only if server is up)
if [[ "$SERVER_OK" == "1" ]]; then
  JOB_ID="$(curl -sS http://localhost:3000/api/jobs | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{const j=JSON.parse(s);if(Array.isArray(j)&&j[0]?.id) console.log(j[0].id);else console.log('');}catch{console.log('');}})")"
  if [[ -n "$JOB_ID" ]]; then
    echo "Using job id: $JOB_ID"
    PATCH_RES="$(mktemp)"
    PATCH_CODE="$(curl -sS -X PATCH "http://localhost:3000/api/jobs/$JOB_ID/status" \
      -H "Content-Type: application/json" \
      -d '{"status":"Onsite"}' \
      -o "$PATCH_RES" -w "%{http_code}" || true)"
    if [[ "$PATCH_CODE" == "200" ]]; then
      pass "PATCH /api/jobs/:id/status returned 200"
      echo "-- PATCH response body:"
      cat "$PATCH_RES"
      echo
    else
      fail "PATCH returned HTTP $PATCH_CODE (endpoint not implemented or error)."
      echo "-- Error body (if any):"
      cat "$PATCH_RES" || true
      echo
    fi
    rm -f "$PATCH_RES"
  else
    fail "Could not extract a job id from GET /api/jobs response."
  fi
fi

echo "== Audit complete =="
