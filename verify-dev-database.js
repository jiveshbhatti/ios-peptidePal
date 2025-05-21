// Script to verify the development database setup and schema
// Run this with: node verify-dev-database.js

const { createClient } = require('@supabase/supabase-js');

// Development database credentials
const DEV_DB = {
  url: 'https://looltsvagvvjnspayhym.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxvb2x0c3ZhZ3Z2am5zcGF5aHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3ODY3MTksImV4cCI6MjA2MzM2MjcxOX0.kIb0cavukeYK1wAveHXEusHur9j2JGPpW2DITDcWADw',
};

async function verifyDevDatabase() {
  console.log('🔍 Verifying development database setup...');
  
  try {
    // Create Supabase client
    const supabase = createClient(DEV_DB.url, DEV_DB.key);
    
    // 1. Test basic connection
    console.log('\n📡 Testing connection to development database...');
    const { data: versionData, error: versionError } = await supabase.rpc('version');
    
    if (versionError) {
      console.error('❌ Connection failed:', versionError.message);
    } else {
      console.log('✅ Connection successful!');
      console.log(`🛢️  PostgreSQL version: ${versionData || 'Unknown'}`);
    }
    
    // 2. Check if peptides table exists
    console.log('\n🔍 Checking if peptides table exists...');
    try {
      // Try using the get_tables_info helper function
      const { data: tables, error: tablesError } = await supabase.rpc('get_tables_info');
      
      if (tablesError) {
        console.log('⚠️  Helper function get_tables_info not found, falling back to information_schema query');
        
        // Direct query if helper function doesn't exist
        const { data: tableInfo, error: tableError } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .eq('table_type', 'BASE TABLE');
        
        if (tableError) {
          console.error('❌ Error checking tables:', tableError.message);
        } else if (!tableInfo || tableInfo.length === 0) {
          console.log('❌ No tables found in the public schema');
        } else {
          const tableNames = tableInfo.map(t => t.table_name);
          console.log('📋 Tables in public schema:', tableNames.join(', '));
          
          if (tableNames.includes('peptides')) {
            console.log('✅ Peptides table exists!');
          } else {
            console.log('❌ Peptides table NOT found!');
          }
        }
      } else {
        // Helper function worked
        const tableNames = tables.map(t => t.table_name);
        console.log('📋 Tables in public schema:', tableNames.join(', '));
        
        if (tableNames.includes('peptides')) {
          console.log('✅ Peptides table exists!');
        } else {
          console.log('❌ Peptides table NOT found!');
        }
      }
    } catch (error) {
      console.error('❌ Error checking tables:', error.message);
    }
    
    // 3. Check peptides table schema
    console.log('\n🔍 Checking peptides table schema...');
    try {
      // Try using the get_columns_info helper function
      const { data: columns, error: columnsError } = await supabase.rpc('get_columns_info', {
        table_name_param: 'peptides'
      });
      
      if (columnsError) {
        console.log('⚠️  Helper function get_columns_info not found, falling back to information_schema query');
        
        // Direct query if helper function doesn't exist
        const { data: columnInfo, error: columnError } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type')
          .eq('table_schema', 'public')
          .eq('table_name', 'peptides');
        
        if (columnError) {
          console.error('❌ Error checking columns:', columnError.message);
        } else if (!columnInfo || columnInfo.length === 0) {
          console.log('❌ No columns found in the peptides table');
        } else {
          // Format column info for display
          const columnDetails = columnInfo.map(col => `${col.column_name} (${col.data_type})`);
          console.log('📋 Columns in peptides table:');
          columnDetails.forEach(col => console.log(`   - ${col}`));
          
          // Check for required columns
          const requiredColumns = ['id', 'name', 'dataaihint', 'schedule', 'vials', 'doselogs'];
          const missingColumns = requiredColumns.filter(
            col => !columnInfo.some(c => c.column_name.toLowerCase() === col.toLowerCase())
          );
          
          if (missingColumns.length === 0) {
            console.log('✅ All required columns are present!');
          } else {
            console.log('❌ Missing required columns:', missingColumns.join(', '));
          }
        }
      } else {
        // Helper function worked
        // Format column info for display
        const columnDetails = columns.map(col => `${col.column_name} (${col.data_type})`);
        console.log('📋 Columns in peptides table:');
        columnDetails.forEach(col => console.log(`   - ${col}`));
        
        // Check for required columns
        const requiredColumns = ['id', 'name', 'dataaihint', 'schedule', 'vials', 'doselogs'];
        const missingColumns = requiredColumns.filter(
          col => !columns.some(c => c.column_name.toLowerCase() === col.toLowerCase())
        );
        
        if (missingColumns.length === 0) {
          console.log('✅ All required columns are present!');
        } else {
          console.log('❌ Missing required columns:', missingColumns.join(', '));
        }
      }
    } catch (error) {
      console.error('❌ Error checking schema:', error.message);
    }
    
    // 4. Test a simple insert/delete operation
    console.log('\n🔧 Testing basic database operations...');
    try {
      // Try to insert a test record
      const testId = `test-${Date.now()}`;
      const testRecord = {
        id: testId,
        name: '[TEST] Verification Test',
        strength: 'Test',
        dosageUnit: 'mcg',
        typicalDosageUnits: 100,
        schedule: {},
        vials: [],
        doseLogs: [],
        dataAiHint: ''
      };
      
      const { error: insertError } = await supabase
        .from('peptides')
        .insert(testRecord);
      
      if (insertError) {
        console.error('❌ Insert test failed:', insertError.message);
      } else {
        console.log('✅ Insert test successful!');
        
        // Try to delete the test record
        const { error: deleteError } = await supabase
          .from('peptides')
          .delete()
          .eq('id', testId);
        
        if (deleteError) {
          console.error('❌ Delete test failed:', deleteError.message);
        } else {
          console.log('✅ Delete test successful!');
        }
      }
    } catch (error) {
      console.error('❌ Operation test failed:', error.message);
    }
    
    // Summary
    console.log('\n📊 Development Database Verification Summary:');
    console.log('-------------------------------------------');
    console.log('If you see all ✅ checks, your development database is correctly set up!');
    console.log('If there are any ❌ errors, please review the DEV_DATABASE_SETUP.md guide');
    console.log('and make sure you\'ve run the setup-dev-database-fixed.sql script.');
    
  } catch (error) {
    console.error('❌ Verification failed with an unexpected error:', error);
  }
}

// Run the verification
verifyDevDatabase();