import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  SectionList,
  Platform,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SwipeListView } from 'react-native-swipe-list-view';
import { theme } from '@/constants/theme';
import { useData } from '@/contexts/DataContext';
import { useDatabase } from '@/contexts/DatabaseContext';
import SearchBar from '@/components/ui/SearchBar';
import SegmentedControl from '@/components/ui/SegmentedControl';
import InventoryPeptideCard from '@/components/inventory/InventoryPeptideCard';
import PeptideFormModal from '@/components/inventory/PeptideFormModal';
import FloatingActionButton from '@/components/ui/FloatingActionButton';
import { InventoryPeptide, InventoryBacWater, InventorySyringe } from '@/types/inventory';
import { inventoryService } from '@/services/inventory.service';
import { AppHaptics } from '@/utils/haptics';
import { Feather } from 'react-native-feather';

export default function InventoryScreen() {
  const { inventoryPeptides, peptides, bacWater, syringes, loading, refreshData } = useData();
  const { service } = useDatabase();
  const [searchQuery, setSearchQuery] = useState('');
  const [tab, setTab] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedPeptide, setSelectedPeptide] = useState<InventoryPeptide | undefined>();

  // Segmented control tabs
  const tabs = ['Peptides', 'BAC Water', 'Syringes', 'Other'];

  // Memoized filtered peptides
  const filteredPeptides = useMemo(() => {
    if (!inventoryPeptides) return [];

    if (searchQuery.trim() === '') {
      return inventoryPeptides;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return inventoryPeptides.filter((peptide) =>
      peptide.name.toLowerCase().includes(query) ||
      (peptide.batch_number && peptide.batch_number.toLowerCase().includes(query))
    );
  }, [searchQuery, inventoryPeptides]);

  // Memoized sections for better performance
  const sections = useMemo(() => {
    const activePeptides = filteredPeptides.filter(
      (peptide) => peptide.active_vial_status === 'IN_USE'
    );
    
    const inactivePeptides = filteredPeptides.filter(
      (peptide) => peptide.active_vial_status !== 'IN_USE'
    );

    return [
      { title: 'Active Peptides', data: activePeptides },
      { title: 'Inactive Stock', data: inactivePeptides },
    ].filter(section => section.data.length > 0);
  }, [filteredPeptides]);

  const handlePeptidePress = useCallback((peptide: InventoryPeptide) => {
    AppHaptics.buttonTap();
    setSelectedPeptide(peptide);
    setShowFormModal(true);
  }, []);

  const handleActivateVial = useCallback(async (peptide: InventoryPeptide) => {
    if (peptide.num_vials <= 0) {
      AppHaptics.error();
      Alert.alert('No Vials', 'No vials available to activate');
      return;
    }

    AppHaptics.activateVial();
    Alert.alert(
      'Activate Vial',
      `Activate a new vial of ${peptide.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Activate',
          onPress: async () => {
            try {
              await inventoryService.activatePeptideVial(peptide.id, new Date().toISOString());
              AppHaptics.success();
              await refreshData();
            } catch (error) {
              AppHaptics.error();
              Alert.alert('Error', 'Failed to activate vial');
            }
          },
        },
      ]
    );
  }, [refreshData]);

  const handleDeletePeptide = useCallback(async (peptide: InventoryPeptide) => {
    AppHaptics.delete();
    Alert.alert(
      'Delete Peptide',
      `Are you sure you want to delete ${peptide.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await inventoryService.deletePeptideFromInventory(peptide.id, peptide.name);
              AppHaptics.success();
              await refreshData();
            } catch (error) {
              AppHaptics.error();
              Alert.alert('Error', 'Failed to delete peptide');
            }
          },
        },
      ]
    );
  }, [refreshData]);

  const handleRefresh = useCallback(async () => {
    AppHaptics.pullToRefresh();
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  const handleTabChange = useCallback((index: number) => {
    AppHaptics.tabSwitch();
    setTab(index);
  }, []);

  const handleAddPress = useCallback(() => {
    AppHaptics.buttonTap();
    setSelectedPeptide(undefined);
    setShowFormModal(true);
  }, []);

  const renderPeptideItem = useCallback(({ item }: { item: InventoryPeptide }) => {
    // Find the associated Peptide for accurate dose tracking
    const schedulePeptide = peptides.find(p => p.id === item.id);
    
    return (
      <InventoryPeptideCard
        peptide={item}
        schedulePeptide={schedulePeptide}
        onPress={() => handlePeptidePress(item)}
      />
    );
  }, [handlePeptidePress, peptides]);

  const renderHiddenItem = useCallback((data: { item: InventoryPeptide }) => (
    <View style={styles.rowBack}>
      <TouchableOpacity
        style={[styles.backButton, styles.activateButton]}
        onPress={() => handleActivateVial(data.item)}
      >
        <Feather name="check-circle" size={20} color="white" />
        <Text style={styles.backButtonText}>Activate</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.backButton, styles.deleteButton]}
        onPress={() => handleDeletePeptide(data.item)}
      >
        <Feather name="trash-2" size={20} color="white" />
        <Text style={styles.backButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  ), [handleActivateVial, handleDeletePeptide]);

  const keyExtractor = useCallback((item: InventoryPeptide) => item.id, []);

  const renderSectionHeader = useCallback(({ section }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.sectionCount}>({section.data.length})</Text>
    </View>
  ), []);

  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    if (tab === 0) {
      // Peptides tab with swipeable list
      if (sections.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <Feather name="package" size={48} color={theme.colors.textLight} />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No peptides found' : 'No peptides in inventory'}
            </Text>
            <Text style={styles.emptySubtext}>
              Tap the + button to add your first peptide
            </Text>
          </View>
        );
      }

      return (
        <SwipeListView
          useSectionList
          sections={sections}
          renderItem={renderPeptideItem}
          renderHiddenItem={renderHiddenItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={keyExtractor}
          rightOpenValue={-150}
          leftOpenValue={75}
          disableRightSwipe
          onSwipeValueChange={(swipeData) => {
            if (Math.abs(swipeData.value) > 20) {
              AppHaptics.swipeAction();
            }
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
        />
      );
    }

    // Other tabs placeholder
    return (
      <View style={styles.comingSoonContainer}>
        <Feather name="tool" size={48} color={theme.colors.textLight} />
        <Text style={styles.comingSoonText}>Coming Soon</Text>
        <Text style={styles.comingSoonSubtext}>
          {tabs[tab]} inventory management will be available in the next update
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search inventory..."
        style={styles.searchBar}
      />
      
      <SegmentedControl
        options={tabs}
        selectedIndex={tab}
        onChange={handleTabChange}
      />

      {renderContent()}

      {tab === 0 && (
        <FloatingActionButton onPress={handleAddPress} />
      )}

      <PeptideFormModal
        visible={showFormModal}
        onClose={() => {
          AppHaptics.modalClose();
          setShowFormModal(false);
        }}
        onSubmit={async (inventoryData, scheduleData) => {
          AppHaptics.formSubmit();
          console.log('Saving peptide with database:', useFirebase ? 'Firebase' : 'Supabase');
          console.log('Inventory data:', inventoryData);
          console.log('Schedule data:', scheduleData);
          
          try {
            if (useFirebase) {
              // Use Firebase service
              console.log('Using Firebase service for save');
              if (selectedPeptide) {
                await service.updatePeptideInInventory(selectedPeptide.id, inventoryData, scheduleData);
              } else {
                await service.addPeptideToInventory(inventoryData, scheduleData);
              }
            } else {
              // Use Supabase service
              console.log('Using Supabase service for save');
              if (selectedPeptide) {
                await inventoryService.updatePeptideInInventory(selectedPeptide.id, inventoryData, scheduleData);
              } else {
                await inventoryService.addPeptideToInventory(inventoryData, scheduleData);
              }
            }
            AppHaptics.success();
            await refreshData();
            setShowFormModal(false);
          } catch (error) {
            AppHaptics.error();
            console.error('Error saving peptide:', error);
            Alert.alert('Error', 'Failed to save peptide');
          }
        }}
        peptide={selectedPeptide}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchBar: {
    margin: theme.spacing.md,
  },
  listContent: {
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  sectionCount: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginLeft: theme.spacing.xs,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  comingSoonText: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: theme.spacing.md,
  },
  comingSoonSubtext: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  rowBack: {
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingRight: theme.spacing.md,
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: '90%',
    marginLeft: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  activateButton: {
    backgroundColor: theme.colors.success,
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
  },
  backButtonText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
  },
});