import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { PersonaCiDi } from "@/integrations/cidituc/reclamos";

/**
 * Sesión mínima del vecino: id_persona de CIDITUC y nombre, firmados con HMAC.
 * No hay base de datos ni registro propio. Dura 2 horas.
 */
export const COOKIE_SESION = "cimba_ciudadano";
const DURACION_S = 2 * 60 * 60;

function secreto(): string | null {
  const s = process.env.CIUDADANO_SESSION_SECRET;
  if (s && s.length >= 32) return s;
  // En desarrollo se tolera un secreto efímero; en producción, sin secreto no hay sesión.
  return process.env.NODE_ENV === "production" ? null : "desarrollo-solo-local-no-usar-en-produccion-0000";
}

const b64 = (s: string) => Buffer.from(s).toString("base64url");
const firmar = (datos: string, clave: string) => createHmac("sha256", clave).update(datos).digest("base64url");

export function crearToken(p: PersonaCiDi): string | null {
  const clave = secreto();
  if (!clave) return null;
  const datos = b64(JSON.stringify({ i: p.id, n: p.nombre, e: Math.floor(Date.now() / 1000) + DURACION_S }));
  return `${datos}.${firmar(datos, clave)}`;
}

export function leerToken(token: string | undefined): PersonaCiDi | null {
  const clave = secreto();
  if (!clave || !token) return null;
  const [datos, firma] = token.split(".");
  if (!datos || !firma) return null;
  const esperada = Buffer.from(firmar(datos, clave));
  const recibida = Buffer.from(firma);
  if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) return null;
  try {
    const p = JSON.parse(Buffer.from(datos, "base64url").toString()) as { i: number; n: string; e: number };
    if (typeof p.i !== "number" || p.e < Date.now() / 1000) return null;
    return { id: p.i, nombre: String(p.n) };
  } catch {
    return null;
  }
}

export async function personaActual(): Promise<PersonaCiDi | null> {
  return leerToken((await cookies()).get(COOKIE_SESION)?.value);
}

export const opcionesCookie = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: DURACION_S,
};

/** Sólo rutas internas: evita redirecciones abiertas. */
export function destinoSeguro(v: string | null): string {
  if (!v || !v.startsWith("/") || v.startsWith("//") || v.includes("\\")) return "/#reclamos";
  return v.slice(0, 200);
}
