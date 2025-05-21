-- Setup script for PeptidePal Development Database
-- Run this in the Supabase SQL Editor to create the tables needed for the application

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.peptides;

-- Create peptides table with all columns from production (using lowercase column names)
CREATE TABLE IF NOT EXISTS public.peptides (
    id UUID PRIMARY KEY,
    name TEXT,
    strength TEXT,
    dosageunit TEXT, -- lowercase!
    typicaldosageunits NUMERIC, -- lowercase!
    schedule JSONB DEFAULT '{}'::jsonb,
    vials JSONB DEFAULT '[]'::jsonb,
    doselogs JSONB DEFAULT '[]'::jsonb, -- lowercase!
    imageurl TEXT, -- lowercase!
    dataaihint TEXT DEFAULT '', -- lowercase!
    notes TEXT,
    startdate TIMESTAMP WITH TIME ZONE, -- lowercase!
    createdat TIMESTAMP WITH TIME ZONE DEFAULT now(), -- lowercase!
    updatedat TIMESTAMP WITH TIME ZONE DEFAULT now() -- lowercase!
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

-- Create helper functions for database operations
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

CREATE OR REPLACE FUNCTION run_query(query text)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    result JSONB;
BEGIN
    EXECUTE 'SELECT jsonb_agg(r) FROM (' || query || ') r' INTO result;
    RETURN result;
END;
$$;