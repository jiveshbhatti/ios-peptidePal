# Firebase Setup Instructions

Follow these steps to properly set up Firebase for your PeptidePal app.

## 1. Create Default Database

```bash
# Wait until previous database deletion is complete (about 2-3 minutes)
gcloud firestore databases create --project='peptidepal' --database='(default)' --location='nam5'
```

## 2. Update Security Rules

In Firebase Console (https://console.firebase.google.com/project/peptidepal/firestore/rules):

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

This configuration allows unrestricted access for development. For production, you should implement proper authentication rules.

## 3. Disable App Check

1. Go to Firebase Console > App Check (https://console.firebase.google.com/project/peptidepal/appcheck)
2. Disable App Check for development OR
3. Enable Debug Mode for development environments

## 4. Test Firebase Connection

```bash
# Test Admin SDK access
node scripts/fix-database-config.js

# Test client-side access
node scripts/basic-client-test.js
```

## 5. Update App Configuration

Use this configuration in your app:

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
```

## 6. Set Up Emulator for Local Development (Optional)

```bash
firebase init emulators
firebase emulators:start
```

Then connect to the emulators in your app.

## 7. Run Migration Scripts

After the database is set up and configured:

```bash
node scripts/admin-migrate-to-firebase.js
```

This will export data from Supabase and import it to Firebase.

## Troubleshooting

If you encounter permission issues:
1. Check App Check settings - this is the most likely source of client access issues
2. Verify security rules are published and correct
3. Make sure you're using the default database
4. Check that your service account has the correct permissions