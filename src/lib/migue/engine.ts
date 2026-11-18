import "server-only";

import { DATE_LABEL, STATUS_META, kindLabel, CLOSURE_STATUS_META } from "@/domain/labels";
import type { Intervention, InterventionStatus, Neighborhood, TrafficClosure } from "@/domain/schemas";
import { formatDate, formatDateTime, normalize } from "@/lib/format";
import { getDataSource } from "@/services";
import { DataUnavailableError } from "@/services/types";
import { listClosures, neighborhoodsTool, searchInterventions, summaryTool } from "./tools";
import { MIGUE_STARTERS, type MigueCard, type MigueReply } from "./types";

/**
 * Motor provisional de Migue: interpreta la intención con reglas simples y
 * responde SÓLO con lo que devuelven las herramientas públicas.
 * Si no hay registros, lo dice. No completa ni supone información.
 *
 * Reemplazable por un modelo de lenguaje con tool use, reutilizando
 * MIGUE_TOOLS (ver docs/MIGUE.md).
 */

const STOPWORDS = new Set(
  "que se en la el los las de del a al y o un una por para hay como cual cuales esta estan sobre mi me hoy arreglo arreglaron reparo reparacion reparaciones calle calles barrio trabajo trabajos obra obras intervencion intervenciones quiero saber informacion donde cuando".split(
    " ",
  ),
);

const toInterventionCard = (i: Intervention): MigueCard => ({
  kind: "intervention",
  id: i.id,
  title: `${i.street}${i.reference ? ` ${i.reference}` : ""}`,
  subtitle: `${i.neighborhood} · ${kindLabel(i)} · ${i.date ? `${DATE_LABEL[i.status]} ${formatDate(i.date)}` : "Sin fecha confirmada"}`,
  badge: STATUS_META[i.status].label,
});

const toClosureCard = (c: TrafficClosure): MigueCard => ({
  kind: "closure",
  id: c.id,
  title: c.street,
  subtitle: `${c.section} · desde ${formatDateTime(c.startsAt)}${c.schedule ? ` · ${c.schedule}` : ""}`,
  badge: CLOSURE_STATUS_META[c.status].label,
});

function findNeighborhood(text: string, hoods: Neighborhood[]) {
  const t = normalize(text);
  return hoods
    .map((h) => ({ h, n: normalize(h.name) }))
    .sort((a, b) => b.n.length - a.n.length)
    .find(({ n }) => t.includes(n))?.h;
}

