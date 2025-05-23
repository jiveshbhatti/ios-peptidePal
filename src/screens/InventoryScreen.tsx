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
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/RootNavigator';
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
import * as Icon from 'react-native-feather';

type InventoryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

export default function InventoryScreen() {
  const navigation = useNavigation<InventoryScreenNavigationProp>();
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
    // Navigate to peptide details screen
    navigation.navigate('PeptideDetails', { peptideId: peptide.id });
  }, [navigation]);


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
        onLongPress={() => {
          AppHaptics.longPress();
          setSelectedPeptide(item);
          setShowFormModal(true);
        }}
      />
    );
  }, [handlePeptidePress, peptides, navigation]);


  const keyExtractor = useCallback((item: InventoryPeptide) => item.id, []);

  const renderSectionHeader = useCallback(({ section }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <Text style={styles.sectionCount}>({section.data.length})</Text>
      </View>
      {section.title === 'Inactive Stock' && (
        <Text style={styles.sectionHint}>Tap to view details and manage vials</Text>
      )}
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
            <Icon.Package width={48} height={48} stroke={theme.colors.gray[400]} />
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
        <SectionList
          sections={sections}
          renderItem={renderPeptideItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={keyExtractor}
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
        <Icon.Tool width={48} height={48} stroke={theme.colors.gray[400]} />
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
          console.log('Saving peptide with Firebase');
          console.log('Inventory data:', inventoryData);
          console.log('Schedule data:', scheduleData);
          
          try {
            // Use Firebase service
            console.log('Using Firebase service for save');
            if (selectedPeptide) {
              await service.updatePeptideInInventory(selectedPeptide.id, inventoryData, scheduleData);
            } else {
              await service.addPeptideToInventory(inventoryData, scheduleData);
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
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.gray[800],
  },
  sectionCount: {
    fontSize: 14,
    color: theme.colors.gray[500],
    marginLeft: theme.spacing.xs,
  },
  sectionHint: {
    fontSize: 12,
    color: theme.colors.gray[400],
    marginTop: theme.spacing.xs,
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
    color: theme.colors.gray[800],
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.gray[500],
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
    color: theme.colors.gray[800],
    marginTop: theme.spacing.md,
  },
  comingSoonSubtext: {
    fontSize: 14,
    color: theme.colors.gray[500],
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
});