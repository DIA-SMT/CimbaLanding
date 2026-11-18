import { getPortalData } from "@/services/portal";
import { buildSuggestions } from "@/lib/suggestions";
import { HeroSearch } from "./HeroSearch";

export async function HeroSearchLoader() {
  const { neighborhoods, interventions } = await getPortalData();
  const suggestions = buildSuggestions(
    neighborhoods.ok ? neighborhoods.data : [],
    interventions.ok ? interventions.data.map((i) => i.street) : [],
  );
  return <HeroSearch suggestions={suggestions} />;
}
