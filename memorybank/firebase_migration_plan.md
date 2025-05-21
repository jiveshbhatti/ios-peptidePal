# Firebase Migration Plan for PeptidePal

## Current Schema (Supabase)

![Supabase Schema](./supabase_schema.png)

### Current Tables
1. **inventory_peptides**
   - id (uuid)
   - name (text)
   - num_vials (int4)
   - concentration_per_vial_mcg (int4)
   - storage_location (text)
   - expiry_date (date)
   - created_at (timestamptz)
   - updated_at (timestamptz)
   - active_vial_expiry_date (timestamptz)
   - active_vial_reconstitution_date (date)
   - active_vial_status (text)
   - low_stock_threshold (int4)
   - batch_number (text) - Used for usage tracking with format "USAGE:14"
   - bac_water_volume_added (float4)
   - typical_dose_mcg (float4)

2. **peptides**
   - id (uuid) - Same as inventory_peptides.id
   - name (text)
   - strength (text)
   - dosageUnit (text)
   - typicalDosageUnits (numeric)
   - schedule (jsonb)
   - vials (jsonb)
   - doseLogs (jsonb)
   - imageUrl (text)
   - dataAiHint (text)
   - notes (text)
   - startDate (timestamptz)

3. **inventory_bac_water**
   - id (uuid)
   - volume_ml_per_bottle (int4)
   - num_bottles (int4)
   - expiry_date (date)
   - created_at (timestamptz)
   - updated_at (timestamptz)

4. **inventory_syringes**
   - id (uuid)
   - type_size (text)
   - quantity (int4)
   - brand (text)
   - created_at (timestamptz)
   - updated_at (timestamptz)

5. **inventory_other_items**
   - id (uuid)
   - item_name (text)
   - description (text)
   - quantity (int4)
   - notes (text)
   - created_at (timestamptz)
   - updated_at (timestamptz)

## Firebase Migration Strategy

### 1. Firestore Data Model

Firestore is a NoSQL database, so we'll restructure our data for document collections:

#### Collections Structure

1. **users**
   - Document ID: `{userId}`
   - Fields:
     - email
     - displayName
     - createdAt
     - lastActive

2. **peptides**
   - Document ID: `{peptideId}` (same as current UUID)
   - Fields:
     ```javascript
     {
       name: string,
       strength: string,
       dosageUnit: string,
       typicalDosageUnits: number,
       schedule: {
         frequency: string,
         times: string[],
         daysOfWeek?: number[]
       },
       notes: string,
       startDate: timestamp,
       imageUrl: string,
       dataAiHint: string,
       
       // Inventory data (merged from inventory_peptides)
       inventory: {
         numVials: number,
         concentrationPerVialMcg: number,
         storageLocation: string,
         expiryDate: timestamp,
         lowStockThreshold: number,
         typicalDoseMcg: number
       },
       
       // Active vial data
       activeVial: {
         status: 'NONE' | 'IN_USE' | 'FINISHED' | 'DISCARDED',
         reconstitutionDate: timestamp,
         expiryDate: timestamp,
         bacWaterVolumeAdded: number,
         usedDoses: number  // Replaces USAGE:14 tracking in batch_number
       },
       
       // References
       userId: string,
       createdAt: timestamp,
       updatedAt: timestamp
     }
     ```

3. **vials** (subcollection of peptides)
   - Document ID: auto-generated
   - Fields:
     ```javascript
     {
       peptideId: string,  // Parent reference
       isActive: boolean,
       initialAmountUnits: number,
       remainingAmountUnits: number,
       reconstitutionDate: timestamp,
       expirationDate: timestamp,
       bacWaterMl: number,
       name: string,
       notes: string,
       dateAdded: timestamp
     }
     ```

4. **doseLogs** (subcollection of peptides)
   - Document ID: auto-generated
   - Fields:
     ```javascript
     {
       peptideId: string,  // Parent reference
       vialId: string,     // Reference to vial
       date: timestamp,
       timeOfDay: string,
       dosage: number,
       unit: string,
       notes: string,
       reconstructed: boolean,  // Flag for synthetic logs
       createdAt: timestamp
     }
     ```

