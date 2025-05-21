#!/bin/bash

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js to run these scripts."
    exit 1
fi

# Install required dependencies if not present
if [ ! -d "node_modules/@supabase" ]; then
    echo "Installing required dependencies..."
    npm install @supabase/supabase-js
fi

# First check the current state
echo "📊 Checking current Glow peptide state..."
node check-glow-peptide.js

# Ask for confirmation before fixing
read -p "Do you want to fix the Glow peptide dose count? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔧 Fixing Glow peptide dose count..."
    node fix-glow-doses.js
    
    # Verify the fix
    echo
    echo "✅ Verifying fix..."
    node check-glow-peptide.js
else
    echo "❌ Fix cancelled."
fi

echo
echo "Done."