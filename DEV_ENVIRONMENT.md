# PeptidePal Development Environment

The app has been configured to start in **DEVELOPMENT** mode by default. This document explains how this works and how to switch between environments.

## Default Environment

The app now starts with these settings:

```typescript
// Default to development for easier testing
let currentDb = DEV_DB;

// Start in development mode by default
let useDevDb = true;
```

This means:
- When you launch the app, it connects to the development database
- The Developer Settings in the Settings screen will show "DEV DB"
- All changes affect only the development database

## Switching Environments

You can still switch between development and production using the toggle in Developer Settings:

1. Go to Settings
2. Scroll to Developer Settings at the bottom
3. Use the switch to toggle between environments
4. You'll see a confirmation dialog
5. The environment badge will update to show which database you're using

## Visual Indicators

The app provides several visual indicators to show which environment you're using:

1. **Environment Badge**: Shows "DEV DB" (green) or "PROD DB" (red)
2. **Current Environment** text description
3. **URL Preview** showing part of the database URL
4. **Warning Box** with safety information

## Data Safety

Important safety notes:

- When in **DEVELOPMENT** mode (default), changes only affect test data
- When in **PRODUCTION** mode, changes affect real user data
- The sync feature always copies FROM production TO development (one-way)
- Development data is never uploaded to production

## Verifying Your Environment

To double-check which environment you're using:

1. Look at the environment badge in Developer Settings
2. Check console logs - they should include environment information
3. Run `node verify-environment.js` to test both database connections
4. The development database should contain peptides with `[TEST]` prefixes

## Changing the Default Environment

If you want to change the default back to production:

1. Edit `src/config.ts`
2. Change these lines:
   ```typescript
   let currentDb = DEV_DB;
   let useDevDb = true;
   ```
   
   To:
   ```typescript
   let currentDb = PRODUCTION_DB;
   let useDevDb = false;
   ```
3. Save the file and restart the app