5. **inventory**
   - Subcollection: **bacWater**
     ```javascript
     {
       volumeMlPerBottle: number,
       numBottles: number,
       expiryDate: timestamp,
       userId: string,
       createdAt: timestamp,
       updatedAt: timestamp
     }
     ```
   
   - Subcollection: **syringes**
     ```javascript
     {
       typeSize: string,
       quantity: number,
       brand: string,
       userId: string,
       createdAt: timestamp,
       updatedAt: timestamp
     }
     ```
   
   - Subcollection: **otherItems**
     ```javascript
     {
       itemName: string,
       description: string,
       quantity: number,
       notes: string,
       userId: string,
       createdAt: timestamp,
       updatedAt: timestamp
     }
     ```

### 2. Benefits of this Structure

1. **Unified Peptide Data**: Merges inventory_peptides and peptides tables for simpler access
2. **Subcollections for Related Data**: Keeps vials and doseLogs organized under their peptide
3. **No Schema Worries**: Avoids camelCase/lowercase issues that caused problems
4. **Simplified Queries**: Easier to get all data for a specific peptide
5. **Offline Support**: Better offline capabilities with Firebase's local caching

### 3. Migration Process

#### Step 1: Set Up Firebase Project

```bash
# Install Firebase CLI and tools
npm install -g firebase-tools
npm install firebase @react-native-firebase/app @react-native-firebase/firestore

# Initialize Firebase in your project
firebase init
```

#### Step 2: Create Data Export Script

```javascript
// scripts/export-supabase-data.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Supabase credentials
const supabaseUrl = process.env.SUPABASE_URL || 'https://yawjzpovpfccgisrrfjo.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'YOUR_SUPABASE_KEY';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function exportData() {
  // Export all tables
  const tables = [
    'peptides', 
    'inventory_peptides', 
    'inventory_bac_water',
    'inventory_syringes', 
    'inventory_other_items'
  ];
  
  const data = {};
  
  for (const table of tables) {
    console.log(`Exporting ${table}...`);
    const { data: tableData, error } = await supabase
      .from(table)
      .select('*');
      
    if (error) {
      console.error(`Error exporting ${table}:`, error);
      continue;
    }
    
    data[table] = tableData;
    console.log(`Exported ${tableData.length} records from ${table}`);
  }
  
  // Write to file
  fs.writeFileSync(
    './supabase-export.json',
    JSON.stringify(data, null, 2)
  );
  
  console.log('Export complete!');
}

exportData();
```

#### Step 3: Create Data Transformation Script

