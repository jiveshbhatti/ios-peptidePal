-- PeptidePal Schema - Corrected Tables
-- Run this in the Supabase SQL Editor to set up all tables

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.peptides;
DROP TABLE IF EXISTS public.inventory_peptides;
DROP TABLE IF EXISTS public.inventory_bac_water;
DROP TABLE IF EXISTS public.inventory_syringes;
DROP TABLE IF EXISTS public.inventory_other_items;
DROP TABLE IF EXISTS public.health_metric_logs;

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

-- Create inventory_peptides table with CORRECT column names from production
CREATE TABLE IF NOT EXISTS public.inventory_peptides (
  id UUID PRIMARY KEY,
  name TEXT,
  num_vials INTEGER,
  concentration_per_vial_mcg NUMERIC,
  storage_location TEXT,
  expiry_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  active_vial_expiry_date TIMESTAMP WITH TIME ZONE,
  active_vial_reconstitution_date DATE,
  active_vial_status TEXT,
  low_stock_threshold INTEGER,
  batch_number TEXT,
  bac_water_volume_added NUMERIC,
  typical_dose_mcg NUMERIC
);

-- Create inventory_bac_water table with CORRECT column names from production
CREATE TABLE IF NOT EXISTS public.inventory_bac_water (
  id UUID PRIMARY KEY,
  volume_ml_per_bottle NUMERIC,
  num_bottles INTEGER,
  expiry_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create inventory_syringes table (based on naming patterns)
CREATE TABLE IF NOT EXISTS public.inventory_syringes (
  id UUID PRIMARY KEY,
  type TEXT,
  gauge_size TEXT,
  volume_ml NUMERIC,
  num_syringes INTEGER,
  price NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create inventory_other_items table (based on naming patterns)
CREATE TABLE IF NOT EXISTS public.inventory_other_items (
  id UUID PRIMARY KEY,
  name TEXT,
  category TEXT,
  quantity INTEGER,
  price NUMERIC,
  expiry_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create health_metric_logs table (based on naming patterns)
CREATE TABLE IF NOT EXISTS public.health_metric_logs (
  id UUID PRIMARY KEY,
  date TIMESTAMP WITH TIME ZONE,
  weight NUMERIC,
  blood_pressure_systolic INTEGER,
  blood_pressure_diastolic INTEGER,
  blood_sugar NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Set up row level security (RLS) for all tables
ALTER TABLE public.peptides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_peptides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_bac_water ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_syringes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_other_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_metric_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for all tables
-- Policies for peptides
CREATE POLICY "Enable read access for all users" ON public.peptides FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.peptides FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.peptides FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.peptides FOR DELETE USING (true);

-- Policies for inventory_peptides
CREATE POLICY "Enable read access for all users" ON public.inventory_peptides FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.inventory_peptides FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.inventory_peptides FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.inventory_peptides FOR DELETE USING (true);

-- Policies for inventory_bac_water
CREATE POLICY "Enable read access for all users" ON public.inventory_bac_water FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.inventory_bac_water FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.inventory_bac_water FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.inventory_bac_water FOR DELETE USING (true);

-- Policies for inventory_syringes
CREATE POLICY "Enable read access for all users" ON public.inventory_syringes FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.inventory_syringes FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.inventory_syringes FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.inventory_syringes FOR DELETE USING (true);

-- Policies for inventory_other_items
CREATE POLICY "Enable read access for all users" ON public.inventory_other_items FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.inventory_other_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.inventory_other_items FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.inventory_other_items FOR DELETE USING (true);

-- Policies for health_metric_logs
CREATE POLICY "Enable read access for all users" ON public.health_metric_logs FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.health_metric_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.health_metric_logs FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.health_metric_logs FOR DELETE USING (true);

-- Helper functions for database operations
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

CREATE OR REPLACE FUNCTION get_columns_info(table_name_param text)
RETURNS TABLE (
  column_name text,
  data_type text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY 
  SELECT 
    c.column_name::text,
    c.data_type::text
  FROM 
    information_schema.columns c
  WHERE 
    c.table_schema = 'public'
    AND c.table_name = table_name_param;
END;
$$;