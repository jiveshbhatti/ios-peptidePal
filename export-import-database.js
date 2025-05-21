// Script to export database schema and data from production and import to development
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load database credentials from config
const configFile = fs.readFileSync('./src/config.ts', 'utf8');
const prodUrlMatch = configFile.match(/const PRODUCTION_DB[\s\S]*?url: '([^']+)'/);
const prodKeyMatch = configFile.match(/const PRODUCTION_DB[\s\S]*?key: '([^']+)'/);
const devUrlMatch = configFile.match(/const DEV_DB[\s\S]*?url: '([^']+)'/);
const devKeyMatch = configFile.match(/const DEV_DB[\s\S]*?key: '([^']+)'/);

if (!prodUrlMatch || !prodKeyMatch || !devUrlMatch || !devKeyMatch) {
  console.error('Could not find database credentials in config.ts');
  process.exit(1);
}

const PROD_URL = prodUrlMatch[1];
const PROD_KEY = prodKeyMatch[1];
const DEV_URL = devUrlMatch[1];
const DEV_KEY = devKeyMatch[1];

// Create Supabase clients
const prodClient = createClient(PROD_URL, PROD_KEY);
const devClient = createClient(DEV_URL, DEV_KEY);

// Create directory for export
const exportDir = path.join(__dirname, 'db-export');
if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir);
}

async function getTables() {
  try {
    // This is a more reliable way to get tables using system catalog
    const { data, error } = await prodClient.rpc('get_tables_info');
    
    if (error) {
      console.log('Could not get tables using RPC, trying alternate method...');
      return getTablesAlternative();
    }
    
    if (!data || !Array.isArray(data)) {
      console.log('No tables returned from RPC, trying alternate method...');
      return getTablesAlternative();
    }
    
    return data.map(t => t.table_name);
  } catch (err) {
    console.error('Error getting tables:', err);
    return getTablesAlternative();
  }
}

async function getTablesAlternative() {
  // Fallback method - get data from a few known tables
  return ['peptides'];
}

async function exportTable(tableName) {
  console.log(`Exporting table: ${tableName}`);
  
  try {
    // 1. Export table definition
    const tableDefQuery = `SELECT column_name, data_type, is_nullable, column_default
                          FROM information_schema.columns
                          WHERE table_name = '${tableName}'
                          ORDER BY ordinal_position`;
                          
    const { data: columns, error: columnsError } = await prodClient.rpc('run_query', { query: tableDefQuery });
    
    if (columnsError) {
      console.warn(`Could not get columns for table ${tableName}:`, columnsError.message);
    } else {
      fs.writeFileSync(
        path.join(exportDir, `${tableName}_schema.json`),
        JSON.stringify(columns, null, 2)
      );
      console.log(`✅ Exported schema for ${tableName}`);
    }
    
    // 2. Export table data
    const { data, error } = await prodClient
      .from(tableName)
      .select('*');
    
    if (error) {
      console.error(`Error exporting data for ${tableName}:`, error.message);
      return false;
    }
    
    if (!data || data.length === 0) {
      console.log(`No data found in table ${tableName}`);
      return true;
    }
    
    fs.writeFileSync(
      path.join(exportDir, `${tableName}_data.json`),
      JSON.stringify(data, null, 2)
    );
    
    console.log(`✅ Exported ${data.length} rows from ${tableName}`);
    return true;
  } catch (err) {
    console.error(`Error exporting table ${tableName}:`, err);
    return false;
  }
}

async function generateCreateTableSQL(tableName, columns) {
  // Generate SQL to create the table in development
  let sql = `CREATE TABLE IF NOT EXISTS public.${tableName} (\n`;
  
  // Add columns
  const columnDefs = columns.map(col => {
    const notNull = col.is_nullable === 'NO' ? ' NOT NULL' : '';
    const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
    return `  ${col.column_name} ${col.data_type}${notNull}${defaultVal}`;
  });
  
  sql += columnDefs.join(',\n');
  sql += '\n);\n\n';
  
  // Add RLS policies
  sql += `-- Set up row level security (RLS)\n`;
  sql += `ALTER TABLE public.${tableName} ENABLE ROW LEVEL SECURITY;\n\n`;
  sql += `-- Create policies\n`;
  sql += `CREATE POLICY "Enable read access for all users" ON public.${tableName}\n`;
  sql += `    FOR SELECT USING (true);\n\n`;
  sql += `CREATE POLICY "Enable insert for all users" ON public.${tableName}\n`;
  sql += `    FOR INSERT WITH CHECK (true);\n\n`;
  sql += `CREATE POLICY "Enable update for all users" ON public.${tableName}\n`;
  sql += `    FOR UPDATE USING (true);\n\n`;
  sql += `CREATE POLICY "Enable delete for all users" ON public.${tableName}\n`;
  sql += `    FOR DELETE USING (true);\n`;
  
  return sql;
}

