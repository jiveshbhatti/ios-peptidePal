import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import * as Icon from 'react-native-feather';
import { theme } from '@/constants/theme';
import { Peptide } from '@/types/peptide';
import Card from '@/components/ui/Card';

interface PeptideCardProps {
  peptide: Peptide;
  scheduleTime: 'AM' | 'PM';
  isLogged: boolean;
  onLog: () => void;
  onPress: () => void;
}

export default function PeptideCard({
  peptide,
  scheduleTime,
  isLogged,
  onLog,
  onPress,
}: PeptideCardProps) {
  // Calculate remaining doses from active vial
  const activeVial = peptide.vials?.find(v => v.isActive);
  const remainingDoses = activeVial?.remainingAmountUnits || 0;
  const isLowStock = remainingDoses < 3;

  return (
    <Card style={[styles.container, isLogged && styles.loggedContainer]} variant="default">
      <TouchableOpacity
        style={styles.content}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.imageContainer}>
          {peptide.imageUrl ? (
            <Image
              source={{ uri: peptide.imageUrl }}
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

        <View style={[styles.info, isLogged && styles.loggedInfo]}>
          <Text style={[styles.name, isLogged && styles.loggedText]}>{peptide.name}</Text>
          <Text style={[styles.schedule, isLogged && styles.loggedSubText]}>
            {scheduleTime} • {peptide.typicalDosageUnits}{peptide.dosageUnit}
          </Text>
          {activeVial && (
            <Text style={[styles.status, isLowStock && styles.lowStock, isLogged && styles.loggedSubText]}>
              {remainingDoses} doses left
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.logButton, isLogged && styles.loggedButton]}
          onPress={(e) => {
            e.stopPropagation();
            onLog();
          }}
        >
          {isLogged ? (
            <View style={styles.loggedIndicator}>
              <Icon.CheckCircle
                width={24}
                height={24}
                color={theme.colors.secondary}
              />
              <Text style={styles.loggedIndicatorText}>Logged</Text>
            </View>
          ) : (
            <View style={styles.logButtonInner}>
              <Text style={styles.logButtonText}>Log</Text>
            </View>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  loggedContainer: {
    backgroundColor: '#E8F7F4',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.secondary,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageContainer: {
    marginRight: theme.spacing.md,
  },
  image: {
    width: 54,
    height: 54,
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
  },
  loggedInfo: {
    opacity: 0.9,
  },
  name: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.gray[800],
    marginBottom: 2,
  },
  loggedText: {
    color: theme.colors.gray[700],
  },
  schedule: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.gray[600],
  },
  loggedSubText: {
    color: theme.colors.gray[500],
  },
  status: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[500],
    marginTop: 2,
  },
  lowStock: {
    color: theme.colors.warning,
  },
  logButton: {
    width: 70,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loggedButton: {
    backgroundColor: 'transparent',
  },
  logButtonInner: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  logButtonText: {
    color: theme.colors.background,
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
  },
  loggedIndicator: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loggedIndicatorText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.secondary,
    fontWeight: '500',
    marginTop: 2,
  },
});