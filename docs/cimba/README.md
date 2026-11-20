# Datos reales: vistas de solo lectura en la base de CIMBA

El portal lee la información pública de CIMBA **directamente de su base**, pero
sólo a través de vistas preparadas y con un usuario que **únicamente puede
leerlas**. Así los datos se actualizan solos (el portal vuelve a leer como
máximo cada minuto) y el sistema interno queda aislado.

| Pieza | Dónde | Qué hace |
|---|---|---|
| `publico.trabajos` | base de CIMBA | Trabajos finalizados (validados), con dirección del bache, empresa, m², tipo y fotos |
| `publico.obras_en_curso` | base de CIMBA | Obras empezadas y no terminadas |
| `publico.problemas` | base de CIMBA | Problemas en agenda, **sin dirección** |
| `publico.barrios` | base de CIMBA | Barrios con su contorno |
| `publico.resumen` | base de CIMBA | Total de reparaciones y desde cuándo |
| rol `cimba_publico` | base de CIMBA | Sólo `SELECT` sobre esas vistas; solo lectura; 10 s por consulta; 5 conexiones |
| `CIMBA_DATA_MODE=db` | portal | Activa esta fuente |
| `CIMBA_DB_PUBLICO_URL` | portal (secreto de servidor) | Conexión con el rol `cimba_publico` |

Las vistas publican lo mismo que la versión pública de Avance de CIMBA. **No**
publican pedidos de vecinos, contactos, nombres de personas, órdenes ni nada más.

La base hoy está en el VPS de CIMBA (`127.0.0.1:5432`, PostgreSQL 17) y no está
expuesta a internet. Por eso el portal debería alojarse en el mismo VPS y
conectarse por `localhost`.

## Probado contra la base real (20/11/2026)

Se aplicó todo dentro de una transacción y se deshizo al final (`ROLLBACK`):
antes y después, 0 esquemas `publico` y 0 roles `cimba_publico`.

| Control | Resultado |
|---|---|
| Vistas creadas como el usuario de CIMBA | 5, dueño `cimba` |
| Trabajos finalizados | 5.560 (2.849 en los últimos 90 días) |
| Obras en curso / problemas en agenda / barrios | 42 / 402 / 327 |
| El rol lee `publico.trabajos` | sí |
| El rol lee `demandas`, `intervenciones`, `perfiles` | **no** (permiso denegado) |
| El rol puede escribir | no |
| Tablas de `public` legibles por el rol | sólo `spatial_ref_sys` (catálogo de PostGIS, público por defecto) |
| Tiempo: trabajos 90 días / obras / problemas / barrios | 1,1 s / 14 ms / 6 ms / 0,3 ms |

Observaciones para la Dirección de Bacheo:

- **Un trabajo con fecha 21/10/2006** (error de carga): hace que el total diga
  "desde el 21 de oct de 2006". Conviene corregir ese registro en CIMBA.
- **476 trabajos sin tipo**: el portal los muestra como "Reparación vial".
- **4.704 fotos fuera de CIMBA** (todas HTTPS): `estadisticas.smt.gob.ar:5010`
  y `lh3.googleusercontent.com`. CIMBA ya las muestra en su página pública; en
  el portal se habilitan con `CIMBA_FOTOS_ORIGENES`.

## 1. Crear el rol (administrador de la base, una vez)

El usuario con el que corre CIMBA (`cimba`) **no puede crear roles**: lo hace el
administrador (`postgres`) con [`rol-cimba-publico.sql`](./rol-cimba-publico.sql):

```bash
sudo -u postgres psql -d cimba -f rol-cimba-publico.sql
```

## 2. Aplicar la migración (equipo de CIMBA)

1. Copiar [`0043_vistas_publicas.sql`](./0043_vistas_publicas.sql) a
   `supabase/migrations/` del repo de CIMBA (renumerar si hace falta).
2. Aplicarla con el procedimiento de CIMBA (`pnpm db:migrar`). No transforma
   datos: crea el esquema `publico` y las vistas, y da lectura al rol si ya existe.

## 3. Habilitar el login del rol (en el servidor, a mano)

La clave se genera y se usa en el servidor. **No se escribe en ningún
repositorio, documento ni chat.**

```bash
# En el VPS, como administrador de la base:
CLAVE="$(openssl rand -base64 36 | tr -d '/+=' | cut -c1-40)"
sudo -u postgres psql -d cimba -c "alter role cimba_publico login password '$CLAVE'"
# Guardar la conexión en el .env del portal (en el mismo servidor):
echo "CIMBA_DB_PUBLICO_URL=postgres://cimba_publico:$CLAVE@127.0.0.1:5432/cimba" >> /ruta/del/portal/.env
unset CLAVE
```

Controles (todos deben dar lo indicado):

```sql
-- No puede leer tablas internas:
select has_table_privilege('cimba_publico', 'public.demandas', 'select');      -- false
select has_table_privilege('cimba_publico', 'public.intervenciones', 'select'); -- false
-- Sí puede leer las vistas:
select has_table_privilege('cimba_publico', 'publico.trabajos', 'select');      -- true
-- No puede escribir:
show default_transaction_read_only;  -- conectado como cimba_publico: on
```

## 4. Configurar el portal

```
CIMBA_DATA_MODE=db
CIMBA_DB_PUBLICO_URL=postgres://cimba_publico:<clave>@127.0.0.1:5432/cimba
CIMBA_FOTOS_BASE=https://cimba.smt.gob.ar/fotos
```

`CIMBA_DATA_MODE` se lee también al compilar (la portada se regenera cada 5 min):
definirla en el build y en la ejecución.

## Probar desde una computadora (túnel SSH)

Con acceso al VPS, se abre un túnel a la base (queda sólo en esa computadora):

```bash
ssh -i ~/.ssh/<clave-del-vps> -N -L 55432:127.0.0.1:5432 root@195.35.42.168
```

y en el `.env.local` del portal:

```
CIMBA_DATA_MODE=db
CIMBA_DB_PUBLICO_URL=postgres://cimba_publico:<clave>@localhost:55432/cimba
```

## Volver atrás

```sql
drop schema publico cascade;
drop role cimba_publico;
```

No afecta ningún dato de CIMBA: sólo borra las vistas y el rol.
