-- ═══════════════════════════════════════════════════════════════════════════
-- EL ROL LECTOR DE CIMBA CIUDADANO
--
-- Lo corre UNA vez el administrador de la base (el usuario `postgres` del VPS),
-- porque el usuario de CIMBA no puede crear roles:
--
--   sudo -u postgres psql -d cimba -f rol-cimba-publico.sql
--
-- Crea `cimba_publico` SIN login (la clave se habilita aparte, ver README.md),
-- de solo lectura, con tope de 10 s por consulta y 5 conexiones, y le da
-- lectura de las vistas del esquema `publico` si ya existen.
-- Idempotente.
-- ═══════════════════════════════════════════════════════════════════════════

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'cimba_publico') then
    create role cimba_publico nologin noinherit nocreatedb nocreaterole connection limit 5;
  end if;
end
$$;

alter role cimba_publico set default_transaction_read_only = on;
alter role cimba_publico set statement_timeout = '10s';
alter role cimba_publico set search_path = publico;

do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'publico') then
    grant usage on schema publico to cimba_publico;
    grant select on all tables in schema publico to cimba_publico;
  end if;
end
$$;
