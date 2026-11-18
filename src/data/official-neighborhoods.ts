import "server-only";

import raw from "./barrios-smt.json";
import type { Neighborhood } from "@/domain/schemas";
import { buildAreaIndex, centerOf, slugify, type AreaGeometry } from "@/lib/geo";

/**
 * Capa OFICIAL de barrios de San Miguel de Tucumán (327 polígonos), tomada de
 * CIMBA (apps/web/public/data/barrios.json) sin sus propiedades internas.
 * Se usa en modo demo y como respaldo para asignar barrio a un punto.
 * En modo live, los barrios vienen de /api/publico/avance/capas.
 */
interface RawFeature {
  properties: { nombre: string };
  geometry: AreaGeometry;
}

const features = (raw as unknown as { features: RawFeature[] }).features;

/** Nombre duplicado → id único (algunos nombres se repiten en la capa). */
const seen = new Map<string, number>();
export const OFFICIAL_AREAS = features.map((f) => {
  const base = slugify(f.properties.nombre) || "barrio";
  const n = (seen.get(base) ?? 0) + 1;
  seen.set(base, n);
  const id = n > 1 ? `${base}-${n}` : base;
  return { id, name: f.properties.nombre, geometry: f.geometry };
});

export const OFFICIAL_NEIGHBORHOODS: Neighborhood[] = OFFICIAL_AREAS.map((a) => ({
  id: a.id,
  name: a.name,
  center: centerOf(a.geometry),
})).sort((a, b) => a.name.localeCompare(b.name, "es"));

export const findOfficialNeighborhood = buildAreaIndex(
  OFFICIAL_AREAS.map((a) => ({ value: { id: a.id, name: a.name }, geometry: a.geometry })),
);
