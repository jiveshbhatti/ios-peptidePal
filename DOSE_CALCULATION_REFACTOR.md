# Dose Calculation Refactor

## Overview
This document summarizes the refactoring of the dose calculation system to use actual dose logs as the single source of truth instead of maintaining a separate `remainingAmountUnits` counter.

## Changes Made

### 1. Updated `dose-calculations.ts`
- Modified `calculateRemainingDoses()` to calculate remaining doses based on dose logs rather than using the stored `remainingAmountUnits` value
- Added new function `calculateUsedDosesFromLogs()` that sums up all dose logs for a specific vial
- Updated `calculateUsedDoses()` to use the new dose log calculation

### 2. Updated Peptide Services
Modified the following services to NOT update `remainingAmountUnits` when logging doses:

#### `peptide.service.ts` (Supabase)
- `addDoseLog()`: Now only adds the dose log without decrementing `remainingAmountUnits`
- `removeDoseLog()`: Now only removes the dose log without incrementing `remainingAmountUnits`
- Both functions now calculate used doses from logs and update inventory tracking

#### `peptide.service.adaptive.ts`
- Same changes as above, with support for dynamic column names

#### `peptide.service.dynamic.ts`
- Same changes as above

#### `firebase-clean.js`
- `addDoseLog()`: Now only adds the dose log to the subcollection without updating vial's `remainingAmountUnits`
- `removeDoseLog()`: Now only removes the dose log without updating vial's `remainingAmountUnits`

### 3. Updated UI Components
- `DoseLogModal.tsx`: Updated to use `calculateRemainingDoses()` instead of directly accessing `activeVial.remainingAmountUnits`
- `PeptideCard.tsx`: Already using `calculateRemainingDoses()` (no changes needed)

### 4. Created Migration Script
- Added `scripts/recalculate-remaining-doses.js` to help identify and fix any mismatches between stored `remainingAmountUnits` and calculated values from dose logs

## Benefits

1. **Single Source of Truth**: Dose logs are now the only source of truth for usage tracking
2. **Data Consistency**: Eliminates the possibility of `remainingAmountUnits` getting out of sync with actual dose logs
3. **Audit Trail**: All doses are tracked in the dose logs, providing a complete history
4. **Easier Corrections**: Removing or modifying dose logs automatically updates the calculated remaining doses

## Implementation Notes

### Dose Calculation Logic
The system calculates doses as follows:
- Initial doses = `vial.initialAmountUnits` (set when vial is activated)
- Used doses = Sum of all dose logs for that vial, where each log's units are calculated as `Math.ceil(doseAmount / typicalDoseUnits)`
- Remaining doses = Initial doses - Used doses

### Firebase vs Supabase
- **Firebase**: Dose logs are stored in a subcollection `doseLogs`
- **Supabase**: Dose logs are stored in an array field on the peptide document
- The calculation logic works for both storage methods

### Migration Considerations
Before deploying this change to production:
1. Run the migration script in dry-run mode to identify any data inconsistencies
2. Back up the database
3. Apply the code changes
4. Run the migration script to fix any mismatches (if needed)

## Future Improvements

1. Consider removing `remainingAmountUnits` field entirely from the database schema
2. Add real-time validation to ensure dose logs don't exceed vial capacity
3. Implement vial capacity warnings based on typical dose calculations