import { NextResponse } from "next/server";
import { migueRequestSchema } from "@/lib/migue/types";
import { answer } from "@/lib/migue/engine";
import { responderConIA } from "@/lib/migue/llm";
import { logger } from "@/lib/logger";

/** Asistente: sólo POST, cuerpo JSON acotado y validado. No se registra el texto del vecino. */
export async function POST(req: Request) {
  if (!req.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ error: { code: "unsupported", message: "Formato no admitido" } }, { status: 415 });
  }
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > 12_000) {
    return NextResponse.json({ error: { code: "too_large", message: "Mensaje demasiado largo" } }, { status: 413 });
  }

  const body = await req.json().catch(() => null);
  const parsed = migueRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "invalid", message: "Escribí una consulta de hasta 400 caracteres." } }, { status: 400 });
  }

  try {
    // Con modelo si está configurado; si no (o si falla), el motor de reglas.
    const { message, historial } = parsed.data;
    const reply = (await responderConIA(message, historial)) ?? (await answer(message));
    return NextResponse.json(reply, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    logger.error("api.migue: error al responder", err);
    return NextResponse.json({ error: { code: "internal", message: "No pude responder en este momento." } }, { status: 500 });
  }
}
