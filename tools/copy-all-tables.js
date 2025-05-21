// Script to copy all tables from production to development database
const { createClient } = require('@supabase/supabase-js');

// Database configurations
const PROD_DB = {
  url: 'https://yawjzpovpfccgisrrfjo.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhd2p6cG92cGZjY2dpc3JyZmpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5OTg4MDksImV4cCI6MjA2MjU3NDgwOX0.n00tZcmuTEdC8gEPD63_bedFsO8iQv5YMWOPboKnT2o',
  label: 'PRODUCTION'
};

const DEV_DB = {
  url: 'https://looltsvagvvjnspayhym.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxvb2x0c3ZhZ3Z2am5zcGF5aHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3ODY3MTksImV4cCI6MjA2MzM2MjcxOX0.kIb0cavukeYK1wAveHXEusHur9j2JGPpW2DITDcWADw',
  label: 'DEVELOPMENT'
};

// List of tables to copy (in order of dependencies)
const TABLES = [
  'peptides',
  'inventory_peptides',
  'inventory_bac_water',
  'inventory_syringes',
  'inventory_other_items',
  'health_metric_logs'
];

async function copyAllTables() {
  console.log(`🔄 Copying all tables from ${PROD_DB.label} to ${DEV_DB.label}...`);

  // Create clients
  const prodClient = createClient(PROD_DB.url, PROD_DB.key);
  const devClient = createClient(DEV_DB.url, DEV_DB.key);

  // 1. Generate schema SQL for all tables
  const schemaSQL = {};
  
  // Log overall progress
  let tablesProcessed = 0;
  
  // Process each table
  for (const tableName of TABLES) {
    console.log(`\n📋 Processing table: ${tableName}`);
    tablesProcessed++;
    console.log(`Progress: ${tablesProcessed}/${TABLES.length} tables`);
    
    try {
      // 1. Create table in development if it doesn't exist
      console.log(`Creating SQL schema for ${tableName}...`);
      
      // Create SQL based on table name (specific structure for each table)
      let createTableSQL = '';
      
      if (tableName === 'peptides') {
        createTableSQL = `
          -- Create peptides table
          CREATE TABLE IF NOT EXISTS public.peptides (
            id UUID PRIMARY KEY,
            name TEXT,
            strength TEXT,
            dosageunit TEXT,
            typicaldosageunits NUMERIC,
            schedule JSONB DEFAULT '{}'::jsonb,
            vials JSONB DEFAULT '[]'::jsonb,
            doselogs JSONB DEFAULT '[]'::jsonb,
            imageurl TEXT,
            dataaihint TEXT DEFAULT '',
            notes TEXT,
            startdate TIMESTAMP WITH TIME ZONE,
            createdat TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updatedat TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
        `;
      } else if (tableName === 'inventory_peptides') {
        createTableSQL = `
          -- Create inventory_peptides table
          CREATE TABLE IF NOT EXISTS public.inventory_peptides (
            id UUID PRIMARY KEY,
            name TEXT,
            brand TEXT,
            strength TEXT,
            quantity INTEGER,
            price NUMERIC,
            expirationdate TIMESTAMP WITH TIME ZONE,
            notes TEXT,
            createdat TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updatedat TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
        `;
      } else if (tableName === 'inventory_bac_water') {
        createTableSQL = `
          -- Create inventory_bac_water table
          CREATE TABLE IF NOT EXISTS public.inventory_bac_water (
            id UUID PRIMARY KEY,
            brand TEXT,
            volume NUMERIC,
            quantity INTEGER,
            price NUMERIC,
            expirationdate TIMESTAMP WITH TIME ZONE,
            notes TEXT,
            createdat TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updatedat TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
        `;
      } else if (tableName === 'inventory_syringes') {
        createTableSQL = `
          -- Create inventory_syringes table
          CREATE TABLE IF NOT EXISTS public.inventory_syringes (
            id UUID PRIMARY KEY,
            type TEXT,
            gaugesize TEXT,
            volume TEXT,
            quantity INTEGER,
            price NUMERIC,
            notes TEXT,
            createdat TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updatedat TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
        `;
      } else if (tableName === 'inventory_other_items') {
        createTableSQL = `
          -- Create inventory_other_items table
          CREATE TABLE IF NOT EXISTS public.inventory_other_items (
            id UUID PRIMARY KEY,
            name TEXT,
            category TEXT,
            quantity INTEGER,
            price NUMERIC,
            expirationdate TIMESTAMP WITH TIME ZONE,
            notes TEXT,
            createdat TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updatedat TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
        `;
      } else if (tableName === 'health_metric_logs') {
        createTableSQL = `
          -- Create health_metric_logs table
          CREATE TABLE IF NOT EXISTS public.health_metric_logs (
            id UUID PRIMARY KEY,
            date TIMESTAMP WITH TIME ZONE,
            weight NUMERIC,
            bloodpressuresystolic INTEGER,
            bloodpressurediastolic INTEGER,
            bloodsugar NUMERIC,
            notes TEXT,
            createdat TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updatedat TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
        `;
      }
      
      schemaSQL[tableName] = createTableSQL;
      
      // Add RLS policies for the table
      schemaSQL[tableName] += `
        -- Set up row level security (RLS)
        ALTER TABLE public.${tableName} ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Enable read access for all users" ON public.${tableName}
          FOR SELECT USING (true);
        
        CREATE POLICY "Enable insert for all users" ON public.${tableName}
          FOR INSERT WITH CHECK (true);
        
        CREATE POLICY "Enable update for all users" ON public.${tableName}
          FOR UPDATE USING (true);
        
        CREATE POLICY "Enable delete for all users" ON public.${tableName}
          FOR DELETE USING (true);
      `;
      
      // 2. Apply schema to development database
      console.log(`Applying schema for ${tableName}...`);
      const { error: createError } = await devClient.rpc('run_query', {
        query: `
          DROP TABLE IF EXISTS public.${tableName};
          ${createTableSQL}
          
          -- Set up row level security (RLS)
          ALTER TABLE public.${tableName} ENABLE ROW LEVEL SECURITY;
          
          -- Create policies
          CREATE POLICY "Enable read access for all users" ON public.${tableName}
            FOR SELECT USING (true);
          
          CREATE POLICY "Enable insert for all users" ON public.${tableName}
            FOR INSERT WITH CHECK (true);
          
          CREATE POLICY "Enable update for all users" ON public.${tableName}
            FOR UPDATE USING (true);
          
          CREATE POLICY "Enable delete for all users" ON public.${tableName}
            FOR DELETE USING (true);
        `
      });
      
      if (createError) {
        console.warn(`⚠️ Error creating table ${tableName}: ${createError.message}`);
        console.log('Trying direct table creation...');
        
        // Try direct table creation if run_query fails
        const { error: directError } = await devClient.rpc('run_query', {
          query: `DROP TABLE IF EXISTS public.${tableName};`
        });
        
        if (directError) {
          console.warn(`⚠️ Error dropping existing table: ${directError.message}`);
        }
        
        // Try creating the table directly
        const { error: createTableError } = await devClient.rpc('run_query', {
          query: createTableSQL
        });
        
        if (createTableError) {
          console.error(`❌ Failed to create ${tableName} table: ${createTableError.message}`);
          console.log('⚠️ You may need to manually run the SQL in the Supabase SQL Editor');
        } else {
          console.log(`✅ Table ${tableName} created successfully`);
        }
      } else {
        console.log(`✅ Schema for ${tableName} applied successfully`);
      }
      
      // 3. Copy data from production to development
      console.log(`Fetching data from production ${tableName}...`);
      const { data: prodData, error: fetchError } = await prodClient
        .from(tableName)
        .select('*');
      
      if (fetchError) {
        console.error(`❌ Error fetching ${tableName} data:`, fetchError.message);
        continue;
      }
      
      if (!prodData || prodData.length === 0) {
        console.log(`ℹ️ No data found in ${tableName} table`);
        continue;
      }
      
      console.log(`✅ Found ${prodData.length} rows in production ${tableName}`);
      
      // For inventory tables, create test copies
      let devData = prodData;
      if (tableName.startsWith('inventory_')) {
        console.log(`Creating [TEST] copies for ${tableName}...`);
        devData = prodData.map(item => ({
          ...item,
          // Add [TEST] prefix to name field if it exists, otherwise leave as is
          ...(item.name ? { name: item.name.startsWith('[TEST]') ? item.name : `[TEST] ${item.name}` } : {}),
        }));
      }
      
      // Insert data into development
      console.log(`Inserting data into development ${tableName}...`);
      let successCount = 0;
      let failCount = 0;
      
      for (const row of devData) {
        try {
          // Delete existing record with the same ID if it exists
          await devClient.from(tableName).delete().eq('id', row.id);
          
          // Insert the row
          const { error: insertError } = await devClient
            .from(tableName)
            .insert(row);
            
          if (insertError) {
            console.log(`⚠️ Error inserting row in ${tableName}:`, insertError.message);
            failCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          console.error(`❌ Error processing row in ${tableName}:`, error.message);
          failCount++;
        }
      }
      
      console.log(`✅ ${tableName} sync complete: ${successCount}/${devData.length} rows inserted successfully`);
      
    } catch (error) {
      console.error(`❌ Error processing ${tableName}:`, error.message);
    }
  }
  
  // 4. Save schema SQL to file
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Create directory if it doesn't exist
    const schemaDir = path.join(__dirname, '../db-schema');
    if (!fs.existsSync(schemaDir)) {
      fs.mkdirSync(schemaDir, { recursive: true });
    }
    
    // Write combined schema SQL to file
    const schemaFilePath = path.join(schemaDir, 'all-tables-schema.sql');
    let combinedSQL = `-- PeptidePal Schema - All Tables\n-- Generated on ${new Date().toISOString()}\n\n`;
    
    for (const [tableName, sql] of Object.entries(schemaSQL)) {
      combinedSQL += `\n-- Table: ${tableName}\n${sql}\n`;
    }
    
    fs.writeFileSync(schemaFilePath, combinedSQL);
    console.log(`\n✅ Schema SQL saved to ${schemaFilePath}`);
  } catch (error) {
    console.error('❌ Error saving schema SQL to file:', error.message);
  }
  
  console.log('\n🏁 All tables processed. Please check for any errors above.');
}

// Run the copy process
copyAllTables();