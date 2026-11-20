"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { ExternalLink, Loader2, LogIn, RotateCcw, ShieldCheck, X } from "lucide-react";
import { siteConfig } from "@/config/site";

/**
 * Formulario OFICIAL de reclamos de CiDiTuc (derivador) embebido en el portal.
 *
 * El reclamo, el login y los datos del vecino quedan 100 % en CiDiTuc: el
 * portal sólo muestra la ventana. Por ser otro sitio (cross-origin), el portal
 * no puede leer nada de lo que pasa adentro.
 *
 * Se carga recién cuando el vecino lo pide (no se contacta a CiDiTuc al abrir
 * la página). En celulares se abre a pantalla completa.
 */
/**
 * Primera vista: el LOGIN de CiDiTuc. Con `next`, después de validar el
 * usuario CiDiTuc lleva al formulario de reclamo.
 * `loginBase` permite apuntar a una copia local de CiDiTuc (CIDITUC_LOGIN_BASE).
 */
function urlInicial(loginBase: string | null): string {
  const r = siteConfig.reclamos;
  const origen = loginBase ?? new URL(r.loginUrl).origin;
  // El login de CiDiTuc usa HashRouter: el parámetro va dentro del hash.
  return `${origen}/#/login${r.loginNext ? `?next=${encodeURIComponent(r.loginNext)}` : ""}`;
}

