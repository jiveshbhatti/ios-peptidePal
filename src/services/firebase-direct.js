/**
 * Direct Firebase Service
 * 
 * This module provides direct access to Firebase/Firestore services
 * with proper initialization to ensure correct instances are used.
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
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAMnokBM7CVDE265ZLhZROjWrQ5w2DR2P0",
  authDomain: "peptidepal.firebaseapp.com",
  projectId: "peptidepal",
  storageBucket: "peptidepal.appspot.com", 
  messagingSenderId: "229078698562",
  appId: "1:229078698562:web:a3a431131daad253b7fbdb"
};

// Create a unique named app to prevent conflicts
const firebaseApp = initializeApp(firebaseConfig, 'peptidepal-direct-instance');
const firestoreDb = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

// Helper to convert Firestore timestamp to ISO string
const timestampToString = (timestamp) => {
  if (!timestamp) return null;
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toISOString();
  }
  return timestamp;
};

// Firebase service with properly initialized Firestore references
export const firebaseDirectService = {
  async getPeptides() {
    try {
      const peptideSnapshot = await getDocs(collection(firestoreDb, "peptides"));
      
      const peptides = [];
      for (const peptideDoc of peptideSnapshot.docs) {
        const peptideData = peptideDoc.data();
        
        // Get vials subcollection
        const vialsSnapshot = await getDocs(collection(firestoreDb, "peptides", peptideDoc.id, "vials"));
        const vials = vialsSnapshot.docs.map(vialDoc => ({
          id: vialDoc.id,
          ...vialDoc.data(),
          reconstitutionDate: timestampToString(vialDoc.data().reconstitutionDate),
          expirationDate: timestampToString(vialDoc.data().expirationDate),
          dateAdded: timestampToString(vialDoc.data().dateAdded)
        }));
        
        // Get doseLogs subcollection
        const doseLogsSnapshot = await getDocs(
          query(collection(firestoreDb, "peptides", peptideDoc.id, "doseLogs"), orderBy("date"))
        );
        
        const doseLogs = doseLogsSnapshot.docs.map(logDoc => ({
          id: logDoc.id,
          ...logDoc.data(),
          date: timestampToString(logDoc.data().date)
        }));
        
        peptides.push({
          id: peptideDoc.id,
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
      
      return peptides;
    } catch (error) {
      console.error('Error fetching peptides:', error);
      return [];
    }
  },
  
  async getPeptideById(peptideId) {
    try {
      const docRef = doc(firestoreDb, "peptides", peptideId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const peptideData = docSnap.data();
        
        // Get vials subcollection
        const vialsSnapshot = await getDocs(collection(firestoreDb, "peptides", peptideId, "vials"));
        const vials = vialsSnapshot.docs.map(vialDoc => ({
          id: vialDoc.id,
          ...vialDoc.data(),
          reconstitutionDate: timestampToString(vialDoc.data().reconstitutionDate),
          expirationDate: timestampToString(vialDoc.data().expirationDate),
          dateAdded: timestampToString(vialDoc.data().dateAdded)
        }));
        
        // Get doseLogs subcollection
        const doseLogsSnapshot = await getDocs(
          query(collection(firestoreDb, "peptides", peptideId, "doseLogs"), orderBy("date"))
        );
        
        const doseLogs = doseLogsSnapshot.docs.map(logDoc => ({
          id: logDoc.id,
          ...logDoc.data(),
          date: timestampToString(logDoc.data().date)
        }));
        
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
        return null;
      }
    } catch (error) {
      console.error('Error fetching peptide:', error);
      return null;
    }
  },
  
  async addDoseLog(peptideId, doseLog) {
    try {
      // Get the peptide document
      const peptideRef = doc(firestoreDb, "peptides", peptideId);
      const peptideDoc = await getDoc(peptideRef);
      
      if (!peptideDoc.exists()) {
        throw new Error(`Peptide ${peptideId} not found`);
      }
      
      // Add to doseLogs collection
      const doseLogRef = await addDoc(collection(firestoreDb, "peptides", peptideId, "doseLogs"), {
        ...doseLog,
        timestamp: serverTimestamp()
      });
      
      return doseLogRef.id;
    } catch (error) {
      console.error('Error adding dose log:', error);
      throw error;
    }
  },

  async getInventoryPeptides() {
    try {
      const inventorySnapshot = await getDocs(collection(firestoreDb, "inventory_peptides"));
      
      return inventorySnapshot.docs.map(doc => {
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
    } catch (error) {
      console.error('Error fetching inventory peptides:', error);
      return [];
    }
  },
  
  async getInventoryBacWater() {
    try {
      const snapshot = await getDocs(collection(firestoreDb, "inventory_bac_water"));
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        expiry_date: timestampToString(doc.data().expiry_date),
        created_at: timestampToString(doc.data().created_at),
        updated_at: timestampToString(doc.data().updated_at),
      }));
    } catch (error) {
      console.error('Error fetching bac water inventory:', error);
      return [];
    }
  },
  
  async getInventorySyringes() {
    try {
      const snapshot = await getDocs(collection(firestoreDb, "inventory_syringes"));
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        expiry_date: timestampToString(doc.data().expiry_date),
        created_at: timestampToString(doc.data().created_at),
        updated_at: timestampToString(doc.data().updated_at),
      }));
    } catch (error) {
      console.error('Error fetching syringes inventory:', error);
      return [];
    }
  },
  
  async getInventoryOtherItems() {
    try {
      const snapshot = await getDocs(collection(firestoreDb, "inventory_other_items"));
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        expiry_date: timestampToString(doc.data().expiry_date),
        created_at: timestampToString(doc.data().created_at),
        updated_at: timestampToString(doc.data().updated_at),
      }));
    } catch (error) {
      console.error('Error fetching other items inventory:', error);
      return [];
    }
  }
};

// Export the initialized Firebase instances
export { firebaseApp, firestoreDb, storage };