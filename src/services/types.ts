import type {
  ClosuresQuery,
  DataMode,
  Intervention,
  InterventionsQuery,
  Neighborhood,
  Summary,
  TrafficClosure,
} from "@/domain/schemas";

/**
 * Contrato de una fuente de datos pública.
 * Implementaciones: DemoDataSource (desarrollo) y CimbaPublicDataSource
 * (integración futura, sólo con endpoints públicos autorizados).
 */
export interface PublicDataSource {
  readonly mode: DataMode;
  getSummary(): Promise<Summary>;
  listInterventions(query?: InterventionsQuery): Promise<Intervention[]>;
  getIntervention(id: string): Promise<Intervention | null>;
  listClosures(query?: ClosuresQuery): Promise<TrafficClosure[]>;
  listNeighborhoods(): Promise<Neighborhood[]>;
  /** Reparaciones publicadas por mes desde el inicio del registro continuo (si la fuente lo sabe). */
  getMonthlyRepairs?(): Promise<{ mes: string; reparaciones: number }[]>;
}

export class DataUnavailableError extends Error {
  constructor(message = "La fuente de datos pública no está disponible") {
    super(message);
    this.name = "DataUnavailableError";
  }
}
