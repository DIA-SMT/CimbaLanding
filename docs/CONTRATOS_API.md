# Integración con CIMBA

Relevado del repositorio **DIA-SMT/CIMBA** (commit `f6e9406`, 23/10/2026), sólo lectura.

## 1. La fuente: la API pública oficial de CIMBA

CIMBA ya tiene una versión pública de su pantalla de Avance, pensada para los vecinos:

| Ruta en CIMBA | Qué devuelve | Archivo |
|---|---|---|
| `GET /api/publico/avance?dias=N&barrio=&distrito=` | `DatosAvance` en versión pública | `apps/web/src/app/api/publico/avance/route.ts` |
| `GET /api/publico/avance/capas` | 327 barrios (polígonos), cuadras arregladas y barrio de cada trabajo | `.../avance/capas/route.ts` |
| `GET /api/publico/avance/fotos?pagina=` | Pares de fotos antes/después | `.../avance/fotos/route.ts` |
| `/publico` | La pantalla pública completa | `apps/web/src/app/publico/page.tsx` |

- **Sin sesión ni credenciales**, cacheada en el borde (60 s / 10 min).
- **Apagada por defecto**: responden 404 hasta que la Dirección configure
  `AVANCE_PUBLICO=1` en el hosting de CIMBA. Verificado el 18/11/2026:
  `https://cimba.smt.gob.ar/api/publico/avance` → **404**.
- La versión pública (`publico: true`) ya excluye: nombres de personas,
  direcciones de los pedidos de vecinos, el feed de movimientos, la
  proyección, los avisos y los trabajos sin validar.

El portal consume `avance` y `capas` desde el servidor
([`src/integrations/cimba/client.ts`](../src/integrations/cimba/client.ts)), valida la
respuesta con zod ([`avance-schema.ts`](../src/integrations/cimba/avance-schema.ts)) y la
traduce al modelo público ([`adapter.ts`](../src/integrations/cimba/adapter.ts)).

## 2. Cómo se traduce

| CIMBA (`DatosAvance`) | Portal | Estado público |
|---|---|---|
| `hechos` (intervenciones `finalizada`, validadas) | id `t{id}` | **Reparado** |
| `enCurso` (intervenciones `en_curso`) | id `o{id}` | **En ejecución** |
| `agenda` con `estado = en_ejecucion` | id `p{id}` | **En ejecución** |
| `agenda` con `estado = programado` | id `p{id}` | **Programado** |
| `agenda` con `estado = detectado / priorizado` | id `p{id}` | **Detectado** |
| `pendientes` (pedidos de vecinos) | — | No se publican |
| `agenda` con `grupo = agua` (S.A.T.) | — | No se publica (no lo resuelve Bacheo) |
| `cifras.total.n` / `.desde` | Indicador “Reparaciones finalizadas” | — |
| `capas.barrios` | Barrios de “Mi barrio” y asignación de cada punto | — |

Equivalencia de estados basada en el semáforo de CIMBA (`pasoDeEstado`,
`apps/web/src/lib/formato.ts`): ver [`status-map.ts`](../src/integrations/cimba/status-map.ts).
Colores del mapa = `SEMAFORO_HEX` (tema claro) de CIMBA.

Tipos de trabajo = enum `tipo_intervencion` (`bacheo`, `pano_hormigon`, `carpeta`,
`enripiado`). Tipos de problema = enum `tipo_problema`, con las etiquetas de
`ETIQUETA_TIPO`.

Fotos: CIMBA devuelve rutas `/fotos/...` (servidas por su nginx). El adaptador las
resuelve contra `CIMBA_PUBLIC_API_URL` y sólo acepta HTTPS desde orígenes
permitidos (`CIMBA_FOTOS_ORIGENES`).

## 3. Lo que CIMBA no tiene

- **Cortes de tránsito**: fuera del portal por ahora (decisión de noviembre de 2026): son
  tema de otro Migue / otra área. Se sacaron la sección, la capa del mapa, el indicador, la
  API pública y la herramienta de Migue; el modelo de datos (`TrafficClosure`, `listClosures`)
  queda en el código para reconectarlo si hiciera falta.
