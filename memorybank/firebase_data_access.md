# Firebase Data Access Guide

## Overview
This guide documents how to safely access Firebase Firestore data for the PeptidePal project using the Firebase Admin SDK.

## Prerequisites

1. **Service Account Key**
   - Located at: `/Users/jiveshbhatti/Downloads/peptidepal-firebase-adminsdk-fbsvc-9003dbd28d.json`
   - This file contains credentials for admin access
   - DO NOT commit this file to version control

2. **Firebase Admin SDK**
   - Already installed in the project: `firebase-admin`
   - Used for server-side access with full privileges

## Project Information
- **Project Name**: PeptidePal
- **Project ID**: peptidepal
- **Firebase Console**: https://console.firebase.google.com/project/peptidepal

## How to Access Firebase Data

### 1. Create a Script

```javascript
const admin = require('firebase-admin');
const fs = require('fs');

// Path to service account key
const serviceAccountPath = '/Users/jiveshbhatti/Downloads/peptidepal-firebase-adminsdk-fbsvc-9003dbd28d.json';

// Initialize Firebase Admin
const serviceAccountContent = fs.readFileSync(serviceAccountPath, 'utf8');
const serviceAccount = JSON.parse(serviceAccountContent);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'peptidepal'
});

const db = admin.firestore();
```

### 2. Common Operations

#### Read a Collection
```javascript
const snapshot = await db.collection('peptides').get();
snapshot.forEach(doc => {
  console.log(doc.id, '=>', doc.data());
});
```

#### Query Documents
```javascript
const query = await db.collection('peptides')
  .where('name', '==', 'Glow')
  .get();
```

#### Read Subcollections
```javascript
// For inventory structure: inventory/peptides/peptides/{docId}
const inventoryDoc = await db.collection('inventory')
  .doc('peptides')
  .collection('peptides')
  .doc(peptideId)
  .get();
```

### 3. Data Structure

```
Firestore Structure:
├── peptides/
│   └── {peptideId}/
│       ├── name
│       ├── typicalDosageUnits
│       ├── vials[] (array)
│       └── doseLogs[] (array)
│
└── inventory/
    └── peptides/
        └── peptides/
            └── {peptideId}/
                ├── concentration_per_vial_mcg
                ├── bac_water_volume_added
                └── typical_dose_mcg
```

## Important Fields for Volume Calculation

For volume calculation to work, we need:
1. `vial.reconstitutionBacWaterMl` - Amount of BAC water added
2. `vial.totalPeptideInVialMcg` - Total peptide in the vial (often missing)
3. `peptide.typicalDosageUnits` - Dose amount

### Known Issues
- Many vials are missing `totalPeptideInVialMcg`
- Inventory data is not always synced with peptide data
- Some peptides have no active vials

## Safety Guidelines

1. **Always use read-only operations** when checking data
2. **Never run delete operations** without explicit confirmation
3. **Test queries in scripts** before implementing in production code
4. **Keep service account key secure** and never commit to git

## Script Location
Store diagnostic scripts in: `/scripts/` directory
Example scripts:
- `check-nad-data.js` - Check NAD+ peptide data
- `check-project-config.js` - Verify Firebase configuration

## Firebase CLI Alternative

While Firebase CLI is installed, for data queries the Admin SDK is preferred because:
- More programmatic control
- Better for complex queries
- Can process results in JavaScript
- Direct database access

Firebase CLI is better for:
- Project management
- Deployment
- Security rules
- Initial setup