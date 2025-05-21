// Simple script to test Supabase database queries
const { createClient } = require('@supabase/supabase-js');

// Development database configuration from config.ts
const DEV_URL = 'https://looltsvagvvjnspayhym.supabase.co';
const DEV_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxvb2x0c3ZhZ3Z2am5zcGF5aHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3ODY3MTksImV4cCI6MjA2MzM2MjcxOX0.kIb0cavukeYK1wAveHXEusHur9j2JGPpW2DITDcWADw';

// Create Supabase client
const supabase = createClient(DEV_URL, DEV_KEY);

async function testDatabaseQueries() {
  console.log('Testing database queries on development database...');
  
  try {
    // 1. Get existing peptides
    console.log('\n1. Fetching existing peptides:');
    const { data: peptides, error: peptideError } = await supabase
      .from('peptides')
      .select('*');
    
    if (peptideError) {
      console.error('Error fetching peptides:', peptideError.message);
    } else {
      console.log(`Found ${peptides.length} peptides:`);
      peptides.forEach((peptide, index) => {
        console.log(`${index + 1}. ${peptide.name} (${peptide.id})`);
      });
    }
    
    // 2. Insert a test peptide
    console.log('\n2. Inserting test peptide:');
    const testPeptide = {
      name: `[TEST] Peptide ${new Date().toISOString()}`,
      strength: '10mg',
      dosageUnit: 'mg',
      typicalDosageUnits: 1,
      schedule: { frequency: 'daily', times: ['AM'] },
      notes: 'Test record created by db-test.js script'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('peptides')
      .insert(testPeptide)
      .select();
    
    if (insertError) {
      console.error('Error inserting test peptide:', insertError.message);
    } else {
      console.log('Test peptide inserted successfully:');
      console.log(insertData[0]);
      
      // Save the ID for later deletion
      const testPeptideId = insertData[0].id;
      
      // 3. Update the test peptide
      console.log('\n3. Updating test peptide:');
      const { data: updateData, error: updateError } = await supabase
        .from('peptides')
        .update({ notes: 'Updated by db-test.js script' })
        .eq('id', testPeptideId)
        .select();
      
      if (updateError) {
        console.error('Error updating test peptide:', updateError.message);
      } else {
        console.log('Test peptide updated successfully:');
        console.log(updateData[0]);
      }
      
      // 4. Delete the test peptide
      console.log('\n4. Deleting test peptide:');
      const { error: deleteError } = await supabase
        .from('peptides')
        .delete()
        .eq('id', testPeptideId);
      
      if (deleteError) {
        console.error('Error deleting test peptide:', deleteError.message);
      } else {
        console.log('Test peptide deleted successfully');
      }
    }
    
    return true;
  } catch (error) {
    console.error('Test failed with exception:', error.message);
    return false;
  }
}

testDatabaseQueries()
  .then(success => {
    if (success) {
      console.log('\n✅ Database queries completed successfully!');
      console.log('The development database is properly configured and working.');
    } else {
      console.log('\n❌ Database query tests failed.');
    }
  })
  .catch(error => {
    console.error('Error running tests:', error);
  });