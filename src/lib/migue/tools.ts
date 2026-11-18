import "server-only";

import { z } from "zod";
import { siteConfig } from "@/config/site";
import { interventionStatusSchema, type Intervention, type TrafficClosure } from "@/domain/schemas";
import { getDataSource } from "@/services";

/**
 * Herramientas de Migue.
 *
 * Cada herramienta consulta EXCLUSIVAMENTE la capa de datos pública del portal
 * (la misma que expone /api/public/*). Ninguna accede a la base interna de
 * CIMBA. Están descriptas con esquema de entrada para poder conectarlas, en
 * el futuro, a un modelo de lenguaje mediante "tool use" sin cambiar su
 * implementación.
 */
export interface MigueTool<I extends z.ZodTypeAny, O> {
  name: string;
  description: string;
  input: I;
  run: (input: z.infer<I>) => Promise<O>;
}

const define = <I extends z.ZodTypeAny, O>(t: MigueTool<I, O>) => t;

export const searchInterventions = define({
  name: "buscar_intervenciones",
  description: "Busca intervenciones publicadas por calle, barrio o estado.",
  input: z.object({
    texto: z.string().max(80).optional(),
    barrioId: z.string().max(64).optional(),
    estado: interventionStatusSchema.optional(),
    limite: z.number().int().min(1).max(10).default(5),
  }),
  async run(i): Promise<Intervention[]> {
    return getDataSource().listInterventions({
      q: i.texto,
      neighborhood: i.barrioId,
      status: i.estado ? [i.estado] : undefined,
      limit: i.limite,
    });
  },
});

export const listClosures = define({
  name: "consultar_cortes",
  description: "Lista cortes de tránsito vigentes o programados, opcionalmente filtrados por calle o barrio.",
  input: z.object({
    calle: z.string().max(80).optional(),
    barrioId: z.string().max(64).optional(),
  }),
  async run(i): Promise<TrafficClosure[]> {
    const all = await getDataSource().listClosures({
      status: ["vigente", "programado"],
      neighborhood: i.barrioId,
    });
    if (!i.calle) return all;
    const { matchesQuery } = await import("@/lib/format");
    return all.filter((c) => matchesQuery([c.street, c.section], i.calle!));
  },
});

export const neighborhoodsTool = define({
  name: "listar_barrios",
  description: "Devuelve los barrios con información pública disponible.",
  input: z.object({}),
  run: () => getDataSource().listNeighborhoods(),
});

export const summaryTool = define({
  name: "resumen_general",
  description: "Indicadores públicos generales (finalizadas, en curso, cortes vigentes, barrios).",
  input: z.object({}),
  run: () => getDataSource().getSummary(),
});

export const claimsGuidance = define({
  name: "orientar_reclamo",
  description: "Explica cómo hacer un reclamo vial: formulario del portal, registrado en CiDiTuc (Atención Ciudadana · 147).",
  input: z.object({}),
  async run() {
    return {
      formulario: "#reclamos",
      sistema: "CiDiTuc · Atención Ciudadana",
      telefono: "147",
      identidad: "Cuenta de Ciudad Digital",
      sitioMunicipal: siteConfig.channels.municipalSite,
    };
  },
});

export const MIGUE_TOOLS = [searchInterventions, listClosures, neighborhoodsTool, summaryTool, claimsGuidance];
