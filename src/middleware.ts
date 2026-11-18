import { NextResponse, type NextRequest } from "next/server";

/**
 * Rate limiting básico para la API pública y el asistente.
 *
 * Ventana fija en memoria por instancia: suficiente para desarrollo y para
 * frenar abusos simples. En producción con varias instancias, reemplazar por
 * un almacén compartido (Redis/Upstash) o por el rate limiting del proxy/WAF.
 */
const WINDOW_MS = 60_000;
const LIMITS: Array<{ prefix: string; max: number }> = [
  { prefix: "/api/reclamos", max: 10 },
  { prefix: "/api/auth", max: 20 },
  { prefix: "/api/migue", max: 15 },
  { prefix: "/api/public", max: 120 },
];

const buckets = new Map<string, { count: number; reset: number }>();

function clientKey(req: NextRequest) {
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || req.headers.get("x-real-ip") || "anon";
}

export function middleware(req: NextRequest) {
  /**
   * Entrada desde Ciudad Digital: el portal municipal abre este sitio con
   * ?auth=<token> en cualquier ruta. Se deriva al validador, que vuelve a la
   * misma página sin el token en la URL (mismo criterio que CIMBA).
   */
  const { pathname, searchParams } = req.nextUrl;
  if (searchParams.has("auth") && !pathname.startsWith("/api/")) {
    const url = req.nextUrl.clone();
    url.pathname = "/api/auth/ciudad-digital";
    url.search = "";
    url.searchParams.set("auth", searchParams.get("auth") ?? "");
    url.searchParams.set("volver", pathname === "/" ? "/#reclamos" : pathname);
    return NextResponse.redirect(url);
  }
  if (!pathname.startsWith("/api/")) return NextResponse.next();

  const rule = LIMITS.find((l) => req.nextUrl.pathname.startsWith(l.prefix));
  if (!rule) return NextResponse.next();

  const now = Date.now();
  const key = `${rule.prefix}:${clientKey(req)}`;
  const bucket = buckets.get(key);

  if (!bucket || bucket.reset < now) {
    buckets.set(key, { count: 1, reset: now + WINDOW_MS });
    if (buckets.size > 10_000) {
      for (const [k, b] of buckets) if (b.reset < now) buckets.delete(k);
    }
    return NextResponse.next();
  }

  bucket.count++;
  if (bucket.count > rule.max) {
    return NextResponse.json(
      { error: { code: "rate_limited", message: "Demasiadas consultas. Probá nuevamente en un minuto." } },
      { status: 429, headers: { "Retry-After": String(Math.ceil((bucket.reset - now) / 1000)) } },
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|brand|demo|favicon|icon|apple-icon).*)"],
};
