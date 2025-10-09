#!/bin/bash

# Script to test status update API manually

set -e

echo "🧪 Testing Status Update API"
echo "=============================="
echo ""

# Create a test job
echo "1. Creating test job..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "title": "API Test Job",
    "company": "TestCorp",
    "status": "Applied",
    "notes": "Testing status updates"
  }')

JOB_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$JOB_ID" ]; then
  echo "❌ Failed to create job"
  echo "Response: $RESPONSE"
  exit 1
fi

echo "✅ Created job with ID: $JOB_ID"
echo ""

# Update status to Phone Screen
echo "2. Updating status to 'Phone Screen'..."
curl -s -X PATCH http://localhost:3000/api/jobs/$JOB_ID/status \
  -H "Content-Type: application/json" \
  -d '{"status": "Phone Screen"}' | jq '.'
echo ""

sleep 1

# Update status to Onsite
echo "3. Updating status to 'Onsite'..."
curl -s -X PATCH http://localhost:3000/api/jobs/$JOB_ID/status \
  -H "Content-Type: application/json" \
  -d '{"status": "Onsite"}' | jq '.'
echo ""

sleep 1

# Get history
echo "4. Fetching status history..."
curl -s http://localhost:3000/api/jobs/$JOB_ID/history | jq '.'
echo ""

echo "✅ API test complete!"
echo ""
echo "Expected history (most recent first):"
echo "  - Onsite"
echo "  - Phone Screen"
echo "  - Applied"

