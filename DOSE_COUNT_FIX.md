# Peptide Dose Count Fix

## Problem

After fixing the column naming issues in the database schema (camelCase vs. lowercase), we encountered an unintended side effect: the dose count for the Glow peptide was reset from "13/33" to "2/33".

This happened because:

1. The column naming fix changed how we interact with the database
2. The schema cache and different column formats caused inconsistent updates
3. When we fixed one issue, we inadvertently created another

## Solution

The fix requires:

1. Calculating the correct dose count by examining the dose logs
2. Updating the vial's `remainingAmountUnits` property to reflect the correct value
3. Ensuring we use camelCase with quotes (`"doseLogs"`) for all future updates

## Fix Components

This fix includes three files:

1. `check-glow-peptide.js` - Diagnostic script that examines the current state
2. `fix-glow-doses.js` - Repair script that fixes the dose count
3. `fix-dose-counts.sh` - Shell script to run both scripts with confirmation

## How the Fix Works

1. The script retrieves the Glow peptide data from the production database
2. It counts all dose logs associated with the active vial
3. It calculates the correct `remainingAmountUnits` based on:
   - Initial amount (33 doses)
   - Number of doses taken (e.g., 14 doses)
4. It updates the vial with the correct remaining amount (e.g., 19 doses)

## Running the Fix

```bash
# Make the script executable
chmod +x fix-dose-counts.sh

# Run the fix script
./fix-dose-counts.sh
```

## Prevention

To prevent this from happening again:

1. Always use camelCase column names with quotes as defined in the table: `"doseLogs"`, not `doselogs`
2. Keep using the multi-step approach (update vials, then update dose logs)
3. Use the database testing tool to verify column naming requirements when in doubt

## Monitoring

After applying the fix, verify that:

1. The Glow peptide shows the correct count (e.g., "14/33" or the appropriate count)
2. New doses can be logged without issues
3. The count correctly updates when a new dose is logged