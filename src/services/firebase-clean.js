/**
 * Firebase Clean Implementation
 * 
 * This is a completely fresh implementation of the Firebase service
 * with no dependencies on other Firebase files in the project.
 */
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

// DEBUG FLAG - when true, logs all Firestore operations
const DEBUG_FIREBASE = true;

// COLLECTION NAMES - these are the exact collection names in Firestore
const COLLECTION = {
  PEPTIDES: 'peptides',
  INVENTORY_PEPTIDES: 'inventory_peptides',
  INVENTORY_BAC_WATER: 'inventory_bac_water',
  INVENTORY_SYRINGES: 'inventory_syringes',
  INVENTORY_OTHER_ITEMS: 'inventory_other_items'
};

// SUBCOLLECTION NAMES - important for case-sensitivity
const SUBCOLLECTION = {
  VIALS: 'vials',
  DOSE_LOGS: 'doseLogs'  // Note: camelCase is correct based on inspection!
};

// Firebase configuration - copied directly from Firebase console
const firebaseConfig = {
  apiKey: "AIzaSyAMnokBM7CVDE265ZLhZROjWrQ5w2DR2P0",
  authDomain: "peptidepal.firebaseapp.com",
  projectId: "peptidepal",
  storageBucket: "peptidepal.appspot.com", 
  messagingSenderId: "229078698562",
  appId: "1:229078698562:web:a3a431131daad253b7fbdb"
};

// Create a fresh Firebase app instance with a unique name
const firebaseAppClean = initializeApp(firebaseConfig, 'peptidepal-clean-instance');

// Get a fresh Firestore instance
const firestoreDbClean = getFirestore(firebaseAppClean);

// Log the initialization
if (DEBUG_FIREBASE) {
  console.log('=== CLEAN FIREBASE INITIALIZED ===');
  console.log(`App name: peptidepal-clean-instance`);
  console.log(`Project ID: ${firebaseConfig.projectId}`);
  console.log('=================================');
}

// Helper to convert Firestore timestamp to ISO string
const timestampToString = (timestamp) => {
  if (!timestamp) return null;
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toISOString();
  }
  return timestamp;
};

