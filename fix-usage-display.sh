#!/bin/bash

# Script to fix peptide usage display in the inventory UI

echo "Starting peptide usage display fix..."

# Fix Glow peptide specifically
echo "Fixing Glow peptide usage display..."
node fix-glow-usage-display.js

# Initialize usage tracking for all peptides
echo "Initializing usage tracking for all peptides..."
node initialize-all-peptide-usage.js

echo "Peptide usage display fix complete!"