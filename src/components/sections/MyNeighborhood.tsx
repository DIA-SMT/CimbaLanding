"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Crosshair, History, Home, Loader2, X } from "lucide-react";
import type { DataMode, Intervention, Neighborhood } from "@/domain/schemas";
import { DATE_LABEL, STATUS_META, kindLabel } from "@/domain/labels";
import { distanceKm, formatDate } from "@/lib/format";
import { goToMap } from "@/hooks/useExplorer";
import { DataModeBadge } from "@/components/ui/primitives";

/** Etiquetas de los contadores. "Progra­mados" lleva guion opcional: en celulares angostos no entra entero. */
const CONTADOR = { finalizado: "Reparados", en_ejecucion: "En curso", programado: "Progra­mados" } as const;

const KEY = "cimba:mi-barrio";

function readSaved(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}
function save(id: string | null) {
  try {
    if (id) window.localStorage.setItem(KEY, id);
    else window.localStorage.removeItem(KEY);
  } catch {
    /* almacenamiento no disponible: se continúa sin recordar */
  }
}

export function MyNeighborhood({
  neighborhoods,
  mode,
}: {
  neighborhoods: Neighborhood[];
  mode: DataMode;
}) {
  const [hoodId, setHoodId] = useState<string | null>(null);
  const [remember, setRemember] = useState(false);
  const [geo, setGeo] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    const saved = readSaved();
    if (saved && neighborhoods.some((n) => n.id === saved)) {
      setHoodId(saved);
      setRemember(true);
    }
  }, [neighborhoods]);

  const choose = (id: string | null) => {
    setHoodId(id);
    if (remember) save(id);
  };

  const hood = neighborhoods.find((n) => n.id === hoodId) ?? null;
  /** Las intervenciones del barrio se piden recién al elegirlo (no viajan con la portada). */
  const [delBarrio, setDelBarrio] = useState<{ id: string; items: Intervention[] } | null>(null);
  const [cargandoBarrio, setCargandoBarrio] = useState(false);
  useEffect(() => {
    if (!hoodId) return;
    let vivo = true;
    setCargandoBarrio(true);
    fetch(`/api/public/interventions?neighborhood=${encodeURIComponent(hoodId)}&limit=500`)
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => vivo && setDelBarrio({ id: hoodId, items: Array.isArray(body?.data) ? (body.data as Intervention[]) : [] }))
      .catch(() => vivo && setDelBarrio({ id: hoodId, items: [] }))
      .finally(() => vivo && setCargandoBarrio(false));
    return () => {
      vivo = false;
    };
  }, [hoodId]);
  const items = useMemo(
    () =>
      delBarrio && delBarrio.id === hoodId
        ? [...delBarrio.items].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
        : [],
    [delBarrio, hoodId],
  );
  const count = (s: Intervention["status"]) => items.filter((i) => i.status === s).length;

  const locate = () => {
    if (!("geolocation" in navigator)) return setGeo("error");
    setGeo("loading");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const here = { lat: p.coords.latitude, lng: p.coords.longitude };
        const nearest = [...neighborhoods].sort((a, b) => distanceKm(here, a.center) - distanceKm(here, b.center))[0];
        setGeo("idle");
        if (nearest && distanceKm(here, nearest.center) < 6) choose(nearest.id);
        else setGeo("error");
      },
      () => setGeo("error"),
      { timeout: 10_000, maximumAge: 300_000 },
    );
  };

  return (
    <div className="on-dark relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#082a66_0%,#0b377f_45%,#0876ec_100%)] p-5 text-white shadow-[var(--shadow-lift)] sm:p-8 lg:p-10">
      <div aria-hidden className="absolute -right-24 -top-24 size-80 rounded-full bg-celeste/25 blur-2xl" />
      <svg aria-hidden className="absolute inset-x-0 bottom-0 h-10 w-full opacity-90" viewBox="0 0 1200 40" preserveAspectRatio="none">
        <path d="M0 26C300 40 700 40 1200 6v34H0z" fill="#36b3ff" opacity=".5" />
        <path d="M0 33c300 9 700 9 1200-20v27H0z" fill="#ffdf00" />
      </svg>

      <div className="relative grid gap-8 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-amarillo">
            <Home className="size-4" aria-hidden /> Mi barrio
          </p>
          <h2 id="barrio-title" className="mt-2 text-[1.9rem] font-extrabold leading-tight tracking-tight sm:text-[2.2rem]">
            ¿Qué pasa en tu barrio?
          </h2>
          <p className="mt-3 text-white/85">Elegí tu barrio para ver las reparaciones registradas y los trabajos en curso.</p>

          <label htmlFor="barrio-select" className="mt-6 block text-sm font-bold text-white/90">
            Barrio
          </label>
          <select
            id="barrio-select"
            value={hoodId ?? ""}
            onChange={(e) => choose(e.target.value || null)}
            className="mt-1.5 h-13 w-full rounded-2xl border-0 bg-white px-4 text-[1rem] font-semibold text-ink focus:ring-3 focus:ring-amarillo"
          >
            <option value="">Seleccioná tu barrio</option>
            {neighborhoods.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={locate}
            className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-white/12 px-4 text-sm font-bold ring-1 ring-white/30 transition hover:bg-white/20"
          >
            {geo === "loading" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Crosshair className="size-4" aria-hidden />}
            Detectar con mi ubicación
          </button>
          <p className="mt-2 text-xs text-white/70" role="status">
            {geo === "error"
              ? "No pudimos determinar tu barrio. Elegilo de la lista."
              : "Opcional. Tu ubicación se usa sólo en tu dispositivo y no se envía ni se guarda."}
          </p>

          <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-sm text-white/90">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => {
                setRemember(e.target.checked);
                save(e.target.checked ? hoodId : null);
              }}
              className="mt-0.5 size-[18px] accent-[#ffdf00]"
            />
            Recordar mi barrio en este dispositivo (sin registrarte)
          </label>
        </div>

        <div className="min-h-[18rem]" aria-live="polite">
          <AnimatePresence mode="wait">
            {!hood ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid h-full place-items-center rounded-3xl border border-dashed border-white/30 p-8 text-center text-white/80"
              >
                <p>
                  Seleccioná un barrio para ver su información.
                  <br />
                  <span className="text-sm text-white/60">{neighborhoods.length} barrios con datos disponibles.</span>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={hood.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="rounded-3xl bg-white p-5 text-ink shadow-xl sm:p-6"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-2xl font-extrabold">{hood.name}</h3>
                  <DataModeBadge mode={mode} />
                  <button type="button" onClick={() => choose(null)} className="ml-auto grid size-9 place-items-center rounded-full bg-canvas hover:bg-line">
                    <X className="size-4" aria-hidden />
                    <span className="sr-only">Quitar barrio</span>
                  </button>
                </div>

                <ul className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
                  {(["finalizado", "en_ejecucion", "programado"] as const).map((s) => (
                    <li key={s} className={`rounded-2xl ${STATUS_META[s].bg} p-3 sm:p-4`}>
                      <span className="block text-2xl font-extrabold sm:text-3xl">{cargandoBarrio ? "…" : count(s)}</span>
                      <span className={`text-xs font-bold sm:text-sm ${STATUS_META[s].text}`}>{CONTADOR[s]}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-5 grid gap-5">
                  <div>
                    <h4 className="mb-2 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-ink-soft">
                      <History className="size-4 text-primary" aria-hidden /> Historial reciente
                    </h4>
                    {items.length === 0 ? (
                      <p className="text-sm text-ink-soft">{cargandoBarrio ? "Cargando…" : "Sin intervenciones publicadas."}</p>
                    ) : (
                      <ol className="relative grid gap-3 border-l-2 border-line pl-4">
                        {items.slice(0, 4).map((i) => (
                          <li key={i.id} className="relative text-sm">
                            <span className="absolute -left-[1.42rem] top-1 size-3 rounded-full ring-2 ring-white" style={{ background: STATUS_META[i.status].color }} aria-hidden />
                            <span className="font-bold">
                              {i.street} {i.reference}
                            </span>
                            <span className="block text-ink-soft">
                              {kindLabel(i)} · {i.date ? `${DATE_LABEL[i.status].toLowerCase()} ${formatDate(i.date)}` : "sin fecha"}
                            </span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => goToMap({ neighborhoodId: hood.id, query: "", selectedId: null })}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-bold text-white transition hover:bg-institucional"
                >
                  Ver {hood.name} en el mapa <ArrowRight className="size-4" aria-hidden />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
