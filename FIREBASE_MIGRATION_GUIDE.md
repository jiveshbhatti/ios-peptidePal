# Firebase Migration Guide for PeptidePal

This document details how to use Firebase with PeptidePal, including the migration process from Supabase.

## Table of Contents
1. [Firebase Setup](#firebase-setup)
2. [Migrating from Supabase to Firebase](#migrating-from-supabase-to-firebase)
3. [App Configuration](#app-configuration)
4. [Security Rules](#security-rules)
5. [App Check Configuration](#app-check-configuration)
6. [Schema Structure](#schema-structure)
7. [Troubleshooting](#troubleshooting)

## Firebase Setup

The app has been configured to use Firebase Firestore as a database backend. Here are the key details:

- **Project ID**: `peptidepal`
- **Database**: Default Firestore database in Native mode
- **Security Rules**: Set to allow all access during development
- **App Check**: Enabled and bypassed with debug token for development

## Migrating from Supabase to Firebase

Use the admin migration script to migrate data from Supabase to Firebase:

```bash
# Run the full migration
node scripts/admin-migrate-to-firebase.js

# Test with a single peptide
node scripts/migration-test.js
```

The migration process:
1. Exports data from Supabase
2. Transforms it to the Firebase schema
3. Imports it to Firebase using the Admin SDK (or client SDK with App Check debug token)

## App Configuration

The Firebase configuration is set up in `src/firebase-config.js`:

```javascript
// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAMnokBM7CVDE265ZLhZROjWrQ5w2DR2P0",
  authDomain: "peptidepal.firebaseapp.com",
  projectId: "peptidepal",
  storageBucket: "peptidepal.appspot.com", 
  messagingSenderId: "229078698562",
  appId: "1:229078698562:web:a3a431131daad253b7fbdb"
};
```

The app uses a database context to switch between Supabase and Firebase backends:

```javascript
// In DatabaseContext.tsx
const service = useFirebase ? firebaseService : peptideService as DatabaseService;
```

## Security Rules

The Firestore security rules are set to allow all access during development:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

For production, implement proper authentication rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## App Check Configuration

App Check is enabled for the Firebase project. For development, we bypass it with a debug token:

```javascript
// For development only - enables App Check debug mode
if (typeof self !== 'undefined') {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
} else if (typeof global !== 'undefined') {
  global.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}
```

For production, you should:
1. Register your app with App Check in the Firebase Console
2. Implement proper App Check in your app
3. Remove the debug token setting

## Schema Structure

The Firebase schema follows this structure:

```
peptides/
  {peptideId}/
    - id: string
    - name: string
    - strength: string
    - dosageUnit: string
    - typicalDosageUnits: number
    - schedule: object
    - startDate: timestamp
    - createdAt: timestamp
    - updatedAt: timestamp
    
    vials/ (subcollection)
      {vialId}/
        - id: string
        - isActive: boolean
        - initialAmountUnits: number
        - remainingAmountUnits: number
        - reconstitutionDate: timestamp
        - expirationDate: timestamp
    
    doseLogs/ (subcollection)
      {logId}/
        - id: string
        - date: timestamp
        - timeOfDay: string
        - dosage: number
        - unit: string
        - vialId: string
        - notes: string (optional)
```

## Troubleshooting

### Permission Denied Errors

If you encounter "Missing or insufficient permissions" errors:

1. **Check security rules** - Make sure they allow access
2. **App Check** - Make sure the debug token is set before Firebase initialization
3. **Authentication** - If using auth rules, make sure the user is authenticated

### Firebase Admin SDK

For administrative tasks, use the Firebase Admin SDK with a service account key:

1. Generate a service account key from Firebase Console > Project Settings > Service Accounts
2. Save it as `serviceAccountKey.json` in the project root
3. Use the Admin SDK in scripts, not in the client app

### Migration Issues

If you encounter issues during migration:

1. **Schema mismatch** - Check the transformation logic in the migration script
2. **Dates** - Make sure dates are properly converted to Firestore timestamps
3. **Batch limits** - Firebase has a limit of 500 operations per batch, use multiple batches for large datasets