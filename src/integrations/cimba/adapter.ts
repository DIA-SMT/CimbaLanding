import "server-only";
import { rutaFotoLocal } from "./fotos-externas";

import {
  interventionSchema,
  interventionTypeSchema,
  type Intervention,
  type InterventionType,
  type Neighborhood,
  type Photo,
  type Summary,
} from "@/domain/schemas";
import { PROBLEM_LABEL } from "@/domain/labels";
import { OFFICIAL_NEIGHBORHOODS, findOfficialNeighborhood } from "@/data/official-neighborhoods";
import { buildAreaIndex, centerOf, type AreaGeometry } from "@/lib/geo";
import { logger } from "@/lib/logger";
import type { CapasAvance, DatosAvance } from "./avance-schema";
import { mapIncidentStatus } from "./status-map";

/**
 * Adaptador: respuesta pública de CIMBA (`/api/publico/avance` + `/capas`) →
 * modelo público del portal.
 *
 * Reglas:
 *  - Sólo se leen campos de la versión pública (sin nombres de personas, sin
 *    direcciones de pedidos de vecinos). Los pedidos (`pendientes`) NO se
 *    publican en el portal.
 *  - `hechos` con `sinValidar` se descartan (sólo trabajo validado).
 *  - De la agenda se publica lo de calzada y "otro"; lo de agua (S.A.T.) no
 *    lo resuelve Bacheo y queda fuera.
 *  - Las fotos sólo se aceptan si su origen está en la lista permitida.
 *  - Todo registro se valida contra el esquema público; lo inválido se descarta.
 */

export interface AdaptOptions {
  /** Origen de CIMBA, para resolver rutas relativas de fotos (/fotos/...). */
  origin: string;
  /** Orígenes desde los que se aceptan fotos. */
  photoOrigins: string[];
  windowDays: number;
}

export interface AdaptedAvance {
  interventions: Intervention[];
  neighborhoods: Neighborhood[];
  summary: Summary;
}

const TYPES = new Set<string>(interventionTypeSchema.options);
const asType = (t: unknown): InterventionType | null => (typeof t === "string" && TYPES.has(t) ? (t as InterventionType) : null);

/** "YYYY-MM-DD" (día de Tucumán) → ISO al mediodía local. */
const dayToIso = (d: string | null | undefined): string | null =>
  d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? `${d}T12:00:00-03:00` : null;

const clean = (s: string | null | undefined) => (s ? s.replace(/\s+/g, " ").trim() || null : null);

/** "Andrés Chazarreta 1770, Municipalidad de San Miguel De Tucuman, Tucumán" → "Andrés Chazarreta 1770". */
const direccionCorta = (s: string | null | undefined) =>
  clean(s?.replace(/,\s*(municipalidad de )?san miguel de tucum[aá]n.*$/i, "").replace(/,\s*tucum[aá]n\s*$/i, ""));

function resolvePhoto(url: string | null | undefined, opts: AdaptOptions, alt: string): Photo | null {
  if (!url) return null;
  try {
    const u = new URL(url, opts.origin);
    if (u.protocol !== "https:") return null;
    if (!opts.photoOrigins.includes(u.origin)) return null;
    return { url: rutaFotoLocal(u), alt };
  } catch {
    return null;
  }
}

