# Firebase Migration Guide

This document outlines the process for migrating PeptidePal from Supabase to Firebase.

## Why Migrate to Firebase?

1. **Schemaless Database**:
   - No more issues with camelCase vs. snake_case
   - More flexible document structure for peptides, vials, and dose logs

2. **Better Offline Support**:
   - Firebase provides robust offline capabilities for mobile apps
   - Automatic conflict resolution when reconnecting

3. **Simplified Data Model**:
   - Subcollections for dose logs and vials
   - No need to manage JSON arrays in database columns

4. **Improved Reliability**:
   - Avoid schema cache issues that caused data corruption

## Migration Process

### 1. Set Up Firebase Environment

We've already completed the initial setup with the Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyAMnokBM7CVDE265ZLhZROjWrQ5w2DR2P0",
  authDomain: "peptidepal.firebaseapp.com",
  projectId: "peptidepal",
  storageBucket: "peptidepal.firebasestorage.app",
  messagingSenderId: "229078698562",
  appId: "1:229078698562:web:a3a431131daad253b7fbdb"
};
```

### 2. Export Data from Supabase

Use the migration script to export your current data:

```bash
node scripts/migrate-to-firebase.js --no-import
```

This will:
- Export all data from Supabase
- Transform it for Firebase's data model
- Save both export and transformed import files to the `/backups/migration/` folder

### 3. Import Data to Firebase

Once you've reviewed the export and transformation, run:

```bash
node scripts/migrate-to-firebase.js
```

This will:
- Export data from Supabase
- Transform it for Firebase 
- Import the transformed data to Firebase

If you want to clear existing Firebase data first:

```bash
node scripts/migrate-to-firebase.js --clear
```

### 4. Testing the Migration

We've implemented a DatabaseProvider context that allows switching between Supabase and Firebase at runtime. Use the toggle switch in the app to test both implementations.

The DatabaseSwitcher component in the HomeScreen will show the current database being used.

### 5. Data Model in Firebase

The Firebase data model is structured as follows:

#### Main Collections

- **peptides**: Main peptide documents
  - Each with subcollections for vials and dose logs
- **inventory**: Contains subcollections for different inventory types

#### Peptide Document

```javascript
{
  name: "Glow",
  strength: "10000mcg total",
  dosageUnit: "mcg",
  typicalDosageUnits: 300,
  schedule: { 
    frequency: "daily", 
    times: ["AM", "PM"] 
  },
  notes: "9 units = 300 mcg",
  startDate: "2025-05-13T07:00:00+00:00",
  imageUrl: "https://example.com/image.jpg",
  dataAiHint: "Glow peptide",
  
  // Inventory data
  inventory: {
    numVials: 7,
    concentrationPerVialMcg: 10000,
    storageLocation: "Mini Fridge",
    lowStockThreshold: 2,
    typicalDoseMcg: 300
  },
  
  // Active vial data
  activeVial: {
    status: "IN_USE",
    reconstitutionDate: "2025-05-13",
    expiryDate: "2025-06-10T00:00:00+00:00",
    bacWaterVolumeAdded: 3,
    usedDoses: 14
  },
  
  createdAt: "2025-05-14T02:33:06.630576+00:00",
  updatedAt: "2025-05-21T06:48:33.687908+00:00"
}
```

#### Vials Subcollection

```javascript
{
  id: "vial123",
  peptideId: "peptide456",
  isActive: true,
  initialAmountUnits: 33,
  remainingAmountUnits: 19,
  reconstitutionDate: "2025-05-13",
  expirationDate: "2025-06-10T00:00:00.000Z",
  bacWaterMl: 3,
  dateAdded: "2025-05-13"
}
```

#### DoseLogs Subcollection

```javascript
{
  id: "log123",
  peptideId: "peptide456",
  vialId: "vial123",
  date: "2025-05-14T00:00:00.000Z",
  timeOfDay: "AM",
  dosage: 300,
  unit: "mcg",
  createdAt: "2025-05-14T00:00:00.000Z"
}
```

## Switching Between Databases

The app includes a database switcher that lets you toggle between Supabase and Firebase. This preference is stored in AsyncStorage.

To implement the switch in your components, use the `useDatabase` hook:

```javascript
import { useDatabase } from '@/contexts/DatabaseContext';

function MyComponent() {
  const { service, useFirebase, toggleDatabase } = useDatabase();
  
  // Use service.getPeptides() instead of peptideService.getPeptides()
  // This will use either Firebase or Supabase based on current setting
  const fetchData = async () => {
    const peptides = await service.getPeptides();
    // ...
  };
  
  return (
    <View>
      <Text>Current database: {useFirebase ? 'Firebase' : 'Supabase'}</Text>
      <Button title="Switch Database" onPress={toggleDatabase} />
    </View>
  );
}
```

## Files Added for Firebase Support

1. **src/services/firebase.ts**
   - Firebase service implementation
   - Mimics the Supabase service API

2. **src/contexts/DatabaseContext.tsx**
   - Provider for switching between databases
   - Exposes the `useDatabase` hook

3. **src/components/DatabaseSwitcher.tsx**
   - UI component to toggle between databases

4. **scripts/migrate-to-firebase.js**
   - Migration script for exporting, transforming, and importing data

## Next Steps

- [ ] Implement more Firebase services like authentication
- [ ] Add offline sync capabilities
- [ ] Create Firebase indexes for optimized queries
- [ ] Move entirely to Firebase when ready