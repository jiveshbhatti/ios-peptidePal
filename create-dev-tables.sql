-- Create peptides table
CREATE TABLE IF NOT EXISTS public.peptides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    strength TEXT,
    dosageUnit TEXT,
    typicalDosageUnits NUMERIC,
    schedule JSONB,
    vials JSONB,
    doseLogs JSONB,
    imageUrl TEXT,
    dataAiHint TEXT,
    notes TEXT,
    startDate TIMESTAMP WITH TIME ZONE
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