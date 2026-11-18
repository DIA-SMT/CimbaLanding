# Pendientes para pasar a producción

## Lo que decide la Dirección de Bacheo

1. **Prender el avance público de CIMBA** (`AVANCE_PUBLICO=1` en su hosting). Es la
   única condición técnica para que el portal muestre datos reales. Hoy
   `https://cimba.smt.gob.ar/api/publico/avance` responde 404.
2. **Confirmar el estado público “Detectado”**, que agrupa *detectado* y
   *priorizado* de CIMBA.
3. **Confirmar qué se muestra de las empresas**: el portal muestra “Realizado por”
   con el nombre corto de la empresa, igual que la pantalla `/publico` de CIMBA.
4. **Migue con casco** (`migue-casco-v3.png` del repositorio de CIMBA) se usa sólo como avatar del chat, aprobado por ahora. El hero no lleva a Migue. Para volver al marcador neutro: `migue.avatarUrl` en `null` en `src/config/site.ts`.

## Reclamos en CiDiTuc (Atención Ciudadana · 147)

El formulario ya está en el portal y arma el reclamo con el formato de CiDiTuc.
Hoy funciona en **modo simulado**. Para registrarlo de verdad falta:

1. **Endpoint de alta en CiDiTuc**: pedirlo a Sistemas (DITEC), como se hizo con
   `POST /reclamos/cerrar` para CIMBA. Cuerpo y respuesta propuestos en
   [CONTRATOS_API.md](./CONTRATOS_API.md#5-reclamos-dentro-del-portal-siempre-en-cidituc).
2. **Alta del portal como "sistema externo" en Ciudad Digital** (el mismo trámite
   pendiente para CIMBA) y la URL de `/usuarios/authStatus` en `CIUDAD_DIGITAL_API_URL`.
   Con eso también se habilita el seguimiento.
3. Definir el `id_oreclamo` (origen "portal CIMBA Ciudadano") si Atención Ciudadana lo usa.
4. Fotos del reclamo: se suman cuando el alta acepte adjuntos.
5. `CIUDADANO_SESSION_SECRET` (32+ caracteres) en el hosting.

El ingreso con Ciudad Digital es el único paso fuera del portal: se valida la identidad
y se vuelve automáticamente al formulario con el borrador intacto. Si el vecino entra
al portal desde la app de Ciudad Digital (con `?auth=`), no sale nunca.

## Recursos oficiales

| Recurso | Estado | Qué falta |
|---|---|---|
| Logo municipal completo | PNG oficial del portal de Turismo SMT, enlazado. | Copiarlo a `public/brand/` (en CIMBA sólo está el isotipo, ya copiado). |
| Identidad CIMBA | Glifo radar y “CIMBA.” tomados de `components/marca.tsx` de CIMBA. Íconos de la app copiados. | — |
| Colores | Tokens oficiales de CIMBA (`#0066FF`, `#2EB1FF`, `#F4DC00`) y semáforo de estados. | — |
| Barrios | Capa oficial de 327 barrios copiada de CIMBA, sin propiedades internas. En modo live se usan los de `/capas`. | — |
| Foto del hero | Panorámica real de la Catedral, del portal de Turismo SMT. | Confirmar derechos y copiarla localmente. |
| Fuente de cortes de tránsito | **CIMBA no la tiene.** | Identificar la fuente oficial e implementar `listClosures` en una integración propia. |
| Contacto / accesibilidad / privacidad | Sin datos confirmados; privacidad en borrador. | Revisión legal y canal de contacto. |

## Migue

- Responde con un motor de reglas sobre la información pública del portal. **No usa el
  Migue interno de CIMBA** (`/api/migue`, que requiere sesión, consulta la base y llama
  a OpenRouter sin límite de gasto).
- Las herramientas (`src/lib/migue/tools.ts`) ya están listas para un modelo con *tool
  use*. Si se conecta uno: clave como secreto de servidor, límite de llamadas por
  sesión/día, y nunca enviar texto libre de pedidos de vecinos.

## Infraestructura

- Rate limiting en memoria (`src/middleware.ts`): usar almacén compartido si hay varias instancias.
- La portada se regenera cada 5 min (ISR) y CIMBA cachea 60 s: un trabajo nuevo tarda
  hasta ~6 min en aparecer.
- Mapa base OpenFreeMap. CIMBA usa CARTO positron; se puede unificar cambiando
  `siteConfig.map.styleUrl` y la CSP.
