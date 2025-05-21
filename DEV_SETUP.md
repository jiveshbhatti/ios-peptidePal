# Development Environment Setup

This document outlines how to set up a development environment for PeptidePal, including creating a separate development database to avoid affecting production data.

## Why Use a Development Database?

During development and testing, you'll want to:
- Experiment with features without affecting real users
- Make database changes that might be destructive
- Test with dummy data
- Avoid accidentally corrupting production data

## Setting Up a Development Database

### 1. Create a new Supabase project

1. Go to [Supabase Dashboard](https://app.supabase.io) 
2. Create a new project named "PeptidePal Development"
3. After project creation, copy the following credentials:
   - Project URL (e.g., `https://your-project-id.supabase.co`)
   - API Keys > anon key (public)

### 2. Update your config file

Open `/src/config.ts` and update the DEV_DB configuration with your new credentials:

```typescript
const DEV_DB: DatabaseConfig = {
  url: 'YOUR_NEW_DEV_PROJECT_URL',
  key: 'YOUR_NEW_DEV_PROJECT_KEY',
  label: 'DEVELOPMENT'
};
```

### 3. Clone database schema (optional)

If you want to clone your production database schema to development:

1. Export your production database schema
   ```bash
   supabase db dump --schema-only -f schema.sql
   ```

2. Import the schema to your development database
   ```bash
   supabase db push -d your-dev-project-id
   ```

## Switching Between Environments

### Using the Settings UI

The simplest way to switch between environments is:

1. Go to the Settings tab in the app
2. Scroll to the bottom to find the Developer Settings section
3. Toggle the "Database Environment" switch
4. Restart the app to ensure all data is reloaded from the new environment

### Using Code

You can also programmatically switch environments:

```typescript
import { switchToDevelopmentDb, switchToProductionDb } from '@/config';

// Switch to development database
switchToDevelopmentDb();

// Switch to production database 
switchToProductionDb();
```

## Testing with Dummy Data

To populate your development database with test data:

1. Run the setup-dev-db.js script:
   ```bash
   node setup-dev-db.js
   ```

This script will:
1. Fetch data from your production database
2. Create modified copies with "[TEST]" prefix
3. Insert these copies into your development database

## Best Practices

1. **Always check which environment you're in** before making changes
2. **Never use real user data** for testing purposes
3. **Run in development mode** during feature development
4. **Test in production mode** before releasing
5. **Document database changes** between environments

## Troubleshooting

If you encounter any issues with database connections:

1. Verify your API keys are correctly set in the config
2. Check network connectivity to Supabase
3. Verify your database schema is properly set up
4. Look for any console errors related to database operations

Remember that database changes made in development will not affect your production database!