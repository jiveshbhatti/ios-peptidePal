import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Peptide } from '@/types/peptide';
import { InventoryPeptide, InventoryBacWater, InventorySyringe, InventoryOtherItem } from '@/types/inventory';
import firebaseRealtimeService from '@/services/firebase-realtime';
import { inventoryService } from '@/services/inventory.service';
import NotificationService from '@/services/NotificationService';
import SiriShortcutsManager from '@/services/SiriShortcutsManager';
import { syncActiveVialStatus } from '@/utils/sync-active-status';
import { needsDoseLogMigration, migrateAllDoseLogs } from '@/utils/migrate-dose-logs';

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


  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch data from Firebase
      const peptideData = await firebaseRealtimeService.getPeptides();
      const inventoryData = await inventoryService.getInventoryPeptides();
      
      // Set states
      setPeptides(peptideData);
      setInventoryPeptides(inventoryData);
      
      // For now, set empty arrays for other collections
      // TODO: Implement when these collections are migrated
      setBacWater([]);
      setSyringes([]);
      setOtherItems([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let unsubscribeFunctions: (() => void)[] = [];

    // Use real-time subscriptions for Firebase
    console.log('Setting up Firebase real-time subscriptions...');
    
    // Subscribe to peptides
    const unsubscribePeptides = firebaseRealtimeService.subscribeToPeptides((updatedPeptides) => {
      console.log('Peptides updated via real-time subscription:', updatedPeptides.length);
      
      // Check for newly activated peptides and schedule notifications
      updatedPeptides.forEach(peptide => {
        const hasActiveVial = peptide.vials?.some(v => v.isActive);
        const previousPeptide = peptides.find(p => p.id === peptide.id);
        const hadActiveVial = previousPeptide?.vials?.some(v => v.isActive);
        
        // If a vial was just activated, schedule notifications
        if (hasActiveVial && !hadActiveVial) {
          console.log(`New vial activated for ${peptide.name}, scheduling notifications`);
          NotificationService.scheduleDoseReminders(peptide);
          
          // Also schedule expiry alert if vial has expiration date
          const activeVial = peptide.vials?.find(v => v.isActive);
          if (activeVial?.expirationDate) {
            NotificationService.scheduleExpiryAlert(
              peptide.id,
              peptide.name,
              new Date(activeVial.expirationDate)
            );
          }
        }
      });
      
      setPeptides(updatedPeptides);
      // Update Siri shortcuts with latest peptides data
      SiriShortcutsManager.updatePeptides(updatedPeptides);
      setLoading(false);
      
      // Check if dose logs need migration (one-time fix)
      if (needsDoseLogMigration(updatedPeptides)) {
        console.log('Dose logs need migration, starting migration...');
        migrateAllDoseLogs(updatedPeptides).then(() => {
          console.log('Dose log migration completed');
          // Trigger a refresh to update the UI with migrated data
          refreshData();
        }).catch(error => {
          console.error('Error migrating dose logs:', error);
        });
      }
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
    
    // Do an initial fetch for inventory
    inventoryService.getInventoryPeptides().then(setInventoryPeptides).catch(console.error);

    // Cleanup function
    return () => {
      console.log('Cleaning up DataContext subscriptions...');
      unsubscribeFunctions.forEach(fn => fn());
      firebaseRealtimeService.cleanup();
    };
  }, []); // Run once on mount

  // Sync active vial status when both peptides and inventory data are available
  useEffect(() => {
    if (peptides.length > 0 && inventoryPeptides.length > 0) {
      console.log('Syncing active vial statuses...');
      
      // Run sync for each inventory peptide
      inventoryPeptides.forEach(async (inventoryPeptide) => {
        const peptide = peptides.find(p => p.id === inventoryPeptide.id);
        if (peptide) {
          await syncActiveVialStatus(peptide, inventoryPeptide);
        }
      });
    }
  }, [peptides, inventoryPeptides]);

  const refreshData = async () => {
    console.log('Manual data refresh requested');
    // For Firebase, the real-time subscriptions will handle updates
    // Just do a manual fetch to ensure latest data
    await fetchData();
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