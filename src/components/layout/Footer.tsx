import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { navItems, siteConfig } from "@/config/site";
import { CimbaMark, MunicipalLogo } from "@/components/brand/Logo";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="on-dark relative mt-24 overflow-hidden bg-institucional text-white sm:mt-32">
      <svg aria-hidden className="absolute inset-x-0 top-0 h-6 w-full" viewBox="0 0 1440 24" preserveAspectRatio="none">
        <path d="M0 0h1440v6C1000 22 450 22 0 8z" fill="#f4f7fc" />
        <path d="M0 8c450 14 1000 14 1440-2v4C1000 26 450 26 0 12z" fill="#ffdf00" />
      </svg>
      <div className="mx-auto grid max-w-[88rem] gap-10 px-4 pb-10 pt-16 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-10">
        <div>
          <div className="flex items-center gap-4">
            <MunicipalLogo variant="negative" />
            <span aria-hidden className="h-9 w-px bg-white/25" />
            <CimbaMark tone="light" />
          </div>
          <p className="mt-5 max-w-sm text-white/75">
            {siteConfig.name} es el portal público de información vial de la {siteConfig.institution}. Publica sólo información autorizada para su difusión.
          </p>
        </div>

        <nav aria-label="Secciones del portal">
          <h2 className="text-sm font-extrabold uppercase tracking-[0.12em] text-amarillo">Portal</h2>
          <ul className="mt-4 grid gap-2.5">
            {navItems.map((n) => (
              <li key={n.id}>
                <Link href={`/#${n.id}`} className="text-white/85 hover:text-white hover:underline">
                  {n.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/#reclamos" className="text-white/85 hover:text-white hover:underline">
                Reclamos
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-extrabold uppercase tracking-[0.12em] text-amarillo">Canales oficiales</h2>
          <ul className="mt-4 grid gap-2.5">
            <li>
              <a href={siteConfig.channels.municipalSite} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-white/85 hover:text-white hover:underline">
                smt.gob.ar <ExternalLink className="size-3.5" aria-hidden />
              </a>
            </li>
            {siteConfig.channels.social.map((s) => (
              <li key={s.href}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-white/85 hover:text-white hover:underline">
                  {s.label} <ExternalLink className="size-3.5" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-extrabold uppercase tracking-[0.12em] text-amarillo">Información</h2>
          <ul className="mt-4 grid gap-2.5">
            <li>
              <Link href="/privacidad" className="text-white/85 hover:text-white hover:underline">
                Política de privacidad
              </Link>
            </li>
            <li>
              <Link href="/accesibilidad" className="text-white/85 hover:text-white hover:underline">
                Accesibilidad
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/15">
        <p className="mx-auto max-w-[88rem] px-4 py-5 text-sm text-white/65 sm:px-6 lg:px-10">
          © {year} {siteConfig.institution}. Mapa base © colaboradores de OpenStreetMap · OpenFreeMap.
        </p>
      </div>
    </footer>
  );
}