```javascript
// scripts/transform-for-firebase.js
const fs = require('fs');

// Read exported data
const data = JSON.parse(fs.readFileSync('./supabase-export.json', 'utf8'));

// Transform data for Firebase
function transformData() {
  const firebaseData = {
    peptides: {},
    inventory: {
      bacWater: {},
      syringes: {},
      otherItems: {}
    }
  };
  
  // Map peptides and inventory together
  const peptideMap = new Map();
  data.peptides.forEach(peptide => peptideMap.set(peptide.id, peptide));
  
  data.inventory_peptides.forEach(invPeptide => {
    const peptide = peptideMap.get(invPeptide.id) || {};
    
    // Create merged peptide document
    firebaseData.peptides[invPeptide.id] = {
      name: invPeptide.name,
      strength: peptide.strength || '',
      dosageUnit: peptide.dosageUnit || 'mcg',
      typicalDosageUnits: peptide.typicalDosageUnits || 0,
      schedule: peptide.schedule || { frequency: 'daily', times: ['AM'] },
      notes: peptide.notes || '',
      startDate: peptide.startDate || new Date().toISOString(),
      imageUrl: peptide.imageUrl || '',
      dataAiHint: peptide.dataAiHint || '',
      
      // Inventory data
      inventory: {
        numVials: invPeptide.num_vials || 0,
        concentrationPerVialMcg: invPeptide.concentration_per_vial_mcg || 0,
        storageLocation: invPeptide.storage_location || '',
        expiryDate: invPeptide.expiry_date || null,
        lowStockThreshold: invPeptide.low_stock_threshold || 2,
        typicalDoseMcg: invPeptide.typical_dose_mcg || 0
      },
      
      // Active vial data
      activeVial: {
        status: invPeptide.active_vial_status || 'NONE',
        reconstitutionDate: invPeptide.active_vial_reconstitution_date || null,
        expiryDate: invPeptide.active_vial_expiry_date || null,
        bacWaterVolumeAdded: invPeptide.bac_water_volume_added || 0,
        usedDoses: invPeptide.batch_number?.startsWith('USAGE:') ? 
          parseInt(invPeptide.batch_number.split('USAGE:')[1], 10) : 0
      },
      
      createdAt: invPeptide.created_at || new Date().toISOString(),
      updatedAt: invPeptide.updated_at || new Date().toISOString()
    };
    
    // Extract vials subcollection
    if (peptide.vials && Array.isArray(peptide.vials)) {
      firebaseData.peptides[invPeptide.id].vials = {};
      peptide.vials.forEach((vial, index) => {
        firebaseData.peptides[invPeptide.id].vials[`vial_${index}`] = {
          ...vial,
          peptideId: invPeptide.id
        };
      });
    }
    
    // Extract dose logs subcollection
    if (peptide.doseLogs && Array.isArray(peptide.doseLogs)) {
      firebaseData.peptides[invPeptide.id].doseLogs = {};
      peptide.doseLogs.forEach((log, index) => {
        firebaseData.peptides[invPeptide.id].doseLogs[`log_${log.id || index}`] = {
          ...log,
          peptideId: invPeptide.id,
          createdAt: new Date(log.date).toISOString()
        };
      });
    }
  });
  
  // Transform inventory
  data.inventory_bac_water.forEach((item, index) => {
    firebaseData.inventory.bacWater[`bac_${item.id || index}`] = {
      volumeMlPerBottle: item.volume_ml_per_bottle || 0,
      numBottles: item.num_bottles || 0,
      expiryDate: item.expiry_date || null,
      createdAt: item.created_at || new Date().toISOString(),
      updatedAt: item.updated_at || new Date().toISOString()
    };
  });
  
  data.inventory_syringes.forEach((item, index) => {
    firebaseData.inventory.syringes[`syringe_${item.id || index}`] = {
      typeSize: item.type_size || '',
      quantity: item.quantity || 0,
      brand: item.brand || '',
      createdAt: item.created_at || new Date().toISOString(),
      updatedAt: item.updated_at || new Date().toISOString()
    };
  });
  
  data.inventory_other_items.forEach((item, index) => {
    firebaseData.inventory.otherItems[`item_${item.id || index}`] = {
      itemName: item.item_name || '',
      description: item.description || '',
      quantity: item.quantity || 0,
      notes: item.notes || '',
      createdAt: item.created_at || new Date().toISOString(),
      updatedAt: item.updated_at || new Date().toISOString()
    };
  });
  
  // Write transformed data
  fs.writeFileSync(
    './firebase-import.json',
    JSON.stringify(firebaseData, null, 2)
  );
  
  console.log('Transformation complete!');
}

transformData();
```

#### Step 4: Import Data to Firebase

