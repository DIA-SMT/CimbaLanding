import { descargarImagenSmt } from "@/integrations/cidituc/https";
import { ESTADISTICAS_FOTOS } from "@/integrations/cimba/fotos-externas";

export const runtime = "nodejs";

/**
 * Fotos de relevamiento/inspección que CIMBA guarda en estadisticas.smt.gob.ar.
 * Ese servidor no envía el certificado intermedio y el optimizador de imágenes
 * no puede descargarlas; esta ruta las trae con la cadena completa. Sólo sirve
 * archivos de imagen de su carpeta pública de subidas (nada más de ese host).
 */
const SEGMENTO = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/;

export async function GET(_req: Request, { params }: { params: Promise<{ ruta: string[] }> }) {
  const { ruta } = await params;
  if (!ruta.length || ruta.length > 6 || !ruta.every((s) => SEGMENTO.test(s) && !s.includes(".."))) {
    return new Response(null, { status: 404 });
  }
  if (!/\.(jpe?g|png|webp)$/i.test(ruta.at(-1)!)) return new Response(null, { status: 404 });

  const url = new URL(`${ESTADISTICAS_FOTOS.prefijo}${ruta.map(encodeURIComponent).join("/")}`, ESTADISTICAS_FOTOS.origen);
  try {
    const r = await descargarImagenSmt(url);
    if (!r.cuerpo || !r.tipo) return new Response(null, { status: r.status === 404 ? 404 : 502 });
    return new Response(new Uint8Array(r.cuerpo), {
      headers: {
        "content-type": r.tipo,
        "content-length": String(r.cuerpo.length),
        // El archivo se identifica por número: no cambia una vez subido.
        "cache-control": "public, max-age=604800, s-maxage=2592000, stale-while-revalidate=86400",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: 504 });
  }
}
