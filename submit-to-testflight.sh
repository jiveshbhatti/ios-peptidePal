#!/bin/bash

echo "🚀 Submitting PeptidePal v1.1.0 to TestFlight..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if build ID is provided as argument
if [ "$1" ]; then
    BUILD_ID=$1
    echo -e "${YELLOW}Using specified build ID: $BUILD_ID${NC}"
else
    echo -e "${YELLOW}Using latest build${NC}"
    BUILD_ID="--latest"
fi

# Submit to TestFlight
echo ""
echo "📱 Submitting to App Store Connect..."
npx eas-cli submit --platform ios $BUILD_ID

# Check if submission was successful
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Successfully submitted to TestFlight!${NC}"
    echo ""
    echo "📝 Next steps:"
    echo "1. Wait for Apple to process the build (5-10 minutes)"
    echo "2. Check App Store Connect for the build status"
    echo "3. Once processed, the build will be available in TestFlight"
    echo "4. Internal testers can install immediately"
    echo "5. External testers require review (24-48 hours)"
    echo ""
    echo "🔗 App Store Connect: https://appstoreconnect.apple.com"
else
    echo ""
    echo "❌ Submission failed. Please check the error messages above."
fi