import "server-only";

import { cache } from "react";
import type { DataMode, Intervention, Neighborhood, Summary, TrafficClosure } from "@/domain/schemas";
import { getDataSource } from "@/services";
import { logger } from "@/lib/logger";
import { DataUnavailableError } from "@/services/types";

export type Loaded<T> = { ok: true; data: T } | { ok: false; data: null };

async function safe<T>(label: string, fn: () => Promise<T>): Promise<Loaded<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (err) {
    if (!(err instanceof DataUnavailableError)) logger.error(`portal: no se pudo cargar ${label}`, err);
    return { ok: false, data: null };
  }
}

export interface PortalData {
  mode: DataMode;
  summary: Loaded<Summary>;
  interventions: Loaded<Intervention[]>;
  closures: Loaded<TrafficClosure[]>;
  neighborhoods: Loaded<Neighborhood[]>;
}

/** Carga única por request (React cache) compartida por todas las secciones del servidor. */
export const getPortalData = cache(async (): Promise<PortalData> => {
  const src = getDataSource();
  const [summary, interventions, closures, neighborhoods] = await Promise.all([
    safe("resumen", () => src.getSummary()),
    safe("intervenciones", () => src.listInterventions()),
    safe("cortes", () => src.listClosures()),
    safe("barrios", () => src.listNeighborhoods()),
  ]);
  return { mode: src.mode, summary, interventions, closures, neighborhoods };
});
