export interface InventoryPeptide {
  id: string;
  // user_id: string; // Removed
  name: string;
  num_vials: number;
  concentration_per_vial_mcg?: number | null;
  storage_location?: string | null;
  expiry_date?: string | null; // ISO date string (YYYY-MM-DD) for the overall batch
  active_vial_status: 'NONE' | 'IN_USE' | 'FINISHED' | 'DISCARDED'; // Status of the currently active vial
  active_vial_reconstitution_date?: string | null; // ISO date string (YYYY-MM-DD) or datetime string
  active_vial_expiry_date?: string | null; // ISO date string (YYYY-MM-DD) or datetime string
  low_stock_threshold?: number | null; // Threshold for low stock warning
  batch_number?: string | null; // Batch or Lot number
  bac_water_volume_added?: number | null; // Volume of BAC water added for reconstitution (ml)
  typical_dose_mcg?: number | null; // Typical dose in mcg for this peptide
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
}

export interface InventoryBacWater {
  id: string;
  // user_id: string; // Removed
  volume_ml_per_bottle?: number | null;
  num_bottles: number;
  expiry_date?: string | null; // ISO date string (YYYY-MM-DD)
  // Note: The batch_number column does not exist in the actual database schema
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
}

export interface InventorySyringe {
  id: string;
  // user_id: string; // Removed
  type_size?: string | null; // e.g., "1ml 29G"
  quantity: number;
  brand?: string | null;
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
}

export interface InventoryOtherItem {
  id: string;
  // user_id: string; // Removed
  item_name: string;
  description?: string | null;
  quantity: number;
  notes?: string | null;
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
}

// Combined type for easier handling in some cases, or for Supabase table generation
export type InventoryItem = InventoryPeptide | InventoryBacWater | InventorySyringe | InventoryOtherItem;

// Types for data to be inserted (omitting id, created_at, updated_at as they are often auto-generated or context-derived)
export type NewInventoryPeptide = Omit<InventoryPeptide, 'id' | 'created_at' | 'updated_at'>;
export type NewInventoryBacWater = Omit<InventoryBacWater, 'id' | 'created_at' | 'updated_at'>;
export type NewInventorySyringe = Omit<InventorySyringe, 'id' | 'created_at' | 'updated_at'>;
export type NewInventoryOtherItem = Omit<InventoryOtherItem, 'id' | 'created_at' | 'updated_at'>;

// Types for data to be updated (id is required, other fields are partial)
export type UpdateInventoryPeptide = Partial<Omit<InventoryPeptide, 'id' | 'created_at' | 'updated_at'>>;
export type UpdateInventoryBacWater = Partial<Omit<InventoryBacWater, 'id' | 'created_at' | 'updated_at'>>;
export type UpdateInventorySyringe = Partial<Omit<InventorySyringe, 'id' | 'created_at' | 'updated_at'>>;
export type UpdateInventoryOtherItem = Partial<Omit<InventoryOtherItem, 'id' | 'created_at' | 'updated_at'>>;
