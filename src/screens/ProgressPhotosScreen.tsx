import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
  Platform,
  Linking,
} from 'react-native';
import { theme } from '@/constants/theme';
import { useNavigation } from '@react-navigation/native';
import Button from '@/components/ui/Button';
import FloatingActionButton from '@/components/ui/FloatingActionButton';
import { userProfileService } from '@/services/user-profile.service';
import { ProgressPhotoDocument } from '@/types/firebase';
import { format } from 'date-fns';
import * as Icon from 'react-native-feather';
import * as ImagePicker from 'expo-image-picker';
import { Timestamp } from 'firebase/firestore';
import ImageOptimizer from '@/utils/image-optimization';
import { testStorageConnection } from '@/utils/test-storage';

const { width: screenWidth } = Dimensions.get('window');
const imageSize = (screenWidth - theme.spacing.md * 3) / 2;

type PhotoType = 'front' | 'side' | 'back';

export default function ProgressPhotosScreen() {
  const navigation = useNavigation();
  const [photos, setPhotos] = useState<ProgressPhotoDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhotoDocument | null>(null);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [selectedType, setSelectedType] = useState<PhotoType>('front');
  const [pendingPickerLaunch, setPendingPickerLaunch] = useState<PhotoType | null>(null);

  useEffect(() => {
    loadPhotos();
  }, []);

  // Launch picker when modal is closed and we have a pending type
  useEffect(() => {
    if (!showTypeSelector && pendingPickerLaunch) {
      console.log('Modal closed, launching picker for type:', pendingPickerLaunch);
      // Small delay to ensure modal animation completes
      const timer = setTimeout(() => {
        launchImagePicker(pendingPickerLaunch);
        setPendingPickerLaunch(null);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [showTypeSelector, pendingPickerLaunch]);

  const loadPhotos = async () => {
    try {
      const fetchedPhotos = await userProfileService.getProgressPhotos();
      setPhotos(fetchedPhotos);
    } catch (error) {
      Alert.alert('Error', 'Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  const requestPermissions = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('Media library permission status:', status);
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required', 
          'Please enable photo library access in Settings to upload progress photos.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => {
              // On iOS, this will open the app settings
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              }
            }}
          ]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  };

  const handleAddPhoto = async () => {
    // Check if we're on a supported platform
    if (Platform.OS === 'web') {
      Alert.alert('Not Supported', 'Photo upload is not supported on web.');
      return;
    }
    
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;
    
    setShowTypeSelector(true);
  };

  const handleTypeSelected = (type: PhotoType) => {
    console.log('Type selected:', type);
    setSelectedType(type);
    setPendingPickerLaunch(type);
    setShowTypeSelector(false);
  };

  const launchImagePicker = async (type: PhotoType) => {
    try {
      console.log('Launching image picker...');
      
      // Verify ImagePicker is available
      if (!ImagePicker || !ImagePicker.launchImageLibraryAsync) {
        throw new Error('ImagePicker not available');
      }
      
      // Request permissions one more time to be sure
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('Final permission check:', permissionResult.status);
      
      if (permissionResult.status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Photo library access is required. Please enable it in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }
      
      // Simple configuration with just the essentials
      console.log('About to call launchImageLibraryAsync...');
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      console.log('Image picker result:', JSON.stringify(result, null, 2));
      
      if (result.canceled || result.cancelled) { // Check both spellings
        console.log('Image picker was cancelled');
        return;
      }
      
      const imageUri = result.assets?.[0]?.uri || result.uri; // Handle different result formats
      
      if (imageUri) {
        console.log('Image selected with URI:', imageUri);
        await uploadPhoto(imageUri, type);
      } else {
        console.log('No image selected or invalid result structure');
        console.log('Full result object:', result);
        Alert.alert('Error', 'No image was selected. Please try again.');
      }
    } catch (error: any) {
      console.error('Error in image picker:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      // More detailed error handling
      const errorMessage = error.message || error.toString() || 'Unknown error';
      
      if (errorMessage.includes('permission') || error.code === 'E_NO_PERMISSIONS') {
        Alert.alert(
          'Permission Required',
          'Photo library access is required. Please enable it in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
      } else if (errorMessage.includes('cancel') || error.code === 'E_PICKER_CANCELLED') {
        // User cancelled, no need to show error
        console.log('Picker was cancelled by user');
      } else {
        Alert.alert(
          'Error', 
          `Unable to open photo library: ${errorMessage}`,
          [{ text: 'OK' }]
        );
      }
    }
  };

  const uploadPhoto = async (uri: string, type: PhotoType) => {
    console.log('Starting upload for URI:', uri);
    setUploading(true);
    try {
      // Optimize the image before upload
      console.log('Optimizing image...');
      const optimized = await ImageOptimizer.optimizeProgressPhoto(uri);
      console.log('Image optimized:', optimized);
      
      const photoData = {
        date: Timestamp.now(),
        type,
        weight: undefined, // Could prompt for weight
        notes: undefined, // Could prompt for notes
      };
      
      // Upload using optimized images
      console.log('Uploading to Firebase...');
      await userProfileService.uploadProgressPhoto(
        optimized.full.uri, 
        photoData,
        optimized.thumbnail.uri
      );
      console.log('Upload complete, reloading photos...');
      await loadPhotos();
      
      // Show size reduction info
      // Calculate size reduction
      const reduction = optimized.full.size > 0 ? 
        Math.round((1 - optimized.full.size / (1024 * 1024 * 2)) * 100) : // Assume ~2MB original
        0;
      
      Alert.alert(
        'Success', 
        `Photo uploaded successfully!\n\nSize reduced by ${reduction}%\nOptimized: ${ImageOptimizer.formatFileSize(optimized.full.size)}`
      );
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', `Failed to upload photo: ${error.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = (photo: ProgressPhotoDocument) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await userProfileService.deleteProgressPhoto(photo.id, photo.imageUrl, photo.thumbnailUrl);
              await loadPhotos();
              setSelectedPhoto(null);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete photo');
            }
          },
        },
      ]
    );
  };

  const groupPhotosByDate = () => {
    const grouped: Record<string, ProgressPhotoDocument[]> = {};
    photos.forEach(photo => {
      const dateKey = format(photo.date.toDate(), 'MMMM d, yyyy');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(photo);
    });
    return grouped;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const groupedPhotos = groupPhotosByDate();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {Object.keys(groupedPhotos).length === 0 ? (
          <View style={styles.emptyState}>
            <Icon.Camera color={theme.colors.gray[400]} width={48} height={48} />
            <Text style={styles.emptyTitle}>No Progress Photos</Text>
            <Text style={styles.emptyText}>
              Track your transformation by adding progress photos
            </Text>
            <Button
              title="Add Your First Photo"
              onPress={handleAddPhoto}
              style={styles.emptyButton}
            />
          </View>
        ) : (
          Object.entries(groupedPhotos).map(([date, datePhotos]) => (
            <View key={date} style={styles.dateSection}>
              <Text style={styles.dateHeader}>{date}</Text>
              <View style={styles.photoGrid}>
                {datePhotos.map(photo => (
                  <TouchableOpacity
                    key={photo.id}
                    style={styles.photoItem}
                    onPress={() => setSelectedPhoto(photo)}
                  >
                    <Image
                      source={{ uri: photo.thumbnailUrl || photo.imageUrl }}
                      style={styles.thumbnail}
                    />
                    <View style={styles.photoLabel}>
                      <Text style={styles.photoType}>
                        {photo.type.charAt(0).toUpperCase() + photo.type.slice(1)}
                      </Text>
                      {photo.weight && (
                        <Text style={styles.photoWeight}>{photo.weight} lbs</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {photos.length > 0 && (
        <FloatingActionButton
          onPress={handleAddPhoto}
          style={styles.fab}
        />
      )}

      {/* Photo Type Selector Modal */}
      <Modal
        visible={showTypeSelector}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTypeSelector(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTypeSelector(false)}
        >
          <View style={styles.typeSelector}>
            <Text style={styles.typeSelectorTitle}>Select Photo Type</Text>
            {(['front', 'side', 'back'] as PhotoType[]).map(type => (
              <TouchableOpacity
                key={type}
                style={styles.typeOption}
                onPress={() => handleTypeSelected(type)}
              >
                <Text style={styles.typeOptionText}>
                  {type.charAt(0).toUpperCase() + type.slice(1)} View
                </Text>
                <Icon.ChevronRight color={theme.colors.gray[400]} width={20} height={20} />
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Full Screen Photo Modal */}
      <Modal
        visible={!!selectedPhoto}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <View style={styles.fullScreenModal}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedPhoto(null)}
          >
            <Icon.X color="white" width={24} height={24} />
          </TouchableOpacity>
          
          {selectedPhoto && (
            <>
              <Image
                source={{ uri: selectedPhoto.imageUrl }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
              
              <View style={styles.photoInfo}>
                <Text style={styles.photoInfoDate}>
                  {format(selectedPhoto.date.toDate(), 'MMMM d, yyyy')}
                </Text>
                <Text style={styles.photoInfoType}>
                  {selectedPhoto.type.charAt(0).toUpperCase() + selectedPhoto.type.slice(1)} View
                </Text>
                {selectedPhoto.weight && (
                  <Text style={styles.photoInfoWeight}>{selectedPhoto.weight} lbs</Text>
                )}
                {selectedPhoto.notes && (
                  <Text style={styles.photoInfoNotes}>{selectedPhoto.notes}</Text>
                )}
              </View>
              
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeletePhoto(selectedPhoto)}
              >
                <Icon.Trash2 color="white" width={20} height={20} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>

      {uploading && (
        <View style={styles.uploadingOverlay}>
          <View style={styles.uploadingContent}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.uploadingText}>Uploading photo...</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    paddingTop: 100,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '600',
    color: theme.colors.gray[800],
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.gray[600],
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  emptyButton: {
    paddingHorizontal: theme.spacing.xl,
  },
  dateSection: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  dateHeader: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.gray[800],
    marginBottom: theme.spacing.sm,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  photoItem: {
    width: imageSize,
    height: imageSize,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.gray[100],
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  photoLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: theme.spacing.sm,
  },
  photoType: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500',
    color: 'white',
  },
  photoWeight: {
    fontSize: theme.typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  fab: {
    position: 'absolute',
    right: theme.spacing.md,
    bottom: theme.spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeSelector: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },
  typeSelectorTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.gray[800],
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  typeOptionText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.gray[700],
  },
  fullScreenModal: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: theme.spacing.md,
    zIndex: 10,
    padding: theme.spacing.sm,
  },
  fullScreenImage: {
    width: '100%',
    height: '80%',
  },
  photoInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: theme.spacing.lg,
  },
  photoInfoDate: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: 'white',
    marginBottom: theme.spacing.xs,
  },
  photoInfoType: {
    fontSize: theme.typography.fontSize.base,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: theme.spacing.xs,
  },
  photoInfoWeight: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: theme.spacing.xs,
  },
  photoInfoNotes: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
  },
  deleteButton: {
    position: 'absolute',
    bottom: theme.spacing.lg,
    right: theme.spacing.lg,
    backgroundColor: theme.colors.error,
    borderRadius: theme.borderRadius.full,
    padding: theme.spacing.md,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingContent: {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  uploadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.gray[700],
  },
});