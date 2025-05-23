# Mobile App Feature Test Plan

## Features Added
1. **Peptide Details Screen** - View comprehensive peptide information
2. **Automatic Vial Depletion** - Vials auto-deactivate when empty
3. **Dose Calculation from Logs** - Accurate dose counting that handles reverts
4. **Navigation Improvements** - Tap/long-press navigation to details
5. **Visual Enhancements** - Removed non-functional Log buttons, added swipe hints

## Test Cases

### 1. Navigation Tests
- [ ] **Home Screen**: Tap peptide card → navigates to details
- [ ] **Inventory Screen**: Long press peptide → navigates to details
- [ ] **Inventory Screen**: Tap peptide → opens edit modal
- [ ] **Details Screen**: Back button returns to previous screen

### 2. Peptide Details Screen Tests
- [ ] **Overview Tab**: Shows active vial status with correct remaining doses
- [ ] **Overview Tab**: Shows expiration date and reconstitution info
- [ ] **Overview Tab**: Quick stats (doses this week, compliance rate) calculate correctly
- [ ] **History Tab**: Shows all vials with status indicators
- [ ] **Stats Tab**: Dose trend chart displays properly
- [ ] **Delete Function**: Trash icon in header deletes peptide

### 3. Dose Logging Tests
- [ ] **Swipe to Log**: Right swipe logs dose successfully
- [ ] **Success Animation**: Shows after logging
- [ ] **Dose Count Update**: Remaining doses decrease after logging
- [ ] **Low Stock Warning**: Yellow warning when < 3 doses
- [ ] **Expired Vial**: Red warning and prevents logging

### 4. Vial Depletion Tests
- [ ] **Auto-Deactivation**: Vial deactivates when last dose logged
- [ ] **Depletion Alert**: Shows prompt to activate new vial
- [ ] **Inventory Status**: Updates to 'FINISHED' when depleted
- [ ] **Navigate to Inventory**: Alert button navigates correctly

### 5. Dose Revert Tests
- [ ] **Swipe to Undo**: Left swipe on logged dose reverts it
- [ ] **Dose Count Recovery**: Remaining doses increase after revert
- [ ] **No Counter Drift**: Multiple log/revert cycles maintain accuracy

### 6. Edge Cases
- [ ] **No Active Vial**: Shows "Activate New Vial" button
- [ ] **Empty Schedule**: Shows helpful empty state message
- [ ] **Expired Vial**: Prevents dose logging with alert
- [ ] **Multiple Vials**: History shows all vials correctly

### 7. Visual/UX Tests
- [ ] **Swipe Hints**: Double chevrons show for unlogged doses
- [ ] **Progress Circle**: Accurately reflects remaining percentage
- [ ] **Color Coding**: Green (>50%), Yellow (20-50%), Red (<20%)
- [ ] **Haptic Feedback**: Vibrates on swipe, tap, success

## Testing Steps

1. **Setup**
   - Ensure Firebase is connected
   - Have at least 2 peptides with active vials
   - One peptide should have low doses (< 3)

2. **Basic Flow**
   - Navigate to each peptide's details
   - Log doses and verify counts update
   - Revert a dose and verify count increases
   - Deplete a vial completely

3. **Error Scenarios**
   - Try logging to expired vial
   - Try logging without active vial
   - Navigate with no peptides scheduled

## Known Working Features
- ✅ Swipe gestures for dose logging/reverting
- ✅ Real-time data sync with Firebase
- ✅ Haptic feedback on all interactions
- ✅ Inventory activation flow
- ✅ Schedule filtering by day

## Post-Merge Checklist
- [ ] All navigation paths work
- [ ] Dose calculations are accurate
- [ ] No console errors
- [ ] UI renders correctly
- [ ] Data persists properly