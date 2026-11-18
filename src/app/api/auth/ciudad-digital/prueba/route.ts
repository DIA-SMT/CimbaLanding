import { NextResponse } from "next/server";
import { ciudadDigitalConfig } from "@/integrations/cidituc/config";
import { COOKIE_SESION, crearToken, opcionesCookie } from "@/lib/sesion";

/**
 * SÓLO DESARROLLO: persona de prueba para recorrer el circuito sin Ciudad
 * Digital. Con NODE_ENV=production o sin CIUDAD_DIGITAL_DEV_PERSONA=1 responde
 * 404. El id está fuera del padrón de CIDITUC (1–177.193), así que nunca
 * coincide con una persona real.
 */
export async function POST() {
  if (!ciudadDigitalConfig().devPersona) return NextResponse.json({ error: "no existe" }, { status: 404 });
  const token = crearToken({ id: 990_000_001, nombre: "Persona de prueba" });
  if (!token) return NextResponse.json({ error: "no existe" }, { status: 404 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_SESION, token, opcionesCookie);
  return res;
}
