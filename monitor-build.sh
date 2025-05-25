#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BUILD_ID="056f78f1-62b4-4c6a-9796-1ebe40b440ab"

echo -e "${BLUE}📱 PeptidePal Build Monitor${NC}"
echo "================================"
echo ""

while true; do
    # Get build status
    STATUS_JSON=$(npx eas-cli build:list --platform ios --limit 1 --non-interactive --json 2>/dev/null)
    STATUS=$(echo $STATUS_JSON | grep -o '"status":"[^"]*' | head -1 | sed 's/"status":"//')
    
    # Clear line and print status
    echo -ne "\r\033[K"
    
    case $STATUS in
        "FINISHED")
            echo -e "${GREEN}✅ Build Complete!${NC}"
            echo ""
            echo "🎉 Your build is ready for submission!"
            echo ""
            echo "To submit to TestFlight, run:"
            echo -e "${YELLOW}./submit-to-testflight.sh${NC}"
            break
            ;;
        "IN_PROGRESS")
            echo -ne "🔄 Build in progress... (Press Ctrl+C to stop monitoring)"
            ;;
        "IN_QUEUE")
            echo -ne "⏳ Build queued... (Press Ctrl+C to stop monitoring)"
            ;;
        "ERRORED")
            echo -e "${RED}❌ Build failed!${NC}"
            echo ""
            echo "Check the logs at:"
            echo "https://expo.dev/accounts/jiveshbhatti/projects/peptidepal/builds/$BUILD_ID"
            break
            ;;
        *)
            echo -ne "Status: $STATUS"
            ;;
    esac
    
    sleep 30
done