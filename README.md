# CIMBA Ciudadano

Portal público de información vial de la **Municipalidad de San Miguel de Tucumán**.
Interfaz ciudadana de CIMBA (sistema interno de gestión de baches y asfalto): muestra
sólo información autorizada para publicación. **No reemplaza ni accede a CIMBA.**

## Inicio rápido

```bash
npm install
cp .env.example .env.local   # por defecto, modo demo
npm run dev                  # http://localhost:3000
```

Scripts: `npm run dev`, `npm run build`, `npm start`, `npm run lint`, `npx tsc --noEmit`.

> En modo `demo` todo el portal se rotula como **demostración**: las cifras, intervenciones,
> cortes e imágenes son ficticios (los barrios, tipos y estados sí son los oficiales de CIMBA).
> En modo `live` lee la **API pública oficial de CIMBA** (`/api/publico/avance`), que se
> habilita con `AVANCE_PUBLICO=1` en CIMBA. Sin datos, el portal muestra “no disponible”.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · MapLibre GL (clusters nativos) ·
Motion · Lucide · Zod · Plus Jakarta Sans autoalojada (`@fontsource-variable`).

## Arquitectura

```
src/
  app/                      Rutas (portada, /privacidad, /accesibilidad) y API
    api/public/*            API pública de solo lectura del portal
    api/migue               Asistente (POST, validado, rate limited)
  config/site.ts            Recursos oficiales, canales, navegación, mapa
  domain/                   Esquemas zod (modelo público) y etiquetas
  services/                 Selección de fuente, filtros, carga de la portada
    demo/                   Datos de demostración (server-only)
  integrations/cidituc/     Reclamos en CiDiTuc (alta, seguimiento) e identidad con Ciudad Digital (server-only)
  integrations/cimba/       Cliente de /api/publico/avance, esquema, adaptador y estados (server-only)
  data/                     Capa oficial de 327 barrios (copiada de CIMBA)
  lib/                      Formato, logger seguro, helpers de API, Migue (motor + herramientas)
  hooks/useExplorer.ts      Estado compartido hero ⇄ mapa ⇄ Mi barrio ⇄ Migue
  components/
    layout/                 Header, Footer, aviso demo
    sections/               Hero, indicadores, destacados, intervenciones, cortes, Mi barrio, etc.
    map/                    MapExplorer (filtros, lista, ficha), InterventionsMap (MapLibre)
    migue/                  Widget de chat, avatar oficial (configurable), saludo
    ui/                     Primitivas, comparador antes/después, Reveal, CountUp
  middleware.ts             Rate limiting de /api/*
```

Flujo de datos: `PublicDataSource` (demo | CIMBA | no disponible) → `getPortalData()` (React
`cache`, una carga por request, ISR 5 min) → secciones de servidor → componentes cliente.
El navegador nunca habla con CIMBA: sólo con `/api/*` del portal.

## Seguridad

- Secretos sólo en variables de servidor (`server-only`), nunca `NEXT_PUBLIC_*`.
- Sólo consume la versión pública de CIMBA; descarta lo no validado, lo desestimado y los pedidos de vecinos.
- Validación de entradas con zod, IDs con regex, cuerpo del asistente limitado a 400 caracteres.
- Rate limiting (120/min API pública, 15/min Migue).
- Cabeceras: CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy, COOP.
- Logger que no registra entradas del usuario y redacta credenciales.
- Geolocalización opcional, sólo en el dispositivo; “Mi barrio” se recuerda en `localStorage` sin registro.

## Documentación

- [docs/CONTRATOS_API.md](docs/CONTRATOS_API.md) — integración con la API pública de CIMBA y equivalencias.
- [docs/cimba/README.md](docs/cimba/README.md) — datos reales con vistas de solo lectura en la base de CIMBA (recomendado).
- [docs/PRUEBA-DATOS-REALES.md](docs/PRUEBA-DATOS-REALES.md) — cómo ver el portal con datos reales de CIMBA en local.
- [docs/PENDIENTES.md](docs/PENDIENTES.md) — recursos oficiales e integraciones faltantes (incluye el alta de reclamos en CiDiTuc).
