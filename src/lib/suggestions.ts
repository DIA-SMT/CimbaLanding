export interface Suggestion {
  kind: "barrio" | "calle";
  label: string;
  value: string;
}

/**
 * "Vicente Gallo 1500" / "Vicente Gallo al 1.579" / "Pueyrredón y Pje. Lautaro"
 * → "Vicente Gallo" / "Vicente Gallo" / "Pueyrredón": sólo el nombre de la calle,
 * para sugerir cada calle una vez (y no una por altura).
 */
export function nombreDeCalle(direccion: string): string {
  return direccion
    .split(/\s+y\s+|,/i)[0]!
    .replace(/\s+(al\s+)?[\d.]+\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Sugerencias del buscador, construidas sólo con datos públicos ya publicados. */
export function buildSuggestions(neighborhoods: { id: string; name: string }[], streets: string[]): Suggestion[] {
  const hoods = neighborhoods.map((n) => ({ kind: "barrio" as const, label: n.name, value: n.name }));
  const vistas = new Map<string, string>();
  for (const s of streets) {
    const nombre = nombreDeCalle(s);
    const clave = nombre.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    if (nombre.length >= 3 && !/^(dirección|ubicación|problema)\b/i.test(nombre) && !vistas.has(clave)) vistas.set(clave, nombre);
  }
  const calles = [...vistas.values()].sort((a, b) => a.localeCompare(b, "es"));
  return [...hoods, ...calles.map((s) => ({ kind: "calle" as const, label: s, value: s }))];
}
