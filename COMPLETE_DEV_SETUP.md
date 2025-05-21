# Complete Development Database Setup

This guide provides step-by-step instructions for setting up a complete development environment for PeptidePal, including all tables from the production database.

## Step 1: Set Up the Database Schema

First, you need to set up the database schema with all required tables:

1. Log in to the [Supabase Dashboard](https://app.supabase.com/)
2. Open your development project
3. Navigate to the SQL Editor
4. Copy the entire contents of `db-schema/all-tables-fixed.sql` from this repository
5. Paste it into the SQL Editor and run the script
6. This will create all tables with proper structure and RLS policies

## Step 2: Sync Data from Production

After setting up the schema, you can sync data from production to development:

```bash
# Install the required dependency if you haven't already
npm install @supabase/supabase-js

# Run the sync script
node tools/sync-all-tables.js
```

This script will:
1. Connect to both production and development databases
2. Copy data from each table in production
3. For tables with name fields (peptides, inventory items), add a [TEST] prefix
4. Insert the data into the corresponding tables in development

## Case Sensitivity Issues

**Important:** Supabase's PostgreSQL database is case-sensitive for column names, and all column names must be lowercase. If you encounter errors like:

```
Could not find the 'dataAiHint' column of 'peptides' in the schema cache
```

It means there's a case mismatch. Our scripts address this by:

1. Using all lowercase column names in the SQL schema (`dataaihint` instead of `dataAiHint`)
2. Converting all object keys to lowercase before inserting

## Troubleshooting

If you encounter issues:

1. **Schema Issues**: Make sure you've run the latest `db-schema/all-tables-fixed.sql` script
2. **Permission Issues**: Check that RLS policies are correctly set up
3. **Missing Tables**: Verify all tables were created by running `SELECT * FROM get_tables_info()` in the SQL Editor
4. **Column Issues**: Check column names with `SELECT * FROM get_columns_info('peptides')` (remember: they should be lowercase)
5. **Sync Failures**: Look at the console output from the sync script for specific errors

## Manual Sync

If automatic syncing fails, you can manually copy data:

1. Export data from production using the Supabase UI or API
2. Modify the exported data to add [TEST] prefixes to names
3. Convert all column names to lowercase
4. Import into development database

## Tables Included

This setup includes all tables from the production database:

1. `peptides` - Core peptide data with schedules, vials, and dose logs
2. `inventory_peptides` - Inventory tracking for peptides
3. `inventory_bac_water` - Bacteriostatic water inventory
4. `inventory_syringes` - Syringe inventory
5. `inventory_other_items` - Other inventory items
6. `health_metric_logs` - Health metrics tracking

## Using the Development Environment

After setup is complete:

1. In the app, go to Settings
2. Scroll to the Developer Settings section
3. Select the "DEVELOPMENT" environment
4. The app will now use your development database

## Syncing New Data

To sync new data that's been added to production:

1. Run `node tools/sync-all-tables.js` again
2. This will copy new data while preserving your existing development data
3. Any data with [TEST] prefix already in development will be updated to match production

## Switching Back to Production

When you're ready to use production again:
1. Go to Settings in the app
2. Select the "PRODUCTION" environment
3. The app will reconnect to the production database