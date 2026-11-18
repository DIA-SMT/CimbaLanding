import { z } from "zod";

/**
 * Subconjunto de la respuesta de la API pública de CIMBA que usa el portal.
 * Espejo de `DatosAvance` / `CapasAvance` (apps/web/src/lib/avance-tipos.ts en
 * DIA-SMT/CIMBA). Sólo se declaran los campos que se leen: el resto se descarta.
 */

const point = z.object({
  type: z.literal("Point"),
  coordinates: z.tuple([z.number(), z.number()]).rest(z.number()),
});

const feature = <P extends z.ZodTypeAny>(props: P) =>
  z.object({ type: z.literal("Feature"), geometry: point.nullable(), properties: props });

const fc = <P extends z.ZodTypeAny>(props: P) =>
  z.object({
    type: z.literal("FeatureCollection"),
    // Un registro inválido no tumba la respuesta entera: se filtra después.
    features: z.array(z.unknown()).transform((arr) =>
      arr.flatMap((f) => {
        const r = feature(props).safeParse(f);
        return r.success ? [r.data] : [];
      }),
    ),
  });

const str = z.string().max(300);

export const hechoSchema = z.object({
  id: z.number(),
  fecha: str,
  empresa: str.nullable().optional(),
  m2: z.number().nullable().optional(),
  direccion: str.nullable().optional(),
  foto: z.string().max(600).nullable().optional(),
  fotoAntes: z.string().max(600).nullable().optional(),
  tipo: str.nullable().optional(),
  sinValidar: z.boolean().optional(),
});

export const enCursoSchema = z.object({
  id: z.number(),
  empresa: str.nullable().optional(),
  m2: z.number().nullable().optional(),
  tipo: str.nullable().optional(),
  iniciada: str.nullable().optional(),
  direccion: str.nullable().optional(),
  actualizado: str.nullable().optional(),
});

export const agendaSchema = z.object({
  id: z.number(),
  estado: str,
  tipo: str.nullable().optional(),
  direccion: str.nullable().optional(),
  grupo: z.enum(["calzada", "agua", "otro"]).catch("otro"),
});

const cifra = z.object({ n: z.number(), m2: z.number().optional(), toneladas: z.number().optional() });

export const datosAvanceSchema = z.object({
  generadoEn: str,
  hoy: str.optional(),
  publico: z.boolean().optional(),
  hechos: fc(hechoSchema),
  enCurso: fc(enCursoSchema).optional(),
  agenda: fc(agendaSchema).optional(),
  cifras: z.object({
    total: cifra.extend({ desde: str.nullable().optional() }),
    ahora: z.object({ obras: z.number() }).partial().optional(),
  }),
});

const area = z.object({
  type: z.enum(["Polygon", "MultiPolygon"]),
  coordinates: z.array(z.unknown()),
});

export const capasAvanceSchema = z.object({
  barrios: z.object({
    features: z.array(
      z.object({
        geometry: area,
        properties: z.object({ id: z.number(), nombre: str, distrito: z.number().nullable().optional() }),
      }),
    ),
  }),
  /** [trabajo, clave de cuadra, cuadra, barrio] */
  trabajos: z.array(z.tuple([z.number(), z.string().nullable(), z.number().nullable(), z.number().nullable()])).optional(),
});

export type DatosAvance = z.infer<typeof datosAvanceSchema>;
export type CapasAvance = z.infer<typeof capasAvanceSchema>;
