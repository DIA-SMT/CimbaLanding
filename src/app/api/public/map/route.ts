import { publicGet } from "@/lib/api";
import { toMapPoint } from "@/domain/map-point";
import { getDataSource } from "@/services";

/** Puntos livianos para el mapa (se piden recién cuando el mapa está por verse). */
export async function GET() {
  return publicGet(async () => {
    const items = await getDataSource().listInterventions();
    return {
      data: items.map(toMapPoint),
      updatedAt: items.map((d) => d.updatedAt).sort().at(-1) ?? null,
    };
  });
}
