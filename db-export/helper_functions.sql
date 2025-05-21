
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
    