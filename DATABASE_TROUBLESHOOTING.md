# Database Column Case Troubleshooting Guide

This document outlines the solution to the database column naming issue that affected the PeptidePal app. The primary issue was PostgreSQL schema cache inconsistency when handling column names.

## CRITICAL WARNING

⚠️ **NEVER include both camelCase and lowercase column names in the same database update operation!**

The Supabase PostgreSQL schema cache will fail with errors like:
```
Could not find the 'doseLogs' column of 'peptides' in the schema cache
```

## FINAL SOLUTION: Always use **original camelCase column names** (`doseLogs`, not `doselogs`) exactly as defined in the table definition

After checking the actual table definition, we confirmed:
```sql
CREATE TABLE public.peptides (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name text NOT NULL,
  strength text NULL,
  "dosageUnit" text NULL,
  "typicalDosageUnits" numeric NULL,
  schedule jsonb NULL,
  vials jsonb NULL,
  "doseLogs" jsonb NULL,
  "imageUrl" text NULL,
  "dataAiHint" text NULL,
  notes text NULL,
  "startDate" timestamp with time zone NULL,
  CONSTRAINT peptides_pkey PRIMARY KEY (id)
);
```

The database uses original camelCase column names with quotes. Always use these exact same names in your update operations.

## Problem

We encountered errors like:
```
ERROR Error updating peptide: {"code": "PGRST204", "details": null, "hint": null, "message": "Could not find the 'doselogs' column of 'peptides' in the schema cache"}
```

## Root Cause Analysis

After extensive testing, we discovered:

1. We initially assumed that:
   - The production database used camelCase column names (e.g., `doseLogs`)
   - The development database used lowercase column names (e.g., `doselogs`)

2. Our first diagnostic tests led us to believe:
   - Both environments use camelCase column names
   - The error occurred because we were using lowercase column names

3. Further diagnostics revealed the actual issue:
   - **Both environments actually use lowercase column names**
   - The error occurred because we were trying to use camelCase column names
   - More critically, trying to use BOTH column name formats in the same update operation causes failures

4. Key findings:
   - The error was consistent across both environments when using camelCase column names
   - Using lowercase column names works reliably in both environments
   - Our initial assumptions about environment-specific column naming were correct, but our fix was wrong
   - Trying to use both column formats in the same update causes errors with the database schema cache

## Solution Implementation

1. Fixed the peptide service to use original camelCase column names with quotes:
   ```typescript
   // Use camelCase for JSONB column names exactly as in table definition
   const updates = {
     "doseLogs": [...(peptide.doseLogs || []), newDoseLog],
     "vials": updatedVials,
   };
   ```

2. Updated the sync function to maintain camelCase column names:
   ```typescript
   // Special handling for peptides table to maintain camelCase as in definition
   if (tableName === 'peptides') {
     // Maintain original column names with exact case
     if ('dataAiHint' in item) {
       processedItem['dataAiHint'] = item.dataAiHint;
     }
     if ('doseLogs' in item) {
       processedItem['doseLogs'] = item.doseLogs;
     }
     // ...other columns...
   }
   ```

3. Added comprehensive diagnostic tools to verify column naming:
   - `checkDbColumnNames()` function to test both column naming styles
   - `tryUpdateColumn()` function to test specific column names dynamically
   - Detailed logging for environment detection

4. Created a multi-step update approach (separate vials and doseLogs updates):
   ```typescript
   // STEP 1: Update vials only
   await supabase
     .from('peptides')
     .update({ vials: updatedVials })
     .eq('id', peptideId);
     
   // STEP 2: Update dose logs with camelCase names
   await supabase
     .from('peptides')
     .update({ "doseLogs": updatedDoseLogs })
     .eq('id', peptideId);
   ```

5. Removed fallback mechanisms that were causing issues:
   ```typescript
   // IMPORTANT: Do NOT add other column name variants as fallbacks
   // Our testing shows that including both camelCase and lowercase column names
   // in the same update causes the database to fail with schema cache errors
   ```

## Testing Procedure

When encountering database column issues, use the following diagnostic approach:

1. Run the comprehensive column test in HomeScreen.tsx:
   ```typescript
   // This will run on component mount
   async function runDatabaseCheck() {
     await checkDbColumnNames();
   }
   ```

2. Watch the console for diagnostic output that shows which column naming convention works:
   ```
   🔍 DIRECT DB COLUMN CHECK:
   camelCase 'doseLogs' works: YES ✅
   lowercase 'doselogs' works: NO ❌
   ```

3. For direct field testing, use:
   ```typescript
   const camelCaseWorks = await tryUpdateColumn(peptideId, 'doseLogs', peptide.doseLogs || []);
   const lowerCaseWorks = await tryUpdateColumn(peptideId, 'doselogs', peptide.doseLogs || []);
   console.log(`Column name test results: camelCase=${camelCaseWorks}, lowercase=${lowerCaseWorks}`);
   ```

## Development vs Production

The dynamic Supabase client allows seamless switching between environments:

1. **Development Environment**:
   - URL: https://looltsvagvvjnspayhym.supabase.co
   - Uses camelCase column names
   - Default environment for easier testing

2. **Production Environment**:
   - URL: https://yawjzpovpfccgisrrfjo.supabase.co
   - Uses camelCase column names
   - Used for production app

## Conclusion

The database column case sensitivity issue has been resolved by:

1. Consistently using camelCase column names across all database operations
2. Adding enhanced error handling and fallback mechanisms
3. Implementing comprehensive diagnostic tools
4. Documenting the solution for future reference

This solution ensures reliable database operations across both development and production environments.