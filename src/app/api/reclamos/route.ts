import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { IDS_TIPO_RECLAMO } from "@/integrations/cidituc/catalogo";
import { ciudadDigitalConfig, modoReclamos } from "@/integrations/cidituc/config";
import { crearReclamo, ReclamosNoDisponibles } from "@/integrations/cidituc/reclamos";
import { findOfficialNeighborhood } from "@/data/official-neighborhoods";
import { personaActual } from "@/lib/sesion";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/** Estado del formulario para el navegador: modo, sesión y cómo ingresar. */
export async function GET() {
  const persona = await personaActual();
  const cidi = ciudadDigitalConfig();
  return NextResponse.json(
    {
      modo: modoReclamos(),
      persona: persona ? { nombre: persona.nombre } : null,
      ingreso: { portalUrl: cidi.portalUrl, ssoConfigurado: Boolean(cidi.apiUrl), prueba: cidi.devPersona },
      seguimiento: Boolean(cidi.apiUrl),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

const texto = (min: number, max: number) =>
  z
    .string()
    .transform((s) => s.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim())
    .pipe(z.string().min(min).max(max));

const reclamoSchema = z.object({
  tipo: z.coerce.number().refine((n) => (IDS_TIPO_RECLAMO as readonly number[]).includes(n), "Tipo inválido"),
  lat: z.number().min(-27.2).max(-26.5),
  lng: z.number().min(-65.6).max(-64.9),
  direccion: texto(4, 120),
  referencia: texto(0, 160).nullable().optional(),
  detalle: texto(10, 500),
});

function mismoOrigen(req: NextRequest) {
  const origin = req.headers.get("origin");
  return !origin || origin === req.nextUrl.origin;
}

export async function POST(req: NextRequest) {
  if (!mismoOrigen(req)) return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
  if (!req.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ error: "Formato no admitido" }, { status: 415 });
  }
  const persona = await personaActual();
  if (!persona) {
    return NextResponse.json({ error: "Ingresá con Ciudad Digital para enviar el reclamo." }, { status: 401 });
  }

  const parsed = reclamoSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Revisá los datos del reclamo: falta información o hay un campo inválido." }, { status: 400 });
  }
  const r = parsed.data;
  // Debe caer dentro de un barrio oficial de San Miguel de Tucumán.
  const barrio = findOfficialNeighborhood(r.lng, r.lat);
  if (!barrio) {
    return NextResponse.json({ error: "La ubicación marcada está fuera de San Miguel de Tucumán." }, { status: 400 });
  }

  try {
    const resultado = await crearReclamo(
      { tipo: r.tipo, lat: r.lat, lng: r.lng, direccion: r.direccion, referencia: r.referencia || null, detalle: r.detalle },
      persona,
    );
    return NextResponse.json({ ...resultado, barrio: barrio.name }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof ReclamosNoDisponibles) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    logger.error("api.reclamos: error al registrar", err);
    return NextResponse.json({ error: "No pudimos registrar el reclamo. Probá de nuevo en unos minutos." }, { status: 500 });
  }
}
