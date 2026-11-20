import "server-only";

import type { PublicDataSource } from "@/services/types";
import { DataUnavailableError } from "@/services/types";
import { filterInterventions, sortByRelevance } from "@/services/filters";
import { logger } from "@/lib/logger";
import { adaptAvance, type AdaptedAvance } from "./adapter";
import { capasAvanceSchema, datosAvanceSchema, type CapasAvance } from "./avance-schema";

/**
 * Cliente de la API PÚBLICA OFICIAL de CIMBA (repositorio DIA-SMT/CIMBA):
 *
 *   GET {base}/api/publico/avance?dias=N      → DatosAvance (versión pública)
 *   GET {base}/api/publico/avance/capas        → barrios y cuadras
 *
 * Esas rutas sólo responden cuando la Dirección prende la llave
 * AVANCE_PUBLICO=1 en el hosting de CIMBA; mientras tanto devuelven 404 y el
 * portal muestra "información no disponible". No usa credenciales: es una API
 * pública de solo lectura, sin datos personales.
 *
 * CIMBA no registra cortes de tránsito: esa sección queda sin fuente.
 */

const TIMEOUT_MS = 12_000;
const REVALIDATE_S = 300;

export interface CimbaConfig {
  baseUrl: string;
  windowDays: number;
  photoOrigins: string[];
}

/** En desarrollo se permite http a un CIMBA local o de la red interna (prueba con datos reales). */
const RED_LOCAL = /^(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/;

function assertSafeUrl(u: URL) {
  const local = RED_LOCAL.test(u.hostname) && process.env.NODE_ENV !== "production";
  if (u.protocol !== "https:" && !local) throw new DataUnavailableError("La integración con CIMBA exige HTTPS");
}

async function getJson(cfg: CimbaConfig, path: string, revalidate = REVALIDATE_S): Promise<unknown> {
  const url = new URL(path, cfg.baseUrl);
  assertSafeUrl(url);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: ctrl.signal,
      next: { revalidate },
    });
    if (res.status === 404) throw new DataUnavailableError("CIMBA todavía no publica su avance (AVANCE_PUBLICO apagado)");
    if (!res.ok) throw new DataUnavailableError(`CIMBA respondió ${res.status}`);
    return await res.json();
  } catch (err) {
    logger.warn(`cimba.client: sin respuesta útil de ${url.pathname} (${err instanceof Error ? err.message : "error"})`);
    throw err instanceof DataUnavailableError ? err : new DataUnavailableError();
  } finally {
    clearTimeout(timer);
  }
}

export function createCimbaSource(cfg: CimbaConfig): PublicDataSource {
  const origin = new URL(cfg.baseUrl).origin;
  let memo: { at: number; value: Promise<AdaptedAvance> } | null = null;

  const load = (): Promise<AdaptedAvance> => {
    if (memo && Date.now() - memo.at < 60_000) return memo.value;
    const value = (async () => {
      const [datosRaw, capasRaw] = await Promise.all([
        getJson(cfg, `/api/publico/avance?dias=${cfg.windowDays}`),
        getJson(cfg, "/api/publico/avance/capas", 3600).catch(() => null),
      ]);
      const datos = datosAvanceSchema.safeParse(datosRaw);
      if (!datos.success) {
        logger.error("cimba.client: la respuesta de avance no tiene el formato esperado");
        throw new DataUnavailableError("Formato de CIMBA no reconocido");
      }
      let capas: CapasAvance | null = null;
      if (capasRaw) {
        const parsed = capasAvanceSchema.safeParse(capasRaw);
        capas = parsed.success ? parsed.data : null;
      }
      const out = adaptAvance(datos.data, capas, {
        // Con un CIMBA local (http) las rutas /fotos/... se buscan donde viven de verdad.
        origin: origin.startsWith("https://") ? origin : "https://cimba.smt.gob.ar",
        photoOrigins: cfg.photoOrigins,
        windowDays: cfg.windowDays,
      });
      return { ...out, interventions: sortByRelevance(out.interventions) };
    })().catch((e) => {
      memo = null;
      throw e;
    });
    memo = { at: Date.now(), value };
    return value;
  };

  return {
    mode: "live",
    async getSummary() {
      return (await load()).summary;
    },
    async listInterventions(query) {
      return filterInterventions((await load()).interventions, query);
    },
    async getIntervention(id) {
      return (await load()).interventions.find((i) => i.id === id) ?? null;
    },
    async listClosures() {
      throw new DataUnavailableError("CIMBA no registra cortes de tránsito; falta integrar la fuente oficial");
    },
    async listNeighborhoods() {
      return (await load()).neighborhoods;
    },
  };
}
