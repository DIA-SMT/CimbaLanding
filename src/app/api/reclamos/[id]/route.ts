import { NextResponse } from "next/server";
import { ciudadDigitalConfig } from "@/integrations/cidituc/config";
import { consultarReclamo, ReclamosNoDisponibles } from "@/integrations/cidituc/reclamos";
import { personaActual } from "@/lib/sesion";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Seguimiento de un reclamo de CIDITUC. Sólo para la persona que lo hizo
 * (se compara su id_persona de Ciudad Digital). Nunca devuelve datos de contacto.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d{1,9}$/.test(id)) return NextResponse.json({ error: "Número de reclamo inválido" }, { status: 400 });
  if (!ciudadDigitalConfig().apiUrl) {
    return NextResponse.json({ error: "El seguimiento todavía no está habilitado" }, { status: 503 });
  }
  const persona = await personaActual();
  if (!persona) return NextResponse.json({ error: "Ingresá con Ciudad Digital para ver tus reclamos." }, { status: 401 });

  try {
    const estado = await consultarReclamo(Number(id), persona);
    if (!estado) {
      return NextResponse.json({ error: "No encontramos un reclamo tuyo con ese número." }, { status: 404 });
    }
    return NextResponse.json({ data: estado }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (!(err instanceof ReclamosNoDisponibles)) logger.error("api.reclamos.seguimiento: error", err);
    return NextResponse.json({ error: "Atención Ciudadana no respondió. Probá más tarde." }, { status: 503 });
  }
}
