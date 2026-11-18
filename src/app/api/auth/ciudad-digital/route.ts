import { NextResponse, type NextRequest } from "next/server";
import { validarTokenCiDi } from "@/integrations/cidituc/ciudad-digital";
import { COOKIE_SESION, crearToken, destinoSeguro, opcionesCookie } from "@/lib/sesion";

/**
 * Entrada desde Ciudad Digital: ?auth=<token> → valida contra CIDITUC → cookie
 * firmada → vuelve al formulario sin el token en la URL.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("auth") ?? "";
  const volver = destinoSeguro(req.nextUrl.searchParams.get("volver"));
  const destino = new URL(volver, req.nextUrl.origin);

  const persona = token ? await validarTokenCiDi(token) : null;
  const firmado = persona ? crearToken(persona) : null;
  if (!firmado) {
    destino.searchParams.set("cidi", "error");
    destino.hash = "reclamos";
    return NextResponse.redirect(destino);
  }
  const res = NextResponse.redirect(destino);
  res.cookies.set(COOKIE_SESION, firmado, opcionesCookie);
  res.headers.set("Cache-Control", "no-store");
  return res;
}