- **Fecha de los problemas en agenda**: la versión pública no la incluye; se muestra
  “sin fecha confirmada”.
- **Dirección de los problemas en agenda**: la versión pública la oculta; se ubica por
  barrio y punto en el mapa.

## 4. API propia del portal

El navegador nunca llama a CIMBA. Consulta `/api/public/*` del portal
(solo `GET`, validación con zod, rate limiting):

| Ruta | Parámetros | `data` |
|---|---|---|
| `/api/public/summary` | — | `Summary` |
| `/api/public/interventions` | `q`, `status`, `type`, `neighborhood`, `from`, `to`, `limit` | `Intervention[]` |
| `/api/public/interventions/:id` | `id` | `Intervention` |
| `/api/public/neighborhoods` | — | `Neighborhood[]` |

Respuesta: `{ data, meta: { mode: "live" | "demo" | "unavailable", updatedAt, notice } }`.
Modelos en [`src/domain/schemas.ts`](../src/domain/schemas.ts).

## 5. Reclamos: dentro del portal, siempre en CiDiTuc

El vecino carga el reclamo en el portal (sección **Reclamos**), sin ser derivado a
otro sitio, pero el reclamo **se registra en CiDiTuc** (Atención Ciudadana · 147)
a su nombre. El portal no guarda reclamos: CIMBA los recibe desde CiDiTuc con
su barrido diario, igual que los del 147.

Relevado de DIA-SMT/CIMBA:

| Pieza | Qué hay hoy | Archivo en CIMBA |
|---|---|---|
| Backend de Atención Ciudadana | `https://estadisticas.smt.gob.ar:8084`, sin autenticación | `.env.example` |
| Leer un reclamo | `POST /reclamos/traerReclamoPorID {idreclamo}` | `fuentes/atencion-ciudadana.ts` |
| Cerrar un reclamo | `POST /reclamos/cerrar` (lo montó Sistemas para CIMBA) | `fuentes/cierre-ac.ts` |
| **Crear un reclamo** | **No existe** | — |
| Tipos de “Calles” | categoría 1; tipos 1, 3, 105, 126, 148 habilitados | `fuentes/atencion-ciudadana.ts` |
| Identidad | Ciudad Digital: `?auth=<token>` → `GET /usuarios/authStatus` → `id_persona` | `lib/sso.ts` |
| TLS | el servidor omite el intermedio Sectigo; se suma a las CA | `fuentes/https-smt.ts` |

Implementación en el portal:

| Ruta | Qué hace |
|---|---|
| `GET /api/reclamos` | Modo (`off`/`simulado`/`real`), sesión y forma de ingreso |
| `POST /api/reclamos` | Valida (tipo, punto dentro de un barrio oficial, textos) y llama al alta de CiDiTuc |
| `GET /api/reclamos/:id` | Seguimiento: sólo si el `id_persona` del reclamo es el de la sesión; sin datos de contacto |
| `GET /api/auth/ciudad-digital?auth=` | Valida el token y crea la sesión (cookie firmada, 2 h) |
| `POST /api/auth/salir` | Cierra la sesión en el portal |

Cualquier página abierta con `?auth=<token>` (como abre Ciudad Digital a sus
sistemas externos) se deriva al validador y vuelve sin el token en la URL.

**Cuerpo propuesto del alta** (replica los campos de un reclamo de CiDiTuc):

```json
{ "id_persona": 12345, "id_categoria": 1, "id_treclamo": 1, "id_oreclamo": null,
  "asunto": "Solicitud de bacheo", "detalle": "...", "direccion": "24 de Septiembre 500",
  "descripcion_lugar": "frente a la plaza", "coorde1": -26.8303, "coorde2": -65.2038 }
```

Respuesta esperada: `{ "id_reclamo": 123456 }`. Ruta configurable con
`CIDITUC_RECLAMOS_ALTA_PATH`.
