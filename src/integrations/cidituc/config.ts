import "server-only";

/**
 * Configuración de CIDITUC (Atención Ciudadana · 147) y Ciudad Digital.
 * Todo del lado servidor. Ningún valor va al navegador salvo `modo`.
 *
 *   CIDITUC_RECLAMOS_MODO  off | simulado | real
 *     off       → el formulario se ve pero no envía (producción por defecto)
 *     simulado  → arma el reclamo y muestra lo que se enviaría, sin enviarlo
 *     real      → lo registra en CIDITUC (requiere el endpoint de alta)
 */
export type ModoReclamos = "off" | "simulado" | "real";

export function modoReclamos(): ModoReclamos {
  const v = process.env.CIDITUC_RECLAMOS_MODO;
  if (v === "off" || v === "simulado" || v === "real") {
    if (v === "real" && !process.env.CIDITUC_RECLAMOS_ALTA_PATH) return "off";
    return v;
  }
  return process.env.NODE_ENV === "production" ? "off" : "simulado";
}

export const ciditucConfig = () => ({
  /** Backend público de Atención Ciudadana (el mismo que lee CIMBA). */
  baseUrl: process.env.CIDITUC_API_URL || "https://estadisticas.smt.gob.ar:8084",
  /**
   * Ruta del ALTA de reclamos. NO EXISTE TODAVÍA: hay que pedirla a Sistemas
   * (DITEC), como se hizo con POST /reclamos/cerrar para CIMBA.
   */
  altaPath: process.env.CIDITUC_RECLAMOS_ALTA_PATH || null,
  /** id de "origen del reclamo" (id_oreclamo) que CIDITUC asigne a este portal. */
  origenId: Number(process.env.CIDITUC_ORIGEN_ID) || null,
});

export const ciudadDigitalConfig = () => ({
  /** Backend que valida el token: GET {apiUrl}/usuarios/authStatus. */
  apiUrl: process.env.CIUDAD_DIGITAL_API_URL || null,
  /** Portal de Ciudad Digital, donde el vecino inicia sesión. */
  portalUrl: process.env.CIUDAD_DIGITAL_PORTAL_URL || "https://ciudaddigital.smt.gob.ar/",
  /** Sólo en desarrollo: permite una persona de prueba para probar el circuito. */
  devPersona: process.env.NODE_ENV !== "production" && process.env.CIUDAD_DIGITAL_DEV_PERSONA === "1",
});
