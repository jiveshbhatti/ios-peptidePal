import AsyncStorage from '@react-native-async-storage/async-storage';
import { Peptide } from '@/types/peptide';
import { InventoryPeptide } from '@/types/inventory';

const STORAGE_KEYS = {
  PEPTIDES: '@PeptidePal:peptides',
  INVENTORY_PEPTIDES: '@PeptidePal:inventoryPeptides',
};

// Peptide storage
export async function storePeptides(peptides: Peptide[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.PEPTIDES, JSON.stringify(peptides));
  } catch (error) {
    console.error('Error storing peptides:', error);
  }
}

export async function getStoredPeptides(): Promise<Peptide[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.PEPTIDES);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error retrieving peptides:', error);
    return [];
  }
}

// Inventory peptide storage
export async function storeInventoryPeptides(
  peptides: InventoryPeptide[]
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.INVENTORY_PEPTIDES,
      JSON.stringify(peptides)
    );
  } catch (error) {
    console.error('Error storing inventory peptides:', error);
  }
}

export async function getStoredInventoryPeptides(): Promise<InventoryPeptide[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.INVENTORY_PEPTIDES);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error retrieving inventory peptides:', error);
    return [];
  }
}

// Clear all storage
export async function clearStorage(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
}