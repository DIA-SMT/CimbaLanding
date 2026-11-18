import Image from "next/image";
import { siteConfig } from "@/config/site";

/**
 * Logotipo OFICIAL de la Municipalidad (recurso del portal de Turismo SMT).
 * No se redibuja ni se reinterpreta. Para servirlo localmente, copiar los PNG
 * oficiales a /public/brand y actualizar src/config/site.ts.
 */
export function MunicipalLogo({ variant = "positive", className = "" }: { variant?: "positive" | "negative"; className?: string }) {
  return (
    <Image
      src={variant === "positive" ? siteConfig.assets.logoPositive : siteConfig.assets.logoNegative}
      alt={siteConfig.assets.logoAlt}
      width={911}
      height={298}
      priority={variant === "positive"}
      sizes="160px"
      className={`h-10 w-auto ${className}`}
    />
  );
}

/**
 * Glifo radar de CIMBA, copiado tal cual de su identidad oficial
 * (DIA-SMT/CIMBA → apps/web/src/components/marca.tsx, GlifoCimba).
 */
export function GlifoCimba({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden className="shrink-0">
      <circle cx="20" cy="20" r="18" stroke="#2EB1FF" strokeOpacity="0.35" strokeWidth="1.5" />
      <circle cx="20" cy="20" r="11.5" stroke="#2EB1FF" strokeOpacity="0.55" strokeWidth="1.5" />
      <circle cx="20" cy="20" r="5" stroke="#0066FF" strokeWidth="2" />
      <circle cx="20" cy="20" r="1.8" fill="#F4DC00" />
      <g style={{ transformOrigin: "20px 20px", animation: "barrido 4s linear infinite" }}>
        <path d="M20 20 L20 2 A18 18 0 0 1 33.5 7.5 Z" fill="url(#haz-cimba)" />
      </g>
      <defs>
        <linearGradient id="haz-cimba" x1="20" y1="2" x2="33" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2EB1FF" stopOpacity="0.5" />
          <stop offset="1" stopColor="#2EB1FF" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Identificador oficial de CIMBA: glifo + "CIMBA." + bajada, con "Ciudadano" como portal. */
export function CimbaMark({
  tone = "dark",
  subtitleClass = "hidden sm:block",
}: {
  tone?: "dark" | "light";
  /** Visibilidad de la bajada; en el header se oculta donde no entra el menú completo. */
  subtitleClass?: string;
}) {
  const dark = tone === "dark";
  return (
    <span className="flex items-center gap-2">
      <GlifoCimba size={32} />
      <span className="flex flex-col leading-none">
        <span className={`text-[1.3rem] font-extrabold tracking-tight sm:text-[1.45rem] ${dark ? "text-ink" : "text-white"}`}>
          CIMBA<span className={dark ? "text-[#c9b500]" : "text-amarillo"}>.</span>
          <span className={`ml-1.5 hidden text-[0.95rem] font-bold tracking-normal min-[400px]:inline ${dark ? "text-primary" : "text-celeste"}`}>Ciudadano</span>
        </span>
        <span
          className={`mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] ${subtitleClass} ${dark ? "text-ink-soft" : "text-white/70"}`}
        >
          Monitoreo de Baches y Asfalto
        </span>
      </span>
    </span>
  );
}
