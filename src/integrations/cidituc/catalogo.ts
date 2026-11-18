/**
 * Tipos de reclamo de Atención Ciudadana (CIDITUC) que corresponden a calles.
 *
 * Categoría 1 = "Calles". Ids y nombres tomados del catálogo que usa CIMBA
 * (packages/integrations/src/fuentes/atencion-ciudadana.ts, que a su vez sale
 * de GET /atencionCiudadana/listarTipoReclamo). Sólo los HABILITADOS: los
 * marcados como deshabilitados en CIDITUC (2, 4, 104, 135) no se ofrecen.
 *
 * Módulo plano: lo usan el servidor y el formulario.
 */
export const CATEGORIA_CALLES = 1;

export const TIPOS_RECLAMO = [
  {
    id: 1,
    nombre: "Solicitud de bacheo",
    ayuda: "Un pozo o bache en una calle asfaltada.",
  },
  {
    id: 105,
    nombre: "Calle de pavimento en mal estado",
    ayuda: "Pavimento roto, hundido o muy deteriorado en un tramo.",
  },
  {
    id: 126,
    nombre: "Tapa rota u obstruida de desagüe o boca de tormenta",
    ayuda: "Tapas faltantes, rotas o bocas de tormenta tapadas.",
  },
  {
    id: 148,
    nombre: "Reparación o construcción de cordón cuneta",
    ayuda: "Cordón cuneta roto o inexistente.",
  },
  {
    id: 3,
    nombre: "Mantenimiento en calle de ripio",
    ayuda: "Calle sin pavimentar que necesita mantenimiento.",
  },
] as const;

export type IdTipoReclamo = (typeof TIPOS_RECLAMO)[number]["id"];
export const IDS_TIPO_RECLAMO = TIPOS_RECLAMO.map((t) => t.id) as [IdTipoReclamo, ...IdTipoReclamo[]];

export const nombreTipoReclamo = (id: number) => TIPOS_RECLAMO.find((t) => t.id === id)?.nombre ?? "Reclamo de calles";
