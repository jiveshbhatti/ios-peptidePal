// Script to test connection to the development database
// Use this to validate your development database configuration
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load config.ts
const configFile = fs.readFileSync('./src/config.ts', 'utf8');

// Extract DEV_DB values with regex
const urlRegex = /const DEV_DB[\s\S]*?url: '([^']+)'/;
const keyRegex = /const DEV_DB[\s\S]*?key: '([^']+)'/;

const urlMatch = configFile.match(urlRegex);
const keyMatch = configFile.match(keyRegex);

if (!urlMatch || !keyMatch) {
  console.error('Could not find database credentials in config.ts');
  process.exit(1);
}

const DEV_URL = urlMatch[1];
const DEV_KEY = keyMatch[1];

// Output the found credentials (partial key for security)
console.log('Found development credentials:');
console.log(`URL: ${DEV_URL}`);
console.log(`Key: ${DEV_KEY.substring(0, 8)}...${DEV_KEY.substring(DEV_KEY.length - 8)}`);

// Check if they're still default values
if (DEV_URL.includes('your-dev') || DEV_KEY.includes('your-dev')) {
  console.error('⚠️ Error: You need to update the development database credentials in src/config.ts');
  console.error('Please follow the instructions in DEV_DATABASE_SETUP.md');
  process.exit(1);
}

async function testConnection() {
  console.log('Testing connection to development database...');
  
  // Create Supabase client
  const supabase = createClient(DEV_URL, DEV_KEY);
  
  try {
    // First, check if the database connection works at all
    const { data: healthData, error: healthError } = await supabase
      .rpc('pg_typeof', { val: 1 })
      .single();
      
    if (healthError) {
      console.error('❌ Database connection failed:', healthError.message);
      return false;
    }
    
    console.log('✅ Basic database connection successful');
    
    // Test connection by checking for peptides table
    const { data, error } = await supabase
      .from('peptides')
      .select('*')
      .limit(1);
    
    if (error) {
      console.warn('⚠️ Peptides table check:', error.message);
      if (error.message.includes('not found') || error.message.includes('does not exist')) {
        console.log('The "peptides" table does not exist yet. This is normal for a new database.');
        console.log('We will try to create it for you...');
        
        // Try to create the peptides table
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS public.peptides (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT NOT NULL,
            strength TEXT,
            dosageUnit TEXT,
            typicalDosageUnits NUMERIC,
            schedule JSONB,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
          
          -- Create extension if it doesn't exist
          CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        `;
        
        const { error: createError } = await supabase.rpc('exec', { sql: createTableSQL });
        
        if (createError) {
          console.error('❌ Could not create peptides table:', createError.message);
          console.error('Please run the SQL setup from DEV_DATABASE_SETUP.md manually');
          return false;
        }
        
        console.log('✅ Created peptides table successfully');
      } else {
        return false;
      }
    } else {
      console.log('✅ Peptides table exists');
    }
    
    console.log('✅ Connection successful!');
    console.log(`Found ${data?.length || 0} peptides in development database`);
    
    // Try to insert a test record
    const testId = `test-${Date.now()}`;
    const { error: insertError } = await supabase
      .from('peptides')
      .insert({
        id: testId,
        name: '[TEST] Connection Test',
        strength: '10mg',
        dosageUnit: 'mg',
        typicalDosageUnits: 1,
        schedule: { frequency: 'daily', times: ['AM'] },
        notes: 'Test record - safe to delete'
      });
    
    if (insertError) {
      console.error('❌ Test insert failed:', insertError.message);
      return false;
    }
    
    console.log('✅ Test record inserted successfully');
    
    // Clean up test record
    const { error: deleteError } = await supabase
      .from('peptides')
      .delete()
      .eq('id', testId);
    
    if (deleteError) {
      console.warn('⚠️ Could not delete test record:', deleteError.message);
    } else {
      console.log('✅ Test record cleaned up');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
}

testConnection()
  .then(success => {
    if (success) {
      console.log('\n✅ Development database is properly configured and ready to use!');
      console.log('You can now use the "Sync with Web App" feature in the app.');
    } else {
      console.log('\n❌ Development database configuration needs attention.');
      console.log('Please check DEV_DATABASE_SETUP.md for troubleshooting.');
    }
  })
  .catch(error => {
    console.error('Error testing connection:', error);
  });