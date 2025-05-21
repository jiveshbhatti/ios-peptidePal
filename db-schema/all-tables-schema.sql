-- PeptidePal Schema - All Tables
-- Generated on 2025-05-21T00:55:36.922Z


-- Table: peptides

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
      

-- Table: inventory_peptides

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
        
        -- Set up row level security (RLS)
        ALTER TABLE public.inventory_peptides ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Enable read access for all users" ON public.inventory_peptides
          FOR SELECT USING (true);
        
        CREATE POLICY "Enable insert for all users" ON public.inventory_peptides
          FOR INSERT WITH CHECK (true);
        
        CREATE POLICY "Enable update for all users" ON public.inventory_peptides
          FOR UPDATE USING (true);
        
        CREATE POLICY "Enable delete for all users" ON public.inventory_peptides
          FOR DELETE USING (true);
      

-- Table: inventory_bac_water

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
        
        -- Set up row level security (RLS)
        ALTER TABLE public.inventory_bac_water ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Enable read access for all users" ON public.inventory_bac_water
          FOR SELECT USING (true);
        
        CREATE POLICY "Enable insert for all users" ON public.inventory_bac_water
          FOR INSERT WITH CHECK (true);
        
        CREATE POLICY "Enable update for all users" ON public.inventory_bac_water
          FOR UPDATE USING (true);
        
        CREATE POLICY "Enable delete for all users" ON public.inventory_bac_water
          FOR DELETE USING (true);
      

-- Table: inventory_syringes

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
        
        -- Set up row level security (RLS)
        ALTER TABLE public.inventory_syringes ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Enable read access for all users" ON public.inventory_syringes
          FOR SELECT USING (true);
        
        CREATE POLICY "Enable insert for all users" ON public.inventory_syringes
          FOR INSERT WITH CHECK (true);
        
        CREATE POLICY "Enable update for all users" ON public.inventory_syringes
          FOR UPDATE USING (true);
        
        CREATE POLICY "Enable delete for all users" ON public.inventory_syringes
          FOR DELETE USING (true);
      

-- Table: inventory_other_items

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
        
        -- Set up row level security (RLS)
        ALTER TABLE public.inventory_other_items ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Enable read access for all users" ON public.inventory_other_items
          FOR SELECT USING (true);
        
        CREATE POLICY "Enable insert for all users" ON public.inventory_other_items
          FOR INSERT WITH CHECK (true);
        
        CREATE POLICY "Enable update for all users" ON public.inventory_other_items
          FOR UPDATE USING (true);
        
        CREATE POLICY "Enable delete for all users" ON public.inventory_other_items
          FOR DELETE USING (true);
      

-- Table: health_metric_logs

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
        
        -- Set up row level security (RLS)
        ALTER TABLE public.health_metric_logs ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Enable read access for all users" ON public.health_metric_logs
          FOR SELECT USING (true);
        
        CREATE POLICY "Enable insert for all users" ON public.health_metric_logs
          FOR INSERT WITH CHECK (true);
        
        CREATE POLICY "Enable update for all users" ON public.health_metric_logs
          FOR UPDATE USING (true);
        
        CREATE POLICY "Enable delete for all users" ON public.health_metric_logs
          FOR DELETE USING (true);
      
