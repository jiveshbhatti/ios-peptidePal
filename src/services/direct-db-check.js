// Direct database check script to include in the production app bundle
// This will help us diagnose column issues
import { supabase } from './supabase';
import { generateUUID } from '@/utils/uuid';

/**
 * This function attempts to query both column name variants
 * and logs which one succeeds
 */
export async function checkDbColumnNames() {
  console.log("🔍 DIRECT DB COLUMN CHECK:");
  console.log("🔍 Database URL:", supabase.supabaseUrl);
  
  try {
    // Create a test peptide to check which column names work using proper UUID format
    const testId = generateUUID();
    const testPeptide = {
      id: testId,
      name: 'TEST-COLUMN-CHECK',
      vials: [{ id: generateUUID(), isActive: true, remainingAmountUnits: 10 }]
    };
    
    // Insert the test peptide
    console.log("🔍 Inserting test peptide with ID:", testId);
    const { data: insertData, error: insertError } = await supabase
      .from('peptides')
      .insert(testPeptide);
      
    if (insertError) {
      console.log("❌ Failed to insert test peptide:", insertError.message);
      return;
    } else {
      console.log("✅ Test peptide inserted successfully");
    }
    
    // Test 1: Check camelCase columns
    console.log("\n🔍 Test 1: Testing camelCase column names (doseLogs)");
    const camelCaseUpdate = { "doseLogs": [{ id: 'test-log', date: new Date().toISOString() }] };
    console.log("Sending update with payload:", JSON.stringify(camelCaseUpdate));
    
    const { data: camelData, error: camelError } = await supabase
      .from('peptides')
      .update(camelCaseUpdate)
      .eq('id', testId)
      .select();
      
    if (camelError) {
      console.log("❌ camelCase update failed:", camelError.message);
      console.log("Error details:", JSON.stringify(camelError));
    } else {
      console.log("✅ camelCase update succeeded");
      console.log("Response data:", JSON.stringify(camelData));
    }
    
    // Test 2: Check lowercase columns
    console.log("\n🔍 Test 2: Testing lowercase column names (doselogs)");
    const lowerCaseUpdate = { doselogs: [{ id: 'test-log-2', date: new Date().toISOString() }] };
    console.log("Sending update with payload:", JSON.stringify(lowerCaseUpdate));
    
    const { data: lowerData, error: lowerError } = await supabase
      .from('peptides')
      .update(lowerCaseUpdate)
      .eq('id', testId)
      .select();
      
    if (lowerError) {
      console.log("❌ lowercase update failed:", lowerError.message);
      console.log("Error details:", JSON.stringify(lowerError));
    } else {
      console.log("✅ lowercase update succeeded");
      console.log("Response data:", JSON.stringify(lowerData));
    }
    
    // Test 3: Try both at once
    console.log("\n🔍 Test 3: Testing both column names in the same update");
    const bothUpdate = { 
      doseLogs: [{ id: 'test-log-3a', date: new Date().toISOString() }],
      doselogs: [{ id: 'test-log-3b', date: new Date().toISOString() }]
    };
    console.log("Sending update with payload:", JSON.stringify(bothUpdate));
    
    const { data: bothData, error: bothError } = await supabase
      .from('peptides')
      .update(bothUpdate)
      .eq('id', testId)
      .select();
      
    if (bothError) {
      console.log("❌ Combined update failed:", bothError.message);
    } else {
      console.log("✅ Combined update succeeded");
      console.log("Response data:", JSON.stringify(bothData));
      
      // Check which field was actually updated
      if (bothData[0] && 'doseLogs' in bothData[0]) {
        console.log("✅ Database used camelCase 'doseLogs' field");
      }
      if (bothData[0] && 'doselogs' in bothData[0]) {
        console.log("✅ Database used lowercase 'doselogs' field");
      }
    }
    
    // Test 4: Check the raw table structure
    console.log("\n🔍 Test 4: Fetching complete table structure");
    try {
      const { data: testData, error: testError } = await supabase
        .from('peptides')
        .select('*')
        .eq('id', testId)
        .maybeSingle();
        
      if (testError) {
        console.log("❌ Failed to fetch test peptide:", testError.message);
      } else if (testData) {
        console.log("✅ Test peptide retrieved");
        console.log("All column names in database:", Object.keys(testData).join(', '));
        console.log("Dose logs column found:", 'doseLogs' in testData ? 'doseLogs (camelCase)' : 
                                             'doselogs' in testData ? 'doselogs (lowercase)' : 'NOT FOUND');
      }
    } catch (err) {
      console.log("❌ Error checking test peptide:", err.message);
    }
    
    // Clean up the test peptide
    console.log("\n🧹 Cleaning up test data");
    const { error: deleteError } = await supabase
      .from('peptides')
      .delete()
      .eq('id', testId);
      
    if (deleteError) {
      console.log("❌ Failed to delete test peptide:", deleteError.message);
    } else {
      console.log("✅ Test peptide deleted successfully");
    }
    
    // Print summary
    console.log("\n📊 COLUMN NAME TEST SUMMARY:");
    console.log(`Database: ${supabase.supabaseUrl}`);
    console.log(`camelCase 'doseLogs' works: ${!camelError ? 'YES ✅' : 'NO ❌'}`);
    console.log(`lowercase 'doselogs' works: ${!lowerError ? 'YES ✅' : 'NO ❌'}`);
    console.log("\n");
    
  } catch (err) {
    console.log("❌ Unexpected error during column check:", err.message);
  }
}

// Add a direct helper to try updating with a specific column name
export async function tryUpdateColumn(peptideId, columnName, value) {
  try {
    console.log(`🔍 Trying to update column "${columnName}" for peptide ${peptideId}`);
    console.log(`🔍 Database URL: ${supabase.supabaseUrl}`);
    
    // Create update object with dynamic key - IMPORTANT: Only include ONE key
    // Never add multiple column variants as this causes schema cache errors
    const update = {};
    update[columnName] = value;
    
    console.log(`Full update payload: ${JSON.stringify(update)}`);
    
    // First select the peptide to see what's already there
    const { data: peptideData, error: selectError } = await supabase
      .from('peptides')
      .select('*')
      .eq('id', peptideId)
      .maybeSingle();
      
    if (selectError) {
      console.log(`❌ Could not fetch peptide ${peptideId}:`, selectError.message);
    } else {
      console.log(`✅ Current peptide data:`);
      console.log(`   - Column names: ${Object.keys(peptideData).join(', ')}`);
      console.log(`   - Has camelCase doseLogs: ${'doseLogs' in peptideData}`);
      console.log(`   - Has lowercase doselogs: ${'doselogs' in peptideData}`);
    }
    
    // Try to update with ONLY the specified column name
    console.log(`Attempting update with column "${columnName}"...`);
    const { data, error } = await supabase
      .from('peptides')
      .update(update)
      .eq('id', peptideId)
      .select();
      
    if (error) {
      console.log(`❌ Update failed for column "${columnName}":`, error.message);
      console.log(`Error details:`, JSON.stringify(error));
      return false;
    } else {
      console.log(`✅ Update succeeded for column "${columnName}"`);
      return true;
    }
  } catch (err) {
    console.log(`❌ Unexpected error updating column "${columnName}":`, err.message);
    return false;
  }
}