/**
 * Helper functions for handling blobs in React Native
 * React Native's fetch/blob handling can be tricky with local file URIs
 */

export async function uriToBlob(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function() {
      resolve(xhr.response);
    };
    xhr.onerror = function() {
      reject(new Error('Failed to load image'));
    };
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}

export async function uploadImageToFirebase(
  uri: string,
  uploadFunction: (blob: Blob) => Promise<any>
): Promise<any> {
  try {
    // Method 1: Try XMLHttpRequest first (more reliable for local files)
    console.log('Attempting blob conversion with XMLHttpRequest...');
    const blob = await uriToBlob(uri);
    console.log('Blob created successfully:', { size: blob.size, type: blob.type });
    return await uploadFunction(blob);
  } catch (error) {
    console.error('XMLHttpRequest method failed:', error);
    
    // Method 2: Fallback to fetch
    console.log('Falling back to fetch method...');
    const response = await fetch(uri);
    const blob = await response.blob();
    return await uploadFunction(blob);
  }
}