# PeptidePal iOS App Testing Results

## Issue Investigation: NAD+ Not Displaying on Schedule

### Problem
The NAD+ peptide was showing in the web app but not in the mobile app for today's schedule.

### Root Cause
We identified a data format mismatch in the day filtering logic. The `daysOfWeek` array in the NAD+ peptide's schedule contains numeric values (`[2, 5]` for Tuesday and Friday), but the mobile app's filtering logic was comparing these numbers with string day names ('monday', 'tuesday', etc.).

### Solution
Updated the scheduling filter logic in `HomeScreen.tsx` to handle both formats:
```typescript
if (frequency === 'specific_days' && daysOfWeek) {
  // Handle both string day names and numeric day indexes
  if (typeof daysOfWeek[0] === 'number') {
    // If daysOfWeek contains numbers (0-6), compare with the numeric day index
    isScheduledToday = daysOfWeek.includes(dayOfWeek);
  } else {
    // If daysOfWeek contains strings ('monday', etc.), compare with the day name
    isScheduledToday = daysOfWeek.includes(currentDay);
  }
}
```

### Testing Results
After implementing the fix:
1. NAD+ now appears in the schedule with correct information (17 doses left, AM dosing)
2. The app properly filters peptides based on:
   - Active vial status
   - Day of week scheduling
   - Remaining doses

## Other Observations

### UI Elements Working Correctly
- Calendar displays correctly with dots marking days with scheduled peptides
- Today's date (May 20) is appropriately highlighted
- Peptide cards display all required information:
  - Name
  - Image/placeholder
  - Dosing schedule (AM/PM)
  - Remaining doses

### Data Model
- Mobile app uses same Supabase database as web app
- Data is correctly synchronized through polling every 30 seconds

## Recommendations
1. **Data Format Standardization**: Consider standardizing the daysOfWeek format in both web and mobile apps to avoid similar issues in the future
2. **Type Safety**: Add TypeScript type guards to check data formats before filtering
3. **UI Testing**: Implement automated tests for schedule filtering logic

## Next Steps
- Consider handling other edge cases in the scheduling logic
- Add comprehensive logging for easier debugging
- Continue improving UI/UX for dose logging