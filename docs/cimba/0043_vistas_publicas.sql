-- ═══════════════════════════════════════════════════════════════════════════
-- LAS VISTAS PÚBLICAS PARA CIMBA CIUDADANO
--
-- PROPUESTA para el repositorio de CIMBA (supabase/migrations). La aplica el
-- equipo de CIMBA con su procedimiento (`pnpm db:migrar`); renumerar si ya
-- existe la 0043. No transforma datos: sólo crea un esquema y vistas, y da
-- permiso de lectura al rol lector si ya existe.
--
-- Qué publica: exactamente lo que ya publica la versión pública de Avance
-- (`/api/publico/avance`, `datosAvance(..., { publico: true })` en
-- apps/web/src/lib/avance.ts):
--   - trabajos finalizados (intervenciones `finalizada`, o sea validadas),
--     con dirección del bache, empresa (nombre corto), m², tipo y fotos;
--   - obras en curso;
--   - problemas en agenda SIN dirección;
--   - barrios (contorno simplificado).
-- No publica: pedidos de vecinos, contactos, nombres de personas, órdenes,
-- actas, auditoría, perfiles ni nada que no esté en estas vistas.
--
-- El rol `cimba_publico` (creado aparte por el administrador de la base, ver
-- docs/cimba/rol-cimba-publico.sql del portal) sólo puede leer las vistas del
-- esquema `publico`: no ve las tablas de origen (las vistas se ejecutan con los
-- permisos de su dueño), no puede escribir y cada consulta tiene un tope de
-- 10 segundos. La clave no va en ningún repositorio.
--
-- Idempotente: se puede correr más de una vez.
-- ═══════════════════════════════════════════════════════════════════════════

create schema if not exists publico;

-- ── Trabajos finalizados ────────────────────────────────────────────────────
create or replace view publico.trabajos as
select iv.id,
       coalesce(iv.finalizada_en, iv.iniciada_en, iv.creado_en)            as fecha,
       iv.tipo_intervencion::text                                          as tipo,
       case when iv.metadata->>'escala' = 'obra' then 'obra' else 'bacheo' end as escala,
       iv.superficie_m2::float8                                            as m2,
       -- Mismo criterio que EMPRESA_CORTA: primera palabra del nombre de la
       -- empresa; si no se reconoce, "Otros". Nunca el texto cargado a mano
       -- (puede ser el nombre de una persona).
       coalesce(initcap(split_part(coalesce(e_ot.nombre, e_md.nombre), ' ', 1)), 'Otros') as empresa,
       i.direccion,
       st_x(st_centroid(iv.geom_ejecucion))::float8                        as lon,
       st_y(st_centroid(iv.geom_ejecucion))::float8                        as lat,
       ba.id                                                               as barrio_id,
       fd.storage_path                                                     as foto_despues,
       fd.url_externa                                                      as foto_despues_url,
       fa.storage_path                                                     as foto_antes,
       fa.url_externa                                                      as foto_antes_url
  from intervenciones iv
  left join incidentes i on i.id = iv.incidente_id
  left join lateral (
    select ot.empresa_id
      from orden_items oi
      join ordenes_trabajo ot on ot.id = oi.orden_id
     where oi.intervencion_id = iv.id
     order by oi.id
     limit 1
  ) it on true
  left join empresas e_ot on e_ot.id = it.empresa_id
  left join empresas e_md
    on it.empresa_id is null
   and e_md.slug = lower(public.unaccent(split_part(trim(coalesce(iv.metadata->>'contratista', iv.metadata->>'empresa', '')), ' ', 1)))
  left join lateral (
    select b.id from barrios b where st_intersects(b.geom, iv.geom_ejecucion) limit 1
  ) ba on true
  left join lateral (
    select f.storage_path, f.url_externa from fotografias f
     where f.intervencion_id = iv.id and f.momento = 'despues'
     order by f.tomada_en desc nulls last limit 1
  ) fd on true
  left join lateral (
    select f.storage_path, f.url_externa from fotografias f
     where f.intervencion_id = iv.id and f.momento = 'antes'
     order by f.tomada_en asc nulls last limit 1
  ) fa on true
 where iv.estado = 'finalizada'
   and iv.geom_ejecucion is not null;