```javascript
// scripts/import-to-firebase.js
const admin = require('firebase-admin');
const fs = require('fs');
const serviceAccount = require('./firebase-service-account.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function importData() {
  // Read transformed data
  const data = JSON.parse(fs.readFileSync('./firebase-import.json', 'utf8'));
  
  // Batch operations for better performance
  const MAX_BATCH_SIZE = 500;
  let operationCount = 0;
  let batch = db.batch();
  
  // Import peptides
  console.log('Importing peptides...');
  for (const [peptideId, peptideData] of Object.entries(data.peptides)) {
    // Extract subcollections
    const vials = peptideData.vials || {};
    const doseLogs = peptideData.doseLogs || {};
    
    // Remove subcollections from main document
    delete peptideData.vials;
    delete peptideData.doseLogs;
    
    // Add main peptide document
    const peptideRef = db.collection('peptides').doc(peptideId);
    batch.set(peptideRef, peptideData);
    operationCount++;
    
    // Handle vials subcollection
    for (const [vialId, vialData] of Object.entries(vials)) {
      const vialRef = peptideRef.collection('vials').doc(vialId);
      batch.set(vialRef, vialData);
      operationCount++;
      
      if (operationCount >= MAX_BATCH_SIZE) {
        await batch.commit();
        batch = db.batch();
        operationCount = 0;
      }
    }
    
    // Handle doseLogs subcollection
    for (const [logId, logData] of Object.entries(doseLogs)) {
      const logRef = peptideRef.collection('doseLogs').doc(logId);
      batch.set(logRef, logData);
      operationCount++;
      
      if (operationCount >= MAX_BATCH_SIZE) {
        await batch.commit();
        batch = db.batch();
        operationCount = 0;
      }
    }
  }
  
  // Import inventory subcollections
  console.log('Importing inventory items...');
  
  // BAC Water
  for (const [id, itemData] of Object.entries(data.inventory.bacWater || {})) {
    const itemRef = db.collection('inventory').doc('bacWater').collection('items').doc(id);
    batch.set(itemRef, itemData);
    operationCount++;
    
    if (operationCount >= MAX_BATCH_SIZE) {
      await batch.commit();
      batch = db.batch();
      operationCount = 0;
    }
  }
  
  // Syringes
  for (const [id, itemData] of Object.entries(data.inventory.syringes || {})) {
    const itemRef = db.collection('inventory').doc('syringes').collection('items').doc(id);
    batch.set(itemRef, itemData);
    operationCount++;
    
    if (operationCount >= MAX_BATCH_SIZE) {
      await batch.commit();
      batch = db.batch();
      operationCount = 0;
    }
  }
  
  // Other Items
  for (const [id, itemData] of Object.entries(data.inventory.otherItems || {})) {
    const itemRef = db.collection('inventory').doc('otherItems').collection('items').doc(id);
    batch.set(itemRef, itemData);
    operationCount++;
    
    if (operationCount >= MAX_BATCH_SIZE) {
      await batch.commit();
      batch = db.batch();
      operationCount = 0;
    }
  }
  
  // Commit any remaining operations
  if (operationCount > 0) {
    await batch.commit();
  }
  
  console.log('Import complete!');
}

importData().catch(err => {
  console.error('Error importing data:', err);
  process.exit(1);
});
```

### 4. Firebase Service Implementation

Create a new service layer to replace the existing Supabase services:

