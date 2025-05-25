import { storage } from '@/services/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

export async function testStorageConnection() {
  try {
    console.log('Testing Firebase Storage connection...');
    
    // Check if storage is initialized
    if (!storage) {
      console.error('Storage is not initialized!');
      return false;
    }
    
    // Log storage configuration
    console.log('Storage app:', storage.app.name);
    console.log('Storage bucket:', storage._bucket?.bucket);
    
    // Try to create a reference
    const testRef = ref(storage, 'test/connection.txt');
    console.log('Test reference created:', testRef.fullPath);
    
    // Try to upload a simple text file
    const testData = 'Test connection at ' + new Date().toISOString();
    const snapshot = await uploadString(testRef, testData);
    console.log('Upload successful!');
    
    // Get download URL
    const url = await getDownloadURL(snapshot.ref);
    console.log('Download URL:', url);
    
    return true;
  } catch (error: any) {
    console.error('Storage test failed:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Server response:', error.serverResponse);
    return false;
  }
}