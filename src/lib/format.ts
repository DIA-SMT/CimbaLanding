const TZ = "America/Argentina/Tucuman";

const dateFmt = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: TZ,
});

const dateTimeFmt = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: TZ,
});

const numberFmt = new Intl.NumberFormat("es-AR");

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "Sin fecha confirmada";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Sin fecha confirmada";
  return dateFmt.format(d).replace(/\./g, "");
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return dateTimeFmt.format(d).replace(/\./g, "");
}

export function formatNumber(n: number): string {
  return numberFmt.format(n);
}

/** Normaliza texto para búsquedas: minúsculas, sin acentos ni signos. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchesQuery(haystack: string[], query: string): boolean {
  const q = normalize(query);
  if (!q) return true;
  const text = normalize(haystack.join(" "));
  return q.split(" ").every((token) => text.includes(token));
}

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
