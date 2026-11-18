import "server-only";

import type { Intervention, InterventionStatus, InterventionType, Neighborhood, TrafficClosure } from "@/domain/schemas";
import { PROBLEM_LABEL } from "@/domain/labels";
import { OFFICIAL_NEIGHBORHOODS, findOfficialNeighborhood } from "@/data/official-neighborhoods";
import { sortByRelevance } from "@/services/filters";

/**
 * ⚠️ DATOS DE DEMOSTRACIÓN — NO SON INFORMACIÓN MUNICIPAL.
 *
 * Se generan de forma determinística para diseñar y probar la interfaz
 * mientras CIMBA no publique su avance (AVANCE_PUBLICO). Los barrios son la
 * capa oficial (327 polígonos) y los tipos y estados son los de CIMBA, pero
 * las intervenciones, fechas, empresas, cortes y cantidades son ficticios.
 * La interfaz los rotula como demostración.
 */

export const DEMO_NEIGHBORHOODS: Neighborhood[] = OFFICIAL_NEIGHBORHOODS;

/** Barrios oficiales donde se reparten los registros de ejemplo, con calles reales de cada zona. */
const DEMO_ZONES: Array<{ name: string; streets: string[] }> = [
  { name: "Microcentro", streets: ["24 de Septiembre", "San Martín", "Laprida", "Maipú", "Congreso", "Las Piedras"] },
  { name: "Norte", streets: ["Av. Sarmiento", "Santiago del Estero", "Córdoba", "Monteagudo", "Marcos Paz"] },
  { name: "Sur", streets: ["Av. Roca", "General Paz", "Lavalle", "Chacabuco", "Corrientes"] },
  { name: "Villa Lujan", streets: ["Av. Avellaneda", "Lamadrid", "Pje. Padilla", "Av. Brígido Terán"] },
  { name: "Ciudadela", streets: ["Av. Mate de Luna", "Pje. Coronel Zelaya", "Av. Alem", "Bolívar"] },
  { name: "Oeste II", streets: ["Av. Mate de Luna", "Av. Mitre", "Av. América", "Av. Independencia"] },
  { name: "Villa 9 de Julio", streets: ["Av. Juan B. Justo", "Av. Sarmiento", "Thames", "Marco Avellaneda"] },
  { name: "Villa Alem", streets: ["Av. Roca", "Av. Jujuy", "Ayacucho", "Av. Independencia"] },
  { name: "El Bosque", streets: ["Av. Ejército del Norte", "Av. Alem", "Las Talitas"] },
  { name: "Villa Amalia", streets: ["Av. Ejército del Norte", "Av. Néstor Kirchner", "Viamonte"] },
  { name: "Ciudad Jardin", streets: ["Av. Roca", "Av. Siria", "Alberdi", "Av. Benjamín Aráoz"] },
  { name: "Parque Centenario", streets: ["Av. Benjamín Aráoz", "Av. Soldati", "Av. Gobernador del Campo"] },
];

const WORK_TYPES: InterventionType[] = ["bacheo", "bacheo", "bacheo", "bacheo", "pano_hormigon", "carpeta"];
const PROBLEMS = ["bache", "bache", "bache", "hundimiento", "pavimento_deteriorado", "bocacalle_rota"];
const COMPANIES = ["Empresa A", "Empresa B", "Empresa C", "Cuadrilla municipal"];
const STATUSES: InterventionStatus[] = [
  "finalizado",
  "finalizado",
  "finalizado",
  "finalizado",
  "en_ejecucion",
  "en_ejecucion",
  "programado",
  "pendiente",
];

/** PRNG determinístico (mulberry32) para que la demo sea estable entre renders. */
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAY = 86_400_000;

function startOfToday(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12);
}

/** Imágenes ilustrativas (SVG generado) — rotuladas como tales, no son evidencia. */
function illustrativePhotos() {
  return {
    before: {
      url: "/demo/ilustracion-antes.svg",
      alt: "Ilustración de ejemplo de calzada deteriorada (no es una fotografía real)",
      illustrative: true,
    },
    after: {
      url: "/demo/ilustracion-despues.svg",
      alt: "Ilustración de ejemplo de calzada reparada (no es una fotografía real)",
      illustrative: true,
    },
  };
}

const pick = <T,>(arr: T[], r: number): T => arr[Math.floor(r * arr.length)] as T;

