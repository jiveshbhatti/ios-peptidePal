# Setting Up Firebase Service Account

To properly run the Firebase migration script, you need to set up a service account. This document guides you through the process of obtaining and configuring the service account key.

## Step 1: Generate a Service Account Key

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your PeptidePal project
3. Click on the gear icon ⚙️ (Settings) in the left sidebar, and select "Project settings"
4. Navigate to the "Service accounts" tab
5. Click "Generate new private key" button for "Firebase Admin SDK"
6. Save the downloaded JSON file securely

## Step 2: Place the Service Account Key File

1. Move the downloaded JSON file to your project directory
2. Rename it to `serviceAccountKey.json` 
3. Place it in the root directory of your project or in a secure location

Example path: `/Users/jiveshbhatti/Desktop/studio/ios-peptidepal/serviceAccountKey.json`

## Step 3: Setup Environment Variable (Optional)

If you prefer not to store the key file in your project directory, you can set an environment variable pointing to the file:

```bash
export FIREBASE_SERVICE_ACCOUNT_PATH="/path/to/your/serviceAccountKey.json"
```

## Step 4: Run the Admin Migration Script

Now you're ready to run the admin migration script:

```bash
node scripts/admin-migrate-to-firebase.js
```

The script will:
1. Export data from Supabase
2. Transform the data for Firebase
3. Import the data to Firebase using the Admin SDK

## Security Notes

- **IMPORTANT**: Never commit the `serviceAccountKey.json` file to version control
- Add `serviceAccountKey.json` to your `.gitignore` file
- This file contains sensitive credentials that should be kept secure
- For production use, consider using environment variables or a secrets manager

## Firebase Security Rules

The Firebase project is already configured with proper security rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2025, 6, 10);
    }
  }
}
```

These rules allow read and write access until June 10, 2025. For production, you should implement stricter rules based on user authentication.