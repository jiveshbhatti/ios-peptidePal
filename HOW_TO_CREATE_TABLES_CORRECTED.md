# How to Create Tables with Corrected Schema

I've identified column name differences between our schema and the actual production database. Follow these steps to set up the tables correctly:

## Step 1: Run the Corrected SQL Schema

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Sign in and select your development project
3. In the left sidebar, click on "SQL Editor"
4. Click the "+" button to create a new query
5. Open the file `db-schema/corrected-tables.sql` in this repository
6. Copy the entire contents
7. Paste into the SQL Editor in Supabase
8. Click "Run" or press Ctrl+Enter (Cmd+Enter on Mac)

## Step 2: Verify Tables Were Created

Run the following SQL query to check that all tables were created:

```sql
SELECT * FROM get_tables_info();
```

## Step 3: Run the Sync Script Again

Now run the sync script to copy data from production to development:

```bash
node tools/sync-all-tables.js
```

## What Changed?

The key differences in the corrected schema are:

1. **inventory_peptides** table:
   - Column names now match production exactly (using snake_case format)
   - Added fields discovered in production:
     - `num_vials` instead of `quantity`
     - `concentration_per_vial_mcg` instead of `strength`
     - `active_vial_expiry_date`
     - `active_vial_reconstitution_date`
     - `active_vial_status`
     - And others

2. **inventory_bac_water** table:
   - Changed column names to match production:
     - `volume_ml_per_bottle` instead of `volume`
     - `num_bottles` instead of `quantity`
     - `created_at` and `updated_at` instead of `createdat` and `updatedat`

3. **Other tables**:
   - Updated with consistent naming patterns

This corrected schema will work correctly with the sync script, allowing all data to be properly copied from production to development.