export function buildDemoInterventions(): Intervention[] {
  const rand = rng(20261118);
  const today = startOfToday();
  const items: Intervention[] = [];
  let n = 1;

  for (const zone of DEMO_ZONES) {
    const hood = OFFICIAL_NEIGHBORHOODS.find((h) => h.name === zone.name);
    if (!hood) continue;
    const count = 5 + Math.floor(rand() * 5);
    for (let i = 0; i < count; i++) {
      const status = pick(STATUSES, rand());
      // Como en CIMBA: lo terminado y las obras tienen tipo de trabajo; lo que está en agenda, tipo de problema.
      const isWork = status === "finalizado" || (status === "en_ejecucion" && rand() > 0.5);
      const street = pick(zone.streets, rand());
      const altura = (Math.floor(rand() * 28) + 1) * 100;
      const offsetDays =
        status === "finalizado" ? -Math.floor(rand() * 85) - 1 : status === "en_ejecucion" ? -Math.floor(rand() * 10) : 0;
      const location = {
        lat: hood.center.lat + (rand() - 0.5) * 0.006,
        lng: hood.center.lng + (rand() - 0.5) * 0.007,
      };
      const where = findOfficialNeighborhood(location.lng, location.lat) ?? { id: hood.id, name: hood.name };
      const id = `demo-${String(n).padStart(3, "0")}`;

      items.push({
        id,
        street: `${street} al ${altura.toLocaleString("es-AR")}`,
        reference: null,
        neighborhoodId: where.id,
        neighborhood: where.name,
        type: isWork ? pick(WORK_TYPES, rand()) : null,
        problem: isWork ? null : PROBLEM_LABEL[pick(PROBLEMS, rand())],
        status,
        company: isWork ? pick(COMPANIES, rand()) : null,
        areaM2: isWork ? Math.round(2 + rand() * 6) : null,
        // CIMBA no publica fecha para lo que está en agenda (programado / detectado).
        date: isWork ? new Date(today + offsetDays * DAY).toISOString() : null,
        location,
        photos: status === "finalizado" && rand() > 0.35 ? illustrativePhotos() : {},
        summary: null,
        updatedAt: new Date(today - Math.floor(rand() * 3) * DAY).toISOString(),
      });
      n++;
    }
  }

  return sortByRelevance(items);
}

const hoodOfPath = (path: [number, number][]) => {
  const [lng, lat] = path[0] ?? [0, 0];
  return findOfficialNeighborhood(lng, lat)?.id ?? null;
};

export function buildDemoClosures(): TrafficClosure[] {
  const today = startOfToday();
  // Hora local de Tucumán (UTC-3).
  const iso = (d: number, h = 8) => new Date(today + d * DAY + (h + 3 - 12) * 3_600_000).toISOString();
  const updatedAt = new Date(today).toISOString();

  const list: TrafficClosure[] = [
    {
      id: "demo-c1",
      street: "Av. Mate de Luna",
      section: "Entre Av. América y Av. Mitre (mano hacia el oeste)",
      neighborhoodId: null,
      startsAt: iso(-1),
      endsAt: iso(2, 20),
      schedule: "De 8 a 20 h",
      reason: "Bacheo de calzada (demostración)",
      status: "vigente",
      estimatedDuration: "4 días",
      officialDetour: null,
      path: [
        [-65.2372, -26.8247],
        [-65.2268, -26.8263],
      ],
      updatedAt,
    },
    {
      id: "demo-c2",
      street: "24 de Septiembre",
      section: "Entre Laprida y Maipú",
      neighborhoodId: null,
      startsAt: iso(0, 7),
      endsAt: iso(0, 19),
      schedule: "De 7 a 19 h",
      reason: "Repavimentación (demostración)",
      status: "vigente",
      estimatedDuration: "1 jornada",
      officialDetour: "Ejemplo de desvío oficial: circular por Mendoza. (Texto de demostración)",
      path: [
        [-65.2058, -26.8306],
        [-65.2011, -26.8301],
      ],
      updatedAt,
    },
    {
      id: "demo-c3",
      street: "Av. Roca",
      section: "Entre Av. Jujuy y Ayacucho",
      neighborhoodId: null,
      startsAt: iso(3),
      endsAt: iso(6, 18),
      schedule: "De 8 a 18 h",
      reason: "Reparación de calzada de hormigón (demostración)",
      status: "programado",
      estimatedDuration: "3 días",
      officialDetour: null,
      path: [
        [-65.2101, -26.8478],
        [-65.1998, -26.8466],
      ],
      updatedAt,
    },
    {
      id: "demo-c4",
      street: "Av. Benjamín Aráoz",
      section: "Entre Av. Soldati y Av. Gobernador del Campo",
      neighborhoodId: null,
      startsAt: iso(5, 22),
      endsAt: iso(6, 6),
      schedule: "Nocturno, de 22 a 6 h",
      reason: "Sellado de fisuras (demostración)",
      status: "programado",
      estimatedDuration: "1 noche",
      officialDetour: null,
      path: [
        [-65.1922, -26.8398],
        [-65.1868, -26.8352],
      ],
      updatedAt,
    },
    {
      id: "demo-c5",
      street: "Av. Juan B. Justo",
      section: "Entre Thames y Marco Avellaneda",
      neighborhoodId: null,
      startsAt: iso(-2),
      endsAt: iso(1, 20),
      schedule: null,
      reason: "Bacheo de calzada (demostración)",
      status: "vigente",
      estimatedDuration: "4 días",
      officialDetour: null,
      path: [
        [-65.2152, -26.8115],
        [-65.2148, -26.8031],
      ],
      updatedAt,
    },
  ];
  return list.map((c) => ({ ...c, neighborhoodId: hoodOfPath(c.path) }));
}
