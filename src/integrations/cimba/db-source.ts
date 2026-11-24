import "server-only";

import postgres from "postgres";
import type { PublicDataSource } from "@/services/types";
import { DataUnavailableError } from "@/services/types";
import { filterInterventions, sortByRelevance } from "@/services/filters";
import { logger } from "@/lib/logger";
import { adaptAvance, type AdaptedAvance } from "./adapter";
import type { CapasAvance, DatosAvance } from "./avance-schema";

/**
 * Fuente de datos: VISTAS DE SOLO LECTURA de la base de CIMBA (esquema
 * `publico`, ver docs/cimba/0043_vistas_publicas.sql), con el rol
 * `cimba_publico`, que sólo puede leer esas vistas.
 *
 * Los datos se actualizan solos: cada minuto (como máximo) se vuelve a leer
 * la base. Las filas se convierten al mismo formato que la API pública de
 * CIMBA y pasan por el mismo adaptador, con las mismas reglas de publicación.
 *
 * Nunca se usa la conexión principal de CIMBA (DATABASE_URL): sólo
 * CIMBA_DB_PUBLICO_URL, del lado servidor.
 */

export interface DbConfig {
  url: string;
  windowDays: number;
  photoOrigins: string[];
  /** Base de las fotos propias de CIMBA (su nginx sirve /fotos). */
  fotosBase: string;
}

interface FilaTrabajo {
  id: string | number;
  dia: string;
  tipo: string | null;
  m2: number | null;
  empresa: string | null;
  direccion: string | null;
  lon: number;
  lat: number;
  barrio_id: string | number | null;
  foto_despues: string | null;
  foto_despues_url: string | null;
  foto_antes: string | null;
  foto_antes_url: string | null;
}
interface FilaObra {
  id: string | number;
  iniciada: string | null;
  tipo: string | null;
  m2: number | null;
  empresa: string | null;
  direccion: string | null;
  lon: number;
  lat: number;
}
interface FilaProblema {
  id: string | number;
  estado: string;
  tipo: string | null;
  lon: number;
  lat: number;
}
interface FilaBarrio {
  id: string | number;
  nombre: string;
  contorno: string;
}
interface FilaResumen {
  reparaciones: number;
  desde: string | null;
  generado_en: Date;
}

/** Reparaciones publicadas por mes (hora de Tucumán). */
export interface FilaMes {
  mes: string; // YYYY-MM
  n: number;
  primera: string; // YYYY-MM-DD
}

/**
 * Un mes cuenta como inicio del registro cuando tiene al menos esta cantidad
 * de reparaciones. Evita que una fecha mal cargada (hay una de 2006) o unas
 * pocas pruebas sueltas hagan decir "desde 2006" cuando CIMBA empezó en 2026.
 */
export const MINIMO_MES_CONSISTENTE = 20;

/** Desde cuándo hay registro continuo, cuántas reparaciones hay desde entonces y la serie mensual. */
export function inicioRegistros(meses: FilaMes[], minimo = MINIMO_MES_CONSISTENTE) {
  const i = meses.findIndex((m) => Number(m.n) >= minimo);
  if (i < 0) return null;
  const serie = meses.slice(i).map((m) => ({ mes: m.mes, reparaciones: Number(m.n) }));
  return {
    desde: meses[i]!.primera,
    total: serie.reduce((s, m) => s + m.reparaciones, 0),
    meses: serie,
    sueltasAnteriores: meses.slice(0, i).reduce((s, m) => s + Number(m.n), 0),
  };
}

/** Igual que `grupoDe` de CIMBA (apps/web/src/lib/avance.ts). */
function grupoDe(tipo: string | null): "calzada" | "agua" | "otro" {
  switch (tipo) {
    case "bache":
    case "pavimento_deteriorado":
    case "hundimiento":
    case "fisura":
    case "bocacalle_rota":
    case "cuneta_rota":
    case "cuadra_completa":
      return "calzada";
    case "perdida_agua":
    case "perdida_cloacal":
    case "sumidero":
    case "tapa_registro":
      return "agua";
    default:
      return "otro";
  }
}

/** Igual que `urlFoto` de CIMBA (apps/web/src/lib/fotos.ts). */
function urlFoto(base: string, storagePath: string | null, urlExterna: string | null): string | null {
  if (urlExterna) return urlExterna;
  if (!storagePath) return null;
  return `${base.replace(/\/$/, "")}/${storagePath.split("/").map(encodeURIComponent).join("/")}`;
}

const num = (v: string | number | null): number | null => (v == null ? null : Number(v));
const punto = (lon: number, lat: number) =>
  Number.isFinite(lon) && Number.isFinite(lat) ? { type: "Point" as const, coordinates: [lon, lat] as [number, number] } : null;

/** Una sola conexión (pool chico) por proceso, también entre recargas en desarrollo. */
const globalPool = globalThis as unknown as { __cimbaPublico?: ReturnType<typeof postgres> };

/**
 * El rol cimba_publico admite 5 conexiones en total. El portal en marcha usa
 * hasta 2 y la compilación 1, así un despliegue (que convive con el portal
 * vivo) nunca se queda sin conexión y no publica una portada vacía.
 */
const MAX_CONEXIONES = process.env.NEXT_PHASE === "phase-production-build" ? 1 : 2;

function conexion(url: string) {
  if (!globalPool.__cimbaPublico) {
    globalPool.__cimbaPublico = postgres(url, {
      max: MAX_CONEXIONES,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
      onnotice: () => {},
      connection: { application_name: "cimba-ciudadano" },
    });
  }
  return globalPool.__cimbaPublico;
}

