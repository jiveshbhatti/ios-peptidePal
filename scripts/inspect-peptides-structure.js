/**
 * Inspect Peptides Collection Structure
 * 
 * This script examines the structure of the peptides collection
 * and its documents in Firestore to help diagnose issues.
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs,
  doc, 
  getDoc,
  collectionGroup
} = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAMnokBM7CVDE265ZLhZROjWrQ5w2DR2P0",
  authDomain: "peptidepal.firebaseapp.com",
  projectId: "peptidepal",
  storageBucket: "peptidepal.appspot.com", 
  messagingSenderId: "229078698562",
  appId: "1:229078698562:web:a3a431131daad253b7fbdb"
};

// Terminal colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Helper function to display object keys and types
function inspectObject(obj, indent = 0) {
  const padding = ' '.repeat(indent);
  for (const [key, value] of Object.entries(obj)) {
    const valueType = typeof value;
    
    if (value === null) {
      console.log(`${padding}${key}: ${colors.red}null${colors.reset}`);
    } 
    else if (valueType === 'object') {
      if (value.toDate && typeof value.toDate === 'function') {
        console.log(`${padding}${key}: ${colors.green}Timestamp(${value.toDate().toISOString()})${colors.reset}`);
      } else if (Array.isArray(value)) {
        console.log(`${padding}${key}: ${colors.blue}Array[${value.length}]${colors.reset}`);
        if (value.length > 0) {
          console.log(`${padding}  - First item: ${typeof value[0]} ${JSON.stringify(value[0]).substring(0, 50)}`);
        }
      } else {
        console.log(`${padding}${key}: ${colors.cyan}Object${colors.reset}`);
        inspectObject(value, indent + 2);
      }
    }
    else {
      const displayValue = valueType === 'string' 
        ? `"${value.length > 50 ? value.substring(0, 47) + '...' : value}"` 
        : value;
      console.log(`${padding}${key}: ${colors.magenta}${valueType}${colors.reset} ${displayValue}`);
    }
  }
}

async function inspectPeptidesCollection() {
  console.log(`${colors.cyan}===== INSPECTING FIRESTORE PEPTIDES COLLECTION =====${colors.reset}`);
  
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig, 'inspect-peptides-app');
    const db = getFirestore(app);
    
    console.log(`${colors.yellow}Connected to Firebase project: ${firebaseConfig.projectId}${colors.reset}`);
    
    // 1. Examine peptides collection
    console.log(`\n${colors.blue}1. PEPTIDES COLLECTION${colors.reset}`);
    const peptideSnapshot = await getDocs(collection(db, 'peptides'));
    console.log(`Found ${peptideSnapshot.size} peptide documents`);
    
    if (peptideSnapshot.size > 0) {
      // Show first peptide in detail
      const firstPeptide = peptideSnapshot.docs[0];
      console.log(`\n${colors.green}First Peptide:${colors.reset}`);
      console.log(`ID: ${firstPeptide.id}`);
      console.log(`Data structure:`);
      inspectObject(firstPeptide.data(), 2);
      
      // 2. Check for subcollections on first peptide
      console.log(`\n${colors.blue}2. SUBCOLLECTIONS FOR PEPTIDE ${firstPeptide.id}${colors.reset}`);
      
      // Try to access vials subcollection
      console.log(`\n${colors.yellow}Vials Subcollection:${colors.reset}`);
      try {
        const vialsSnapshot = await getDocs(collection(db, 'peptides', firstPeptide.id, 'vials'));
        console.log(`Found ${vialsSnapshot.size} vial documents`);
        
        if (vialsSnapshot.size > 0) {
          const firstVial = vialsSnapshot.docs[0];
          console.log(`First Vial ID: ${firstVial.id}`);
          console.log(`Data structure:`);
          inspectObject(firstVial.data(), 2);
        }
      } catch (error) {
        console.log(`${colors.red}Error accessing vials subcollection: ${error.message}${colors.reset}`);
      }
      
      // Try both "doseLogs" and "doselogs" subcollections
      console.log(`\n${colors.yellow}DoseLogs Subcollection (camelCase):${colors.reset}`);
      try {
        const doseLogsSnapshot = await getDocs(collection(db, 'peptides', firstPeptide.id, 'doseLogs'));
        console.log(`Found ${doseLogsSnapshot.size} doseLogs documents`);
        
        if (doseLogsSnapshot.size > 0) {
          const firstDoseLog = doseLogsSnapshot.docs[0];
          console.log(`First DoseLog ID: ${firstDoseLog.id}`);
          console.log(`Data structure:`);
          inspectObject(firstDoseLog.data(), 2);
        }
      } catch (error) {
        console.log(`${colors.red}Error accessing doseLogs subcollection: ${error.message}${colors.reset}`);
      }
      
      console.log(`\n${colors.yellow}Doselogs Subcollection (lowercase):${colors.reset}`);
      try {
        const doselogsSnapshot = await getDocs(collection(db, 'peptides', firstPeptide.id, 'doselogs'));
        console.log(`Found ${doselogsSnapshot.size} doselogs documents`);
        
        if (doselogsSnapshot.size > 0) {
          const firstDoselog = doselogsSnapshot.docs[0];
          console.log(`First Doselog ID: ${firstDoselog.id}`);
          console.log(`Data structure:`);
          inspectObject(firstDoselog.data(), 2);
        }
      } catch (error) {
        console.log(`${colors.red}Error accessing doselogs subcollection: ${error.message}${colors.reset}`);
      }
    }
    
    // Scan for all subcollections that might be related to doses
    console.log(`\n${colors.blue}3. SCANNING FOR ALL DOSE RELATED SUBCOLLECTIONS${colors.reset}`);
    const peptides = peptideSnapshot.docs;
    
    // List of possible dose subcollection names
    const possibleNames = ['doseLogs', 'doselogs', 'dose_logs', 'doses', 'doseHistory', 'dosehistory'];
    
    for (const peptide of peptides) {
      console.log(`\nChecking peptide ${peptide.id} (${peptide.data().name})`);
      
      for (const subName of possibleNames) {
        try {
          const subSnapshot = await getDocs(collection(db, 'peptides', peptide.id, subName));
          console.log(`  - Subcollection '${subName}': ${subSnapshot.size} documents`);
        } catch (error) {
          console.log(`  - Subcollection '${subName}': ${colors.red}Error - ${error.message}${colors.reset}`);
        }
      }
    }
    
    console.log(`\n${colors.cyan}===== INSPECTION COMPLETE =====${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}Error:${colors.reset}`, error);
  }
}

// Run the inspection
inspectPeptidesCollection();