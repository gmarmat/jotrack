#!/usr/bin/env bash
set -euo pipefail

# Kill anything on 3000 (requires npx)
npx kill-port 3000 || true

# Launch V2 on 3000 (server + client flags)
export INTERVIEW_V2=1
export NEXT_PUBLIC_INTERVIEW_V2=1
export AI_ASSIST_ON=1
export NEXT_PUBLIC_AI_ASSIST_ON=1
exec npx next dev -p 3000
