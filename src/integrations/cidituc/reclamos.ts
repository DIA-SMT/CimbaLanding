import "server-only";

import { z } from "zod";
import { logger } from "@/lib/logger";
import { CATEGORIA_CALLES, nombreTipoReclamo } from "./catalogo";
import { ciditucConfig, modoReclamos } from "./config";
import { requestSmt } from "./https";

/**
 * Reclamos en Atención Ciudadana (CIDITUC · 147).
 *
 * El reclamo SIEMPRE es de CIDITUC: este portal no guarda reclamos propios.
 * Lo carga el vecino acá, identificado con Ciudad Digital, y se registra en
 * CIDITUC con su id_persona. Desde ahí CIMBA lo ingiere solo (barrido diario
 * de /reclamos/traerReclamoPorID), igual que los que entran por el 147.
 */

export interface PersonaCiDi {
  id: number;
  nombre: string;
}

export interface NuevoReclamo {
  tipo: number;
  lat: number;
  lng: number;
  direccion: string;
  referencia: string | null;
  detalle: string;
}

export type ResultadoAlta =
  | { modo: "real"; idReclamo: number }
  | { modo: "simulado"; enviado: Record<string, unknown> };

export class ReclamosNoDisponibles extends Error {}

/** Cuerpo del alta. PROPUESTA: replica los campos de un reclamo de CIDITUC. */
function cuerpoAlta(r: NuevoReclamo, persona: PersonaCiDi) {
  const cfg = ciditucConfig();
  return {
    id_persona: persona.id,
    id_categoria: CATEGORIA_CALLES,
    id_treclamo: r.tipo,
    ...(cfg.origenId ? { id_oreclamo: cfg.origenId } : {}),
    asunto: nombreTipoReclamo(r.tipo),
    detalle: r.detalle,
    direccion: r.direccion,
    descripcion_lugar: r.referencia ?? "",
    coorde1: r.lat, // en CIDITUC coorde1 = latitud, coorde2 = longitud
    coorde2: r.lng,
  };
}

const altaRespuesta = z.union([
  z.object({ id_reclamo: z.coerce.number().int().positive() }).passthrough(),
  z.array(z.object({ id_reclamo: z.coerce.number().int().positive() }).passthrough()).min(1),
]);

export async function crearReclamo(r: NuevoReclamo, persona: PersonaCiDi): Promise<ResultadoAlta> {
  const modo = modoReclamos();
  const enviado = cuerpoAlta(r, persona);
  if (modo === "off") throw new ReclamosNoDisponibles("La recepción de reclamos desde el portal no está habilitada");
  if (modo === "simulado") return { modo, enviado };

  const cfg = ciditucConfig();
  const res = await requestSmt<unknown>(new URL(cfg.altaPath!, cfg.baseUrl), { method: "POST", body: enviado });
  const parsed = altaRespuesta.safeParse(res.body);
  if (res.status >= 400 || !parsed.success) {
    logger.error(`cidituc.alta: respuesta ${res.status} no válida`);
    throw new ReclamosNoDisponibles("Atención Ciudadana no confirmó el reclamo");
  }
  const id = Array.isArray(parsed.data) ? parsed.data[0]!.id_reclamo : parsed.data.id_reclamo;
  return { modo: "real", idReclamo: id };
}

/* ───────────────────────── Seguimiento ───────────────────────── */

const filaReclamo = z
  .object({
    id_reclamo: z.coerce.number(),
    id_persona: z.coerce.number().nullish(),
    nombre_treclamo: z.string().nullish(),
    fecha_hora_inicio: z.string().nullish(),
    direccion: z.string().nullish(),
    id_movi: z.coerce.number().nullish(),
    nombre_estado: z.string().nullish(),
  })
  .passthrough();

export interface EstadoReclamo {
  id: number;
  tipo: string | null;
  fecha: string | null;
  direccion: string | null;
  estado: string | null;
}

/**
 * Estado de un reclamo, SÓLO si pertenece a la persona identificada.
 * Si no existe o es de otra persona, devuelve null (misma respuesta en ambos
 * casos: no se revela si el número existe). Nunca devuelve datos de contacto.
 */
export async function consultarReclamo(id: number, persona: PersonaCiDi): Promise<EstadoReclamo | null> {
  const cfg = ciditucConfig();
  const res = await requestSmt<unknown>(new URL("/reclamos/traerReclamoPorID", cfg.baseUrl), {
    method: "POST",
    body: { idreclamo: id },
  });
  if (res.status === 404) return null;
  if (res.status >= 400) throw new ReclamosNoDisponibles("Atención Ciudadana no respondió");
  const filas = (Array.isArray(res.body) ? res.body : [res.body])
    .map((f) => filaReclamo.safeParse(f))
    .flatMap((p) => (p.success ? [p.data] : []));
  const primera = filas[0];
  if (!primera || primera.id_persona == null || primera.id_persona !== persona.id) return null;
  // El estado vigente es el del último movimiento (id_movi más alto), como lo lee CIMBA.
  const ultimo = [...filas].sort((a, b) => (b.id_movi ?? 0) - (a.id_movi ?? 0))[0];
  const limpio = (s: string | null | undefined) => (s ? s.replace(/\s+/g, " ").trim() || null : null);
  return {
    id: primera.id_reclamo,
    tipo: limpio(primera.nombre_treclamo),
    fecha: limpio(primera.fecha_hora_inicio),
    direccion: limpio(primera.direccion?.split(", SAN MIGUEL")[0]),
    estado: limpio(ultimo?.nombre_estado),
  };
}
