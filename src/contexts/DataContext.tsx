import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Peptide } from '@/types/peptide';
import { InventoryPeptide, InventoryBacWater, InventorySyringe, InventoryOtherItem } from '@/types/inventory';
import { getSupabaseClient } from '@/services/supabase-dynamic';
import { useDatabase } from './DatabaseContext';
import firebaseRealtimeService from '@/services/firebase-realtime';

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
        // For initial load, fetch data once
        const peptideData = await firebaseRealtimeService.getPeptides();
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
    let unsubscribeFunctions: (() => void)[] = [];

    if (useFirebase) {
      // Use real-time subscriptions for Firebase
      console.log('Setting up Firebase real-time subscriptions...');
      
      // Subscribe to peptides
      const unsubscribePeptides = firebaseRealtimeService.subscribeToPeptides((updatedPeptides) => {
        console.log('Peptides updated via real-time subscription:', updatedPeptides.length);
        setPeptides(updatedPeptides);
        setLoading(false);
      });
      unsubscribeFunctions.push(unsubscribePeptides);
      
      // Subscribe to all inventory collections
      const unsubscribeInventory = firebaseRealtimeService.subscribeToAllInventory({
        onPeptides: (items) => {
          console.log('Inventory peptides updated:', items.length);
          setInventoryPeptides(items);
        },
        onBacWater: (items) => {
          console.log('Bac water inventory updated:', items.length);
          setBacWater(items);
        },
        onSyringes: (items) => {
          console.log('Syringes inventory updated:', items.length);
          setSyringes(items);
        },
        onOtherItems: (items) => {
          console.log('Other items inventory updated:', items.length);
          setOtherItems(items);
        }
      });
      unsubscribeFunctions.push(unsubscribeInventory);
      
      // Do an initial fetch for inventory (until real-time is fully implemented)
      service.getInventoryPeptides().then(setInventoryPeptides).catch(console.error);
      
    } else {
      // For Supabase, continue with initial fetch and polling
      fetchData();
      
      // Set up polling for Supabase
      const pollingInterval = setInterval(fetchData, 30000); // Poll every 30 seconds
      unsubscribeFunctions.push(() => clearInterval(pollingInterval));
    }

    // Cleanup function
    return () => {
      console.log('Cleaning up DataContext subscriptions...');
      unsubscribeFunctions.forEach(fn => fn());
      firebaseRealtimeService.cleanup();
    };
  }, [useFirebase]); // Re-run when database changes

  const refreshData = async () => {
    console.log('Manual data refresh requested');
    if (useFirebase) {
      // For Firebase, the real-time subscriptions will handle updates
      // Just do a manual fetch to ensure latest data
      await fetchData();
    } else {
      // For Supabase, do a full refresh
      await fetchData();
    }
  };

  const contextValue: DataContextType = {
    peptides,
    inventoryPeptides,
    bacWater,
    syringes,
    otherItems,
    loading,
    error,
    refreshData,
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}