export interface FilasPublicas {
  trabajos: FilaTrabajo[];
  obras: FilaObra[];
  problemas: FilaProblema[];
  barrios: FilaBarrio[];
  resumen: FilaResumen[];
  /** Si viene, el total y el "desde" salen del registro continuo (ver inicioRegistros). */
  meses?: FilaMes[];
}

/** Convierte las filas de las vistas al modelo público (función pura, sin base). */
export function filasAAvance(filas: FilasPublicas, cfg: Omit<DbConfig, "url">): AdaptedAvance {
  const { trabajos, obras, problemas, barrios, resumen } = filas;
  const inicio = filas.meses ? inicioRegistros(filas.meses) : null;
  const datos: DatosAvance = {
    generadoEn: (resumen[0]?.generado_en ?? new Date()).toISOString(),
    hechos: {
      type: "FeatureCollection",
      features: trabajos.map((t) => ({
        type: "Feature" as const,
        geometry: punto(t.lon, t.lat),
        properties: {
          id: Number(t.id),
          fecha: t.dia,
          empresa: t.empresa,
          m2: t.m2,
          direccion: t.direccion,
          foto: urlFoto(cfg.fotosBase, t.foto_despues, t.foto_despues_url),
          fotoAntes: urlFoto(cfg.fotosBase, t.foto_antes, t.foto_antes_url),
          tipo: t.tipo,
          sinValidar: false,
        },
      })),
    },
    enCurso: {
      type: "FeatureCollection",
      features: obras.map((o) => ({
        type: "Feature" as const,
        geometry: punto(o.lon, o.lat),
        properties: {
          id: Number(o.id),
          empresa: o.empresa,
          m2: o.m2,
          tipo: o.tipo,
          iniciada: o.iniciada,
          direccion: o.direccion,
          actualizado: null,
        },
      })),
    },
    agenda: {
      type: "FeatureCollection",
      features: problemas.map((p) => ({
        type: "Feature" as const,
        geometry: punto(p.lon, p.lat),
        properties: { id: Number(p.id), estado: p.estado, tipo: p.tipo, direccion: null, grupo: grupoDe(p.tipo) },
      })),
    },
    cifras: {
      total: inicio
        ? { n: inicio.total, desde: inicio.desde }
        : { n: Number(resumen[0]?.reparaciones ?? 0), desde: resumen[0]?.desde ?? null },
      ahora: { obras: obras.length },
    },
  };

  const capas: CapasAvance = {
    barrios: {
      features: barrios.flatMap((b) => {
        try {
          const geometry = JSON.parse(b.contorno) as CapasAvance["barrios"]["features"][number]["geometry"];
          return [{ geometry, properties: { id: Number(b.id), nombre: b.nombre, distrito: null } }];
        } catch {
          return [];
        }
      }),
    },
    trabajos: trabajos.map((t) => [Number(t.id), null, null, num(t.barrio_id)] as [number, null, null, number | null]),
  };

  const out = adaptAvance(datos, capas, {
    origin: "https://cimba.smt.gob.ar",
    photoOrigins: cfg.photoOrigins,
    windowDays: cfg.windowDays,
  });
  return { ...out, interventions: sortByRelevance(out.interventions) };
}

export function createCimbaDbSource(cfg: DbConfig): PublicDataSource {
  type Cargado = AdaptedAvance & { meses: { mes: string; reparaciones: number }[] };
  let memo: { at: number; value: Promise<Cargado> } | null = null;

  const leer = async (): Promise<Cargado> => {
    const sql = conexion(cfg.url);
    const ventana = cfg.windowDays > 0 ? sql`where fecha >= now() - make_interval(days => ${cfg.windowDays})` : sql``;
    let trabajos: FilaTrabajo[], obras: FilaObra[], problemas: FilaProblema[], barrios: FilaBarrio[], resumen: FilaResumen[], meses: FilaMes[];
    try {
      [trabajos, obras, problemas, barrios, resumen, meses] = await Promise.all([
        sql<FilaTrabajo[]>`
          select id, to_char(fecha at time zone 'America/Argentina/Tucuman', 'YYYY-MM-DD') as dia,
                 tipo, m2, empresa, direccion, lon, lat, barrio_id,
                 foto_despues, foto_despues_url, foto_antes, foto_antes_url
            from publico.trabajos ${ventana}`,
        sql<FilaObra[]>`
          select id, to_char(iniciada at time zone 'America/Argentina/Tucuman', 'YYYY-MM-DD') as iniciada,
                 tipo, m2, empresa, direccion, lon, lat
            from publico.obras_en_curso`,
        sql<FilaProblema[]>`select id, estado, tipo, lon, lat from publico.problemas`,
        sql<FilaBarrio[]>`select id, nombre, contorno from publico.barrios`,
        sql<FilaResumen[]>`select reparaciones, desde, generado_en from publico.resumen`,
        sql<FilaMes[]>`
          select to_char(fecha at time zone 'America/Argentina/Tucuman', 'YYYY-MM') as mes,
                 count(*)::int as n,
                 min(to_char(fecha at time zone 'America/Argentina/Tucuman', 'YYYY-MM-DD')) as primera
            from publico.trabajos group by 1 order by 1`,
      ]);
    } catch (err) {
      logger.error("cimba.db: no se pudo leer las vistas públicas", err);
      throw new DataUnavailableError("No se pudo leer la información pública de CIMBA");
    }

    const avance = filasAAvance({ trabajos, obras, problemas, barrios, resumen, meses }, cfg);
    return { ...avance, meses: inicioRegistros(meses)?.meses ?? [] };
  };

  const load = (): Promise<Cargado> => {
    if (memo && Date.now() - memo.at < 60_000) return memo.value;
    const value = leer().catch((e) => {
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
    async getMonthlyRepairs() {
      return (await load()).meses;
    },
  };
}
