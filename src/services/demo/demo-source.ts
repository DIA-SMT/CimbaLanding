import "server-only";

import type { PublicDataSource } from "@/services/types";
import { computeSummary, filterClosures, filterInterventions } from "@/services/filters";
import { buildDemoClosures, buildDemoInterventions, DEMO_NEIGHBORHOODS } from "./demo-data";

/** Fuente de demostración. Sólo se activa explícitamente (ver services/index.ts). */
export function createDemoSource(): PublicDataSource {
  return {
    mode: "demo",
    async getSummary() {
      return computeSummary(buildDemoInterventions(), buildDemoClosures());
    },
    async listInterventions(query) {
      return filterInterventions(buildDemoInterventions(), query);
    },
    async getIntervention(id) {
      return buildDemoInterventions().find((i) => i.id === id) ?? null;
    },
    async listClosures(query) {
      return filterClosures(buildDemoClosures(), query);
    },
    async listNeighborhoods() {
      return DEMO_NEIGHBORHOODS;
    },
  };
}
