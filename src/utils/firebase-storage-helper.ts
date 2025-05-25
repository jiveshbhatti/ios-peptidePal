/**
 * Firebase Storage Helper for React Native
 * 
 * This module provides workarounds for common Firebase Storage issues in React Native
 */

import { Platform } from 'react-native';
import { ref, uploadBytes, getDownloadURL, UploadMetadata } from 'firebase/storage';
import { storage } from '@/services/firebase';

/**
 * Platform-specific blob creation
 */
export async function createBlobFromUri(uri: string): Promise<Blob> {
  if (Platform.OS === 'web') {
    // Web platform can use fetch
    const response = await fetch(uri);
    return response.blob();
  }
  
  // For iOS/Android, use XMLHttpRequest which handles local file URIs better
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function() {
      if (xhr.status === 200) {
        resolve(xhr.response);
      } else {
        reject(new Error(`Failed to load image: ${xhr.status}`));
      }
    };
    xhr.onerror = function() {
      reject(new Error('XMLHttpRequest failed'));
    };
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}

/**
 * Upload image with retries and better error handling
 */
export async function uploadImageWithRetry(
  path: string,
  uri: string,
  metadata?: UploadMetadata,
  maxRetries: number = 3
): Promise<{ url: string; snapshot: any }> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Upload attempt ${attempt}/${maxRetries} for ${path}`);
      
      // Create blob with platform-specific method
      const blob = await createBlobFromUri(uri);
      console.log(`Blob created: ${blob.size} bytes, type: ${blob.type}`);
      
      // Ensure blob has a type
      if (!blob.type || blob.type === '') {
        console.warn('Blob has no type, setting to image/jpeg');
        // Create a new blob with the correct type
        const typedBlob = new Blob([blob], { type: 'image/jpeg' });
        blob = typedBlob;
      }
      
      // Create storage reference
      const storageRef = ref(storage, path);
      
      // Upload with metadata
      const uploadMetadata: UploadMetadata = {
        contentType: blob.type || 'image/jpeg',
        ...metadata
      };
      
      console.log('Uploading with metadata:', uploadMetadata);
      const snapshot = await uploadBytes(storageRef, blob, uploadMetadata);
      
      // Get download URL
      const url = await getDownloadURL(snapshot.ref);
      console.log('Upload successful, URL:', url);
      
      return { url, snapshot };
    } catch (error: any) {
      lastError = error;
      console.error(`Upload attempt ${attempt} failed:`, error);
      
      if (error.code === 'storage/unauthorized') {
        // Don't retry auth errors
        throw error;
      }
      
      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // All retries failed
  throw lastError || new Error('Upload failed after all retries');
}