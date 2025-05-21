# PeptidePal Troubleshooting Guide

This guide covers common issues you might encounter with the PeptidePal app, particularly when working with the development environment.

## Database Connection Issues

### Switching Between Environments

If the app doesn't correctly switch between development and production databases:

1. In the Settings screen, go to Developer Settings
2. Toggle the environment switch
3. **Important**: Restart the app completely
4. The app will reconnect using the new database

### Verifying Current Environment

To verify which database you're connected to:

1. Look for the environment badge in Developer Settings
2. Check console logs - they should show the current database URL
3. Run the `verify-environment.js` script to test both databases

## Column Name Case Sensitivity

Supabase's PostgreSQL databases are case-sensitive for column names.

### Common Error Messages

- `Could not find the 'doseLogs' column of 'peptides' in the schema cache`
- `Could not find the 'dataAiHint' column of 'peptides' in the schema cache`

These errors occur because the app is trying to use camelCase field names, but the database expects lowercase names.

### Solution

All database column names should be lowercase:

| App Code (TypeScript) | Database Column |
|----------------------|-----------------|
| `doseLogs`           | `doselogs`      |
| `typicalDosageUnits` | `typicaldosageunits` |
| `dataAiHint`         | `dataaihint`    |

When writing database operations:

```typescript
// WRONG - will cause errors
const updates = {
  doseLogs: [...peptide.doseLogs, newLog]
};

// CORRECT - use lowercase for database operations
const updates = {
  doselogs: [...peptide.doseLogs, newLog]
};
```

## Syncing Data Issues

If you're having trouble syncing data between production and development:

1. Make sure you're in DEVELOPMENT mode before syncing
2. Check that all tables exist in the development database
3. Run the SQL script in `db-schema/all-tables-fixed.sql` to create missing tables
4. Try the standalone sync script: `node tools/sync-all-tables.js`

## Other Common Issues

### Missing Peptides in Schedule

If peptides aren't showing up in the schedule:

1. Check if the peptide has an active vial
2. Verify the vial has remaining doses (remainingAmountUnits > 0)
3. Confirm the peptide's schedule matches the selected date

### Data Not Updating

If changes aren't reflected immediately:

1. Pull down to refresh the screen
2. Check the network connection
3. Restart the app if necessary
4. Verify you're using the expected database environment

## Advanced Troubleshooting

For more complex issues:

1. Check the console logs for error messages
2. Ensure all tables have the correct schema in development database
3. Try clearing app storage and reloading data
4. Use the standalone sync script for more detailed error reporting