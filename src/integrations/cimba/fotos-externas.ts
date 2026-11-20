/**
 * Fotos que CIMBA referencia en estadisticas.smt.gob.ar:5010. Se sirven por
 * /fotos/estadisticas/… (ver app/fotos/estadisticas) porque ese servidor no
 * envía su certificado intermedio y el optimizador de imágenes las rechaza.
 */
export const ESTADISTICAS_FOTOS = {
  origen: "https://estadisticas.smt.gob.ar:5010",
  prefijo: "/api/uploads/",
  rutaLocal: "/fotos/estadisticas/",
} as const;

/** URL de estadisticas → ruta local equivalente; cualquier otra URL, tal cual. */
export function rutaFotoLocal(u: URL): string {
  if (u.origin === ESTADISTICAS_FOTOS.origen && u.pathname.startsWith(ESTADISTICAS_FOTOS.prefijo)) {
    return ESTADISTICAS_FOTOS.rutaLocal + u.pathname.slice(ESTADISTICAS_FOTOS.prefijo.length);
  }
  return u.toString();
}
