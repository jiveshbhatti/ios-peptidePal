#!/bin/bash

echo "🔍 Checking build status..."
echo ""

# Check the specific build
BUILD_ID="056f78f1-62b4-4c6a-9796-1ebe40b440ab"

# Get build status
npx eas-cli build:view $BUILD_ID --json > build-status.json 2>/dev/null

# Parse status
STATUS=$(cat build-status.json | grep -o '"status":"[^"]*' | sed 's/"status":"//')
ARTIFACT=$(cat build-status.json | grep -o '"buildArtifactUrl":"[^"]*' | sed 's/"buildArtifactUrl":"//')

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "Build ID: $BUILD_ID"
echo ""

if [ "$STATUS" = "finished" ]; then
    echo -e "Status: ${GREEN}✅ Build Complete!${NC}"
    echo ""
    echo "🎉 Your build is ready for submission!"
    echo ""
    echo "To submit to TestFlight, run:"
    echo "./submit-to-testflight.sh $BUILD_ID"
    echo ""
    if [ ! -z "$ARTIFACT" ]; then
        echo "📦 Build artifact available at:"
        echo "$ARTIFACT"
    fi
elif [ "$STATUS" = "in-progress" ] || [ "$STATUS" = "in progress" ]; then
    echo -e "Status: ${YELLOW}🔄 Build in progress...${NC}"
    echo ""
    echo "Check the live logs at:"
    echo "https://expo.dev/accounts/jiveshbhatti/projects/peptidepal/builds/$BUILD_ID"
elif [ "$STATUS" = "in-queue" ] || [ "$STATUS" = "in queue" ]; then
    echo -e "Status: ${YELLOW}⏳ Build queued...${NC}"
    echo ""
    echo "Your build is waiting to start. This usually takes a few minutes."
else
    echo -e "Status: ${RED}❌ Build status: $STATUS${NC}"
fi

# Clean up
rm -f build-status.json

echo ""
echo "Run this script again to check for updates."