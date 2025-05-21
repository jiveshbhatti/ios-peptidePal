import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Peptide } from '@/types/peptide';
import { InventoryPeptide, InventoryBacWater, InventorySyringe, InventoryOtherItem } from '@/types/inventory';
import { getSupabaseClient } from '@/services/supabase-dynamic';
import { useDatabase } from './DatabaseContext';

interface DataContextType {
  peptides: Peptide[];
  inventoryPeptides: InventoryPeptide[];
  bacWater: InventoryBacWater[];
  syringes: InventorySyringe[];
  otherItems: InventoryOtherItem[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [peptides, setPeptides] = useState<Peptide[]>([]);
  const [inventoryPeptides, setInventoryPeptides] = useState<InventoryPeptide[]>([]);
  const [bacWater, setBacWater] = useState<InventoryBacWater[]>([]);
  const [syringes, setSyringes] = useState<InventorySyringe[]>([]);
  const [otherItems, setOtherItems] = useState<InventoryOtherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get database service from context
  const { service, useFirebase } = useDatabase();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (useFirebase) {
        // Firebase data fetching
        const peptideData = await service.getPeptides();
        const inventoryData = await service.getInventoryPeptides();
        
        // Set states
        setPeptides(peptideData);
        setInventoryPeptides(inventoryData);
        
        // For now, set empty arrays for other collections
        // TODO: Implement when these collections are migrated
        setBacWater([]);
        setSyringes([]);
        setOtherItems([]);
      } else {
        // Original Supabase fetching
        const supabase = getSupabaseClient();
        
        const [
          { data: peptideData, error: peptideError },
          { data: inventoryData, error: inventoryError },
          { data: bacWaterData, error: bacWaterError },
          { data: syringeData, error: syringeError },
          { data: otherData, error: otherError },
        ] = await Promise.all([
          supabase.from('peptides').select('*'),
          supabase.from('inventory_peptides').select('*'),
          supabase.from('inventory_bac_water').select('*'),
          supabase.from('inventory_syringes').select('*'),
          supabase.from('inventory_other_items').select('*'),
        ]);

        if (peptideError) throw peptideError;
        if (inventoryError) throw inventoryError;
        if (bacWaterError) throw bacWaterError;
        if (syringeError) throw syringeError;
        if (otherError) throw otherError;
        
        // Set state with fetched data
        setPeptides(peptideData || []);
        setInventoryPeptides(inventoryData || []);
        setBacWater(bacWaterData || []);
        setSyringes(syringeData || []);
        setOtherItems(otherData || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Set up polling for data updates instead of real-time subscriptions
    // This is a simpler approach that works reliably
    const pollingInterval = setInterval(fetchData, 30000); // Poll every 30 seconds
    
    return () => {
      clearInterval(pollingInterval);
    };
  }, []);

  return (
    <DataContext.Provider
      value={{
        peptides,
        inventoryPeptides,
        bacWater,
        syringes,
        otherItems,
        loading,
        error,
        refreshData: fetchData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}