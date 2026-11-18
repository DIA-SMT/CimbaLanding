/**
 * Utilidades geográficas mínimas (sin dependencias): centro de un barrio y
 * a qué barrio pertenece un punto. Coordenadas siempre [lng, lat] (GeoJSON).
 */

export type Ring = number[][];
export type PolygonCoords = Ring[];
export type AreaGeometry =
  | { type: "Polygon"; coordinates: PolygonCoords }
  | { type: "MultiPolygon"; coordinates: PolygonCoords[] };

const polygonsOf = (g: AreaGeometry): PolygonCoords[] => (g.type === "Polygon" ? [g.coordinates] : g.coordinates);

function ringContains(ring: Ring, x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i] as [number, number];
    const [xj, yj] = ring[j] as [number, number];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function polygonContains(g: AreaGeometry, lng: number, lat: number): boolean {
  return polygonsOf(g).some((poly) => {
    const [outer, ...holes] = poly;
    return !!outer && ringContains(outer, lng, lat) && !holes.some((h) => ringContains(h, lng, lat));
  });
}

function ringAreaCentroid(ring: Ring): { a: number; x: number; y: number } {
  let a = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i] as [number, number];
    const [xj, yj] = ring[j] as [number, number];
    const f = xj * yi - xi * yj;
    a += f;
    cx += (xj + xi) * f;
    cy += (yj + yi) * f;
  }
  a /= 2;
  return a === 0 ? { a: 0, x: ring[0]?.[0] ?? 0, y: ring[0]?.[1] ?? 0 } : { a, x: cx / (6 * a), y: cy / (6 * a) };
}

/** Centroide del anillo exterior más grande (suficiente para encuadrar un barrio). */
export function centerOf(g: AreaGeometry): { lat: number; lng: number } {
  let best = { a: 0, x: 0, y: 0 };
  for (const poly of polygonsOf(g)) {
    const c = poly[0] ? ringAreaCentroid(poly[0]) : null;
    if (c && Math.abs(c.a) >= Math.abs(best.a)) best = c;
  }
  return { lat: best.y, lng: best.x };
}

function bboxOf(g: AreaGeometry): [number, number, number, number] {
  let [minX, minY, maxX, maxY] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const poly of polygonsOf(g))
    for (const [x, y] of (poly[0] ?? []) as [number, number][]) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  return [minX, minY, maxX, maxY];
}

/** Índice simple para asignar barrio a muchos puntos (prefiltro por caja). */
export function buildAreaIndex<T>(areas: Array<{ value: T; geometry: AreaGeometry }>) {
  const items = areas.map((a) => ({ ...a, bbox: bboxOf(a.geometry) }));
  return (lng: number, lat: number): T | null => {
    for (const it of items) {
      const [a, b, c, d] = it.bbox;
      if (lng < a || lng > c || lat < b || lat > d) continue;
      if (polygonContains(it.geometry, lng, lat)) return it.value;
    }
    return null;
  };
}

/** "Villa 9 de Julio" → "villa-9-de-julio" */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}
