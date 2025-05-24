/**
 * Firebase Service Wrapper
 * 
 * This module forwards all service calls to the proper firebase-direct module.
 * It serves as a compatibility layer to maintain existing import paths.
 */
import { firebaseDirectService, firestoreDb, firebaseApp, storage } from './firebase-direct';
import { enableNetwork, disableNetwork } from 'firebase/firestore';

// Set up global error handler that can be used by other modules
if (typeof global !== 'undefined') {
  global.handleFirebaseNetworkError = async () => {
    try {
      console.log('Network temporarily disabled for reset');
      await disableNetwork(firestoreDb);
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Network re-enabled after reset');
      await enableNetwork(firestoreDb);
      return true;
    } catch (error) {
      console.warn('Connection reset error:', error);
      return false;
    }
  };
}

// Create a proxy that forwards all calls to the direct service
const firebaseService = new Proxy({}, {
  get: function(target, prop) {
    // If the property exists in the direct service, return it
    if (prop in firebaseDirectService) {
      return firebaseDirectService[prop];
    }
    
    // Otherwise provide a reasonable default
    console.warn(`Warning: Accessing undefined method ${prop.toString()} on firebaseService`);
    return () => { 
      console.error(`Error: Method ${prop.toString()} not implemented in firebaseService`);
      return null;
    };
  }
});

// Export the service and instances
export default firebaseService;
export { firebaseService, firestoreDb, firebaseApp, storage };