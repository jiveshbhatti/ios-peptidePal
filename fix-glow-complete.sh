#!/bin/bash

# Script to fix Glow peptide data corruption and display issues

echo "Starting complete Glow peptide fix..."

# 1. Backup current data
echo "Backing up current data..."
mkdir -p backups
node backup-peptides-data.js

# 2. Reconstruct missing dose logs for Glow
echo "Reconstructing missing Glow dose logs..."
node reconstruct-glow-dose-logs.js

# 3. Fix usage display in inventory
echo "Fixing usage display in inventory..."
node fix-glow-usage-display.js

echo "Glow peptide fix completed!"
echo ""
echo "IMPORTANT: The Glow peptide has been updated with:"
echo "1. Reconstructed dose logs with estimated dates (marked as reconstructed)"
echo "2. Corrected vial remaining amount (15/29)"
echo "3. Updated inventory display to show 14 doses used"
echo ""
echo "If anything went wrong, you can restore from backup with:"
echo "node restore-from-backup.js"