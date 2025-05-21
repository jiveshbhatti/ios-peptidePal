# How to Create All Tables in Development Database

Follow these steps to create all the necessary tables in your development database:

## Step 1: Access Supabase Dashboard

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Sign in with your account
3. Select your development project (PeptidePal Development)

## Step 2: Open the SQL Editor

1. In the left sidebar, click on "SQL Editor"
2. Click the "+" button to create a new query

## Step 3: Run the Schema Script

1. Open the file `db-schema/all-tables-fixed.sql` in this repository
2. Copy the entire contents
3. Paste into the SQL Editor in Supabase
4. Click "Run" or press Ctrl+Enter (Cmd+Enter on Mac)

The script will:
- Drop existing tables (to avoid conflicts)
- Create all required tables with correct column names
- Set up Row Level Security (RLS) policies
- Create helper functions for database operations

## Step 4: Verify Tables Were Created

Run the following SQL query in the SQL Editor to verify the tables were created:

```sql
SELECT * FROM get_tables_info();
```

You should see a list of all the tables that were created:
- peptides
- inventory_peptides
- inventory_bac_water
- inventory_syringes
- inventory_other_items
- health_metric_logs

## Step 5: Run the Sync Script

After creating the tables, run the sync script to copy data from production:

```bash
node tools/sync-all-tables.js
```

## Troubleshooting

If you encounter any errors when running the SQL script:

1. **Table already exists**: If you see errors about tables already existing, you can safely ignore them
2. **Permission errors**: Make sure you have admin permissions on the database
3. **SQL syntax errors**: Check for any modifications you might have made to the script
4. **Other errors**: Take note of the specific error message and search for it in the Supabase documentation

If you need to start over, you can run the script again - it includes DROP TABLE statements to clean up existing tables.