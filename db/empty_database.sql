-- Empty database: truncate all tables EXCEPT USUARIO (keep existing users)
-- Run with: docker exec -i bodegas_db psql -U postgres -d bodegas_atuel -f empty_database.sql

DO $$ DECLARE r RECORD; BEGIN
    -- Disable triggers (including USUARIO for consistency)
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname='public') LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(r.tablename) || ' DISABLE TRIGGER ALL';
    END LOOP;
    
    -- Truncate all tables EXCEPT USUARIO (keep users and their sequences)
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename != 'usuario') LOOP
        EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
    
    -- Re-enable triggers
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname='public') LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(r.tablename) || ' ENABLE TRIGGER ALL';
    END LOOP;
    
    -- Reset sequences EXCEPT USUARIO sequence (keep user IDs)
    FOR r IN (
        SELECT c.relname 
        FROM pg_class c 
        JOIN pg_namespace n ON n.oid=c.relnamespace 
        WHERE c.relkind='S' 
          AND n.nspname='public'
          AND c.relname NOT LIKE 'usuario%'
    ) LOOP
        EXECUTE 'ALTER SEQUENCE ' || quote_ident(r.relname) || ' RESTART WITH 1';
    END LOOP;
END $$;

-- Nota: La tabla USUARIO se conserva intacta. Se borra todo lo demás
-- (todas las demás tablas y sus secuencias), pero los usuarios que ya
-- existían en la base de datos se mantienen sin cambios.