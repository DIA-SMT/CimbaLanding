export interface Suggestion {
  kind: "barrio" | "calle";
  label: string;
  value: string;
}

/** Sugerencias del buscador, construidas sólo con datos públicos ya publicados. */
export function buildSuggestions(neighborhoods: { id: string; name: string }[], streets: string[]): Suggestion[] {
  const hoods = neighborhoods.map((n) => ({ kind: "barrio" as const, label: n.name, value: n.name }));
  const uniqueStreets = [...new Set(streets)].sort((a, b) => a.localeCompare(b, "es"));
  return [...hoods, ...uniqueStreets.map((s) => ({ kind: "calle" as const, label: s, value: s }))];
}
