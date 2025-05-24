import { Timestamp } from 'firebase/firestore';
import type { PeptideSchedule, Vial, DoseLog } from './peptide'; // Reusing existing detailed types

// Firestore document for the 'peptides' collection
export interface PeptideDocument {
  id: string; // Firestore Document ID
  name: string;
  strength?: string;
  dosageUnit?: string;
  typicalDosageUnits?: number;
  schedule: PeptideSchedule; // Reusing existing type
  vials: Vial[]; // Reusing existing type
  doseLogs?: DoseLog[]; // Reusing existing type, optional as it might not exist initially
  imageUrl?: string;
  dataAiHint?: string;
  notes?: string;
  startDate?: Timestamp; // Firebase Timestamp
  // Firestore timestamps for tracking creation and updates
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Firestore document for the 'inventory_peptides' collection
export interface InventoryPeptideDocument {
  id: string; // Firestore Document ID
  name: string;
  num_vials: number;
  concentration_per_vial_mcg?: number;
  storage_location?: string;
  expiry_date?: Timestamp; // Firebase Timestamp
  active_vial_expiry_date?: Timestamp; // Firebase Timestamp
  active_vial_reconstitution_date?: Timestamp; // Firebase Timestamp
  active_vial_status: 'NONE' | 'IN_USE' | 'FINISHED' | 'DISCARDED';
  low_stock_threshold?: number;
  batch_number?: string;
  bac_water_volume_added?: number;
  typical_dose_mcg?: number;
  created_at: Timestamp; // Firebase Timestamp
  updated_at: Timestamp; // Firebase Timestamp
}

// Firestore document for the 'inventory_bac_water' collection
export interface InventoryBacWaterDocument {
  id: string; // Firestore Document ID
  volume_ml_per_bottle?: number;
  num_bottles: number;
  expiry_date?: Timestamp; // Firebase Timestamp
  created_at: Timestamp; // Firebase Timestamp
  updated_at: Timestamp; // Firebase Timestamp
}

// Firestore document for the 'inventory_syringes' collection
export interface InventorySyringeDocument {
  id: string; // Firestore Document ID
  type_size?: string;
  quantity: number;
  brand?: string;
  created_at: Timestamp; // Firebase Timestamp
  updated_at: Timestamp; // Firebase Timestamp
}

// Firestore document for the 'inventory_other_items' collection
export interface InventoryOtherItemDocument {
  id: string; // Firestore Document ID
  item_name: string;
  description?: string;
  quantity: number;
  notes?: string;
  created_at: Timestamp; // Firebase Timestamp
  updated_at: Timestamp; // Firebase Timestamp
}

// Types for creating new documents, omitting auto-generated fields
export type NewPeptideDocument = Omit<PeptideDocument, 'id'>;
export type NewInventoryPeptideDocument = Omit<InventoryPeptideDocument, 'id' | 'created_at' | 'updated_at'>;
export type NewInventoryBacWaterDocument = Omit<InventoryBacWaterDocument, 'id' | 'created_at' | 'updated_at'>;
export type NewInventorySyringeDocument = Omit<InventorySyringeDocument, 'id' | 'created_at' | 'updated_at'>;
export type NewInventoryOtherItemDocument = Omit<InventoryOtherItemDocument, 'id' | 'created_at' | 'updated_at'>;

// Types for updates (partial updates with known ID)
export type UpdatePeptideDocument = Partial<Omit<PeptideDocument, 'id'>>;
export type UpdateInventoryPeptideDocument = Partial<Omit<InventoryPeptideDocument, 'id' | 'created_at' | 'updated_at'>>;
export type UpdateInventoryBacWaterDocument = Partial<Omit<InventoryBacWaterDocument, 'id' | 'created_at' | 'updated_at'>>;
export type UpdateInventorySyringeDocument = Partial<Omit<InventorySyringeDocument, 'id' | 'created_at' | 'updated_at'>>;
export type UpdateInventoryOtherItemDocument = Partial<Omit<InventoryOtherItemDocument, 'id' | 'created_at' | 'updated_at'>>;

// User Profile and Metrics Types
export interface UserProfileDocument {
  id: string;
  name?: string;
  email?: string;
  dateOfBirth?: Timestamp;
  height?: number;
  heightUnit: 'cm' | 'ft';
  gender?: 'male' | 'female' | 'other';
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goals?: string[];
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface WeightEntryDocument {
  id: string;
  userId: string;
  date: Timestamp;
  weight: number;
  unit: 'kg' | 'lbs';
  notes?: string;
  created_at: Timestamp;
}

export interface BodyMeasurementDocument {
  id: string;
  userId: string;
  date: Timestamp;
  chest?: number;
  waist?: number;
  hips?: number;
  bicepLeft?: number;
  bicepRight?: number;
  thighLeft?: number;
  thighRight?: number;
  calfLeft?: number;
  calfRight?: number;
  neck?: number;
  shoulders?: number;
  unit: 'cm' | 'in';
  notes?: string;
  created_at: Timestamp;
}

export interface ProgressPhotoDocument {
  id: string;
  userId: string;
  date: Timestamp;
  imageUrl: string;
  thumbnailUrl?: string;
  type: 'front' | 'side' | 'back';
  weight?: number;
  notes?: string;
  created_at: Timestamp;
}

// Types for creating new user profile documents
export type NewUserProfileDocument = Omit<UserProfileDocument, 'id' | 'created_at' | 'updated_at'>;
export type NewWeightEntryDocument = Omit<WeightEntryDocument, 'id' | 'created_at'>;
export type NewBodyMeasurementDocument = Omit<BodyMeasurementDocument, 'id' | 'created_at'>;
export type NewProgressPhotoDocument = Omit<ProgressPhotoDocument, 'id' | 'created_at'>;

// Types for updates
export type UpdateUserProfileDocument = Partial<Omit<UserProfileDocument, 'id' | 'created_at' | 'updated_at'>>;
export type UpdateWeightEntryDocument = Partial<Omit<WeightEntryDocument, 'id' | 'created_at' | 'userId'>>;
export type UpdateBodyMeasurementDocument = Partial<Omit<BodyMeasurementDocument, 'id' | 'created_at' | 'userId'>>;
export type UpdateProgressPhotoDocument = Partial<Omit<ProgressPhotoDocument, 'id' | 'created_at' | 'userId'>>;