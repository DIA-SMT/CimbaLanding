import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/** Orígenes externos permitidos. Mantener esta lista mínima. */
const ASSETS_ORIGIN = "https://pag-turismo-ia.vercel.app"; // logo oficial y fotografía de la ciudad (temporal)
const MAP_ORIGIN = "https://tiles.openfreemap.org"; // estilo, teselas, tipografías y sprites del mapa
/**
 * CIMBA: fotos del antes y el después. Siempre se acepta cimba.smt.gob.ar (donde
 * su nginx sirve /fotos), más el origen de la API configurada y los de
 * CIMBA_FOTOS_ORIGENES. Sólo HTTPS (en una prueba local la API puede ser http,
 * pero sus fotos se piden igual a cimba.smt.gob.ar).
 */
const FOTOS_ORIGINS = [
  ...new Set(
    ["https://cimba.smt.gob.ar", process.env.CIMBA_PUBLIC_API_URL, ...(process.env.CIMBA_FOTOS_ORIGENES ?? "").split(",")]
      .map((v) => (v ?? "").trim())
      .filter((v) => v.startsWith("https://"))
      .map((v) => new URL(v).origin),
  ),
];
/**
 * CiDiTuc: login de Ciudad Digital y formulario de reclamo (derivador), que se
 * muestran en un iframe dentro de la sección Reclamos.
 */
const CIDITUC_FRAMES = [
  "https://ciudaddigital.smt.gob.ar",
  "https://cidituc.smt.gob.ar",
  // Copia local de CiDiTuc para pruebas (sólo en desarrollo).
  ...(isDev && process.env.CIDITUC_LOGIN_BASE ? [new URL(process.env.CIDITUC_LOGIN_BASE).origin] : []),
];

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${ASSETS_ORIGIN} ${MAP_ORIGIN} ${FOTOS_ORIGINS.join(" ")}`,
  "font-src 'self' data:",
  `connect-src 'self' ${MAP_ORIGIN}${isDev ? " ws:" : ""}`,
  "worker-src 'self' blob:",
  "child-src blob:",
  `frame-src ${CIDITUC_FRAMES.join(" ")}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: `camera=(), microphone=(), geolocation=(self ${CIDITUC_FRAMES.map((o) => `"${o}"`).join(" ")}), interest-cohort=()` },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Cliente de Postgres (vistas públicas de CIMBA): se usa tal cual en el servidor.
  serverExternalPackages: ["postgres"],
  // Permite compilar en otra carpeta (p. ej. verificar producción con el servidor de desarrollo activo).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "pag-turismo-ia.vercel.app", pathname: "/**" },
      // Fotos propias de CIMBA en /fotos; los orígenes externos que se habiliten
      // (CIMBA_FOTOS_ORIGENES, p. ej. estadisticas.smt.gob.ar:5010) en cualquier ruta.
      ...FOTOS_ORIGINS.map((o) => {
        const u = new URL(o);
        return {
          protocol: "https" as const,
          hostname: u.hostname,
          port: u.port,
          pathname: u.hostname === "cimba.smt.gob.ar" ? "/fotos/**" : "/**",
        };
      }),
    ],
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
