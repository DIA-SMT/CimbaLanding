import { NextResponse } from "next/server";
import { COOKIE_SESION } from "@/lib/sesion";

/** Cierra la sesión del vecino en este portal (no la de Ciudad Digital). */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_SESION, "", { path: "/", maxAge: 0 });
  return res;
}
