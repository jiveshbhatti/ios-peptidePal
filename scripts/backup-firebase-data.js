#!/usr/bin/env node

/**
 * Firebase Data Backup Script
 * Creates a local backup of all Firebase data before making changes
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const fs = require('fs').promises;
const path = require('path');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC7o0SBCeBpogvdPSlHW7toigsM-XchpQE",
  authDomain: "peptidepal-e612e.firebaseapp.com",
  projectId: "peptidepal-e612e",
  storageBucket: "peptidepal-e612e.firebasestorage.app",
  messagingSenderId: "605301817652",
  appId: "1:605301817652:web:92e1701419e646a9cb96d8",
  measurementId: "G-0VHVCERXG2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Collections to backup
const COLLECTIONS = [
  'peptides',
  'inventory_peptides',
  'inventory_bac_water',
  'inventory_syringes',
  'inventory_other_items'
];

async function backupCollection(collectionName) {
  console.log(`Backing up ${collectionName}...`);
  const snapshot = await getDocs(collection(db, collectionName));
  
  const documents = [];
  for (const doc of snapshot.docs) {
    const data = { id: doc.id, ...doc.data() };
    
    // If it's the peptides collection, also backup subcollections
    if (collectionName === 'peptides') {
      // Get vials subcollection
      const vialsSnapshot = await getDocs(collection(db, 'peptides', doc.id, 'vials'));
      data.vials = vialsSnapshot.docs.map(vialDoc => ({
        id: vialDoc.id,
        ...vialDoc.data()
      }));
      
      // Get doseLogs subcollection
      const doseLogsSnapshot = await getDocs(collection(db, 'peptides', doc.id, 'doseLogs'));
      data.doseLogs = doseLogsSnapshot.docs.map(logDoc => ({
        id: logDoc.id,
        ...logDoc.data()
      }));
    }
    
    documents.push(data);
  }
  
  console.log(`  Found ${documents.length} documents`);
  return documents;
}

async function createBackup() {
  console.log('Starting Firebase backup...\n');
  
  const backup = {
    timestamp: new Date().toISOString(),
    project: 'peptidepal-e612e',
    collections: {}
  };
  
  try {
    // Backup each collection
    for (const collectionName of COLLECTIONS) {
      backup.collections[collectionName] = await backupCollection(collectionName);
    }
    
    // Create backups directory if it doesn't exist
    const backupsDir = path.join(__dirname, '..', 'backups', 'firebase');
    await fs.mkdir(backupsDir, { recursive: true });
    
    // Save backup to file
    const filename = `firebase-backup-${new Date().toISOString().replace(/:/g, '-')}.json`;
    const filepath = path.join(backupsDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(backup, null, 2));
    
    // Also save a "latest" copy
    const latestPath = path.join(backupsDir, 'firebase-backup-latest.json');
    await fs.writeFile(latestPath, JSON.stringify(backup, null, 2));
    
    console.log(`\n✅ Backup completed successfully!`);
    console.log(`📁 Saved to: ${filepath}`);
    console.log(`📁 Latest copy: ${latestPath}`);
    
    // Summary
    console.log('\nBackup Summary:');
    for (const [collection, docs] of Object.entries(backup.collections)) {
      console.log(`  - ${collection}: ${docs.length} documents`);
    }
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
    process.exit(1);
  }
}

// Run the backup
createBackup();