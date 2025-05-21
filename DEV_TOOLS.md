# PeptidePal Development Tools Guide

This guide explains the development tools available to help you work with the PeptidePal app without affecting production data.

## Available Tools

1. **Development Database**: A separate Supabase database for development
2. **Environment Switching**: Toggle between production and development databases
3. **Data Sync**: Copy data from production to development with safety measures 
4. **Verification Tools**: Scripts to validate your database setup
5. **CLI Tools**: Scripts for database schema export/import

## Getting Started

### Setting Up the Development Environment

1. Follow the instructions in `DEV_DATABASE_SETUP.md` to set up your development database
2. Run the setup SQL script in the Supabase SQL Editor
3. Verify your database is set up correctly with the verification script

### Tools Usage

#### Using the Schema Dump Tool

The fastest way to set up your development database with the correct schema:

```bash
# Make the script executable if needed
chmod +x dump-and-import-schema.sh

# Run the script
./dump-and-import-schema.sh
```

This will:
1. Create a schema dump from the production database (or generate a script if direct access fails)
2. Prepare a SQL script you can run in the Supabase SQL Editor
3. Provide instructions for importing the schema to your development database

#### Environment Switching

The app includes environment controls in the Settings screen, which allows you to:

- Switch between DEVELOPMENT and PRODUCTION databases
- Clearly see which environment you're working in
- Protect production data from accidental changes

#### Data Synchronization

There are two ways to sync data:

1. **In-App Sync**: Use the Sync button in Settings to:
   - Copy peptide data from production to development 
   - Automatically prefix test data with "[TEST]" to distinguish it
   - Safely modify test data without affecting production

2. **Command-Line Sync**: For more reliable syncing, use the Node.js script:
   ```bash
   # Install dependencies if needed
   npm install @supabase/supabase-js
   
   # Run the sync script
   node tools/db-sync.js
   ```

#### Schema Verification

Run the verification script to check your database setup:

```bash
node verify-dev-database.js
```

This script will:
- Test your database connection
- Verify the peptides table exists
- Check for all required columns
- Test basic insert and delete operations

## Available Scripts

1. `setup-dev-database-fixed.sql`: SQL script to create the correct table schema
2. `verify-dev-database.js`: Node.js script to test your database setup
3. `tools/db-sync.js`: Standalone sync script that handles schema differences
4. `dump-and-import-schema.sh`: Shell script to export schema and prepare import scripts
5. `src/config.ts`: Contains the environment switching and sync functions

## Troubleshooting

If you encounter issues:

1. Check that you've run the latest schema script in the Supabase SQL Editor
2. Verify your database connection with the verification script
3. Look for schema mismatches in the console logs
4. Try using the standalone sync script (`tools/db-sync.js`) instead of the in-app sync
5. Make sure column names match (check for case sensitivity)

For detailed troubleshooting steps, see the "Troubleshooting" section in `DEV_DATABASE_SETUP.md`.

## Best Practices

1. **Always use development mode** during development
2. Test thoroughly in development before touching production
3. Keep test data clearly labeled with "[TEST]" prefix
4. Run the verification script whenever you make database schema changes
5. Check console logs for any database connection errors

## Adding New Database Features

When adding new database features:

1. Update the SQL setup script with any new columns
2. Re-export the schema using the dump script
3. Update the sync functions to handle the new fields
4. Run the verification script to confirm everything works
5. Update documentation to reflect schema changes