export function adaptAvance(datos: DatosAvance, capas: CapasAvance | null, opts: AdaptOptions): AdaptedAvance {
  /* Barrios: los de CIMBA (ids reales de su base) o, si no vinieron las capas, la capa oficial local. */
  let neighborhoods: Neighborhood[];
  let locate: (lng: number, lat: number) => { id: string; name: string } | null;
  const byId = new Map<string, string>();

  if (capas?.barrios.features.length) {
    const areas = capas.barrios.features.map((f) => ({
      id: String(f.properties.id),
      name: clean(f.properties.nombre) ?? `Barrio ${f.properties.id}`,
      geometry: f.geometry as unknown as AreaGeometry,
    }));
    neighborhoods = areas
      .map((a) => ({ id: a.id, name: a.name, center: centerOf(a.geometry) }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
    areas.forEach((a) => byId.set(a.id, a.name));
    locate = buildAreaIndex(areas.map((a) => ({ value: { id: a.id, name: a.name }, geometry: a.geometry })));
  } else {
    neighborhoods = OFFICIAL_NEIGHBORHOODS;
    locate = findOfficialNeighborhood;
  }

  const barrioDeTrabajo = new Map<number, string>();
  for (const [trabajo, , , barrio] of capas?.trabajos ?? []) {
    if (barrio != null) barrioDeTrabajo.set(trabajo, String(barrio));
  }

  const updatedAt = new Date(Date.parse(datos.generadoEn) || Date.now()).toISOString();
  const raw: unknown[] = [];
  let dropped = 0;

  const place = (lng: number, lat: number, hint?: string) => {
    if (hint && byId.has(hint)) return { id: hint, name: byId.get(hint)! };
    return locate(lng, lat) ?? { id: "sin-barrio", name: "Sin barrio asignado" };
  };

  for (const f of datos.hechos.features) {
    const p = f.properties;
    if (!f.geometry || p.sinValidar) {
      dropped++;
      continue;
    }
    const [lng, lat] = f.geometry.coordinates;
    const hood = place(lng, lat, barrioDeTrabajo.get(p.id));
    const where = direccionCorta(p.direccion);
    const after = resolvePhoto(p.foto, opts, `Calle reparada${where ? ` en ${where}` : ""} (después del trabajo)`);
    const before = resolvePhoto(p.fotoAntes, opts, `Estado de la calle${where ? ` en ${where}` : ""} antes del trabajo`);
    raw.push({
      id: `t${p.id}`,
      street: where ?? "Dirección no publicada",
      reference: null,
      neighborhoodId: hood.id,
      neighborhood: hood.name,
      // Sin tipo cargado en CIMBA: no se inventa ("Reparación vial" en la ficha).
      type: asType(p.tipo),
      problem: null,
      status: "finalizado",
      company: p.empresa && p.empresa !== "Otros" ? p.empresa : null,
      areaM2: p.m2 ?? null,
      date: dayToIso(p.fecha),
      location: { lat, lng },
      photos: { before, after },
      summary: null,
      updatedAt,
    });
  }

  for (const f of datos.enCurso?.features ?? []) {
    const p = f.properties;
    if (!f.geometry) continue;
    const [lng, lat] = f.geometry.coordinates;
    const hood = place(lng, lat);
    raw.push({
      id: `o${p.id}`,
      street: direccionCorta(p.direccion) ?? "Dirección no publicada",
      reference: null,
      neighborhoodId: hood.id,
      neighborhood: hood.name,
      type: asType(p.tipo),
      problem: null,
      status: "en_ejecucion",
      company: p.empresa && p.empresa !== "Otros" ? p.empresa : null,
      areaM2: p.m2 ?? null,
      date: dayToIso(p.iniciada),
      location: { lat, lng },
      photos: {},
      summary: null,
      updatedAt: dayToIso(p.actualizado) ?? updatedAt,
    });
  }

  for (const f of datos.agenda?.features ?? []) {
    const p = f.properties;
    const status = mapIncidentStatus(p.estado);
    if (!f.geometry || !status || status === "finalizado" || p.grupo === "agua") {
      dropped++;
      continue;
    }
    const [lng, lat] = f.geometry.coordinates;
    const hood = place(lng, lat);
    raw.push({
      id: `p${p.id}`,
      street: direccionCorta(p.direccion) ?? (hood.id === "sin-barrio" ? "Ubicación sin dirección publicada" : `Problema registrado en ${hood.name}`),
      reference: null,
      neighborhoodId: hood.id,
      neighborhood: hood.name,
      type: null,
      problem: p.tipo ? (PROBLEM_LABEL[p.tipo] ?? "Otro") : null,
      status,
      company: null,
      areaM2: null,
      date: null,
      location: { lat, lng },
      photos: {},
      summary: null,
      updatedAt,
    });
  }

  const interventions: Intervention[] = [];
  for (const r of raw) {
    const parsed = interventionSchema.safeParse(r);
    if (parsed.success) interventions.push(parsed.data);
    else dropped++;
  }
  if (dropped) logger.warn(`cimba.adapter: ${dropped} registro(s) no publicables descartados`);

  const hoodsWithWork = new Set(interventions.map((i) => i.neighborhoodId).filter((id) => id !== "sin-barrio"));

  return {
    interventions,
    neighborhoods,
    summary: {
      completed: datos.cifras.total.n,
      completedSince: datos.cifras.total.desde ?? null,
      inProgress: interventions.filter((i) => i.status === "en_ejecucion").length,
      activeClosures: null,
      neighborhoodsWithInterventions: hoodsWithWork.size,
      updatedAt,
    },
  };
}
