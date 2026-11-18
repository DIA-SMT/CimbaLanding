"use client";

import { Map } from "lucide-react";
import { goToMap } from "@/hooks/useExplorer";

export function ViewOnMapButton({ id, label = "Ver en el mapa" }: { id: string; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => goToMap({ selectedId: id, query: "", neighborhoodId: null })}
      className="inline-flex items-center gap-1.5 rounded-full px-1 text-sm font-bold text-primary hover:underline"
    >
      <Map className="size-4" aria-hidden /> {label}
    </button>
  );
}
