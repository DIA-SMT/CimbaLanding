import "server-only";

import { NextResponse } from "next/server";
import type { z } from "zod";
import { DataUnavailableError } from "@/services/types";
import { buildMeta, getDataSource } from "@/services";
import { logger } from "./logger";

export class NotFoundError extends Error {}

const CACHE ="public, s-maxage=120, stale-while-revalidate=600";

export function parseQuery<S extends z.ZodTypeAny>(schema: S, url: string) {
  const params = Object.fromEntries(new URL(url).searchParams.entries());
  return schema.safeParse(params);
}

export function badRequest() {
  return NextResponse.json(
    { error: { code: "invalid_query", message: "Parámetros de consulta inválidos" } },
    { status: 400 },
  );
}

/** Ejecuta un handler de lectura pública con manejo uniforme de errores. */
export async function publicGet<T>(load: () => Promise<{ data: T; updatedAt?: string | null }>) {
  const source = getDataSource();
  try {
    const { data, updatedAt = null } = await load();
    return NextResponse.json(
      { data, meta: buildMeta(source.mode, updatedAt) },
      { headers: { "Cache-Control": CACHE } },
    );
  } catch (err) {
    if (err instanceof NotFoundError) {
      return NextResponse.json({ error: { code: "not_found", message: "Registro no encontrado" } }, { status: 404 });
    }
    if (err instanceof DataUnavailableError) {
      return NextResponse.json(
        { data: null, meta: buildMeta("unavailable"), error: { code: "unavailable", message: "Información no disponible por el momento" } },
        { status: 503, headers: { "Retry-After": "120" } },
      );
    }
    logger.error("api.public: error inesperado", err);
    return NextResponse.json({ error: { code: "internal", message: "Error interno" } }, { status: 500 });
  }
}
