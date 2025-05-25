import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import {
  UserProfileDocument,
  WeightEntryDocument,
  BodyMeasurementDocument,
  ProgressPhotoDocument,
  NewUserProfileDocument,
  NewWeightEntryDocument,
  NewBodyMeasurementDocument,
  NewProgressPhotoDocument,
  UpdateUserProfileDocument,
} from '@/types/firebase';
import { UserProfile, WeightEntry, BodyMeasurement } from '@/types/metrics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { uploadImageWithRetry } from '@/utils/firebase-storage-helper';

// We'll use a hardcoded user ID for now since we don't have auth
const USER_ID = 'default-user';
const PROFILE_COLLECTION = 'user_profiles';
const WEIGHT_COLLECTION = 'weight_entries';
const MEASUREMENTS_COLLECTION = 'body_measurements';
const PHOTOS_COLLECTION = 'progressPhotos';

class UserProfileService {
  // Convert Firebase document to app type
  private convertProfileFromFirebase(doc: UserProfileDocument): UserProfile {
    return {
      ...doc,
      dateOfBirth: doc.dateOfBirth ? doc.dateOfBirth.toDate().toISOString() : undefined,
      createdAt: doc.created_at.toDate().toISOString(),
      updatedAt: doc.updated_at.toDate().toISOString(),
    };
  }

  private convertWeightFromFirebase(doc: WeightEntryDocument): WeightEntry {
    return {
      ...doc,
      date: doc.date.toDate().toISOString(),
      createdAt: doc.created_at.toDate().toISOString(),
    };
  }

  private convertMeasurementFromFirebase(doc: BodyMeasurementDocument): BodyMeasurement {
    return {
      ...doc,
      date: doc.date.toDate().toISOString(),
      createdAt: doc.created_at.toDate().toISOString(),
    };
  }

