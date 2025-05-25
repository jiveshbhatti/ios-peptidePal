#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

BUILD_ID="056f78f1-62b4-4c6a-9796-1ebe40b440ab"
CHECK_INTERVAL=30
ELAPSED=0

echo -e "${BLUE}🤖 PeptidePal Auto-Deploy Monitor${NC}"
echo "===================================="
echo "Build ID: $BUILD_ID"
echo "I'll monitor the build and automatically submit to TestFlight when ready!"
echo ""

while true; do
    # Get build status
    STATUS_JSON=$(npx eas-cli build:list --platform ios --limit 1 --non-interactive --json 2>/dev/null)
    STATUS=$(echo $STATUS_JSON | grep -o '"status":"[^"]*' | head -1 | sed 's/"status":"//')
    
    # Calculate time elapsed
    MINUTES=$((ELAPSED / 60))
    SECONDS=$((ELAPSED % 60))
    
    # Clear line and print status
    echo -ne "\r\033[K"
    
    case $STATUS in
        "FINISHED")
            echo -e "${GREEN}✅ Build Complete!${NC} (Total time: ${MINUTES}m ${SECONDS}s)"
            echo ""
            echo "🚀 Starting automatic submission to TestFlight..."
            echo ""
            
            # Run the submission script
            ./submit-to-testflight.sh $BUILD_ID
            
            if [ $? -eq 0 ]; then
                echo ""
                echo -e "${GREEN}🎉 All done! Your app is being processed by Apple.${NC}"
                echo ""
                echo "📱 Next steps:"
                echo "1. Check App Store Connect in 5-10 minutes"
                echo "2. The build will appear in TestFlight"
                echo "3. Internal testers can install immediately"
                echo ""
                echo "🔗 https://appstoreconnect.apple.com"
            else
                echo ""
                echo -e "${RED}❌ Submission failed. Please run manually:${NC}"
                echo "./submit-to-testflight.sh $BUILD_ID"
            fi
            break
            ;;
        "IN_PROGRESS")
            echo -ne "🔄 Build in progress... (${MINUTES}m ${SECONDS}s elapsed)"
            ;;
        "IN_QUEUE")
            echo -ne "⏳ Build queued... (${MINUTES}m ${SECONDS}s elapsed)"
            ;;
        "ERRORED")
            echo -e "${RED}❌ Build failed!${NC}"
            echo ""
            echo "Check the logs at:"
            echo "https://expo.dev/accounts/jiveshbhatti/projects/peptidepal/builds/$BUILD_ID"
            break
            ;;
        *)
            echo -ne "Status: $STATUS (${MINUTES}m ${SECONDS}s elapsed)"
            ;;
    esac
    
    sleep $CHECK_INTERVAL
    ELAPSED=$((ELAPSED + CHECK_INTERVAL))
done