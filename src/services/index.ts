import "server-only";

import type { DataMode, PublicResponse, ResponseMeta } from "@/domain/schemas";
import { createCimbaSource } from "@/integrations/cimba/client";
import { createDemoSource } from "./demo/demo-source";
import { DataUnavailableError, type PublicDataSource } from "./types";

/**
 * Selección de la fuente de datos según entorno.
 *
 *   CIMBA_DATA_MODE=live  + CIMBA_PUBLIC_API_URL → integración autorizada.
 *   CIMBA_DATA_MODE=demo                          → datos de demostración rotulados.
 *   sin configurar                               → demo en desarrollo; "no disponible" en producción.
 *
 * En producción NUNCA se muestran datos de demostración salvo que se pida
 * explícitamente (por ejemplo, en un entorno de staging).
 */
function resolveMode(): DataMode {
  const explicit = process.env.CIMBA_DATA_MODE;
  if (explicit === "live") return process.env.CIMBA_PUBLIC_API_URL ? "live" : "unavailable";
  if (explicit === "demo") return "demo";
  if (explicit === "off") return "unavailable";
  return process.env.NODE_ENV === "production" ? "unavailable" : "demo";
}

const unavailableSource: PublicDataSource = {
  mode: "unavailable",
  getSummary: () => Promise.reject(new DataUnavailableError()),
  listInterventions: () => Promise.reject(new DataUnavailableError()),
  getIntervention: () => Promise.reject(new DataUnavailableError()),
  listClosures: () => Promise.reject(new DataUnavailableError()),
  listNeighborhoods: () => Promise.reject(new DataUnavailableError()),
};

let cached: PublicDataSource | null = null;

/** Ventanas que acepta CIMBA (avance-tipos.ts → VENTANAS). 0 = todo. */
const VENTANAS = new Set([1, 7, 30, 90, 0]);

function cimbaConfigFromEnv() {
  const baseUrl = process.env.CIMBA_PUBLIC_API_URL!;
  const dias = Number(process.env.CIMBA_VENTANA_DIAS ?? 90);
  const origin = new URL(baseUrl).origin;
  const extra = (process.env.CIMBA_FOTOS_ORIGENES ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.startsWith("https://"))
    .map((s) => new URL(s).origin);
  return {
    baseUrl,
    windowDays: VENTANAS.has(dias) ? dias : 90,
    photoOrigins: [origin, ...extra],
  };
}

export function getDataSource(): PublicDataSource {
  if (cached) return cached;
  const mode = resolveMode();
  cached =
    mode === "live"
      ? createCimbaSource(cimbaConfigFromEnv())
      : mode === "demo"
        ? createDemoSource()
        : unavailableSource;
  return cached;
}

export const DEMO_NOTICE =
  "Datos de demostración generados para el diseño del portal. No representan información municipal vigente.";

export function buildMeta(mode: DataMode, updatedAt: string | null = null): ResponseMeta {
  return {
    mode,
    updatedAt,
    notice:
      mode === "demo"
        ? DEMO_NOTICE
        : mode === "unavailable"
          ? "La información pública todavía no está disponible."
          : null,
  };
}

export function respond<T>(data: T, mode: DataMode, updatedAt: string | null = null): PublicResponse<T> {
  return { data, meta: buildMeta(mode, updatedAt) };
}
