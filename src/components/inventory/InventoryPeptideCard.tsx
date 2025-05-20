import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
} from 'react-native';
import * as Icon from 'react-native-feather';
import { theme } from '@/constants/theme';
import { InventoryPeptide } from '@/types/inventory';
import Card from '@/components/ui/Card';

interface InventoryPeptideCardProps {
  peptide: InventoryPeptide;
  onPress: () => void;
  onLongPress?: () => void;
}

export default function InventoryPeptideCard({
  peptide,
  onPress,
  onLongPress,
}: InventoryPeptideCardProps) {
  // Get the peptide image from the associated Peptide object
  // This would come from props or context in a real implementation
  const imageUrl = null; // Would come from Peptide in real app
  
  // Calculate active vial percentage remaining
  const isActiveVial = peptide.active_vial_status === 'IN_USE';
  const hasStock = peptide.num_vials > 0;
  const isLowStock = peptide.num_vials <= (peptide.low_stock_threshold || 2);
  
  // Calculate remaining doses percentage if active vial
  const calculateRemainingPercentage = () => {
    if (!isActiveVial || 
        !peptide.concentration_per_vial_mcg || 
        !peptide.typical_dose_mcg ||
        peptide.typical_dose_mcg === 0) {
      return 0;
    }
    
    const totalDoses = peptide.concentration_per_vial_mcg / peptide.typical_dose_mcg;
    // Estimate remaining doses based on active vial status and reconstitution date
    const reconDate = peptide.active_vial_reconstitution_date ? new Date(peptide.active_vial_reconstitution_date) : null;
    const expiryDate = peptide.active_vial_expiry_date ? new Date(peptide.active_vial_expiry_date) : null;
    
    if (!reconDate || !expiryDate) return 50; // Default to 50% if dates not available
    
    const today = new Date();
    const totalDurationMs = expiryDate.getTime() - reconDate.getTime();
    const elapsedDurationMs = today.getTime() - reconDate.getTime();
    
    // Calculate percentage based on time elapsed (simple linear approximation)
    // For a more accurate calculation, we'd need actual dose logs
    const timeBasedPercentage = Math.max(0, 100 - (elapsedDurationMs / totalDurationMs * 100));
    return timeBasedPercentage;
  };
  
  const remainingPercentage = calculateRemainingPercentage();
  
  // Determine status color
  let statusColor = theme.colors.gray[400]; // Default inactive
  if (isActiveVial) {
    statusColor = theme.colors.secondary; // Active/in use
  } else if (!hasStock || isLowStock) {
    statusColor = theme.colors.warning; // Low stock warning
  }

  return (
    <Card style={styles.container} variant="elevated">
      <TouchableOpacity
        style={styles.content}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.7}
      >
        {/* Status indicator */}
        <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />

        {/* Peptide image */}
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Text style={styles.imageText}>
                {peptide.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Peptide info */}
        <View style={styles.info}>
          <Text style={styles.name}>{peptide.name}</Text>
          <Text style={styles.stock}>
            {peptide.num_vials} vials • {peptide.concentration_per_vial_mcg}mcg/vial
          </Text>
          {peptide.typical_dose_mcg && (
            <Text style={styles.dosageInfo}>
              Typical dose: {peptide.typical_dose_mcg}mcg 
              {peptide.concentration_per_vial_mcg && peptide.typical_dose_mcg && (
                ` (${Math.floor(peptide.concentration_per_vial_mcg / peptide.typical_dose_mcg)} doses/vial)`
              )}
            </Text>
          )}
          
          {/* Active vial progress bar */}
          {isActiveVial && (
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    { 
                      width: `${remainingPercentage}%`,
                      backgroundColor: remainingPercentage < 25 
                        ? theme.colors.warning 
                        : theme.colors.primary
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {remainingPercentage < 25 ? 'Low remaining in active vial' : 'Active vial in use'}
              </Text>
            </View>
          )}
        </View>

        {/* Chevron */}
        <Icon.ChevronRight
          width={20}
          height={20}
          color={theme.colors.gray[400]}
        />
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    padding: 0,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.sm,
  },
  imageContainer: {
    marginRight: theme.spacing.md,
  },
  image: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
  },
  imagePlaceholder: {
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageText: {
    color: theme.colors.background,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '600',
  },
  info: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  name: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.gray[800],
    marginBottom: 2,
  },
  stock: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.gray[600],
    marginBottom: 4,
  },
  progressContainer: {
    marginTop: 4,
  },
  progressTrack: {
    height: 4,
    backgroundColor: theme.colors.gray[100],
    borderRadius: 2,
    marginBottom: 4,
    width: 200,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[500],
  },
  dosageInfo: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[600],
    marginBottom: 4,
  },
});