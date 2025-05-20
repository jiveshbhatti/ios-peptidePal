import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { theme } from '@/constants/theme';
import { useData } from '@/contexts/DataContext';
import SearchBar from '@/components/ui/SearchBar';
import SegmentedControl from '@/components/ui/SegmentedControl';
import InventoryPeptideCard from '@/components/inventory/InventoryPeptideCard';
import PeptideFormModal from '@/components/inventory/PeptideFormModal';
import FloatingActionButton from '@/components/ui/FloatingActionButton';
import { InventoryPeptide, InventoryBacWater, InventorySyringe } from '@/types/inventory';
import { inventoryService } from '@/services/inventory.service';

export default function InventoryScreen() {
  const { inventoryPeptides, bacWater, syringes, loading, refreshData } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [tab, setTab] = useState(0);
  const [filteredPeptides, setFilteredPeptides] = useState<InventoryPeptide[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedPeptide, setSelectedPeptide] = useState<InventoryPeptide | undefined>();

  // Segmented control tabs
  const tabs = ['Peptides', 'BAC Water', 'Syringes', 'Other'];

  // Filter peptides based on search query
  useEffect(() => {
    if (!inventoryPeptides) return;

    if (searchQuery.trim() === '') {
      setFilteredPeptides(inventoryPeptides);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = inventoryPeptides.filter((peptide) =>
        peptide.name.toLowerCase().includes(query) ||
        (peptide.batch_number && peptide.batch_number.toLowerCase().includes(query))
      );
      setFilteredPeptides(filtered);
    }
  }, [searchQuery, inventoryPeptides]);

  // Split peptides into active and inactive
  const activePeptides = filteredPeptides.filter(
    (peptide) => peptide.active_vial_status === 'IN_USE'
  );
  
  const inactivePeptides = filteredPeptides.filter(
    (peptide) => peptide.active_vial_status !== 'IN_USE'
  );

  const handlePeptidePress = (peptide: InventoryPeptide) => {
    // Show edit form modal for the selected peptide
    setSelectedPeptide(peptide);
    setShowFormModal(true);
  };

  const handlePeptideLongPress = (peptide: InventoryPeptide) => {
    Alert.alert(
      'Peptide Options',
      `${peptide.name}`,
      [
        {
          text: 'Edit',
          onPress: () => console.log('Edit peptide:', peptide.id),
        },
        {
          text: 'Activate Vial',
          onPress: () => handleActivateVial(peptide),
          style: peptide.num_vials > 0 ? 'default' : 'destructive',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDeletePeptide(peptide),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const handleActivateVial = (peptide: InventoryPeptide) => {
    if (peptide.num_vials <= 0) {
      Alert.alert('No Vials', 'No vials available to activate');
      return;
    }

    Alert.alert(
      'Activate Vial',
      `Activate a new vial of ${peptide.name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Activate',
          onPress: async () => {
            try {
              const today = new Date().toISOString();
              await inventoryService.activatePeptideVial(peptide.id, today);
              await refreshData();
            } catch (error) {
              console.error('Error activating vial:', error);
              Alert.alert('Error', 'Failed to activate vial');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleDeletePeptide = (peptide: InventoryPeptide) => {
    Alert.alert(
      'Delete Peptide',
      `Are you sure you want to delete ${peptide.name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await inventoryService.deletePeptideFromInventory(peptide.id, peptide.name);
              await refreshData();
            } catch (error) {
              console.error('Error deleting peptide:', error);
              Alert.alert('Error', 'Failed to delete peptide');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handleAddItem = () => {
    if (tab === 0) {
      // Show peptide form modal for adding new peptide
      setSelectedPeptide(undefined);
      setShowFormModal(true);
    } else {
      // TODO: Show form for other inventory types
      Alert.alert('Coming Soon', `Adding ${tabs[tab]} will be available soon.`);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SearchBar
        placeholder="Search inventory..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <SegmentedControl
        options={tabs}
        selectedIndex={tab}
        onChange={setTab}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {tab === 0 && (
          <>
            {/* Peptides Tab */}
            {filteredPeptides.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No peptides in inventory</Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={handleAddItem}
                >
                  <Text style={styles.emptyButtonText}>Add Peptide</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {activePeptides.length > 0 && (
                  <View>
                    <Text style={styles.sectionTitle}>
                      Active Peptides ({activePeptides.length})
                    </Text>
                    {activePeptides.map((peptide) => (
                      <InventoryPeptideCard
                        key={peptide.id}
                        peptide={peptide}
                        onPress={() => handlePeptidePress(peptide)}
                        onLongPress={() => handlePeptideLongPress(peptide)}
                      />
                    ))}
                  </View>
                )}

                {inactivePeptides.length > 0 && (
                  <View>
                    <Text style={styles.sectionTitle}>
                      Inactive Stock ({inactivePeptides.length})
                    </Text>
                    {inactivePeptides.map((peptide) => (
                      <InventoryPeptideCard
                        key={peptide.id}
                        peptide={peptide}
                        onPress={() => handlePeptidePress(peptide)}
                        onLongPress={() => handlePeptideLongPress(peptide)}
                      />
                    ))}
                  </View>
                )}
              </>
            )}
          </>
        )}

        {tab === 1 && (
          // BAC Water Tab
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>BAC Water inventory will be implemented soon</Text>
          </View>
        )}

        {tab === 2 && (
          // Syringes Tab
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Syringes inventory will be implemented soon</Text>
          </View>
        )}

        {tab === 3 && (
          // Other Tab
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Other items inventory will be implemented soon</Text>
          </View>
        )}
      </ScrollView>

      <FloatingActionButton onPress={handleAddItem} />

      {/* Peptide Form Modal */}
      <PeptideFormModal
        visible={showFormModal}
        onClose={() => setShowFormModal(false)}
        peptide={selectedPeptide}
        onSave={refreshData}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl + 60, // Extra padding for FAB
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.gray[800],
    marginTop: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 3,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.gray[500],
    marginBottom: theme.spacing.md,
  },
  emptyButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  emptyButtonText: {
    color: theme.colors.background,
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
  },
});