```typescript
// src/services/firebase.ts
import firestore from '@react-native-firebase/firestore';
import { Peptide, DoseLog, Vial } from '@/types';

// Helper to convert Firestore timestamp to ISO string
const timestampToString = (timestamp: any) => {
  if (!timestamp) return null;
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toISOString();
  }
  return timestamp;
};

export const firebaseService = {
  // Peptide Operations
  async getPeptides(): Promise<Peptide[]> {
    try {
      const snapshot = await firestore().collection('peptides').get();
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        
        // Convert Firestore timestamps to ISO strings
        return {
          id: doc.id,
          name: data.name,
          strength: data.strength,
          dosageUnit: data.dosageUnit,
          typicalDosageUnits: data.typicalDosageUnits,
          schedule: data.schedule,
          notes: data.notes,
          startDate: timestampToString(data.startDate),
          imageUrl: data.imageUrl,
          dataAiHint: data.dataAiHint,
          vials: [], // Will be populated below
          doseLogs: [], // Will be populated below
        };
      });
    } catch (error) {
      console.error('Error fetching peptides:', error);
      return [];
    }
  },
  
  async getPeptideWithDetails(peptideId: string): Promise<Peptide | null> {
    try {
      // Get peptide document
      const peptideDoc = await firestore().collection('peptides').doc(peptideId).get();
      
      if (!peptideDoc.exists) {
        return null;
      }
      
      const peptideData = peptideDoc.data();
      
      // Get vials subcollection
      const vialsSnapshot = await peptideDoc.ref.collection('vials').get();
      const vials = vialsSnapshot.docs.map(doc => ({
        id: doc.id,
        isActive: doc.data().isActive,
        initialAmountUnits: doc.data().initialAmountUnits,
        remainingAmountUnits: doc.data().remainingAmountUnits,
        reconstitutionDate: timestampToString(doc.data().reconstitutionDate),
        expirationDate: timestampToString(doc.data().expirationDate),
        bacWaterMl: doc.data().bacWaterMl,
        name: doc.data().name,
        notes: doc.data().notes,
        dateAdded: timestampToString(doc.data().dateAdded),
      }));
      
      // Get dose logs subcollection
      const logsSnapshot = await peptideDoc.ref.collection('doseLogs').orderBy('date').get();
      const doseLogs = logsSnapshot.docs.map(doc => ({
        id: doc.id,
        date: timestampToString(doc.data().date),
        timeOfDay: doc.data().timeOfDay,
        dosage: doc.data().dosage,
        unit: doc.data().unit,
        vialId: doc.data().vialId,
        notes: doc.data().notes,
        reconstructed: doc.data().reconstructed || false,
      }));
      
      return {
        id: peptideId,
        name: peptideData.name,
        strength: peptideData.strength,
        dosageUnit: peptideData.dosageUnit,
        typicalDosageUnits: peptideData.typicalDosageUnits,
        schedule: peptideData.schedule,
        notes: peptideData.notes,
        startDate: timestampToString(peptideData.startDate),
        imageUrl: peptideData.imageUrl,
        dataAiHint: peptideData.dataAiHint,
        vials,
        doseLogs,
      };
    } catch (error) {
      console.error('Error fetching peptide details:', error);
      return null;
    }
  },
  
  async addDoseLog(peptideId: string, dose: Omit<DoseLog, 'id'>): Promise<boolean> {
    try {
      // Get peptide document with vials
      const peptide = await this.getPeptideWithDetails(peptideId);
      if (!peptide) return false;
      
      // Find active vial
      const activeVial = peptide.vials?.find(v => v.isActive);
      if (!activeVial) return false;
      
      // Create dose log
      const newDoseLog = {
        peptideId,
        vialId: activeVial.id,
        date: new Date(dose.date),
        timeOfDay: dose.timeOfDay,
        dosage: dose.dosage,
        unit: dose.unit,
        notes: dose.notes || '',
        createdAt: new Date(),
      };
      
      // Add to doseLogs subcollection
      await firestore()
        .collection('peptides')
        .doc(peptideId)
        .collection('doseLogs')
        .add(newDoseLog);
      
      // Calculate units to deduct
      const amountToDeduct = dose.dosage || 0;
      const typicalDose = peptide.typicalDosageUnits || 300;
      const unitsToDeduct = Math.ceil(amountToDeduct / typicalDose);
      
      // Update vial's remaining amount
      const newRemainingAmount = Math.max(0, activeVial.remainingAmountUnits - unitsToDeduct);
      
      await firestore()
        .collection('peptides')
        .doc(peptideId)
        .collection('vials')
        .doc(activeVial.id)
        .update({
          remainingAmountUnits: newRemainingAmount
        });
      
      // Update used doses count in the main peptide document
      const usedDoses = activeVial.initialAmountUnits - newRemainingAmount;
      
      await firestore()
        .collection('peptides')
        .doc(peptideId)
        .update({
          'activeVial.usedDoses': usedDoses,
          updatedAt: new Date()
        });
      
      return true;
    } catch (error) {
      console.error('Error adding dose log:', error);
      return false;
    }
  },
  
  // Inventory Operations (simplified examples)
  async getInventoryPeptides() {
    try {
      const snapshot = await firestore().collection('peptides').get();
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          num_vials: data.inventory.numVials,
          concentration_per_vial_mcg: data.inventory.concentrationPerVialMcg,
          storage_location: data.inventory.storageLocation,
          expiry_date: timestampToString(data.inventory.expiryDate),
          active_vial_status: data.activeVial.status,
          active_vial_reconstitution_date: timestampToString(data.activeVial.reconstitutionDate),
          active_vial_expiry_date: timestampToString(data.activeVial.expiryDate),
          low_stock_threshold: data.inventory.lowStockThreshold,
          batch_number: `USAGE:${data.activeVial.usedDoses || 0}`,
          bac_water_volume_added: data.activeVial.bacWaterVolumeAdded,
          typical_dose_mcg: data.inventory.typicalDoseMcg,
          created_at: timestampToString(data.createdAt),
          updated_at: timestampToString(data.updatedAt),
        };
      });
    } catch (error) {
      console.error('Error fetching inventory peptides:', error);
      return [];
    }
  },
  
  // More methods...
};
```

