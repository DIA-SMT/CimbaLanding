import type { ClosureStatus, InterventionStatus, InterventionType } from "./schemas";

/**
 * Colores de mapa = SEMAFORO_HEX (tema claro) de CIMBA (apps/web/src/lib/formato.ts):
 * resuelto #15803d · en obra #c08a00 · en cola #e8590c · sin atención #d42d20.
 * Etiquetas en el vocabulario público de CIMBA (glosario.ts).
 */
export const STATUS_META: Record<
  InterventionStatus,
  { label: string; color: string; bg: string; text: string; dot: string; help: string }
> = {
  finalizado: {
    label: "Reparado",
    color: "#15803d",
    bg: "bg-finalizado-bg",
    text: "text-finalizado",
    dot: "bg-finalizado",
    help: "El trabajo se terminó y fue validado por la Dirección de Bacheo.",
  },
  en_ejecucion: {
    label: "En ejecución",
    color: "#c08a00",
    bg: "bg-ejecucion-bg",
    text: "text-ejecucion",
    dot: "bg-ejecucion",
    help: "Hay una cuadrilla o una obra trabajando ahora en el lugar.",
  },
  programado: {
    label: "Programado",
    color: "#e8590c",
    bg: "bg-programado-bg",
    text: "text-programado",
    dot: "bg-programado",
    help: "Tiene cuadrilla u orden de trabajo asignada: hay un compromiso concreto de hacerlo.",
  },
  pendiente: {
    label: "Detectado",
    color: "#d42d20",
    bg: "bg-pendiente-bg",
    text: "text-pendiente",
    dot: "bg-pendiente",
    help: "El problema está registrado y en evaluación, todavía sin trabajo asignado.",
  },
};

export const STATUS_ORDER: InterventionStatus[] = ["finalizado", "en_ejecucion", "programado", "pendiente"];

/** Enum `tipo_intervencion` de CIMBA. */
export const TYPE_LABEL: Record<InterventionType, string> = {
  bacheo: "Bacheo",
  pano_hormigon: "Paño de hormigón",
  carpeta: "Carpeta asfáltica",
  enripiado: "Enripiado",
};

/** Enum `tipo_problema` de CIMBA (ETIQUETA_TIPO en formato.ts). */
export const PROBLEM_LABEL: Record<string, string> = {
  bache: "Bache",
  pavimento_deteriorado: "Pavimento deteriorado",
  hundimiento: "Hundimiento",
  fisura: "Fisura",
  sumidero: "Sumidero",
  tapa_registro: "Tapa de registro",
  perdida_agua: "Pérdida de agua",
  perdida_cloacal: "Pérdida de líquidos cloacales",
  bocacalle_rota: "Bocacalle rota",
  cuneta_rota: "Cuneta rota",
  cuadra_completa: "Cuadra completa",
  otro: "Otro",
};

/** Qué se muestra como "tipo" de una ficha: el trabajo, o el problema si todavía no hay trabajo. */
export function kindLabel(i: { type: InterventionType | null; problem?: string | null }): string {
  return i.type ? TYPE_LABEL[i.type] : (i.problem ?? "Problema vial");
}

export const CLOSURE_STATUS_META: Record<ClosureStatus, { label: string; bg: string; text: string }> = {
  vigente: { label: "Vigente", bg: "bg-corte-bg", text: "text-corte" },
  programado: { label: "Programado", bg: "bg-programado-bg", text: "text-programado" },
  finalizado: { label: "Finalizado", bg: "bg-finalizado-bg", text: "text-finalizado" },
};

/** Qué significa la fecha mostrada según el estado. */
export const DATE_LABEL: Record<InterventionStatus, string> = {
  finalizado: "Reparado el",
  en_ejecucion: "Iniciado el",
  programado: "Programado para el",
  pendiente: "Registrado el",
};
