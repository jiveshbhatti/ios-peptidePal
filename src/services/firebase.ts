/**
 * Firebase Service
 * 
 * IMPORTANT: This file is now just a proxy to firebase-direct.js
 * We're keeping this file for backward compatibility with existing imports.
 */

// Import from the firebase-wrapper which forwards to firebase-direct
import firebaseService, { firestoreDb, firebaseApp, storage } from './firebase-wrapper';

// For compatibility with older code
const db = firestoreDb;
const app = firebaseApp;

// Export the service instance
export default firebaseService;

// Export the Firebase instances for backward compatibility
export { db, app, storage, firebaseService };