export function CiditucFrame({ loginBase = null }: { loginBase?: string | null }) {
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [clave, setClave] = useState(0);
  const [movil, setMovil] = useState(false);
  const cerrarRef = useRef<HTMLButtonElement>(null);
  const src = urlInicial(loginBase);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const actualizar = () => setMovil(mq.matches);
    actualizar();
    // En escritorio el login de CiDiTuc se ve directamente (el iframe carga en diferido).
    if (!mq.matches) setAbierto(true);
    mq.addEventListener("change", actualizar);
    return () => mq.removeEventListener("change", actualizar);
  }, []);

  /**
   * CiDiTuc trae su propio Migue: el del portal se oculta SÓLO mientras el
   * formulario de CiDiTuc está a la vista (pantalla completa en celular, o el
   * recuadro visible en escritorio). En el resto de la página se ve normal.
   */
  const marcoRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const raiz = document.documentElement;
    const ocultar = (si: boolean) => raiz.toggleAttribute("data-cidituc-abierto", si);
    if (!abierto) {
      ocultar(false);
      return;
    }
    if (movil) {
      ocultar(true);
      return () => ocultar(false);
    }
    const el = marcoRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => ocultar(Boolean(e?.isIntersecting)), { threshold: 0.15 });
    io.observe(el);
    return () => {
      io.disconnect();
      ocultar(false);
    };
  }, [abierto, movil]);

  // En móvil, pantalla completa: bloquea el scroll de fondo y cierra con Escape.
  useEffect(() => {
    if (!abierto || !movil) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cerrarRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [abierto, movil]);

  const abrir = () => {
    setCargando(true);
    setAbierto(true);
  };
  const recargar = () => {
    setCargando(true);
    setClave((k) => k + 1);
  };

  const marco = (
    <div
      ref={marcoRef}
      className={
        movil
          ? "fixed inset-0 z-[70] flex flex-col bg-white"
          : "flex h-[780px] flex-col overflow-hidden rounded-[1.6rem] bg-white shadow-[var(--shadow-lift)] ring-1 ring-line/70"
      }
      role={movil ? "dialog" : "region"}
      aria-modal={movil || undefined}
      aria-label="Formulario de reclamo de CiDiTuc"
    >
      <div className="flex items-center gap-2 border-b border-line bg-canvas px-3 py-2.5 sm:px-4">
        <ShieldCheck className="size-5 shrink-0 text-tono-verde-fg" aria-hidden />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-extrabold text-ink">CiDiTuc · Atención Ciudadana</p>
          <p className="truncate text-xs text-ink-soft">
            {loginBase ? `Prueba local · ${new URL(loginBase).host}` : "Sitio oficial de la Municipalidad · smt.gob.ar"}
          </p>
        </div>
        <button type="button" onClick={recargar} className="grid size-9 place-items-center rounded-full text-ink hover:bg-line" title="Recargar">
          <RotateCcw className="size-4" aria-hidden />
          <span className="sr-only">Recargar formulario</span>
        </button>
        <a href={src} target="_blank" rel="noopener noreferrer" className="grid size-9 place-items-center rounded-full text-ink hover:bg-line" title="Abrir en una pestaña nueva">
          <ExternalLink className="size-4" aria-hidden />
          <span className="sr-only">Abrir en una pestaña nueva</span>
        </a>
        <button ref={cerrarRef} type="button" onClick={() => setAbierto(false)} className="grid size-9 place-items-center rounded-full text-ink hover:bg-line" title="Cerrar">
          <X className="size-5" aria-hidden />
          <span className="sr-only">Cerrar formulario</span>
        </button>
      </div>

      <div className="relative flex-1 bg-white">
        {cargando && (
          <div className="absolute inset-0 grid place-items-center bg-white" aria-live="polite">
            <p className="flex items-center gap-2 text-sm text-ink-soft">
              <Loader2 className="size-5 animate-spin text-primary" aria-hidden /> Conectando con CiDiTuc…
            </p>
          </div>
        )}
        <iframe
          key={clave}
          src={src}
          title="Formulario de reclamo de CiDiTuc (Atención Ciudadana)"
          className="absolute inset-0 h-full w-full border-0"
          onLoad={() => setCargando(false)}
          loading="lazy"
          allow="geolocation"
          referrerPolicy="strict-origin-when-cross-origin"
          // Sin allow-top-navigation: CiDiTuc no puede sacar al vecino del portal.
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads allow-modals"
        />
      </div>

      <p className="border-t border-line bg-canvas px-4 py-2 text-xs text-ink-soft">
        ¿No carga o no te deja ingresar?{" "}
        <a href={src} target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline">
          Abrilo en una pestaña nueva
        </a>{" "}
        o llamá al 147.
      </p>
    </div>
  );

  return (
    <>
      {abierto && movil ? (
        // Pantalla completa en celulares: va al <body> para que ningún contenedor animado lo recorte.
        <motion.div key="marco-movil" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="rounded-[1.6rem] bg-white p-6 text-center text-ink-soft shadow-[var(--shadow-soft)] ring-1 ring-line/70">
            Formulario de CiDiTuc abierto.
          </div>
          {createPortal(marco, document.body)}
        </motion.div>
      ) : abierto ? (
        <motion.div key="marco" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          {marco}
        </motion.div>
      ) : (
        <motion.div
          key="inicio"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
         
          className="flex flex-col rounded-[1.6rem] bg-white p-6 shadow-[var(--shadow-lift)] ring-1 ring-line/70 sm:p-8"
        >
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-tono-verde px-3 py-1.5 text-xs font-bold text-tono-verde-fg">
              <ShieldCheck className="size-4" aria-hidden /> Formulario oficial de CiDiTuc
            </span>
            <h3 className="mt-4 text-2xl font-extrabold text-ink">Hacé tu reclamo acá</h3>
            <p className="mt-2 text-ink-soft">
              Se abre el formulario de Atención Ciudadana (CiDiTuc · 147) dentro de esta página. Ingresás con tu cuenta de Ciudad Digital, completás el
              reclamo y queda registrado a tu nombre, con número de seguimiento.
            </p>
            <ul className="mt-5 grid gap-2 text-sm text-ink-soft sm:grid-cols-3">
              <li className="rounded-2xl bg-canvas p-3">
                <strong className="block text-ink">1. Ingresá</strong>con tu CUIL y clave de Ciudad Digital.
              </li>
              <li className="rounded-2xl bg-canvas p-3">
                <strong className="block text-ink">2. Completá</strong>categoría “Calles”, ubicación en el mapa, detalle y hasta 3 fotos.
              </li>
              <li className="rounded-2xl bg-canvas p-3">
                <strong className="block text-ink">3. Listo</strong>CiDiTuc te muestra el número de reclamo.
              </li>
            </ul>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={abrir}
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-amarillo px-7 font-bold text-ink shadow-[0_12px_26px_-12px_rgb(244_220_0/0.9)] transition hover:-translate-y-0.5"
            >
              <LogIn className="size-5" aria-hidden /> Abrir formulario de reclamo
            </button>
            <p className="text-xs text-ink-soft">No necesitás salir del portal.</p>
          </div>
        </motion.div>
      )}
    </>
  );
}
