# Development Database Setup Guide

This guide walks you through setting up a development database for PeptidePal that mirrors your production environment but keeps development data separate.

## Step 1: Create a New Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Click "New Project"
3. Name your project "PeptidePal Development"
4. Choose a secure database password
5. Select a region (preferably the same as your production database)
6. Click "Create new project"

## Step 2: Set Up Database Schema

After your project is created:

1. Go to the SQL Editor in the dashboard
2. Copy the entire content of the `setup-dev-database-fixed.sql` file from this repository
3. Paste it into the SQL Editor and run the script
4. This script will create the peptides table with all required columns and RLS policies

## Step 3: Get Your API Credentials

1. Go to Project Settings → API
2. You'll need:
   - The "Project URL" (ends with .supabase.co)
   - The "anon" public API key

For reference, here are the development database credentials already configured:
```
URL: https://looltsvagvvjnspayhym.supabase.co
Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxvb2x0c3ZhZ3Z2am5zcGF5aHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3ODY3MTksImV4cCI6MjA2MzM2MjcxOX0.kIb0cavukeYK1wAveHXEusHur9j2JGPpW2DITDcWADw
```

![Supabase API Keys Location](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/guides/api-keys-copy.png)

## Step 4: Update Your Development Configuration

Open the file `/src/config.ts` and update the DEV_DB object with your new credentials:

```typescript
// Define development database
const DEV_DB: DatabaseConfig = {
  url: 'https://your-dev-project-id.supabase.co', // Replace with your Project URL
  key: 'your-dev-anon-key', // Replace with your anon key
  label: 'DEVELOPMENT'
};
```

## Step 5: Test the Connection

1. In the app, go to Settings
2. Scroll down to the Developer Settings at the bottom
3. Make sure "DEVELOPMENT" database is selected
4. Try using the "Sync with Web App" button to copy data from production

## Step 6: Troubleshooting Schema Issues

If you encounter issues with schema mismatches (such as "Could not find the 'dataAiHint' column"):

1. Make sure you've run the `setup-dev-database-fixed.sql` script from this repository, not the older SQL snippet
2. The fixed script includes all necessary columns (including `dataAiHint`) and JSONB defaults
3. The improved sync function will now check available columns and only include fields that exist in your schema
4. If problems persist, check the console logs for specific error details

## Complete Database Schema Reference

The peptides table should include these columns (as defined in the setup script):

- `id` (UUID, Primary Key)
- `name` (TEXT)
- `strength` (TEXT)
- `dosageUnit` (TEXT)
- `typicalDosageUnits` (NUMERIC)
- `schedule` (JSONB)
- `vials` (JSONB)
- `doseLogs` (JSONB)
- `imageUrl` (TEXT)
- `dataAiHint` (TEXT)
- `notes` (TEXT)
- `startDate` (TIMESTAMP WITH TIME ZONE)
- `createdAt` (TIMESTAMP WITH TIME ZONE)
- `updatedAt` (TIMESTAMP WITH TIME ZONE)

## Sample Data Format Reference

This is what a peptide record in your database should look like:

```json
{
  "id": "84160dbf-1d85-41e0-a312-24895c1d6672",
  "name": "Tesamorelin",
  "strength": "5000mcg total",
  "dosageUnit": "mcg",
  "typicalDosageUnits": 1000,
  "schedule": {
    "times": ["AM"],
    "frequency": "daily"
  },
  "vials": [
    {
      "id": "84160dbf-1d85-41e0-a312-24895c1d6672",
      "name": "Vial from batch N/A (Inv ID: 84160dbf)",
      "notes": "Activated from inventory.",
      "isActive": true,
      "dateAdded": "2025-05-14",
      "expirationDate": "2025-06-11T00:00:00+00:00",
      "initialAmountUnits": 5,
      "remainingAmountUnits": 3,
      "reconstitutionBacWaterMl": 2
    }
  ],
  "doseLogs": [
    {
      "id": "ad754360-14dc-4026-ad83-5c1047182eaf",
      "date": "2025-05-15T14:47:29.926Z",
      "unit": "mcg",
      "dosage": 1000,
      "vialId": "84160dbf-1d85-41e0-a312-24895c1d6672",
      "timeOfDay": "AM"
    }
  ],
  "notes": "40.0 units = 1 mg",
  "startDate": "2025-05-15T00:00:00+00:00",
  "dataAiHint": ""
}
```

## Advanced Troubleshooting

- **Schema Mismatch**: The sync function now compares column names and only includes fields that exist in the development database
- **Case Sensitivity**: Supabase's PostgreSQL is case-sensitive. Important: All column names must be lowercase in Supabase
- **Column Naming**: Use lowercase column names in all scripts and code (e.g., `dosageunit` instead of `dosageUnit`)
- **Simple Sync**: If you encounter issues with the in-app sync, use the `tools/simple-sync.js` script instead
- **Empty Column Lists**: If you don't see any columns when checking schema, the table may not exist or access permissions may be incorrect
- **Helper Functions**: The setup script includes helper functions like `get_columns_info(table_name)` to diagnose schema issues

### Case Sensitivity Tips

1. In your SQL scripts, always use lowercase for column names:
   ```sql
   CREATE TABLE peptides (
     id UUID PRIMARY KEY,
     name TEXT,
     dosageunit TEXT,  -- lowercase!
     typicaldosageunits NUMERIC  -- lowercase!
   );
   ```

2. When accessing columns in JavaScript/TypeScript:
   ```js
   // When reading from database (matches what Supabase returns)
   const dosageUnit = peptide.dosageunit;
   
   // When writing to database (use lowercase column names)
   const newPeptide = {
     name: 'Test Peptide',
     dosageunit: '5mg',  // lowercase!
     typicaldosageunits: 300  // lowercase!
   };
   ```

For more help, refer to the [Supabase documentation](https://supabase.com/docs)