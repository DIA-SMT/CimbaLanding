import type { Intervention } from "./schemas";

/**
 * Versión LIVIANA de una intervención para el mapa y su listado: posición,
 * estado y lo necesario para filtrar y buscar. Las fotos, la empresa y el
 * resto de la ficha se piden recién al abrir un punto
 * (GET /api/public/interventions/:id).
 */
export type MapPoint = Pick<Intervention, "id" | "status" | "type" | "problem" | "date" | "street" | "neighborhoodId"> & {
  location: { lat: number; lng: number };
};

/** El punto con el nombre del barrio (se completa en el navegador con la lista de barrios). */
export type MapItem = MapPoint & { neighborhood: string; reference: null };

const redondear = (n: number) => Math.round(n * 1e5) / 1e5; // ~1 m

export function toMapPoint(i: Intervention): MapPoint {
  return {
    id: i.id,
    status: i.status,
    type: i.type,
    problem: i.problem ?? null,
    // Sólo el día: alcanza para filtrar y mostrar, y pesa menos.
    date: i.date ? i.date.slice(0, 10) + "T12:00:00-03:00" : null,
    street: [i.street, i.reference].filter(Boolean).join(" "),
    neighborhoodId: i.neighborhoodId,
    location: { lat: redondear(i.location.lat), lng: redondear(i.location.lng) },
  };
}
