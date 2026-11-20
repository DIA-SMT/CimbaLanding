import { z } from "zod";

/**
 * Modelo PÚBLICO de CIMBA Ciudadano.
 *
 * Es deliberadamente más chico que el modelo interno de CIMBA: sólo contiene
 * campos aptos para publicación. Cualquier dato que llegue de una integración
 * se valida contra estos esquemas y los campos desconocidos se descartan
 * (los objetos de zod son "strip" por defecto), de modo que nunca se filtren
 * datos administrativos o personales al navegador.
 */

const isoDate = z
  .string()
  .min(1)
  .refine((s) => !Number.isNaN(Date.parse(s)), "Fecha inválida");

export const latLngSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

/**
 * Estados públicos. Se derivan del semáforo de CIMBA
 * (apps/web/src/lib/formato.ts → pasoDeEstado), ver
 * src/integrations/cimba/status-map.ts:
 *   finalizado   ← trabajo finalizado y validado (incidente reparado/verificado)
 *   en_ejecucion ← obra en curso o incidente en_ejecucion ("en obra")
 *   programado   ← incidente programado ("en cola")
 *   pendiente    ← incidente detectado o priorizado (se muestra como "Detectado")
 */
export const interventionStatusSchema = z.enum([
  "finalizado",
  "en_ejecucion",
  "programado",
  "pendiente",
]);

/** Tipo de trabajo: enum `tipo_intervencion` de CIMBA (migración 0007). */
export const interventionTypeSchema = z.enum(["bacheo", "pano_hormigon", "carpeta", "enripiado"]);

export const photoSchema = z.object({
  /** URL https absoluta o ruta local que empiece con "/". */
  url: z
    .string()
    .min(1)
    .max(500)
    .refine((u) => u.startsWith("/") || u.startsWith("https://"), "URL de imagen no permitida"),
  alt: z.string().min(1).max(240),
  takenAt: isoDate.nullable().optional(),
  /** true sólo para imágenes ilustrativas de demostración (nunca evidencia real). */
  illustrative: z.boolean().optional(),
});

export const interventionSchema = z.object({
  id: z.string().min(1).max(64),
  street: z.string().min(1).max(120),
  /** Referencia de ubicación pública: altura, intersección o tramo. */
  reference: z.string().max(160).nullable(),
  neighborhoodId: z.string().min(1).max(64),
  neighborhood: z.string().min(1).max(120),
  /** Tipo de trabajo; null cuando todavía es un problema sin trabajo asignado. */
  type: interventionTypeSchema.nullable(),
  /** Tipo de problema de CIMBA (bache, hundimiento…) ya traducido, si se conoce. */
  problem: z.string().max(80).nullable().optional(),
  status: interventionStatusSchema,
  /** Empresa o cuadrilla (nombre corto), tal como lo publica CIMBA. Nunca nombres de personas. */
  company: z.string().max(60).nullable().optional(),
  /** Superficie informada del trabajo, en m². No se suman escalas distintas. */
  areaM2: z.number().nonnegative().nullable().optional(),
  /** Fecha confirmada relevante para el estado (fin, inicio o programación). */
  date: isoDate.nullable(),
  location: latLngSchema,
  photos: z
    .object({
      before: photoSchema.nullable().optional(),
      after: photoSchema.nullable().optional(),
    })
    .default({}),
  summary: z.string().max(600).nullable().optional(),
  updatedAt: isoDate,
});

export const closureStatusSchema = z.enum(["vigente", "programado", "finalizado"]);

export const trafficClosureSchema = z.object({
  id: z.string().min(1).max(64),
  street: z.string().min(1).max(120),
  section: z.string().min(1).max(200),
  neighborhoodId: z.string().max(64).nullable(),
  startsAt: isoDate,
  endsAt: isoDate.nullable(),
  /** Franja horaria informada, si el corte no es continuo. */
  schedule: z.string().max(120).nullable(),
  reason: z.string().min(1).max(240),
  status: closureStatusSchema,
  estimatedDuration: z.string().max(80).nullable(),
  /** Sólo desvíos informados oficialmente. Nunca se generan automáticamente. */
  officialDetour: z.string().max(400).nullable(),
  /** Polilínea del tramo afectado [lng, lat]. */
  path: z.array(z.tuple([z.number(), z.number()])).min(2),
  updatedAt: isoDate,
});

export const neighborhoodSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(120),
  center: latLngSchema,
});

export const dataModeSchema = z.enum(["live", "demo", "unavailable"]);

export const summarySchema = z.object({
  completed: z.number().int().nonnegative(),
  /** Desde cuándo cuenta `completed` (YYYY-MM-DD), si se conoce. */
  completedSince: z.string().nullable().optional(),
  inProgress: z.number().int().nonnegative(),
  /** null = la fuente de cortes no está integrada (CIMBA no registra cortes). */
  activeClosures: z.number().int().nonnegative().nullable(),
  neighborhoodsWithInterventions: z.number().int().nonnegative(),
  updatedAt: isoDate,
});

export const responseMetaSchema = z.object({
  mode: dataModeSchema,
  updatedAt: isoDate.nullable(),
  notice: z.string().nullable(),
});

export type LatLng = z.infer<typeof latLngSchema>;
export type InterventionStatus = z.infer<typeof interventionStatusSchema>;
export type InterventionType = z.infer<typeof interventionTypeSchema>;
export type Photo = z.infer<typeof photoSchema>;
export type Intervention = z.infer<typeof interventionSchema>;
export type ClosureStatus = z.infer<typeof closureStatusSchema>;
export type TrafficClosure = z.infer<typeof trafficClosureSchema>;
export type Neighborhood = z.infer<typeof neighborhoodSchema>;
export type DataMode = z.infer<typeof dataModeSchema>;
export type Summary = z.infer<typeof summarySchema>;
export type ResponseMeta = z.infer<typeof responseMetaSchema>;

export interface PublicResponse<T> {
  data: T;
  meta: ResponseMeta;
}

/* ---------- Validación de entradas (query params) ---------- */

const csv = <T extends z.ZodType<string, string>>(item: T) =>
  z
    .string()
    .max(200)
    .transform((s) => s.split(",").map((x) => x.trim()).filter(Boolean))
    .pipe(z.array(item).max(10));

export const interventionsQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .max(80)
    .regex(/^[\p{L}\p{N}\s.,°º'´-]*$/u, "Caracteres no permitidos")
    .optional(),
  status: csv(interventionStatusSchema).optional(),
  type: csv(interventionTypeSchema).optional(),
  neighborhood: z.string().trim().max(64).regex(/^[a-z0-9-]*$/).optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
  offset: z.coerce.number().int().min(0).max(100_000).optional(),
});

export const closuresQuerySchema = z.object({
  status: csv(closureStatusSchema).optional(),
  neighborhood: z.string().trim().max(64).regex(/^[a-z0-9-]*$/).optional(),
});

export type InterventionsQuery = z.infer<typeof interventionsQuerySchema>;
export type ClosuresQuery = z.infer<typeof closuresQuerySchema>;
