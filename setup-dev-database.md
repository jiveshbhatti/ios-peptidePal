# Setting Up Your Development Database

Follow these steps to set up a dedicated development database for PeptidePal that won't interfere with production data.

## Step 1: Create a New Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Click "New Project"
3. Name your project "PeptidePal Development"
4. Choose a secure database password
5. Select the same region as your production database for best performance
6. Click "Create new project"

## Step 2: Set Up Database Schema

After your project is created:

1. Go to the SQL Editor in the dashboard
2. Create the required tables by running the following SQL:

```sql
-- Create peptides table
CREATE TABLE IF NOT EXISTS public.peptides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    strength TEXT,
    dosageUnit TEXT,
    typicalDosageUnits NUMERIC,
    schedule JSONB,
    vials JSONB,
    doseLogs JSONB,
    imageUrl TEXT,
    dataAiHint TEXT,
    notes TEXT,
    startDate TIMESTAMP WITH TIME ZONE
);

-- Create any other tables your app requires
-- [Add additional SQL statements as needed based on your schema]

-- Set up row level security (RLS)
ALTER TABLE public.peptides ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON public.peptides
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.peptides
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.peptides
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON public.peptides
    FOR DELETE USING (true);
```

## Step 3: Get Your Database Credentials

1. Go to Project Settings → API
2. Find your Project URL and anon/public key
3. You'll need these to update your app configuration

## Step 4: Update Your App Configuration

Open the file `/src/config.ts` and update the DEV_DB object with your new credentials:

```typescript
// Define development database
const DEV_DB: DatabaseConfig = {
  url: 'https://your-dev-project-id.supabase.co', // Replace with your Project URL
  key: 'your-dev-anon-key', // Replace with your anon key
  label: 'DEVELOPMENT'
};
```

## Step 5: Sync Production Data to Development

Now you can use the "Sync with Web App" button in the app's Settings to safely copy production data to your development database for testing.

## Troubleshooting

- If you encounter permission errors, check your RLS policies
- If data isn't syncing, verify your database URL and API key
- For more help, see the Supabase documentation at https://supabase.com/docs