// Firebase service with properly initialized Firestore references
const firebaseCleanService = {
  // Debug log helper
  _log(operation, path, result) {
    if (DEBUG_FIREBASE) {
      console.log(`[Firebase Clean] ${operation} ${path}: ${result ? 'SUCCESS' : 'FAILED'}`);
    }
  },
  
  async getPeptides() {
    try {
      if (DEBUG_FIREBASE) console.log('[Firebase Clean] Getting all peptides...');
      
      // Explicitly use our clean Firestore instance
      const peptideCollection = collection(firestoreDbClean, COLLECTION.PEPTIDES);
      const peptideSnapshot = await getDocs(peptideCollection);
      
      const peptides = [];
      for (const peptideDoc of peptideSnapshot.docs) {
        const peptideData = peptideDoc.data();
        const peptideId = peptideDoc.id;
        
        // Get vials subcollection
        const vialsCollection = collection(firestoreDbClean, COLLECTION.PEPTIDES, peptideId, SUBCOLLECTION.VIALS);
        const vialsSnapshot = await getDocs(vialsCollection);
        
        const vials = vialsSnapshot.docs.map(vialDoc => ({
          id: vialDoc.id,
          ...vialDoc.data(),
          reconstitutionDate: timestampToString(vialDoc.data().reconstitutionDate),
          expirationDate: timestampToString(vialDoc.data().expirationDate),
          dateAdded: timestampToString(vialDoc.data().dateAdded)
        }));
        
        // Get doseLogs subcollection - use camelCase as verified in inspection
        const doseLogsCollection = collection(firestoreDbClean, COLLECTION.PEPTIDES, peptideId, SUBCOLLECTION.DOSE_LOGS);
        const doseLogsQuery = query(doseLogsCollection, orderBy("date"));
        const doseLogsSnapshot = await getDocs(doseLogsQuery);
        
        const doseLogs = doseLogsSnapshot.docs.map(logDoc => ({
          id: logDoc.id,
          ...logDoc.data(),
          date: timestampToString(logDoc.data().date)
        }));
        
        peptides.push({
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
          doseLogs
        });
      }
      
      this._log('getPeptides', COLLECTION.PEPTIDES + '/*', true);
      return peptides;
    } catch (error) {
      console.error('[Firebase Clean] Error fetching peptides:', error);
      this._log('getPeptides', COLLECTION.PEPTIDES + '/*', false);
      return [];
    }
  },
  
  async getPeptideById(peptideId) {
    try {
      if (DEBUG_FIREBASE) console.log(`[Firebase Clean] Getting peptide ${peptideId}...`);
      
      const docRef = doc(firestoreDbClean, COLLECTION.PEPTIDES, peptideId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const peptideData = docSnap.data();
        
        // Get vials subcollection
        const vialsCollection = collection(firestoreDbClean, COLLECTION.PEPTIDES, peptideId, SUBCOLLECTION.VIALS);
        const vialsSnapshot = await getDocs(vialsCollection);
        
        const vials = vialsSnapshot.docs.map(vialDoc => ({
          id: vialDoc.id,
          ...vialDoc.data(),
          reconstitutionDate: timestampToString(vialDoc.data().reconstitutionDate),
          expirationDate: timestampToString(vialDoc.data().expirationDate),
          dateAdded: timestampToString(vialDoc.data().dateAdded)
        }));
        
        // Get doseLogs subcollection - use camelCase as verified in inspection
        const doseLogsCollection = collection(firestoreDbClean, COLLECTION.PEPTIDES, peptideId, SUBCOLLECTION.DOSE_LOGS);
        const doseLogsQuery = query(doseLogsCollection, orderBy("date"));
        const doseLogsSnapshot = await getDocs(doseLogsQuery);
        
        const doseLogs = doseLogsSnapshot.docs.map(logDoc => ({
          id: logDoc.id,
          ...logDoc.data(),
          date: timestampToString(logDoc.data().date)
        }));
        
        this._log('getPeptideById', `${COLLECTION.PEPTIDES}/${peptideId}`, true);
        return {
          id: docSnap.id,
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
          doseLogs
        };
      } else {
        this._log('getPeptideById', `${COLLECTION.PEPTIDES}/${peptideId}`, false);
        return null;
      }
    } catch (error) {
      console.error(`[Firebase Clean] Error fetching peptide ${peptideId}:`, error);
      this._log('getPeptideById', `${COLLECTION.PEPTIDES}/${peptideId}`, false);
      return null;
    }
  },
  
  async addDoseLog(peptideId, doseLog) {
    try {
      if (DEBUG_FIREBASE) console.log(`[Firebase Clean] Adding dose log to peptide ${peptideId}...`);
      
      // Get the peptide document
      const peptideRef = doc(firestoreDbClean, COLLECTION.PEPTIDES, peptideId);
      const peptideDoc = await getDoc(peptideRef);
      
      if (!peptideDoc.exists()) {
        throw new Error(`Peptide ${peptideId} not found`);
      }
      
      // Add to doseLogs collection - use camelCase as verified in inspection
      const doseLogsCollection = collection(firestoreDbClean, COLLECTION.PEPTIDES, peptideId, SUBCOLLECTION.DOSE_LOGS);
      const doseLogRef = await addDoc(doseLogsCollection, {
        ...doseLog,
        timestamp: serverTimestamp()
      });
      
      this._log('addDoseLog', `${COLLECTION.PEPTIDES}/${peptideId}/${SUBCOLLECTION.DOSE_LOGS}/*`, true);
      return doseLogRef.id;
    } catch (error) {
      console.error(`[Firebase Clean] Error adding dose log to peptide ${peptideId}:`, error);
      this._log('addDoseLog', `${COLLECTION.PEPTIDES}/${peptideId}/${SUBCOLLECTION.DOSE_LOGS}/*`, false);
      throw error;
    }
  },

  async getInventoryPeptides() {
    try {
      if (DEBUG_FIREBASE) console.log('[Firebase Clean] Getting inventory peptides...');
      
      const inventoryCollection = collection(firestoreDbClean, COLLECTION.INVENTORY_PEPTIDES);
      const inventorySnapshot = await getDocs(inventoryCollection);
      
      const result = inventorySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          num_vials: data.num_vials || 0,
          concentration_per_vial_mcg: data.concentration_per_vial_mcg || 0,
          storage_location: data.storage_location || '',
          expiry_date: timestampToString(data.expiry_date),
          active_vial_status: data.active_vial_status || 'NONE',
          active_vial_reconstitution_date: timestampToString(data.active_vial_reconstitution_date),
          active_vial_expiry_date: timestampToString(data.active_vial_expiry_date),
          low_stock_threshold: data.low_stock_threshold || 2,
          batch_number: data.batch_number || '',
          bac_water_volume_added: data.bac_water_volume_added || 0,
          typical_dose_mcg: data.typical_dose_mcg || 0,
          created_at: timestampToString(data.created_at),
          updated_at: timestampToString(data.updated_at),
        };
      });
      
      this._log('getInventoryPeptides', COLLECTION.INVENTORY_PEPTIDES + '/*', true);
      return result;
    } catch (error) {
      console.error('[Firebase Clean] Error fetching inventory peptides:', error);
      this._log('getInventoryPeptides', COLLECTION.INVENTORY_PEPTIDES + '/*', false);
      return [];
    }
  },
  
  async getInventoryBacWater() {
    try {
      if (DEBUG_FIREBASE) console.log('[Firebase Clean] Getting bac water inventory...');
      
      const snapshot = await getDocs(collection(firestoreDbClean, COLLECTION.INVENTORY_BAC_WATER));
      
      const result = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        expiry_date: timestampToString(doc.data().expiry_date),
        created_at: timestampToString(doc.data().created_at),
        updated_at: timestampToString(doc.data().updated_at),
      }));
      
      this._log('getInventoryBacWater', COLLECTION.INVENTORY_BAC_WATER + '/*', true);
      return result;
    } catch (error) {
      console.error('[Firebase Clean] Error fetching bac water inventory:', error);
      this._log('getInventoryBacWater', COLLECTION.INVENTORY_BAC_WATER + '/*', false);
      return [];
    }
  },
  
  async getInventorySyringes() {
    try {
      if (DEBUG_FIREBASE) console.log('[Firebase Clean] Getting syringes inventory...');
      
      const snapshot = await getDocs(collection(firestoreDbClean, COLLECTION.INVENTORY_SYRINGES));
      
      const result = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        expiry_date: timestampToString(doc.data().expiry_date),
        created_at: timestampToString(doc.data().created_at),
        updated_at: timestampToString(doc.data().updated_at),
      }));
      
      this._log('getInventorySyringes', COLLECTION.INVENTORY_SYRINGES + '/*', true);
      return result;
    } catch (error) {
      console.error('[Firebase Clean] Error fetching syringes inventory:', error);
      this._log('getInventorySyringes', COLLECTION.INVENTORY_SYRINGES + '/*', false);
      return [];
    }
  },
  
  async getInventoryOtherItems() {
    try {
      if (DEBUG_FIREBASE) console.log('[Firebase Clean] Getting other items inventory...');
      
      const snapshot = await getDocs(collection(firestoreDbClean, COLLECTION.INVENTORY_OTHER_ITEMS));
      
      const result = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        expiry_date: timestampToString(doc.data().expiry_date),
        created_at: timestampToString(doc.data().created_at),
        updated_at: timestampToString(doc.data().updated_at),
      }));
      
      this._log('getInventoryOtherItems', COLLECTION.INVENTORY_OTHER_ITEMS + '/*', true);
      return result;
    } catch (error) {
      console.error('[Firebase Clean] Error fetching other items inventory:', error);
      this._log('getInventoryOtherItems', COLLECTION.INVENTORY_OTHER_ITEMS + '/*', false);
      return [];
    }
  }
};

// Export clean Firebase instances
export { firebaseAppClean, firestoreDbClean, firebaseCleanService };

// Export default clean service
export default firebaseCleanService;