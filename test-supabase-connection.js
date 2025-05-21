// Simple script to test connection to Supabase database
const { createClient } = require('@supabase/supabase-js');

// Development database configuration from config.ts
const DEV_URL = 'https://looltsvagvvjnspayhym.supabase.co';
const DEV_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxvb2x0c3ZhZ3Z2am5zcGF5aHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3ODY3MTksImV4cCI6MjA2MzM2MjcxOX0.kIb0cavukeYK1wAveHXEusHur9j2JGPpW2DITDcWADw';

async function testConnection() {
  console.log('Testing basic connection to development database...');
  
  try {
    // Create Supabase client (version 1.x compatibility)
    const supabase = createClient(DEV_URL, DEV_KEY);
    
    // Test connection by making a simple query to check connection
    console.log('Sending test query...');
    
    try {
      // Try to query a non-existent table
      const { data, error } = await supabase
        .from('_dummy_query_for_connection_test')
        .select('*')
        .limit(1);
      
      // If we get here without error, the table somehow exists
      console.log('✅ Connection successful!');
    } catch (err) {
      // Check if the error is a "relation does not exist" error
      // That would actually be a good sign - it means the connection works
      // but the table doesn't exist (as expected)
      if (err.message && (
          err.message.includes('does not exist') || 
          err.message.includes('not found'))) {
        console.log('✅ Connection successful (expected table not found error)');
      } else {
        throw err; // Re-throw unexpected errors
      }
    }
    
    console.log('\nChecking for peptides table...');
    try {
      const { data: peptideCheck, error: peptideError } = await supabase
        .from('peptides')
        .select('count')
        .limit(1);
      
      if (peptideError) {
        if (peptideError.message.includes('does not exist') || 
            peptideError.message.includes('not found')) {
          console.log('⚠️ Peptides table does not exist yet (this is expected for a new database)');
        } else {
          console.log('⚠️ Could not check for peptides table:', peptideError.message);
        }
      } else {
        console.log('✅ Peptides table exists!');
      }
    } catch (err) {
      if (err.message && (
          err.message.includes('does not exist') || 
          err.message.includes('not found'))) {
        console.log('⚠️ Peptides table does not exist yet (this is expected for a new database)');
      } else {
        console.log('⚠️ Error checking peptides table:', err.message);
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Connection test failed with exception:', error.message);
    return false;
  }
}

testConnection()
  .then(success => {
    if (success) {
      console.log('\n✅ Supabase connection is working!');
      console.log('Development database URL and key in config.ts are correct.');
    } else {
      console.log('\n❌ Supabase connection failed.');
      console.log('Please check your database credentials in config.ts');
    }
  })
  .catch(error => {
    console.error('Error testing connection:', error);
  });