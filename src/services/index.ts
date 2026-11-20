import "server-only";

import type { DataMode, PublicResponse, ResponseMeta } from "@/domain/schemas";
import { createCimbaSource } from "@/integrations/cimba/client";
import { createCimbaDbSource } from "@/integrations/cimba/db-source";
import { createDemoSource } from "./demo/demo-source";
import { DataUnavailableError, type PublicDataSource } from "./types";

/**
 * Selección de la fuente de datos según entorno.
 *
 *   CIMBA_DATA_MODE=db    + CIMBA_DB_PUBLICO_URL → vistas de solo lectura de la base de CIMBA.
 *   CIMBA_DATA_MODE=live  + CIMBA_PUBLIC_API_URL → API pública de CIMBA.
 *   CIMBA_DATA_MODE=demo                          → datos de demostración rotulados.
 *   sin configurar                               → demo en desarrollo; "no disponible" en producción.
 *
 * En producción NUNCA se muestran datos de demostración salvo que se pida
 * explícitamente (por ejemplo, en un entorno de staging).
 */
type Fuente = "db" | "api" | "demo" | "ninguna";

function resolveFuente(): Fuente {
  const explicit = process.env.CIMBA_DATA_MODE;
  if (explicit === "db") return process.env.CIMBA_DB_PUBLICO_URL ? "db" : "ninguna";
  if (explicit === "live") return process.env.CIMBA_PUBLIC_API_URL ? "api" : "ninguna";
  if (explicit === "demo") return "demo";
  if (explicit === "off") return "ninguna";
  return process.env.NODE_ENV === "production" ? "ninguna" : "demo";
}

/** Modo que se informa al navegador (rótulos de demostración, avisos). */
export function resolveMode(): DataMode {
  const f = resolveFuente();
  return f === "db" || f === "api" ? "live" : f === "demo" ? "demo" : "unavailable";
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

function ventanaDias(): number {
  const dias = Number(process.env.CIMBA_VENTANA_DIAS ?? 90);
  return VENTANAS.has(dias) ? dias : 90;
}

function origenesFotos(extraOrigen?: string): string[] {
  const extra = (process.env.CIMBA_FOTOS_ORIGENES ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.startsWith("https://"))
    .map((s) => new URL(s).origin);
  // cimba.smt.gob.ar siempre: ahí su nginx sirve /fotos.
  return [...new Set([...(extraOrigen ? [extraOrigen] : []), "https://cimba.smt.gob.ar", ...extra])];
}

function cimbaConfigFromEnv() {
  const baseUrl = process.env.CIMBA_PUBLIC_API_URL!;
  return { baseUrl, windowDays: ventanaDias(), photoOrigins: origenesFotos(new URL(baseUrl).origin) };
}

export function getDataSource(): PublicDataSource {
  if (cached) return cached;
  const fuente = resolveFuente();
  cached =
    fuente === "db"
      ? createCimbaDbSource({
          url: process.env.CIMBA_DB_PUBLICO_URL!,
          windowDays: ventanaDias(),
          photoOrigins: origenesFotos(),
          fotosBase: process.env.CIMBA_FOTOS_BASE || "https://cimba.smt.gob.ar/fotos",
        })
      : fuente === "api"
        ? createCimbaSource(cimbaConfigFromEnv())
        : fuente === "demo"
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
