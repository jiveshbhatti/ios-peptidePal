// Script to extract database schema information from the production database
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Production database credentials
const SUPABASE_URL = 'https://yawjzpovpfccgisrrfjo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhd2p6cG92cGZjY2dpc3JyZmpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5OTg4MDksImV4cCI6MjA2MjU3NDgwOX0.n00tZcmuTEdC8gEPD63_bedFsO8iQv5YMWOPboKnT2o';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function extractTableData() {
  console.log('Extracting schema information from production database...');
  
  try {
    // Get table information - we need to use rpc for this
    const { data: tables, error: tablesError } = await supabase.rpc('get_tables');
    
    if (tablesError) {
      console.error('Error fetching tables:', tablesError);
      
      // Fallback to just fetching a sample peptide to examine its structure
      console.log('Fetching sample data to infer schema...');
      await fetchSamplePeptide();
      return;
    }
    
    console.log('Tables found:', tables);
    // Write table info to file
    fs.writeFileSync('schema-info.json', JSON.stringify(tables, null, 2));
    console.log('Schema information saved to schema-info.json');
    
    // Also fetch a sample peptide to understand the data structure
    await fetchSamplePeptide();
    
  } catch (error) {
    console.error('Error extracting schema:', error);
    // Fallback to just fetching a sample peptide
    await fetchSamplePeptide();
  }
}

async function fetchSamplePeptide() {
  try {
    console.log('Fetching sample peptide...');
    
    // Try to fetch a peptide to understand its structure
    const { data: peptides, error } = await supabase
      .from('peptides')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error fetching sample peptide:', error);
      return;
    }
    
    if (!peptides || peptides.length === 0) {
      console.log('No peptides found in the database.');
      return;
    }
    
    // Save sample peptide data to file
    fs.writeFileSync('sample-peptide.json', JSON.stringify(peptides[0], null, 2));
    console.log('Sample peptide saved to sample-peptide.json');
    
    // Generate SQL creation script based on the peptide structure
    generateSQLScript(peptides[0]);
    
  } catch (error) {
    console.error('Error fetching sample peptide:', error);
  }
}

function generateSQLScript(peptide) {
  console.log('Generating SQL creation script...');
  
  // Get peptide properties and their types
  const columns = [];
  for (const [key, value] of Object.entries(peptide)) {
    let type = 'TEXT';
    if (typeof value === 'number') {
      type = 'NUMERIC';
    } else if (typeof value === 'boolean') {
      type = 'BOOLEAN';
    } else if (value === null) {
      type = 'TEXT'; // Default to TEXT for null values
    } else if (Array.isArray(value) || typeof value === 'object') {
      type = 'JSONB';
    }
    
    columns.push(`    ${key} ${type}${key === 'id' ? ' PRIMARY KEY' : ''}`);
  }
  
  // Create SQL script
  const sql = `
-- Create peptides table
CREATE TABLE IF NOT EXISTS public.peptides (
${columns.join(',\n')}
);

-- Set up row level security (RLS)
ALTER TABLE public.peptides ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON public.peptides
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.peptides
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.peptides
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON public.peptides
    FOR DELETE USING (true);
`;

  fs.writeFileSync('create-tables.sql', sql);
  console.log('SQL creation script saved to create-tables.sql');
}

// Run the extraction
extractTableData()
  .then(() => console.log('Done extracting schema information.'))
  .catch(err => console.error('Extraction failed:', err));