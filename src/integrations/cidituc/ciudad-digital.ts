import "server-only";

import { z } from "zod";
import { logger } from "@/lib/logger";
import { ciudadDigitalConfig } from "./config";
import { requestSmt } from "./https";
import type { PersonaCiDi } from "./reclamos";

/**
 * Ciudad Digital: identifica al vecino con su cuenta de CIDITUC.
 *
 * Mismo flujo que usa CIMBA (apps/web/src/lib/sso.ts):
 *  1. El portal de Ciudad Digital abre este sitio con ?auth=<token>.
 *  2. El servidor valida el token contra GET /usuarios/authStatus
 *     (Authorization crudo, sin "Bearer").
 *  3. Se guarda sólo id_persona y nombre en una cookie firmada.
 *
 * Requiere que el portal esté dado de alta como "sistema externo" en Ciudad
 * Digital (pendiente, igual que para CIMBA).
 */
const usuarioSchema = z.object({
  id_persona: z.coerce.number().int().positive(),
  nombre_persona: z.string().nullish(),
  apellido_persona: z.string().nullish(),
  nombre: z.string().nullish(),
  apellido: z.string().nullish(),
  apellido_nombre: z.string().nullish(),
});

export async function validarTokenCiDi(token: string): Promise<PersonaCiDi | null> {
  const { apiUrl } = ciudadDigitalConfig();
  if (!apiUrl || token.length > 4096) return null;
  try {
    const res = await requestSmt<Record<string, unknown>>(new URL("/usuarios/authStatus", apiUrl), {
      method: "GET",
      headers: { Authorization: token },
    });
    if (res.status !== 200 || !res.body) return null;
    const b = res.body as Record<string, unknown> & { data?: Record<string, unknown> };
    const crudo = b["usuarioSinContraseña"] ?? b.usuarioSinContrasena ?? b.data?.["usuarioSinContraseña"] ?? b.data?.usuarioSinContrasena;
    const u = usuarioSchema.safeParse(crudo);
    if (!u.success) return null;
    const nombre =
      [u.data.nombre_persona ?? u.data.nombre, u.data.apellido_persona ?? u.data.apellido].filter(Boolean).join(" ").trim() ||
      u.data.apellido_nombre ||
      "Vecino/a";
    return { id: u.data.id_persona, nombre: nombre.replace(/\s+/g, " ").slice(0, 80) };
  } catch (err) {
    logger.error("ciudad-digital: no se pudo validar el token", err);
    return null;
  }
}