function detectStatus(t: string): InterventionStatus | undefined {
  if (/(finaliz|terminad|termino|arreglad|reparad|complet)/.test(t)) return "finalizado";
  if (/(en curso|ejecucion|trabajando|haciendo|ahora)/.test(t)) return "en_ejecucion";
  if (/(program|proxim|planific|van a)/.test(t)) return "programado";
  return undefined;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function freeText(t: string) {
  return t
    .split(" ")
    .filter((w) => w.length > 1 && !STOPWORDS.has(w))
    .join(" ");
}

export async function answer(message: string): Promise<MigueReply> {
  const mode = getDataSource().mode;
  const t = normalize(message);
  const base = { cards: [] as MigueCard[], links: [] as MigueReply["links"], suggestions: [] as string[], mode };
  const demoTail = mode === "demo" ? "\n\n(Estás viendo datos de demostración, no información municipal vigente.)" : "";

  try {
    // Reclamos: se hacen en el portal y quedan en CiDiTuc (Atención Ciudadana · 147).
    if (/(reclam|denunci|report|avisar|bache nuevo|pozo)/.test(t)) {
      return {
        ...base,
        reply:
          "Podés hacer el reclamo acá mismo, en la sección Reclamos: elegís el tipo de problema, marcás el lugar en el mapa y lo describís. Queda registrado en Atención Ciudadana (CiDiTuc · 147) a tu nombre, con tu cuenta de Ciudad Digital, y CIMBA lo recibe automáticamente. También podés llamar al 147.",
        links: [{ label: "Ir al formulario de reclamos", href: "#reclamos" }],
      };
    }

    // Saludo / ayuda
    if (/^(hola|buen|buenas|hey|ayuda|que podes|que sabes)/.test(t) || t.length < 3) {
      return {
        ...base,
        reply:
          "¡Hola! Soy Migue. Puedo ayudarte a consultar reparaciones por calle o barrio, ver cortes de tránsito y orientarte para hacer un reclamo. ¿Qué querés saber?",
        suggestions: MIGUE_STARTERS,
      };
    }

    const hoods = await neighborhoodsTool.run({});
    const hood = findNeighborhood(message, hoods);

    // Cortes
    if (/(corte|cortad|transit|desvio|cerrad|clausur)/.test(t)) {
      const rest = freeText(t.replace(/(cortes?|cortad[ao]s?|transito|desvios?|cerrad[ao]s?|vigentes?|hoy)/g, " "));
      let items;
      try {
        items = await listClosures.run({
          barrioId: hood?.id,
          calle: !hood && rest.length > 2 ? rest : undefined,
        });
      } catch (err) {
        if (!(err instanceof DataUnavailableError)) throw err;
        return {
          ...base,
          reply:
            "Todavía no tengo información de cortes de tránsito: CIMBA registra las reparaciones, pero no los cortes, y la fuente oficial de cortes aún no está conectada a este portal. No te voy a inventar un corte ni un desvío.",
          links: [{ label: "Sitio oficial de la Municipalidad", href: "https://smt.gob.ar/" }],
        };
      }
      if (!items.length) {
        return {
          ...base,
          reply: `No encontré cortes de tránsito publicados${hood ? ` en ${hood.name}` : rest ? ` para “${rest}”` : ""}. Si ves un corte que no figura acá, puede que todavía no haya sido informado.${demoTail}`,
          links: [{ label: "Ver todos los cortes", href: "#cortes" }],
        };
      }
      const vig = items.filter((c) => c.status === "vigente").length;
      return {
        ...base,
        reply: `Encontré ${items.length} corte${items.length > 1 ? "s" : ""} publicado${items.length > 1 ? "s" : ""}${hood ? ` en ${hood.name}` : ""}: ${vig} vigente${vig === 1 ? "" : "s"} y ${items.length - vig} programado${items.length - vig === 1 ? "" : "s"}. Los desvíos sólo se muestran cuando fueron informados oficialmente.${demoTail}`,
        cards: items.slice(0, 4).map(toClosureCard),
        links: [{ label: "Ver sección de cortes", href: "#cortes" }],
      };
    }

    const status = detectStatus(t);

    // Barrio
    if (hood) {
      const items = await searchInterventions.run({ barrioId: hood.id, estado: status, limite: 10 });
      const all = await getDataSource().listInterventions({ neighborhood: hood.id });
      const count = (s: InterventionStatus) => all.filter((i) => i.status === s).length;
      return {
        ...base,
        reply: all.length
          ? `En ${hood.name} hay ${plural(all.length, "intervención publicada", "intervenciones publicadas")}: ${plural(count("finalizado"), "finalizada", "finalizadas")}, ${count("en_ejecucion")} en ejecución y ${plural(count("programado"), "programada", "programadas")}.${demoTail}`
          : `No hay intervenciones publicadas en ${hood.name} por el momento.${demoTail}`,
        cards: items.slice(0, 4).map(toInterventionCard),
        links: all.length ? [{ label: `Ver ${hood.name} en el mapa`, href: `#mapa?barrio=${hood.id}` }] : [],
      };
    }

    // Recientes
    if (/(reciente|ultim|nuev|novedad)/.test(t)) {
      const items = await searchInterventions.run({ estado: status ?? "finalizado", limite: 4 });
      return {
        ...base,
        reply: items.length
          ? `Estas son las intervenciones ${STATUS_META[status ?? "finalizado"].label.toLowerCase()}s más recientes publicadas.${demoTail}`
          : "Todavía no hay intervenciones recientes publicadas.",
        cards: items.map(toInterventionCard),
      };
    }

    // Resumen
    if (/(cuant|total|resumen|estadistic|numero)/.test(t)) {
      const s = await summaryTool.run({});
      return {
        ...base,
        reply: `Según los datos publicados: ${s.completed} reparaciones finalizadas, ${s.inProgress} intervenciones en curso, ${s.activeClosures} cortes vigentes y ${s.neighborhoodsWithInterventions} barrios con intervenciones registradas. Actualizado el ${formatDate(s.updatedAt)}.${demoTail}`,
      };
    }

    // Búsqueda por calle (texto libre)
    const q = freeText(t);
    if (q.length >= 3) {
      const items = await searchInterventions.run({ texto: q, estado: status, limite: 10 });
      if (items.length) {
        return {
          ...base,
          reply: `Encontré ${items.length === 10 ? "10 o más" : items.length} intervención${items.length > 1 ? "es" : ""} publicada${items.length > 1 ? "s" : ""} que coinciden con “${q}”.${demoTail}`,
          cards: items.slice(0, 4).map(toInterventionCard),
          links: [{ label: "Ver resultados en el mapa", href: `#mapa?q=${encodeURIComponent(q)}` }],
        };
      }
      return {
        ...base,
        reply: `No encontré registros publicados para “${q}”. Puede que no haya intervenciones informadas en esa ubicación o que el nombre esté escrito de otra forma. Probá con el nombre de la calle o del barrio.`,
        suggestions: MIGUE_STARTERS.slice(0, 3),
      };
    }

    return {
      ...base,
      reply: "No estoy seguro de haber entendido. Podés preguntarme por una calle, un barrio, los cortes de tránsito o cómo hacer un reclamo.",
      suggestions: MIGUE_STARTERS,
    };
  } catch (err) {
    if (err instanceof DataUnavailableError) {
      return {
        ...base,
        mode: "unavailable",
        reply: "En este momento no puedo acceder a la información pública. Probá nuevamente en unos minutos.",
      };
    }
    throw err;
  }
}
