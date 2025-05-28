/**
 * Firebase Real-time Service
 * 
 * This module provides real-time Firebase/Firestore services with proper subscriptions
 * instead of polling, improving performance and reducing unnecessary reads.
 */
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy,
  serverTimestamp,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { firestoreDb } from './firebase-wrapper';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
import type { Peptide, DoseLog, Vial } from '../types/peptide';
import type { 
  InventoryPeptide, 
  InventoryBacWater, 
  InventorySyringe, 
  InventoryOtherItem 
} from '../types/inventory';

// Cache keys for offline support
const CACHE_KEYS = {
  PEPTIDES: 'cached_peptides',
  INVENTORY_PEPTIDES: 'cached_inventory_peptides',
  INVENTORY_BAC_WATER: 'cached_inventory_bac_water',
  INVENTORY_SYRINGES: 'cached_inventory_syringes',
  INVENTORY_OTHER_ITEMS: 'cached_inventory_other_items'
};

// Helper to convert Firestore timestamp to ISO string
const timestampToString = (timestamp: any): string | null => {
  if (!timestamp) return null;
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toISOString();
  }
  return timestamp;
};

// Helper to save data to cache
const saveToCache = async (key: string, data: any) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to cache:', error);
  }
};

// Helper to load data from cache
const loadFromCache = async (key: string): Promise<any | null> => {
  try {
    const cached = await AsyncStorage.getItem(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Error loading from cache:', error);
    return null;
  }
};

class FirebaseRealtimeService {
  // Active subscriptions
  private subscriptions: Map<string, Unsubscribe> = new Map();
  
  // Subscribe to peptides collection with real-time updates
  subscribeToPeptides(callback: (peptides: Peptide[]) => void): Unsubscribe {
    // Unsubscribe from any existing subscription
    this.unsubscribePeptides();
    
    // Load cached data immediately
    loadFromCache(CACHE_KEYS.PEPTIDES).then(cached => {
      if (cached) {
        callback(cached);
      }
    });
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(
      collection(firestoreDb, 'peptides'),
      async (snapshot) => {
        const peptides: Peptide[] = [];
        
        for (const peptideDoc of snapshot.docs) {
          const peptideData = peptideDoc.data();
          const peptideId = peptideDoc.id;
          
          // Get vials subcollection
          const vialsSnapshot = await getDocs(
            collection(firestoreDb, 'peptides', peptideId, 'vials')
          );
          const vials: Vial[] = vialsSnapshot.docs.map(vialDoc => ({
            id: vialDoc.id,
            ...vialDoc.data(),
            reconstitutionDate: timestampToString(vialDoc.data().reconstitutionDate),
            expirationDate: timestampToString(vialDoc.data().expirationDate),
            dateAdded: timestampToString(vialDoc.data().dateAdded)
          } as Vial));
          
          // Get doseLogs subcollection
          const doseLogsSnapshot = await getDocs(
            query(
              collection(firestoreDb, 'peptides', peptideId, 'doseLogs'), 
              orderBy('date', 'desc')
            )
          );
          const doseLogs: DoseLog[] = doseLogsSnapshot.docs.map(logDoc => ({
            id: logDoc.id,
            ...logDoc.data(),
            date: timestampToString(logDoc.data().date)
          } as DoseLog));
          
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
          } as Peptide);
        }
        
        // Save to cache for offline support
        await saveToCache(CACHE_KEYS.PEPTIDES, peptides);
        
        // Notify callback
        callback(peptides);
      },
      (error) => {
        console.error('Peptides subscription error:', error);
        // Fall back to cached data on error
        loadFromCache(CACHE_KEYS.PEPTIDES).then(cached => {
          if (cached) {
            callback(cached);
          }
        });
      }
    );
    
    // Store unsubscribe function
    this.subscriptions.set('peptides', unsubscribe);
    
    return unsubscribe;
  }
  
  // Unsubscribe from peptides
  unsubscribePeptides() {
    const unsubscribe = this.subscriptions.get('peptides');
    if (unsubscribe) {
      unsubscribe();
      this.subscriptions.delete('peptides');
    }
  }
  
  // Subscribe to inventory peptides
  subscribeToInventoryPeptides(callback: (items: InventoryPeptide[]) => void): Unsubscribe {
    const unsubscribe = onSnapshot(
      collection(firestoreDb, 'inventory_peptides'),
      async (snapshot) => {
        const items = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            created_at: timestampToString(data.created_at),
            updated_at: timestampToString(data.updated_at),
            expiry_date: timestampToString(data.expiry_date),
            active_vial_reconstitution_date: timestampToString(data.active_vial_reconstitution_date),
            active_vial_expiry_date: timestampToString(data.active_vial_expiry_date),
            active_vial_status: data.active_vial_status || 'NONE' // Ensure this field is included
          } as InventoryPeptide;
        });
        
        await saveToCache(CACHE_KEYS.INVENTORY_PEPTIDES, items);
        callback(items);
      },
      (error) => {
        console.error('Inventory peptides subscription error:', error);
        loadFromCache(CACHE_KEYS.INVENTORY_PEPTIDES).then(cached => {
          if (cached) callback(cached);
        });
      }
    );
    
    this.subscriptions.set('inventory_peptides', unsubscribe);
    return unsubscribe;
  }
  
  // Subscribe to all inventory collections
  subscribeToAllInventory(callbacks: {
    onPeptides?: (items: InventoryPeptide[]) => void;
    onBacWater?: (items: InventoryBacWater[]) => void;
    onSyringes?: (items: InventorySyringe[]) => void;
    onOtherItems?: (items: InventoryOtherItem[]) => void;
  }): () => void {
    const unsubscribes: Unsubscribe[] = [];
    
    if (callbacks.onPeptides) {
      unsubscribes.push(this.subscribeToInventoryPeptides(callbacks.onPeptides));
    }
    
    if (callbacks.onBacWater) {
      const unsubscribe = onSnapshot(
        collection(firestoreDb, 'inventory_bac_water'),
        async (snapshot) => {
          const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as InventoryBacWater));
          await saveToCache(CACHE_KEYS.INVENTORY_BAC_WATER, items);
          callbacks.onBacWater!(items);
        }
      );
      unsubscribes.push(unsubscribe);
    }
    
    if (callbacks.onSyringes) {
      const unsubscribe = onSnapshot(
        collection(firestoreDb, 'inventory_syringes'),
        async (snapshot) => {
          const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as InventorySyringe));
          await saveToCache(CACHE_KEYS.INVENTORY_SYRINGES, items);
          callbacks.onSyringes!(items);
        }
      );
      unsubscribes.push(unsubscribe);
    }
    
    if (callbacks.onOtherItems) {
      const unsubscribe = onSnapshot(
        collection(firestoreDb, 'inventory_other_items'),
        async (snapshot) => {
          const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as InventoryOtherItem));
          await saveToCache(CACHE_KEYS.INVENTORY_OTHER_ITEMS, items);
          callbacks.onOtherItems!(items);
        }
      );
      unsubscribes.push(unsubscribe);
    }
    
    // Return cleanup function
    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }
  
  // Get peptides with offline support (one-time fetch)
  async getPeptides(): Promise<Peptide[]> {
    try {
      const snapshot = await getDocs(collection(firestoreDb, 'peptides'));
      const peptides: Peptide[] = [];
      
      for (const peptideDoc of snapshot.docs) {
        const peptideData = peptideDoc.data();
        const peptideId = peptideDoc.id;
        
        // Get subcollections...
        const vialsSnapshot = await getDocs(
          collection(firestoreDb, 'peptides', peptideId, 'vials')
        );
        const vials = vialsSnapshot.docs.map(vialDoc => ({
          id: vialDoc.id,
          ...vialDoc.data(),
          reconstitutionDate: timestampToString(vialDoc.data().reconstitutionDate),
          expirationDate: timestampToString(vialDoc.data().expirationDate),
          dateAdded: timestampToString(vialDoc.data().dateAdded)
        } as Vial));
        
        const doseLogsSnapshot = await getDocs(
          query(
            collection(firestoreDb, 'peptides', peptideId, 'doseLogs'), 
            orderBy('date', 'desc')
          )
        );
        const doseLogs = doseLogsSnapshot.docs.map(logDoc => ({
          id: logDoc.id,
          ...logDoc.data(),
          date: timestampToString(logDoc.data().date)
        } as DoseLog));
        
        peptides.push({
          id: peptideId,
          ...peptideData,
          startDate: timestampToString(peptideData.startDate),
          vials,
          doseLogs
        } as Peptide);
      }
      
      await saveToCache(CACHE_KEYS.PEPTIDES, peptides);
      return peptides;
    } catch (error) {
      console.error('Error fetching peptides:', error);
      // Try to return cached data
      const cached = await loadFromCache(CACHE_KEYS.PEPTIDES);
      return cached || [];
    }
  }
  
  // Add a dose log with vial reconstitution details
  async addDoseLog(peptideId: string, doseLog: Omit<DoseLog, 'id'>, vialReconstitutionDetails?: {
    reconstitutionBacWaterMl?: number;
    concentration?: number;
  }): Promise<string | null> {
    try {
      // Add dose log to subcollection
      const doseLogRef = await addDoc(
        collection(firestoreDb, 'peptides', peptideId, 'doseLogs'),
        {
          ...doseLog,
          date: new Date(doseLog.date),
          timestamp: serverTimestamp()
        }
      );
      
      // If vial reconstitution details provided, update the vial
      if (vialReconstitutionDetails && doseLog.vialId) {
        const vialRef = doc(firestoreDb, 'peptides', peptideId, 'vials', doseLog.vialId);
        await updateDoc(vialRef, {
          reconstitutionBacWaterMl: vialReconstitutionDetails.reconstitutionBacWaterMl,
          concentration: vialReconstitutionDetails.concentration,
          updatedAt: serverTimestamp()
        });
      }
      
      return doseLogRef.id;
    } catch (error) {
      console.error('Error adding dose log:', error);
      return null;
    }
  }
  
  // Clean up all subscriptions
  cleanup() {
    this.subscriptions.forEach((unsubscribe) => unsubscribe());
    this.subscriptions.clear();
  }
}

// Export singleton instance
export const firebaseRealtimeService = new FirebaseRealtimeService();
export default firebaseRealtimeService;