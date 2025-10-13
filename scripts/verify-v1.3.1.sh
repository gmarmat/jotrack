#!/bin/bash
# Coach Mode v1.3.1 Verification Script

echo "🔍 Verifying Coach Mode v1.3.1 Implementation..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if dev server is running
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Dev server is running"
else
    echo -e "${RED}✗${NC} Dev server is NOT running. Please start with: npm run dev"
    exit 1
fi

echo ""
echo "📋 Checking Routes..."

# Check /settings/ai route
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/settings/ai)
if [ "$STATUS" = "200" ]; then
    echo -e "${GREEN}✓${NC} /settings/ai route accessible (200 OK)"
else
    echo -e "${RED}✗${NC} /settings/ai route failed ($STATUS)"
fi

# Check API endpoints
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/ai/keyvault/status)
if [ "$STATUS" = "200" ]; then
    echo -e "${GREEN}✓${NC} /api/ai/keyvault/status accessible (200 OK)"
else
    echo -e "${RED}✗${NC} /api/ai/keyvault/status failed ($STATUS)"
fi

echo ""
echo "📂 Checking Files..."

FILES=(
    "app/settings/ai/page.tsx"
    "lib/features.ts"
    "e2e/ai-settings-ui.spec.ts"
    "e2e/coach-visibility.spec.ts"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file exists"
    else
        echo -e "${RED}✗${NC} $file missing"
    fi
done

echo ""
echo "🔧 Checking Feature Flags..."

if grep -q "coachProfileTable: true" lib/features.ts; then
    echo -e "${GREEN}✓${NC} coachProfileTable flag = true"
else
    echo -e "${RED}✗${NC} coachProfileTable flag not set"
fi

if grep -q "coachFitTable: true" lib/features.ts; then
    echo -e "${GREEN}✓${NC} coachFitTable flag = true"
else
    echo -e "${RED}✗${NC} coachFitTable flag not set"
fi

if grep -q "coachHeatmap: true" lib/features.ts; then
    echo -e "${GREEN}✓${NC} coachHeatmap flag = true"
else
    echo -e "${RED}✗${NC} coachHeatmap flag not set"
fi

echo ""
echo "🧪 Checking TestIDs..."

# Check for testids in code
if grep -q 'data-testid="ai-settings-page"' app/settings/ai/page.tsx; then
    echo -e "${GREEN}✓${NC} ai-settings-page testid present"
else
    echo -e "${RED}✗${NC} ai-settings-page testid missing"
fi

if grep -q 'data-testid="profile-table"' app/components/coach/steps/ProfileStep.tsx; then
    echo -e "${GREEN}✓${NC} profile-table testid present"
else
    echo -e "${RED}✗${NC} profile-table testid missing"
fi

if grep -q 'data-testid="fit-table"' app/components/coach/steps/FitStep.tsx; then
    echo -e "${GREEN}✓${NC} fit-table testid present"
else
    echo -e "${RED}✗${NC} fit-table testid missing"
fi

if grep -q 'data-testid="heatmap-table"' app/components/coach/steps/FitStep.tsx; then
    echo -e "${GREEN}✓${NC} heatmap-table testid present"
else
    echo -e "${RED}✗${NC} heatmap-table testid missing"
fi

echo ""
echo "📝 Checking Microcopy..."

if grep -q "For real AI analysis" app/components/coach/steps/GatherStep.tsx; then
    echo -e "${GREEN}✓${NC} AI setup callout present in GatherStep"
else
    echo -e "${RED}✗${NC} AI setup callout missing"
fi

if grep -q "Keys are stored securely" app/settings/ai/page.tsx; then
    echo -e "${GREEN}✓${NC} Privacy microcopy present in settings"
else
    echo -e "${RED}✗${NC} Privacy microcopy missing"
fi

echo ""
echo "🔗 Checking API Integration..."

# Check AI provider config
RESPONSE=$(curl -s http://localhost:3000/api/ai/keyvault/status)
if echo "$RESPONSE" | grep -q "networkEnabled"; then
    echo -e "${GREEN}✓${NC} AI config API returns networkEnabled"
else
    echo -e "${RED}✗${NC} AI config API response invalid"
fi

if echo "$RESPONSE" | grep -q "provider"; then
    echo -e "${GREEN}✓${NC} AI config API returns provider"
else
    echo -e "${RED}✗${NC} AI config API missing provider"
fi

if echo "$RESPONSE" | grep -q "model"; then
    echo -e "${GREEN}✓${NC} AI config API returns model"
else
    echo -e "${RED}✗${NC} AI config API missing model"
fi

echo ""
echo "🎯 Quick Manual Test Checklist:"
echo ""
echo "1. Visit http://localhost:3000/settings/ai"
echo "   - [ ] Page loads with AI settings form"
echo "   - [ ] Network toggle visible"
echo "   - [ ] Model dropdown shows gpt-4o-mini, gpt-4o, etc."
echo "   - [ ] API Key input field present"
echo ""
echo "2. Create a job and enter Coach Mode"
echo "   - [ ] Step-1 shows 'Set up AI key' callout"
echo "   - [ ] Clicking callout navigates to /settings/ai"
echo ""
echo "3. Fill Step-1 and proceed to Step-2"
echo "   - [ ] ProfileTable is visible (always)"
echo ""
echo "4. Proceed to Step-3"
echo "   - [ ] FitTable is visible (always)"
echo "   - [ ] HeatmapTable is visible (always)"
echo "   - [ ] 'Explain' button works"
echo ""
echo "5. Toggle Network ON and add API key in settings"
echo "   - [ ] Status badge updates to 'AI (Remote)'"
echo "   - [ ] Sources appear in analysis results"
echo ""
echo -e "${YELLOW}💡 Run E2E tests:${NC}"
echo "   npx playwright test e2e/ai-settings-ui.spec.ts"
echo "   npx playwright test e2e/coach-visibility.spec.ts"
echo ""
echo "✅ Verification complete!"
