# Firebase Troubleshooting Guide

This document provides guidance for troubleshooting common Firebase issues in the PeptidePal app.

## Latest Findings (May 21, 2025)

We've identified specific issues with the Firebase implementation:

1. **NOT_FOUND Errors**: Consistently receiving `Code: 5 Message: 5 NOT_FOUND` errors when trying to write to Firestore
2. **Offline Mode**: Firestore reports it's operating in offline mode and cannot reach the backend
3. **Authentication Issues**: Email/password authentication is not enabled or configured properly

## Immediate Actions Required

1. **Generate a Firebase Admin SDK Service Account**:
   - Follow instructions in `SERVICE_ACCOUNT_INSTRUCTIONS.md` to create a service account key
   - Place the JSON file at the project root as `serviceAccountKey.json`

2. **Verify Firebase Project Configuration**:
   - Confirm the project ID "peptidepal" exists and is accessible
   - Check that the Firebase API key and credentials are correct

3. **Initialize Firestore Database**:
   - Make sure Firestore is enabled and a database is created in Native mode
   - Verify the region setting is appropriate

4. **Enable Email/Password Authentication**:
   - Enable this sign-in method in the Firebase console
   - Create a test user for authentication testing

## Common Firebase Issues

### "NOT_FOUND" Errors

These errors typically occur when:
- You're trying to update or delete a document that doesn't exist
- You're trying to access a subcollection of a document that doesn't exist
- The document paths in your code don't match the actual paths in the Firestore database
- **Most likely issue**: The Firestore database is not properly initialized or doesn't exist

### Connection Issues

If you're seeing transport errors or connectivity issues:

1. **Multiple Initializations**: Make sure Firebase is only initialized once in your app
2. **Offline Mode**: Check if the device has a stable internet connection
3. **Firestore Rules**: Verify your security rules allow the operations you're attempting
4. **Networking**: VPNs or network restrictions can affect Firebase connections

## Testing Firebase Connection

### Run the Connection Test

We've created test scripts to verify Firebase connectivity:

```bash
# Test basic read access
node scripts/test-firebase-read.js

# Test basic write operation
node scripts/create-test-document.js

# Test with authentication (after enabling email/password auth)
node scripts/auth-create-test-document.js

# Test with Admin SDK (after creating service account)
node scripts/admin-create-test-document.js
```

### Test Firebase Data Migration

To test migration without affecting your data:

```bash
node scripts/migrate-to-firebase.js --no-import
```

This will export from Supabase and convert to Firebase format without importing.

## Firebase Schema Structure

The app expects this Firestore structure:

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

## Database Switching

The app provides a database switcher component that allows toggling between Supabase and Firebase. This is helpful for testing:

1. Start with Supabase (the default)
2. Migrate data to Firebase using the migration script
3. Use the in-app database switcher to toggle to Firebase
4. Test functionality with Firebase
5. If issues occur, toggle back to Supabase

## Optimizing Firebase for React Native

For React Native, the app uses these optimizations:

1. **Offline Persistence**: Enabled for better offline support
2. **Long Polling**: Used instead of WebSockets for better reliability
3. **Connection Resets**: Periodic network toggling to avoid connection freezes
4. **Error Monitoring**: Detects and attempts to recover from Firebase transport errors

## Common Fixes

### Firebase Initialization

If getting initialization errors, make sure:

```javascript
// Only initialize Firebase once in your app
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
```

### Document Not Found

When updating documents that might not exist:

```javascript
// Check before updating
const docRef = doc(db, 'peptides', peptideId);
const docSnap = await getDoc(docRef);

if (docSnap.exists()) {
  // Document exists, safe to update
  await updateDoc(docRef, { field: 'value' });
} else {
  // Document doesn't exist, create it
  await setDoc(docRef, { field: 'value', id: peptideId });
}
```

### Timestamps for Dates

Always use Firestore Timestamps for dates:

```javascript
import { Timestamp } from 'firebase/firestore';

// Creating a timestamp
const now = Timestamp.now();
const specificDate = Timestamp.fromDate(new Date("2023-01-01"));

// Reading a timestamp
const dateValue = timestamp.toDate(); // Convert to JavaScript Date
```

## Advanced Troubleshooting

For persistent issues:

1. **Clear IndexedDB Persistence**: Use `clearIndexedDbPersistence(db)` to reset local storage
2. **Run Migration with Clean Data**: Clear the Firebase collections first
3. **Check Security Rules**: Ensure your Firestore rules allow the operations
4. **Simplify Data Structure**: Start with simple document operations to verify connectivity

## Next Steps for Current Issues

1. Generate and add a service account key (highest priority)
2. Enable Email/Password authentication in Firebase Console
3. Review Firestore setup in Firebase Console 
4. Check network connectivity to Firebase
5. Run the admin version of our migration script to bypass client authentication