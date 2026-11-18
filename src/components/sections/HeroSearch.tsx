"use client";

import { PlaceSearch, type Suggestion } from "@/components/search/PlaceSearch";
import { goToMap } from "@/hooks/useExplorer";

export function HeroSearch({ suggestions }: { suggestions: Suggestion[] }) {
  return (
    <PlaceSearch
      suggestions={suggestions}
      placeholder="Buscá tu calle o barrio, por ej.: Av. Mate de Luna"
      onSearch={(value) => goToMap({ query: value, selectedId: null, neighborhoodId: null })}
    />
  );
}