-- ── Obras en curso ──────────────────────────────────────────────────────────
create or replace view publico.obras_en_curso as
select iv.id,
       iv.iniciada_en                                                      as iniciada,
       iv.tipo_intervencion::text                                          as tipo,
       case when iv.metadata->>'escala' = 'obra' then 'obra' else 'bacheo' end as escala,
       iv.superficie_m2::float8                                            as m2,
       coalesce(initcap(split_part(coalesce(e_ot.nombre, e_md.nombre), ' ', 1)), 'Otros') as empresa,
       i.direccion,
       st_x(st_centroid(iv.geom_ejecucion))::float8                        as lon,
       st_y(st_centroid(iv.geom_ejecucion))::float8                        as lat,
       ba.id                                                               as barrio_id
  from intervenciones iv
  left join incidentes i on i.id = iv.incidente_id
  left join lateral (
    select ot.empresa_id
      from orden_items oi
      join ordenes_trabajo ot on ot.id = oi.orden_id
     where oi.intervencion_id = iv.id
     order by oi.id
     limit 1
  ) it on true
  left join empresas e_ot on e_ot.id = it.empresa_id
  left join empresas e_md
    on it.empresa_id is null
   and e_md.slug = lower(public.unaccent(split_part(trim(coalesce(iv.metadata->>'contratista', iv.metadata->>'empresa', '')), ' ', 1)))
  left join lateral (
    select b.id from barrios b where st_intersects(b.geom, iv.geom_ejecucion) limit 1
  ) ba on true
 where iv.estado = 'en_curso'
   and iv.geom_ejecucion is not null;

-- ── Problemas en agenda (sin dirección, como la versión pública) ────────────
create or replace view publico.problemas as
select i.id,
       i.estado::text                                                      as estado,
       i.tipo::text                                                        as tipo,
       st_x(i.geom)::float8                                                as lon,
       st_y(i.geom)::float8                                                as lat,
       ba.id                                                               as barrio_id
  from incidentes i
  left join lateral (
    select b.id from barrios b where st_intersects(b.geom, i.geom) limit 1
  ) ba on true
 where i.estado in ('detectado', 'priorizado', 'programado', 'en_ejecucion')
   and i.geom is not null;

-- ── Barrios ─────────────────────────────────────────────────────────────────
create or replace view publico.barrios as
select b.id,
       b.nombre,
       st_x(st_pointonsurface(b.geom))::float8                             as lon,
       st_y(st_pointonsurface(b.geom))::float8                             as lat,
       st_asgeojson(st_simplifypreservetopology(b.geom, 0.0001), 5)        as contorno
  from barrios b;

-- ── Resumen (para no recorrer todos los trabajos en cada visita) ────────────
create or replace view publico.resumen as
select count(*)::int                                                       as reparaciones,
       to_char(min(fecha) at time zone 'America/Argentina/Tucuman', 'YYYY-MM-DD') as desde,
       now()                                                               as generado_en
  from publico.trabajos;

-- ── Permisos para el rol lector ────────────────────────────────────────────
-- El rol `cimba_publico` NO se crea acá: el usuario con el que corre CIMBA no
-- tiene permiso para crear roles. Lo crea una sola vez el administrador de la
-- base con docs/cimba/rol-cimba-publico.sql (del portal). Si el rol ya existe,
-- esta migración le da acceso de lectura a las vistas; si no, no hace nada.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'cimba_publico') then
    grant usage on schema publico to cimba_publico;
    grant select on all tables in schema publico to cimba_publico;
    alter default privileges in schema publico grant select on tables to cimba_publico;
  end if;
end
$$;