### 5. Code Migration Approach

#### Phase 1: Services Layer Replacement

1. Create a new firebase service implementation alongside the existing Supabase service
2. Create abstractions to hide implementation details from UI components
3. Implement specific services for:
   - Peptide management
   - Dose logging
   - Inventory management

#### Phase 2: Dependency Injection for Testing

1. Use a provider pattern to inject either Firebase or Supabase services
2. Example:

```typescript
// src/contexts/DatabaseProvider.tsx
import React, { createContext, useContext } from 'react';
import { supabaseService } from '@/services/supabase';
import { firebaseService } from '@/services/firebase';

// Create unified database interface
export interface DatabaseService {
  getPeptides(): Promise<Peptide[]>;
  getPeptideById(id: string): Promise<Peptide | null>;
  addDoseLog(peptideId: string, dose: Omit<DoseLog, 'id'>): Promise<boolean>;
  // Other methods...
}

// Create context
const DatabaseContext = createContext<DatabaseService>(null);

// Provider component
export const DatabaseProvider: React.FC = ({ children, useMigrated = false }) => {
  // Choose service based on migration state
  const service = useMigrated ? firebaseService : supabaseService;
  
  return (
    <DatabaseContext.Provider value={service}>
      {children}
    </DatabaseContext.Provider>
  );
};

// Hook for components
export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};
```

#### Phase 3: Component Updates

1. Replace direct service imports with context hooks
2. Example:

```typescript
// Before
import { peptideService } from '@/services/peptide.service';

// After
import { useDatabase } from '@/contexts/DatabaseProvider';

// In component
const { getPeptides, addDoseLog } = useDatabase();
```

#### Phase 4: Gradual Rollout

1. Implement feature flags for Firebase migration
2. Test against a subset of users before full rollout
3. Add monitoring for data consistency during migration

### 6. Testing Strategy

1. Create parallel test suites for both implementations
2. Implement automated data validation tests
3. Create a test harness to validate data integrity during migration
4. Test offline behavior for Firebase implementation

### 7. Rollback Plan

1. Keep Supabase running in parallel during migration
2. Implement continuous data synchronization between both databases
3. Maintain the ability to switch back to Supabase
4. Document specific rollback procedures

## Firebase Advantages for PeptidePal

1. **No Schema Concerns**: No more camelCase vs. lowercase issues
2. **Offline Support**: Better experience for users logging doses without internet
3. **Real-time Updates**: Built-in real-time capabilities for multi-device support
4. **Simpler Nested Data**: Better handling of nested structures like vials and dose logs
5. **Built-in Authentication**: Easy to integrate with user accounts
6. **Flexible Indexing**: Create composite indexes for efficient queries
7. **Better Mobile SDK**: Optimized for React Native
8. **Automatic Backups**: Less need for custom backup scripts

## Firebase Limitations to Consider

1. **Query Flexibility**: Less powerful than SQL for complex analytics
2. **Cost Structure**: Different pricing model based on reads/writes
3. **Migration Effort**: Significant code changes required
4. **Learning Curve**: Team needs to learn Firebase best practices

## Recommended Implementation Timeline

1. **Week 1**: Set up Firebase project, finalize data model
2. **Week 2**: Create export/import scripts, test with sample data
3. **Week 3**: Build Firebase service layer, implement dependency injection
4. **Week 4**: Update components, test with real data
5. **Week 5**: Validate and fix issues, QA testing
6. **Week 6**: Gradual rollout to users, monitoring
7. **Week 7-8**: Complete migration, deprecate Supabase services

## Conclusion

Migrating to Firebase offers significant benefits for PeptidePal, particularly in avoiding schema-related issues and improving offline support. The schemaless document model fits well with the application's data requirements.

The migration requires careful planning but can be implemented gradually without disrupting the user experience. With proper abstraction layers, the transition can be made transparent to users while improving reliability and performance.

Start with a proof-of-concept implementation focused on the dose logging functionality, as this is the most critical aspect that had issues in Supabase.