import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { theme } from '@/constants/theme';
import { useNavigation } from '@react-navigation/native';
import Button from '@/components/ui/Button';
import { UserProfile } from '@/types/metrics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import * as Icon from 'react-native-feather';

const PROFILE_STORAGE_KEY = '@PeptidePal:userProfile';

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    name: '',
    email: '',
    dateOfBirth: '',
    height: undefined,
    heightUnit: 'cm',
    gender: undefined,
    activityLevel: undefined,
    goals: [],
    createdAt: '',
    updatedAt: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const stored = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
      if (stored) {
        setProfile(JSON.parse(stored));
      } else {
        // Create new profile
        const newProfile: UserProfile = {
          id: Date.now().toString(),
          heightUnit: 'cm',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setProfile(newProfile);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedProfile = {
        ...profile,
        updatedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));
      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={profile.name || ''}
            onChangeText={(text) => setProfile(prev => ({ ...prev, name: text }))}
            placeholder="Enter your name"
            placeholderTextColor={theme.colors.gray[400]}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={profile.email || ''}
            onChangeText={(text) => setProfile(prev => ({ ...prev, email: text }))}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={theme.colors.gray[400]}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date of Birth</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>
              {profile.dateOfBirth 
                ? format(new Date(profile.dateOfBirth), 'MMMM d, yyyy')
                : 'Select date'}
            </Text>
            <Icon.Calendar color={theme.colors.gray[400]} width={20} height={20} />
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={profile.dateOfBirth ? new Date(profile.dateOfBirth) : new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setProfile(prev => ({ ...prev, dateOfBirth: selectedDate.toISOString() }));
              }
            }}
            maximumDate={new Date()}
          />
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Physical Information</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.buttonGroup}>
            {(['male', 'female', 'other'] as const).map(option => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionButton,
                  profile.gender === option && styles.optionButtonActive,
                ]}
                onPress={() => setProfile(prev => ({ ...prev, gender: option }))}
              >
                <Text style={[
                  styles.optionText,
                  profile.gender === option && styles.optionTextActive,
                ]}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Height</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={profile.height?.toString() || ''}
              onChangeText={(text) => setProfile(prev => ({ 
                ...prev, 
                height: text ? parseFloat(text) : undefined 
              }))}
              placeholder="0"
              keyboardType="decimal-pad"
              placeholderTextColor={theme.colors.gray[400]}
            />
            <View style={styles.unitToggle}>
              <TouchableOpacity
                style={[styles.unitButton, profile.heightUnit === 'cm' && styles.unitButtonActive]}
                onPress={() => setProfile(prev => ({ ...prev, heightUnit: 'cm' }))}
              >
                <Text style={[styles.unitText, profile.heightUnit === 'cm' && styles.unitTextActive]}>
                  cm
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.unitButton, profile.heightUnit === 'ft' && styles.unitButtonActive]}
                onPress={() => setProfile(prev => ({ ...prev, heightUnit: 'ft' }))}
              >
                <Text style={[styles.unitText, profile.heightUnit === 'ft' && styles.unitTextActive]}>
                  ft
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Activity Level</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.buttonGroup}>
              {(['sedentary', 'light', 'moderate', 'active', 'very_active'] as const).map(level => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.optionButton,
                    profile.activityLevel === level && styles.optionButtonActive,
                  ]}
                  onPress={() => setProfile(prev => ({ ...prev, activityLevel: level }))}
                >
                  <Text style={[
                    styles.optionText,
                    profile.activityLevel === level && styles.optionTextActive,
                  ]}>
                    {level.replace('_', ' ').split(' ').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          title="Save Profile"
          onPress={handleSave}
          loading={saving}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  section: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.gray[800],
    marginBottom: theme.spacing.md,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.gray[700],
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.gray[50],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.gray[800],
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.gray[50],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  dateText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.gray[800],
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  optionButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.gray[100],
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  optionButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  optionText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.gray[700],
  },
  optionTextActive: {
    color: 'white',
  },
  inputRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: theme.colors.gray[100],
    borderRadius: theme.borderRadius.md,
    padding: 2,
  },
  unitButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md - 2,
  },
  unitButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  unitText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.gray[600],
  },
  unitTextActive: {
    color: 'white',
  },
  actions: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
});