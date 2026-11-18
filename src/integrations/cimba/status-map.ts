import type { InterventionStatus } from "@/domain/schemas";

/**
 * Equivalencia entre estados de CIMBA y estados públicos del portal.
 *
 * Fuente: repositorio DIA-SMT/CIMBA
 *  - enum `estado_incidente` (supabase/migrations/0000_init.sql):
 *    detectado, priorizado, programado, en_ejecucion, reparado, verificado, desestimado
 *  - el semáforo `pasoDeEstado` (apps/web/src/lib/formato.ts):
 *    reparado/verificado → resuelto · en_ejecucion → en obra · programado → en cola ·
 *    desestimado → inactivo · el resto → sin atención
 *  - la API pública (`/api/publico/avance`) ya separa: `hechos` (intervenciones
 *    finalizadas y validadas), `enCurso` (intervenciones en_curso) y `agenda`
 *    (incidentes detectado/priorizado/programado/en_ejecucion).
 *
 * `desestimado` y `anulada` nunca se publican.
 * Pendiente de confirmación de la Dirección: mostrar detectado+priorizado como
 * un único estado público "Detectado".
 */
export const CIMBA_INCIDENT_STATUS: Readonly<Record<string, InterventionStatus>> = Object.freeze({
  detectado: "pendiente",
  priorizado: "pendiente",
  programado: "programado",
  en_ejecucion: "en_ejecucion",
  reparado: "finalizado",
  verificado: "finalizado",
});

export function mapIncidentStatus(raw: unknown): InterventionStatus | null {
  if (typeof raw !== "string") return null;
  return CIMBA_INCIDENT_STATUS[raw.trim().toLowerCase()] ?? null;
}
