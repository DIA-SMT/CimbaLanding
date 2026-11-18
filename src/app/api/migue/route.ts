import { NextResponse } from "next/server";
import { migueRequestSchema } from "@/lib/migue/types";
import { answer } from "@/lib/migue/engine";
import { logger } from "@/lib/logger";

/** Asistente: sólo POST, cuerpo JSON pequeño, validado. No se registra el texto del vecino. */
export async function POST(req: Request) {
  if (!req.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ error: { code: "unsupported", message: "Formato no admitido" } }, { status: 415 });
  }
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > 2_000) {
    return NextResponse.json({ error: { code: "too_large", message: "Mensaje demasiado largo" } }, { status: 413 });
  }

  const body = await req.json().catch(() => null);
  const parsed = migueRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "invalid", message: "Escribí una consulta de hasta 400 caracteres." } }, { status: 400 });
  }

  try {
    return NextResponse.json(await answer(parsed.data.message), { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    logger.error("api.migue: error al responder", err);
    return NextResponse.json({ error: { code: "internal", message: "No pude responder en este momento." } }, { status: 500 });
  }
}
