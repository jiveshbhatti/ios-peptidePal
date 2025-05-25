/**
 * Firebase Configuration
 * Use this configuration in your PeptidePal app
 */
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs,
  doc,
  getDoc,
  setDoc, 
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';

// For development only - enables App Check debug mode
if (typeof self !== 'undefined') {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
} else if (typeof global !== 'undefined') {
  global.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

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
// Use a unique name for the app to prevent conflicts with other initializations
const app = initializeApp(firebaseConfig, 'peptidepal-main-instance');
// Initialize Firestore with the app
const db = getFirestore(app);

// Export Firebase instances
export { app, db };

// Export Firestore functions
export {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  serverTimestamp
};

/**
 * Firestore service for PeptidePal
 */
export const firebaseService = {
  // Peptides
  async getPeptides() {
    try {
      const querySnapshot = await getDocs(collection(db, "peptides"));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching peptides:', error);
      return [];
    }
  },
  
  async getPeptideById(peptideId) {
    try {
      const docRef = doc(db, "peptides", peptideId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
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
      const peptideRef = doc(db, "peptides", peptideId);
      const peptideDoc = await getDoc(peptideRef);
      
      if (!peptideDoc.exists()) {
        throw new Error(`Peptide ${peptideId} not found`);
      }
      
      // Add to doseLogs collection
      const doseLogRef = await addDoc(collection(db, "peptides", peptideId, "doseLogs"), {
        ...doseLog,
        timestamp: serverTimestamp()
      });
      
      return doseLogRef.id;
    } catch (error) {
      console.error('Error adding dose log:', error);
      throw error;
    }
  },
  
  // Add more methods as needed based on your app requirements
};

export default firebaseService;