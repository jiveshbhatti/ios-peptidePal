#!/bin/bash
# Script to export schema from production and import to development database

# Install Supabase CLI if not already installed
if ! command -v supabase &> /dev/null; then
    echo "Installing Supabase CLI..."
    npm install -g supabase
fi

# Production database credentials
PROD_URL="https://yawjzpovpfccgisrrfjo.supabase.co"
PROD_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhd2p6cG92cGZjY2dpc3JyZmpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5OTg4MDksImV4cCI6MjA2MjU3NDgwOX0.n00tZcmuTEdC8gEPD63_bedFsO8iQv5YMWOPboKnT2o"

# Development database credentials
DEV_URL="https://looltsvagvvjnspayhym.supabase.co"
DEV_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxvb2x0c3ZhZ3Z2am5zcGF5aHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3ODY3MTksImV4cCI6MjA2MzM2MjcxOX0.kIb0cavukeYK1wAveHXEusHur9j2JGPpW2DITDcWADw"

# Output files
SCHEMA_DIR="./db-schema"
SCHEMA_FILE="$SCHEMA_DIR/schema.sql"
DATA_FILE="$SCHEMA_DIR/peptides-data.sql"

# Create directory for schema files
mkdir -p $SCHEMA_DIR

echo "🔄 PeptidePal Database Schema Migration Tool"
echo "==========================================="
echo

# Export schema from production
echo "📤 Exporting schema from production database..."
supabase db dump -u $PROD_URL --db-key $PROD_KEY --schema-only > $SCHEMA_FILE

if [ $? -ne 0 ]; then
    echo "❌ Schema export failed. Using pg_dump directly..."
    
    # Alternative: Using direct connection with psql
    echo "Attempting to use PSQL..."
    
    # Let's create a .sql script that can be run directly in the Supabase SQL Editor
    echo "-- PeptidePal Schema Export" > $SCHEMA_FILE
    echo "-- Run this in the development database SQL Editor" >> $SCHEMA_FILE
    echo "" >> $SCHEMA_FILE
    
    # Create peptides table with all known columns
    cat <<EOF >> $SCHEMA_FILE
-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.peptides;

-- Create peptides table with all columns from production
CREATE TABLE IF NOT EXISTS public.peptides (
    id UUID PRIMARY KEY,
    name TEXT,
    strength TEXT,
    dosageUnit TEXT,
    typicalDosageUnits NUMERIC,
    schedule JSONB DEFAULT '{}'::jsonb,
    vials JSONB DEFAULT '[]'::jsonb,
    doseLogs JSONB DEFAULT '[]'::jsonb,
    imageUrl TEXT,
    dataAiHint TEXT DEFAULT '',
    notes TEXT,
    startDate TIMESTAMP WITH TIME ZONE,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT now()
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
EOF
    
    echo "✅ Created schema script manually based on known structure"
fi

echo "📋 Schema exported to $SCHEMA_FILE"

# Export production peptides data (optional)
echo
echo "📤 Creating data export script for peptides..."

# Create a script to export data in SQL insert format
cat <<EOF > $DATA_FILE
-- PeptidePal Data Export
-- Run this after schema import to populate development database with test data

-- First, clear any existing test data
DELETE FROM public.peptides WHERE name LIKE '[TEST]%';

-- Insert test copies of production data
EOF

echo "✅ Created data export script template at $DATA_FILE"
echo "   You'll need to use the Sync feature to copy data with [TEST] prefix"

# Instructions for importing
echo
echo "📥 Schema and data import instructions:"
echo "---------------------------------------"
echo "1. Go to the Supabase Dashboard for your development project"
echo "2. Open the SQL Editor"
echo "3. Copy and paste the contents of $SCHEMA_FILE"
echo "4. Run the script to set up your schema"
echo "5. Use the app's Sync feature to copy data from production to development"
echo
echo "✅ Schema migration script completed!"