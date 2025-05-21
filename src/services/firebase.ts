import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc, setDoc, addDoc, updateDoc, query, where, orderBy } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAMnokBM7CVDE265ZLhZROjWrQ5w2DR2P0",
  authDomain: "peptidepal.firebaseapp.com",
  projectId: "peptidepal", 
  storageBucket: "peptidepal.firebasestorage.app",
  messagingSenderId: "229078698562",
  appId: "1:229078698562:web:a3a431131daad253b7fbdb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Helper to convert Firestore timestamp to ISO string
const timestampToString = (timestamp: any) => {
  if (!timestamp) return null;
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toISOString();
  }
  return timestamp;
};

// Define the Firebase service with methods similar to the existing Supabase services
export const firebaseService = {
  // Peptide Operations
  async getPeptides() {
    try {
      const peptideSnapshot = await getDocs(collection(db, "peptides"));
      
      const peptides = [];
      for (const peptideDoc of peptideSnapshot.docs) {
        const peptideData = peptideDoc.data();
        
        // Get vials subcollection
        const vialsSnapshot = await getDocs(collection(peptideDoc.ref, "vials"));
        const vials = vialsSnapshot.docs.map(vialDoc => ({
          id: vialDoc.id,
          ...vialDoc.data(),
          reconstitutionDate: timestampToString(vialDoc.data().reconstitutionDate),
          expirationDate: timestampToString(vialDoc.data().expirationDate),
          dateAdded: timestampToString(vialDoc.data().dateAdded)
        }));
        
        // Get doseLogs subcollection
        const doseLogsSnapshot = await getDocs(
          query(collection(peptideDoc.ref, "doseLogs"), orderBy("date"))
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
  
  async getPeptideById(peptideId: string) {
    try {
      const peptideDoc = await getDoc(doc(db, "peptides", peptideId));
      
      if (!peptideDoc.exists()) {
        return null;
      }
      
      const peptideData = peptideDoc.data();
      
      // Get vials subcollection
      const vialsSnapshot = await getDocs(collection(peptideDoc.ref, "vials"));
      const vials = vialsSnapshot.docs.map(vialDoc => ({
        id: vialDoc.id,
        ...vialDoc.data(),
        reconstitutionDate: timestampToString(vialDoc.data().reconstitutionDate),
        expirationDate: timestampToString(vialDoc.data().expirationDate),
        dateAdded: timestampToString(vialDoc.data().dateAdded)
      }));
      
      // Get doseLogs subcollection
      const doseLogsSnapshot = await getDocs(
        query(collection(peptideDoc.ref, "doseLogs"), orderBy("date"))
      );
      
      const doseLogs = doseLogsSnapshot.docs.map(logDoc => ({
        id: logDoc.id,
        ...logDoc.data(),
        date: timestampToString(logDoc.data().date)
      }));
      
      return {
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
      };
    } catch (error) {
      console.error('Error fetching peptide details:', error);
      return null;
    }
  },
  
  async addDoseLog(peptideId: string, dose: any) {
    try {
      // Get peptide document with vials
      const peptideDoc = await getDoc(doc(db, "peptides", peptideId));
      if (!peptideDoc.exists()) return false;
      
      const peptideData = peptideDoc.data();
      
      // Get vials subcollection to find active vial
      const vialsSnapshot = await getDocs(collection(peptideDoc.ref, "vials"));
      const vials = vialsSnapshot.docs.map(vialDoc => ({
        id: vialDoc.id,
        ...vialDoc.data()
      }));
      
      // Find active vial
      const activeVial = vials.find(v => v.isActive);
      if (!activeVial) return false;
      
      // Create dose log
      const newDoseLog = {
        peptideId,
        vialId: activeVial.id,
        date: new Date(dose.date),
        timeOfDay: dose.timeOfDay,
        dosage: dose.dosage,
        unit: dose.unit || peptideData.dosageUnit,
        notes: dose.notes || '',
        createdAt: new Date(),
      };
      
      // Add to doseLogs subcollection
      const logDocRef = await addDoc(
        collection(doc(db, "peptides", peptideId), "doseLogs"), 
        newDoseLog
      );
      
      // Calculate units to deduct
      const amountToDeduct = dose.dosage || 0;
      const typicalDose = peptideData.typicalDosageUnits || 300;
      const unitsToDeduct = Math.ceil(amountToDeduct / typicalDose);
      
      // Update vial's remaining amount
      const newRemainingAmount = Math.max(0, activeVial.remainingAmountUnits - unitsToDeduct);
      
      await updateDoc(
        doc(db, "peptides", peptideId, "vials", activeVial.id), 
        {
          remainingAmountUnits: newRemainingAmount
        }
      );
      
      // Update used doses count in the main peptide document
      const usedDoses = activeVial.initialAmountUnits - newRemainingAmount;
      
      await updateDoc(
        doc(db, "peptides", peptideId), 
        {
          'activeVial.usedDoses': usedDoses,
          updatedAt: new Date()
        }
      );
      
      return true;
    } catch (error) {
      console.error('Error adding dose log:', error);
      return false;
    }
  },
  
  async getInventoryPeptides() {
    try {
      const peptideSnapshot = await getDocs(collection(db, "peptides"));
      
      return peptideSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          num_vials: data.inventory?.numVials || 0,
          concentration_per_vial_mcg: data.inventory?.concentrationPerVialMcg || 0,
          storage_location: data.inventory?.storageLocation || '',
          expiry_date: timestampToString(data.inventory?.expiryDate),
          active_vial_status: data.activeVial?.status || 'NONE',
          active_vial_reconstitution_date: timestampToString(data.activeVial?.reconstitutionDate),
          active_vial_expiry_date: timestampToString(data.activeVial?.expiryDate),
          low_stock_threshold: data.inventory?.lowStockThreshold || 2,
          batch_number: `USAGE:${data.activeVial?.usedDoses || 0}`,
          bac_water_volume_added: data.activeVial?.bacWaterVolumeAdded || 0,
          typical_dose_mcg: data.inventory?.typicalDoseMcg || 0,
          created_at: timestampToString(data.createdAt),
          updated_at: timestampToString(data.updatedAt),
        };
      });
    } catch (error) {
      console.error('Error fetching inventory peptides:', error);
      return [];
    }
  },
  
  // More methods to be implemented as needed
};

export default firebaseService;