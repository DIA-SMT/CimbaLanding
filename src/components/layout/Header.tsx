"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Megaphone, Menu, X } from "lucide-react";
import { navItems, type NavId } from "@/config/site";
import { CimbaMark, MunicipalLogo } from "@/components/brand/Logo";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<NavId>("inicio");
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const base = usePathname() === "/" ? "" : "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scrollspy: marca la sección visible como activa.
  useEffect(() => {
    const sections = navItems
      .map((n) => document.getElementById(n.id))
      .filter((el): el is HTMLElement => Boolean(el));
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id as NavId);
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: [0, 0.25, 0.5] },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  // Menú móvil: Escape para cerrar, foco inicial y bloqueo de scroll.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("a,button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-[box-shadow,background-color,border-color] duration-300 ${
        scrolled ? "border-line bg-white/95 shadow-[0_6px_24px_-12px_rgb(16_43_87/0.25)] backdrop-blur" : "border-transparent bg-white"
      }`}
    >
      <div className="mx-auto flex h-[var(--header-h)] max-w-[88rem] items-center gap-4 px-4 sm:px-6 lg:px-10 xl:gap-3 xl:px-6 2xl:gap-4 2xl:px-10">
        <a href={`${base}#inicio`} className="flex shrink-0 items-center gap-3 sm:gap-4" aria-label="CIMBA Ciudadano — Inicio">
          <MunicipalLogo className="!h-9 sm:!h-10" />
          <span aria-hidden className="h-8 w-px bg-line sm:h-9" />
          <span>
            <CimbaMark subtitleClass="hidden sm:block xl:hidden 2xl:block" />
          </span>
        </a>

        <nav aria-label="Principal" className="ml-auto hidden xl:block">
          <ul className="flex items-center gap-0.5 2xl:gap-1">
            {navItems.map((item) => {
              const isActive = active === item.id;
              return (
                <li key={item.id}>
                  <a
                    href={`${base}#${item.id}`}
                    aria-current={isActive ? "true" : undefined}
                    className={`relative block whitespace-nowrap rounded-lg px-2.5 py-2 text-[0.92rem] font-semibold transition-colors 2xl:px-3 2xl:text-[0.95rem] ${
                      isActive ? "text-primary" : "text-ink hover:text-primary"
                    }`}
                  >
                    {item.label}
                    {isActive && (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute inset-x-2.5 -bottom-0.5 h-[3px] rounded-full bg-primary 2xl:inset-x-3"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <a
          href={`${base}#reclamos`}
          className="ml-auto hidden shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-amarillo px-5 py-2.5 font-bold text-ink xl:px-4 2xl:px-5 shadow-[0_8px_20px_-8px_rgb(255_200_0/0.9)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-10px_rgb(255_200_0/1)] sm:flex xl:ml-4"
        >
          <Megaphone className="size-[18px]" aria-hidden />
          Realizar un reclamo
        </a>

        <button
          ref={toggleRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="menu-movil"
          className="ml-auto grid size-11 place-items-center rounded-xl text-ink hover:bg-canvas sm:ml-0 xl:hidden"
        >
          {open ? <X aria-hidden /> : <Menu aria-hidden />}
          <span className="sr-only">{open ? "Cerrar menú" : "Abrir menú"}</span>
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="menu-movil"
            ref={panelRef}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-x-0 top-full h-[calc(100dvh-var(--header-h))] overflow-y-auto border-t border-line bg-white px-4 pb-10 pt-4 xl:hidden"
          >
            <nav aria-label="Principal (móvil)">
              <ul className="grid gap-1">
                {navItems.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`${base}#${item.id}`}
                      onClick={() => setOpen(false)}
                      aria-current={active === item.id ? "true" : undefined}
                      className={`flex min-h-12 items-center rounded-xl px-4 text-lg font-semibold ${
                        active === item.id ? "bg-tono-azul text-primary" : "text-ink hover:bg-canvas"
                      }`}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <a
              href={`${base}#reclamos`}
              onClick={() => setOpen(false)}
              className="mt-6 flex min-h-13 items-center justify-center gap-2 rounded-full bg-amarillo px-5 py-3.5 text-lg font-bold text-ink"
            >
              <Megaphone className="size-5" aria-hidden />
              Realizar un reclamo
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
