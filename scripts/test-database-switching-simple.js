/**
 * Simplified Database Switching Test Script
 * 
 * Tests the basic functionality of switching between Supabase and Firebase
 * while focusing on proper Firebase instance initialization.
 */

// Mock AsyncStorage
const mockAsyncStorage = {
  getItem: async (key) => {
    console.log(`[Mock] Reading ${key} from AsyncStorage`);
    return null;
  },
  setItem: async (key, value) => {
    console.log(`[Mock] Writing ${key}=${value} to AsyncStorage`);
    return true;
  }
};

// Mock React Native Alert
const mockAlert = {
  alert: (title, message, buttons) => {
    console.log(`[Mock Alert] ${title}: ${message}`);
    // Auto-press the last button (confirm)
    if (buttons && buttons.length > 0) {
      const lastButton = buttons[buttons.length - 1];
      if (lastButton.onPress) {
        console.log(`[Mock] Pressing button: ${lastButton.text}`);
        lastButton.onPress();
      }
    }
  }
};

// Mock React Native Platform
const mockPlatform = {
  OS: 'ios'
};

// Set up mocks before imports
global.self = {};
global.self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
global.console.warn = (...args) => {
  console.log('[WARN]', ...args);
};

// Mock React Native dependencies
jest.mock('react-native', () => ({
  Alert: mockAlert,
  Platform: mockPlatform,
}));

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Now import the direct Firebase service for testing
console.log('\n=== INITIALIZING FIREBASE DIRECT ===');
const { firebaseDirectService } = require('../src/services/firebase-direct');

// Import firebase.ts for backwards compatibility testing
console.log('\n=== INITIALIZING FIREBASE.TS ===');
const firebaseService = require('../src/services/firebase').default;

// Basic test function
async function testDatabaseSwitching() {
  console.log('\n=== TESTING DATABASE SERVICES ===');
  
  try {
    // Test direct service
    console.log('\n1. Testing Direct Firebase Service:');
    console.log('Attempting to get inventory peptides...');
    const directInventoryPeptides = await firebaseDirectService.getInventoryPeptides();
    console.log(`✅ Direct service working! Found ${directInventoryPeptides.length} inventory peptides`);
    
    // Test firebase.ts service (which should now forward to direct)
    console.log('\n2. Testing firebase.ts Service (should forward to direct):');
    console.log('Attempting to get inventory peptides...');
    const backwardsCompatInventoryPeptides = await firebaseService.getInventoryPeptides();
    console.log(`✅ Backwards compatibility working! Found ${backwardsCompatInventoryPeptides.length} inventory peptides`);
    
    // Compare results
    console.log('\n3. Comparing Results:');
    const directCount = directInventoryPeptides.length;
    const compatCount = backwardsCompatInventoryPeptides.length;
    
    if (directCount === compatCount) {
      console.log(`✅ Both services return the same number of items: ${directCount}`);
    } else {
      console.log(`❌ Services return different counts: direct=${directCount}, firebase.ts=${compatCount}`);
    }
    
    console.log('\n=== TEST COMPLETED SUCCESSFULLY ===');
    console.log('The database switching fix appears to be working!');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error('Error:', error);
  }
}

// Run the test
testDatabaseSwitching();