async function createTableInDevelopment(tableName) {
  try {
    // Load schema and data
    const schemaFile = path.join(exportDir, `${tableName}_schema.json`);
    const dataFile = path.join(exportDir, `${tableName}_data.json`);
    
    if (!fs.existsSync(schemaFile)) {
      console.error(`Schema file does not exist for ${tableName}`);
      return false;
    }
    
    const columns = JSON.parse(fs.readFileSync(schemaFile, 'utf8'));
    
    // Generate create table SQL
    const sql = await generateCreateTableSQL(tableName, columns);
    fs.writeFileSync(path.join(exportDir, `${tableName}_create.sql`), sql);
    
    console.log(`Created SQL for ${tableName}`);
    console.log('Please run this SQL in your development database from the Supabase SQL Editor.');
    
    // We cannot execute the SQL directly through the Supabase JS client
    // You'll need to copy and run the SQL manually in the Supabase dashboard
    
    return true;
  } catch (err) {
    console.error(`Error creating table ${tableName} in development:`, err);
    return false;
  }
}

async function importDataToDevelopment(tableName) {
  try {
    // Load data
    const dataFile = path.join(exportDir, `${tableName}_data.json`);
    
    if (!fs.existsSync(dataFile)) {
      console.warn(`No data file exists for ${tableName}`);
      return false;
    }
    
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    
    if (!data || data.length === 0) {
      console.log(`No data to import for ${tableName}`);
      return true;
    }
    
    console.log(`Importing ${data.length} rows to ${tableName} in development database...`);
    
    // Prepare data - prefix names with [TEST]
    const preparedData = data.map(item => {
      // Special handling for peptides table to add [TEST] prefix
      if (tableName === 'peptides' && item.name) {
        return {
          ...item,
          name: item.name.startsWith('[TEST]') ? item.name : `[TEST] ${item.name}`
        };
      }
      return item;
    });
    
    // Insert data in batches to avoid timeouts
    const batchSize = 20;
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < preparedData.length; i += batchSize) {
      const batch = preparedData.slice(i, i + batchSize);
      
      try {
        const { error } = await devClient
          .from(tableName)
          .upsert(batch, { onConflict: 'id' });
        
        if (error) {
          console.error(`Error importing batch for ${tableName}:`, error.message);
          failCount += batch.length;
        } else {
          successCount += batch.length;
          console.log(`Imported batch ${i/batchSize + 1} (${batch.length} rows) to ${tableName}`);
        }
      } catch (err) {
        console.error(`Error with batch ${i/batchSize + 1} for ${tableName}:`, err.message);
        failCount += batch.length;
      }
    }
    
    console.log(`Import complete for ${tableName}: ${successCount} succeeded, ${failCount} failed`);
    return successCount > 0;
  } catch (err) {
    console.error(`Error importing data for ${tableName}:`, err);
    return false;
  }
}

async function setupFunction() {
  try {
    // Create SQL for rpc function
    const functionSQL = `
    CREATE OR REPLACE FUNCTION get_tables_info()
    RETURNS TABLE (
        table_name text,
        table_schema text
    ) LANGUAGE plpgsql SECURITY DEFINER AS $$
    BEGIN
      RETURN QUERY 
      SELECT 
        t.table_name::text,
        t.table_schema::text
      FROM 
        information_schema.tables t
      WHERE 
        t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE';
    END;
    $$;
    
    CREATE OR REPLACE FUNCTION run_query(query text)
    RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
    DECLARE
        result JSONB;
    BEGIN
        EXECUTE 'SELECT jsonb_agg(r) FROM (' || query || ') r' INTO result;
        RETURN result;
    END;
    $$;
    `;
    
    fs.writeFileSync(path.join(exportDir, 'helper_functions.sql'), functionSQL);
    console.log('Created helper functions SQL');
    console.log('Please run this SQL in both databases from the Supabase SQL Editor.');
    
  } catch (err) {
    console.error('Error creating helper functions:', err);
  }
}

async function main() {
  console.log('Starting database export-import process...');
  
  // 1. Create helper functions
  await setupFunction();
  
  // 2. Get list of tables
  const tables = await getTables();
  console.log('Tables to export:', tables);
  
  // 3. Export each table
  for (const table of tables) {
    await exportTable(table);
  }
  
  // 4. Create tables in development
  console.log('\nGenerating SQL for creating tables in development...');
  for (const table of tables) {
    await createTableInDevelopment(table);
  }
  
  // 5. Import data to development
  console.log('\nImporting data to development...');
  for (const table of tables) {
    await importDataToDevelopment(table);
  }
  
  console.log('\n✅ Export-import process completed!');
  console.log(`SQL scripts have been generated in the '${exportDir}' directory.`);
  console.log('Run these scripts in your development database from the Supabase SQL Editor.');
}

main().catch(err => {
  console.error('Error in main process:', err);
});