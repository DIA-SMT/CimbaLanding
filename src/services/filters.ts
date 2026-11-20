import type {
  ClosuresQuery,
  Intervention,
  InterventionsQuery,
  Summary,
  TrafficClosure,
} from "@/domain/schemas";
import { matchesQuery } from "@/lib/format";

/** Lo mínimo que necesita el filtro: sirve para la ficha completa y para los puntos livianos del mapa. */
export type Filtrable = Pick<Intervention, "status" | "type" | "neighborhoodId" | "neighborhood" | "date" | "street"> & {
  reference?: string | null;
};

/** Filtro común (servidor y cliente) para intervenciones. */
export function filterInterventions<T extends Filtrable>(items: T[], q: InterventionsQuery = {}): T[] {
  const from = q.from ? Date.parse(q.from) : null;
  const to = q.to ? Date.parse(q.to) : null;
  const out = items.filter((it) => {
    if (q.status?.length && !q.status.includes(it.status)) return false;
    if (q.type?.length && (!it.type || !q.type.includes(it.type))) return false;
    if (q.neighborhood && it.neighborhoodId !== q.neighborhood) return false;
    if (from !== null || to !== null) {
      if (!it.date) return false;
      const t = Date.parse(it.date);
      if (from !== null && t < from) return false;
      if (to !== null && t > to + 86_399_999) return false;
    }
    if (q.q && !matchesQuery([it.street, it.reference ?? "", it.neighborhood], q.q)) return false;
    return true;
  });
  const desde = q.offset ?? 0;
  return q.limit ? out.slice(desde, desde + q.limit) : desde ? out.slice(desde) : out;
}

/**
 * Orden de relevancia ciudadana: primero lo que está ocurriendo (en ejecución),
 * luego lo finalizado más reciente, después lo programado más próximo y al
 * final lo pendiente.
 */
const RANK = { en_ejecucion: 0, finalizado: 1, programado: 2, pendiente: 3 } as const;
export function sortByRelevance(items: Intervention[]): Intervention[] {
  return [...items].sort((a, b) => {
    if (a.status !== b.status) return RANK[a.status] - RANK[b.status];
    const da = a.date ?? "";
    const db = b.date ?? "";
    return a.status === "programado" ? da.localeCompare(db) : db.localeCompare(da);
  });
}

export function filterClosures(items: TrafficClosure[], q: ClosuresQuery = {}): TrafficClosure[] {
  return items.filter((c) => {
    if (q.status?.length && !q.status.includes(c.status)) return false;
    if (q.neighborhood && c.neighborhoodId !== q.neighborhood) return false;
    return true;
  });
}

export function computeSummary(interventions: Intervention[], closures: TrafficClosure[]): Summary {
  const hoods = new Set(interventions.map((i) => i.neighborhoodId));
  const latest = [...interventions.map((i) => i.updatedAt), ...closures.map((c) => c.updatedAt)].sort().at(-1);
  return {
    completed: interventions.filter((i) => i.status === "finalizado").length,
    inProgress: interventions.filter((i) => i.status === "en_ejecucion").length,
    activeClosures: closures.filter((c) => c.status === "vigente").length,
    neighborhoodsWithInterventions: hoods.size,
    updatedAt: latest ?? new Date().toISOString(),
  };
}
