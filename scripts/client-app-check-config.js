/**
 * Client App Check Configuration Example
 * 
 * This script demonstrates how to properly configure a client
 * with App Check when it's enabled.
 */
const { initializeApp } = require('firebase/app');
const { 
  getFirestore,
  collection,
  getDocs
} = require('firebase/firestore');
const { 
  initializeAppCheck, 
  ReCaptchaV3Provider 
} = require('firebase/app-check');

console.log('APP CHECK CLIENT CONFIGURATION EXAMPLE');
console.log('This script shows how to configure App Check for client apps');
console.log('');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAMnokBM7CVDE265ZLhZROjWrQ5w2DR2P0",
  authDomain: "peptidepal.firebaseapp.com",
  projectId: "peptidepal",
  storageBucket: "peptidepal.appspot.com", 
  messagingSenderId: "229078698562",
  appId: "1:229078698562:web:a3a431131daad253b7fbdb"
};

/**
 * When App Check is enabled in Firebase, clients must be registered
 * or they'll be blocked from accessing the database, regardless of
 * security rules. This example shows the typical setup.
 */

// Initialize Firebase
console.log('Initializing Firebase...');
const app = initializeApp(firebaseConfig);
console.log('Firebase initialized');

// Initialize App Check (this would be in a browser environment)
// This code won't work in Node.js directly - it's for demonstration
console.log('\nApp Check Configuration (for web apps):');
console.log(`
// In your web app, you would initialize App Check like this:
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('YOUR_RECAPTCHA_SITE_KEY'),
  
  // Optional: set to true for debug tokens in development
  isTokenAutoRefreshEnabled: true,
  
  // Debug mode (set this in dev environments)
  debug: true
});

// Then you would use Firestore normally
const db = getFirestore(app);
// ...rest of your code
`);

console.log('\nALTERNATIVE APPROACH:');
console.log('Rather than configuring App Check in your client, you can:');
console.log('1. Go to Firebase Console > App Check');
console.log('2. Disable App Check temporarily for development');
console.log('3. Or enable "Debug Mode" which provides debug tokens automatically');

console.log('\nIn an iOS/React Native app, you would use the appropriate');
console.log('App Check provider for that platform, like DeviceCheckProvider.');

console.log('\nIMPORTANT: For scripts and testing environments, App Check');
console.log('can cause access issues. Disabling it temporarily is often');
console.log('the simplest approach for development and testing.');

console.log('\nFor more details, see: https://firebase.google.com/docs/app-check');