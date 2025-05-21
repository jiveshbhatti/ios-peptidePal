-- PeptidePal Schema Export
-- Run this in the development database SQL Editor

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
