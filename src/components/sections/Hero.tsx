import Image from "next/image";
import { ArrowRight, List, Map } from "lucide-react";
import { siteConfig } from "@/config/site";
import type { ReactNode } from "react";

export function Hero({ search }: { search: ReactNode }) {
  return (
    <section id="inicio" aria-labelledby="hero-title" className="on-dark relative isolate overflow-hidden bg-institucional text-white">
      {/* Fotografía real de la ciudad */}
      <div className="absolute inset-0 -z-20 lg:left-[22%]">
        <Image
          src={siteConfig.assets.heroPhoto}
          alt={siteConfig.assets.heroPhotoAlt}
          fill
          priority
          sizes="(min-width: 1024px) 78vw, 100vw"
          className="object-cover object-[52%_50%]"
        />
      </div>

      {/* Gradiente institucional (DIM360) */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(8_42_102/0.72)_0%,rgb(11_55_127/0.5)_38%,rgb(11_55_127/0.78)_62%,rgb(8_40_100/0.96)_100%)] lg:bg-[linear-gradient(90deg,#082a66_0%,#0b377f_24%,rgb(11_55_127/0.92)_36%,rgb(11_55_127/0.45)_55%,rgb(11_55_127/0.05)_75%)]"
      />
      <div aria-hidden className="absolute -left-40 -top-48 -z-10 size-[34rem] rounded-full bg-primary/35 blur-3xl" />
      {/* Formas geométricas sutiles */}
      <svg aria-hidden className="absolute left-0 top-0 -z-10 h-full w-[46%] opacity-[0.16]" viewBox="0 0 600 600" preserveAspectRatio="none">
        <path d="M0 0h260L0 420z" fill="#36b3ff" />
        <path d="M0 0h120L0 190z" fill="#0876ec" />
      </svg>

      <div className="relative mx-auto grid max-w-[88rem] gap-8 px-4 pb-24 pt-8 sm:px-6 sm:pt-14 md:pb-36 lg:px-10 lg:pb-40 lg:pt-16">
        <div className="max-w-[44rem]">
          <p className="flex items-center gap-2.5 text-sm font-bold uppercase tracking-[0.14em] text-white">
            <span className="leaf" aria-hidden />
            CIMBA · San Miguel de Tucumán
          </p>
          <h1
            id="hero-title"
            className="mt-4 text-[2.6rem] font-extrabold leading-[1.02] tracking-[-0.03em] text-balance sm:text-6xl lg:text-[4.35rem]"
          >
            Más calles seguras y transitables
          </h1>
          <p className="mt-4 max-w-xl text-[1.05rem] leading-relaxed text-white/95 [text-shadow:0_1px_12px_rgb(4_20_60/0.5)] sm:mt-5 sm:text-xl">
            Conocé las reparaciones y los trabajos en curso en las calles de nuestra ciudad.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-2.5 sm:mt-7 sm:flex sm:gap-3">
            <a
              href="#mapa"
              className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-amarillo px-3 py-3 text-[0.95rem] sm:min-h-13 sm:gap-2.5 sm:px-7 sm:py-3.5 sm:text-base font-bold text-ink shadow-[0_14px_30px_-12px_rgb(255_223_0/0.75)] transition hover:-translate-y-0.5"
            >
              <Map className="size-5" aria-hidden />
              <span className="sm:hidden">Ver mapa</span>
              <span className="hidden sm:inline">Explorar el mapa</span>
              <ArrowRight className="hidden size-[18px] transition group-hover:translate-x-0.5 sm:block" aria-hidden />
            </a>
            <a
              href="#intervenciones"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-white/85 px-3 py-3 text-[0.95rem] sm:min-h-13 sm:gap-2.5 sm:px-7 sm:py-3.5 sm:text-base font-bold text-white transition hover:bg-white hover:text-institucional"
            >
              <List className="size-5 shrink-0" aria-hidden />
              <span className="sm:hidden">Intervenciones</span>
              <span className="hidden sm:inline">Ver intervenciones</span>
            </a>
          </div>

          <div className="mt-5 max-w-xl text-ink sm:mt-7">
            {search}
          </div>
        </div>

      </div>

      {/* Curvas inferiores celeste y amarillo (DIM360) */}
      <svg aria-hidden className="absolute inset-x-0 bottom-[-1px] h-20 w-full sm:h-28" viewBox="0 0 1440 120" preserveAspectRatio="none">
        <path d="M0 62C320 104 700 112 1040 76c160-17 290-40 400-62v34C1300 76 1150 98 1000 106 680 124 330 112 0 82z" fill="#36b3ff" />
        <path d="M0 80c330 34 690 44 1020 14 160-15 300-36 420-58v30c-130 26-260 44-410 56C700 146 330 132 0 96z" fill="#ffdf00" />
        <path d="M0 94c330 32 700 40 1030 12 150-13 290-32 410-54V120H0z" fill="#f4f7fc" />
      </svg>
    </section>
  );
}