  // User Profile Methods
  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, PROFILE_COLLECTION, USER_ID);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return this.convertProfileFromFirebase(docSnap.data() as UserProfileDocument);
      }
      
      // Create a default profile if none exists
      const defaultProfile: NewUserProfileDocument = {
        heightUnit: 'cm',
        goals: [],
      };
      
      await setDoc(docRef, {
        ...defaultProfile,
        id: USER_ID,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      });
      
      return this.getUserProfile();
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  async updateUserProfile(updates: UpdateUserProfileDocument): Promise<void> {
    try {
      const docRef = doc(db, PROFILE_COLLECTION, USER_ID);
      await updateDoc(docRef, {
        ...updates,
        updated_at: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Weight Entry Methods
  async getWeightEntries(limitCount: number = 100): Promise<WeightEntry[]> {
    try {
      const q = query(
        collection(db, WEIGHT_COLLECTION),
        where('userId', '==', USER_ID),
        orderBy('date', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => 
        this.convertWeightFromFirebase({ ...doc.data(), id: doc.id } as WeightEntryDocument)
      );
    } catch (error) {
      console.error('Error getting weight entries:', error);
      throw error;
    }
  }

  async addWeightEntry(entry: Omit<WeightEntry, 'id' | 'createdAt'>): Promise<string> {
    try {
      const newEntry: NewWeightEntryDocument = {
        userId: USER_ID,
        date: Timestamp.fromDate(new Date(entry.date)),
        weight: entry.weight,
        unit: entry.unit,
        notes: entry.notes,
      };
      
      const docRef = await addDoc(collection(db, WEIGHT_COLLECTION), {
        ...newEntry,
        created_at: Timestamp.now(),
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding weight entry:', error);
      throw error;
    }
  }

  async deleteWeightEntry(entryId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, WEIGHT_COLLECTION, entryId));
    } catch (error) {
      console.error('Error deleting weight entry:', error);
      throw error;
    }
  }

  // Body Measurement Methods
  async getBodyMeasurements(limitCount: number = 50): Promise<BodyMeasurement[]> {
    try {
      const q = query(
        collection(db, MEASUREMENTS_COLLECTION),
        where('userId', '==', USER_ID),
        orderBy('date', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => 
        this.convertMeasurementFromFirebase({ ...doc.data(), id: doc.id } as BodyMeasurementDocument)
      );
    } catch (error) {
      console.error('Error getting body measurements:', error);
      throw error;
    }
  }

  async addBodyMeasurement(measurement: Omit<BodyMeasurement, 'id' | 'createdAt'>): Promise<string> {
    try {
      const newMeasurement: NewBodyMeasurementDocument = {
        userId: USER_ID,
        date: Timestamp.fromDate(new Date(measurement.date)),
        chest: measurement.chest,
        waist: measurement.waist,
        hips: measurement.hips,
        bicepLeft: measurement.bicepLeft,
        bicepRight: measurement.bicepRight,
        thighLeft: measurement.thighLeft,
        thighRight: measurement.thighRight,
        calfLeft: measurement.calfLeft,
        calfRight: measurement.calfRight,
        neck: measurement.neck,
        shoulders: measurement.shoulders,
        unit: measurement.unit,
        notes: measurement.notes,
      };
      
      const docRef = await addDoc(collection(db, MEASUREMENTS_COLLECTION), {
        ...newMeasurement,
        created_at: Timestamp.now(),
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding body measurement:', error);
      throw error;
    }
  }

  async deleteBodyMeasurement(measurementId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, MEASUREMENTS_COLLECTION, measurementId));
    } catch (error) {
      console.error('Error deleting body measurement:', error);
      throw error;
    }
  }

  // Progress Photo Methods
  async getProgressPhotos(limitCount: number = 50): Promise<ProgressPhotoDocument[]> {
    try {
      const q = query(
        collection(db, PHOTOS_COLLECTION),
        where('userId', '==', USER_ID),
        orderBy('date', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      } as ProgressPhotoDocument));
    } catch (error: any) {
      // If index is not ready, fall back to simpler query
      if (error.code === 'failed-precondition' && error.message?.includes('index')) {
        console.warn('Index not ready, using fallback query without ordering');
        try {
          const fallbackQuery = query(
            collection(db, PHOTOS_COLLECTION),
            where('userId', '==', USER_ID),
            limit(limitCount)
          );
          
          const querySnapshot = await getDocs(fallbackQuery);
          const photos = querySnapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
          } as ProgressPhotoDocument));
          
          // Sort manually in memory
          return photos.sort((a, b) => {
            const dateA = a.date.toDate();
            const dateB = b.date.toDate();
            return dateB.getTime() - dateA.getTime();
          });
        } catch (fallbackError) {
          console.error('Fallback query also failed:', fallbackError);
          throw fallbackError;
        }
      }
      
      console.error('Error getting progress photos:', error);
      throw error;
    }
  }

  async uploadProgressPhoto(
    imageUri: string,
    photoData: Omit<ProgressPhotoDocument, 'id' | 'imageUrl' | 'thumbnailUrl' | 'createdAt' | 'userId'>,
    thumbnailUri?: string
  ): Promise<string> {
    try {
      // Create unique filename
      const timestamp = Date.now();
      const filename = `progress-photos/${USER_ID}/${timestamp}_${photoData.type}.jpg`;
      console.log('Storage filename:', filename);
      
      // Check if storage is initialized
      if (!storage) {
        throw new Error('Firebase Storage is not initialized');
      }
      
      console.log('Storage config:', {
        bucket: storage._bucket?.bucket,
        host: storage._host,
        protocol: storage._protocol,
        appId: storage._appId
      });
      
      // Upload main image with retry logic
      const metadata = {
        customMetadata: {
          userId: USER_ID,
          type: photoData.type,
          uploadedAt: new Date().toISOString()
        }
      };
      
      const { url: imageUrl } = await uploadImageWithRetry(filename, imageUri, metadata);
      
      // Upload thumbnail if provided
      let thumbnailUrl = imageUrl;
      if (thumbnailUri) {
        const thumbFilename = `progress-photos/${USER_ID}/${timestamp}_${photoData.type}_thumb.jpg`;
        const thumbMetadata = {
          customMetadata: {
            userId: USER_ID,
            type: photoData.type + '_thumb',
            uploadedAt: new Date().toISOString()
          }
        };
        
        const { url } = await uploadImageWithRetry(thumbFilename, thumbnailUri, thumbMetadata);
        thumbnailUrl = url;
      }
      
      // Save photo metadata to Firestore
      const newPhoto: NewProgressPhotoDocument = {
        userId: USER_ID,
        date: photoData.date instanceof Timestamp ? photoData.date : Timestamp.fromDate(new Date(photoData.date)),
        imageUrl,
        thumbnailUrl,
        type: photoData.type,
        weight: photoData.weight,
        notes: photoData.notes,
      };
      
      const docRef = await addDoc(collection(db, PHOTOS_COLLECTION), {
        ...newPhoto,
        created_at: Timestamp.now(),
      });
      
      return docRef.id;
    } catch (error: any) {
      console.error('Error uploading progress photo:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        serverResponse: error.serverResponse,
        customData: error.customData
      });
      
      // If it's a storage error, add more context
      if (error.code?.startsWith('storage/')) {
        console.error('Storage error - check if:');
        console.error('1. Storage bucket URL is correct');
        console.error('2. Storage rules allow write access');
        console.error('3. Firebase Storage is enabled in console');
        console.error('4. Current storage bucket:', storage._bucket?.bucket);
        
        if (error.code === 'storage/unknown') {
          console.error('Unknown storage error - common causes:');
          console.error('- Incorrect storage bucket URL');
          console.error('- Storage not enabled for project');
          console.error('- Network connectivity issues');
          console.error('- Invalid file format or corrupted blob');
        }
      }
      
      throw error;
    }
  }

  async deleteProgressPhoto(photoId: string, imageUrl: string, thumbnailUrl?: string): Promise<void> {
    try {
      // Delete main image from storage
      const storageRef = ref(storage, imageUrl);
      await deleteObject(storageRef);
      
      // Delete thumbnail if different from main image
      if (thumbnailUrl && thumbnailUrl !== imageUrl) {
        try {
          const thumbRef = ref(storage, thumbnailUrl);
          await deleteObject(thumbRef);
        } catch (error) {
          console.warn('Failed to delete thumbnail:', error);
        }
      }
      
      // Delete from Firestore
      await deleteDoc(doc(db, PHOTOS_COLLECTION, photoId));
    } catch (error) {
      console.error('Error deleting progress photo:', error);
      throw error;
    }
  }

  // Migration method to move data from AsyncStorage to Firebase
  async migrateFromAsyncStorage(): Promise<void> {
    try {
      // Migrate profile
      const profileData = await AsyncStorage.getItem('@PeptidePal:userProfile');
      if (profileData) {
        const profile = JSON.parse(profileData);
        await this.updateUserProfile({
          name: profile.name,
          email: profile.email,
          dateOfBirth: profile.dateOfBirth ? Timestamp.fromDate(new Date(profile.dateOfBirth)) : undefined,
          height: profile.height,
          heightUnit: profile.heightUnit,
          gender: profile.gender,
          activityLevel: profile.activityLevel,
          goals: profile.goals,
        });
      }

      // Migrate weight entries
      const weightData = await AsyncStorage.getItem('@PeptidePal:weightEntries');
      if (weightData) {
        const weights: WeightEntry[] = JSON.parse(weightData);
        for (const weight of weights) {
          await this.addWeightEntry({
            date: weight.date,
            weight: weight.weight,
            unit: weight.unit,
            notes: weight.notes,
          });
        }
      }

      // Migrate body measurements
      const measurementData = await AsyncStorage.getItem('@PeptidePal:bodyMeasurements');
      if (measurementData) {
        const measurements: BodyMeasurement[] = JSON.parse(measurementData);
        for (const measurement of measurements) {
          await this.addBodyMeasurement({
            date: measurement.date,
            chest: measurement.chest,
            waist: measurement.waist,
            hips: measurement.hips,
            bicepLeft: measurement.bicepLeft,
            bicepRight: measurement.bicepRight,
            thighLeft: measurement.thighLeft,
            thighRight: measurement.thighRight,
            calfLeft: measurement.calfLeft,
            calfRight: measurement.calfRight,
            neck: measurement.neck,
            shoulders: measurement.shoulders,
            unit: measurement.unit,
            notes: measurement.notes,
          });
        }
      }

      // Clear AsyncStorage after successful migration
      await AsyncStorage.multiRemove([
        '@PeptidePal:userProfile',
        '@PeptidePal:weightEntries',
        '@PeptidePal:bodyMeasurements',
      ]);
    } catch (error) {
      console.error('Error migrating from AsyncStorage:', error);
      throw error;
    }
  }
}

export const userProfileService = new UserProfileService();