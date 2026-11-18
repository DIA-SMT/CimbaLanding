"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Construction, Crosshair, ListFilter, Loader2, MapPin, RotateCcw, SlidersHorizontal } from "lucide-react";
import type { DataMode, Intervention, InterventionStatus, InterventionType, Neighborhood, TrafficClosure } from "@/domain/schemas";
import { DATE_LABEL, STATUS_META, STATUS_ORDER, TYPE_LABEL, kindLabel } from "@/domain/labels";
import { filterInterventions } from "@/services/filters";
import { distanceKm, formatDate } from "@/lib/format";
import { useExplorer } from "@/hooks/useExplorer";
import { PlaceSearch } from "@/components/search/PlaceSearch";
import { buildSuggestions } from "@/lib/suggestions";
import { DataModeBadge } from "@/components/ui/primitives";
import { ClosureDetail, InterventionDetail } from "./DetailCard";
import type { MapFocus } from "./InterventionsMap";

const InterventionsMap = dynamic(() => import("./InterventionsMap"), {
  ssr: false,
  loading: () => <div className="skeleton absolute inset-0 !rounded-none" aria-label="Cargando mapa" />,
});

interface Props {
  interventions: Intervention[];
  closures: TrafficClosure[];
  neighborhoods: Neighborhood[];
  mode: DataMode;
}

const TYPES = Object.keys(TYPE_LABEL) as InterventionType[];

export function MapExplorer({ interventions, closures, neighborhoods, mode }: Props) {
  const explorer = useExplorer();
  const [query, setQuery] = useState("");
  const [statuses, setStatuses] = useState<InterventionStatus[]>([]);
  const [type, setType] = useState<InterventionType | "">("");
  const [hood, setHood] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [showClosures, setShowClosures] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focus, setFocus] = useState<MapFocus | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoState, setGeoState] = useState<"idle" | "loading" | "denied">("idle");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const focusKey = useRef(0);

  // Carga diferida del mapa cuando la sección se acerca al viewport.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { rootMargin: "400px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const filtered = useMemo(
    () =>
      filterInterventions(interventions, {
        q: query || undefined,
        status: statuses.length ? statuses : undefined,
        type: type ? [type] : undefined,
        neighborhood: hood || undefined,
        from: from || undefined,
        to: to || undefined,
      }),
    [interventions, query, statuses, type, hood, from, to],
  );

  const visibleClosures = useMemo(
    () => closures.filter((c) => c.status !== "finalizado" && (!hood || c.neighborhoodId === hood)),
    [closures, hood],
  );

  const selectedIntervention = interventions.find((i) => i.id === selectedId) ?? null;
  const selectedClosure = closures.find((c) => c.id === selectedId) ?? null;

  const focusOn = (lat: number, lng: number, zoom?: number) => setFocus({ lat, lng, zoom, key: ++focusKey.current });

  const select = (id: string | null) => {
    setSelectedId(id);
    if (!id) return;
    const it = interventions.find((i) => i.id === id);
    if (it) return focusOn(it.location.lat, it.location.lng);
    const c = closures.find((x) => x.id === id);
    if (c) {
      setShowClosures(true);
      const [lng, lat] = c.path[0];
      focusOn(lat, lng, 16);
    }
  };

  // Pedidos externos (hero, Migue, Mi barrio, tarjetas)
  useEffect(() => {
    if (explorer.nonce === 0) return;
    setVisible(true);
    const n = explorer.neighborhoodId ? neighborhoods.find((h) => h.id === explorer.neighborhoodId) : null;
    const q = explorer.query.trim();
    const hoodByName = q ? neighborhoods.find((h) => h.name.toLowerCase() === q.toLowerCase()) : null;
    const targetHood = n ?? hoodByName;
    setStatuses([]);
    setType("");
    setFrom("");
    setTo("");
    if (targetHood) {
      setHood(targetHood.id);
      setQuery("");
      focusOn(targetHood.center.lat, targetHood.center.lng, 14.6);
    } else {
      setHood("");
      setQuery(q);
      if (q) {
        const first = filterInterventions(interventions, { q })[0];
        if (first) focusOn(first.location.lat, first.location.lng, 14.5);
      }
    }
    if (explorer.selectedId) select(explorer.selectedId);
    else setSelectedId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [explorer.nonce]);

  const toggleStatus = (s: InterventionStatus) =>
    setStatuses((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const reset = () => {
    setQuery("");
    setStatuses([]);
    setType("");
    setHood("");
    setFrom("");
    setTo("");
    setSelectedId(null);
  };

  const locate = () => {
    if (!("geolocation" in navigator)) return setGeoState("denied");
    setGeoState("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setGeoState("idle");
        const nearest = [...neighborhoods].sort((a, b) => distanceKm(loc, a.center) - distanceKm(loc, b.center))[0];
        if (nearest && distanceKm(loc, nearest.center) < 6) focusOn(loc.lat, loc.lng, 15);
        else focusOn(loc.lat, loc.lng, 13);
      },
      () => setGeoState("denied"),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  };

  const suggestions = useMemo(
    () => buildSuggestions(neighborhoods, interventions.map((i) => i.street)),
    [neighborhoods, interventions],
  );

  const activeFilters = statuses.length + (type ? 1 : 0) + (hood ? 1 : 0) + (from ? 1 : 0) + (to ? 1 : 0) + (query ? 1 : 0);

  const detail = selectedIntervention ? (
    <InterventionDetail item={selectedIntervention} onClose={() => setSelectedId(null)} />
  ) : selectedClosure ? (
    <ClosureDetail item={selectedClosure} onClose={() => setSelectedId(null)} />
  ) : null;

  return (
    <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-[var(--shadow-lift)] ring-1 ring-line/70">
      {/* Barra de filtros */}
      <div className="border-b border-line p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="lg:w-[22rem] lg:shrink-0 xl:w-[26rem]">
            <PlaceSearch
              size="md"
              suggestions={suggestions}
              label="Buscar en el mapa por calle o barrio"
              onSearch={(v, s) => {
                setSelectedId(null);
                if (s?.kind === "barrio") {
                  const h = neighborhoods.find((n) => n.name === s.value);
                  if (h) {
                    setHood(h.id);
                    setQuery("");
                    return focusOn(h.center.lat, h.center.lng, 14.6);
                  }
                }
                setQuery(v);
                const first = filterInterventions(interventions, { q: v })[0];
                if (first) focusOn(first.location.lat, first.location.lng, 14.5);
              }}
            />
          </div>

          <fieldset className="no-scrollbar -mx-3 flex items-center gap-2 overflow-x-auto px-3 sm:mx-0 sm:flex-wrap sm:px-0">
            <legend className="sr-only">Filtrar por estado</legend>
            {STATUS_ORDER.map((s) => {
              const on = statuses.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleStatus(s)}
                  className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-bold transition ${
                    on ? `${STATUS_META[s].bg} ${STATUS_META[s].text} border-current` : "border-line bg-white text-ink hover:border-ink-soft/40"
                  }`}
                >
                  <span className="size-2.5 rounded-full" style={{ background: STATUS_META[s].color }} aria-hidden />
                  {STATUS_META[s].label}
                </button>
              );
            })}
          </fieldset>

          <div className="flex shrink-0 items-center gap-2 lg:ml-auto">
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              aria-expanded={filtersOpen}
              aria-controls="filtros-avanzados"
              className="inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-full border border-line px-4 text-sm font-bold text-ink hover:border-primary/40"
            >
              <SlidersHorizontal className="size-4" aria-hidden />
              Más filtros
              {activeFilters > 0 && <span className="grid size-5 place-items-center rounded-full bg-primary text-[0.7rem] text-white">{activeFilters}</span>}
            </button>
            <button
              type="button"
              onClick={locate}
              className="inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-full bg-tono-azul px-4 text-sm font-bold text-tono-azul-fg hover:bg-primary hover:text-white"
            >
              {geoState === "loading" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Crosshair className="size-4" aria-hidden />}
              Cerca mío
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {filtersOpen && (
            <motion.div
              id="filtros-avanzados"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid gap-3 pt-3 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto_auto] lg:items-end">
                <Field label="Tipo de intervención">
                  <select value={type} onChange={(e) => setType(e.target.value as InterventionType | "")} className={inputCls}>
                    <option value="">Todos los tipos</option>
                    {TYPES.map((t) => (
                      <option key={t} value={t}>
                        {TYPE_LABEL[t]}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Barrio">
                  <select value={hood} onChange={(e) => setHood(e.target.value)} className={inputCls}>
                    <option value="">Todos los barrios</option>
                    {neighborhoods.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Desde">
                  <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Hasta">
                  <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className={inputCls} />
                </Field>
                <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl px-1 text-sm font-bold text-ink">
                  <input type="checkbox" checked={showClosures} onChange={(e) => setShowClosures(e.target.checked)} className="size-5 accent-[#b8282d]" />
                  Mostrar cortes
                </label>
                <button type="button" onClick={reset} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-primary hover:bg-tono-azul">
                  <RotateCcw className="size-4" aria-hidden /> Limpiar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {geoState === "denied" && (
          <p className="mt-2 text-sm text-ink-soft" role="status">
            No pudimos acceder a tu ubicación. Podés buscar tu calle o barrio en el buscador.
          </p>
        )}
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_400px]">
        {/* Mapa */}
        <div ref={wrapRef} className="relative h-[68svh] min-h-[420px] lg:h-[640px]">
          {visible ? (
            <InterventionsMap
              interventions={filtered}
              closures={visibleClosures}
              showClosures={showClosures}
              selectedId={selectedId}
              focus={focus}
              userLocation={userLocation}
              onSelect={select}
            />
          ) : (
            <div className="skeleton absolute inset-0 !rounded-none" />
          )}

          <Legend />

          {/* Bottom sheet en móvil */}
          <AnimatePresence>
            {detail && (
              <motion.div
                key={selectedId}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 380, damping: 38 }}
                className="absolute inset-x-0 bottom-0 z-20 max-h-[78%] overflow-y-auto rounded-t-[1.6rem] bg-white p-4 pt-2 shadow-[0_-18px_40px_-16px_rgb(16_43_87/0.4)] lg:hidden"
                role="region"
                aria-label="Detalle del punto seleccionado"
              >
                <span aria-hidden className="mx-auto mb-3 block h-1.5 w-12 rounded-full bg-line" />
                {detail}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Panel lateral */}
        <aside className="flex max-h-[640px] flex-col border-t border-line lg:border-l lg:border-t-0" aria-label="Resultados">
          <div className="hidden min-h-0 flex-1 overflow-y-auto p-5 lg:block" hidden={!detail}>
            {detail}
          </div>
          <div className={`min-h-0 flex-1 flex-col ${detail ? "flex lg:hidden" : "flex"}`}>
            <div className="flex items-center gap-2 px-4 pb-2 pt-4 sm:px-5">
              <ListFilter className="size-4 text-primary" aria-hidden />
              <p className="font-bold text-ink" role="status" aria-live="polite">
                {filtered.length} {filtered.length === 1 ? "intervención" : "intervenciones"}
              </p>
              <DataModeBadge mode={mode} className="ml-auto" />
            </div>
            {filtered.length === 0 ? (
              <div className="px-5 pb-6 text-ink-soft">
                No hay intervenciones publicadas que coincidan con los filtros.{" "}
                <button type="button" onClick={reset} className="font-bold text-primary underline">
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <ul className="max-h-[360px] min-h-0 flex-1 overflow-y-auto px-2 pb-3 sm:px-3 lg:max-h-none">
                {filtered.slice(0, 80).map((i) => (
                  <li key={i.id}>
                    <button
                      type="button"
                      onClick={() => select(i.id)}
                      aria-current={selectedId === i.id ? "true" : undefined}
                      className={`flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-canvas ${selectedId === i.id ? "bg-tono-azul" : ""}`}
                    >
                      <span className="mt-1.5 size-3 shrink-0 rounded-full ring-2 ring-white" style={{ background: STATUS_META[i.status].color }} aria-hidden />
                      <span className="min-w-0">
                        <span className="block font-bold text-ink">
                          {i.street} {i.reference}
                        </span>
                        <span className="block text-sm text-ink-soft">
                          {i.neighborhood} · {kindLabel(i)}
                        </span>
                        <span className="block text-xs text-ink-soft">
                          {STATUS_META[i.status].label} · {i.date ? `${DATE_LABEL[i.status]} ${formatDate(i.date)}` : "sin fecha confirmada"}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {showClosures && visibleClosures.length > 0 && (
              <div className="border-t border-line px-4 py-3 sm:px-5">
                <p className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
                  <Construction className="size-4 text-corte" aria-hidden /> Cortes en el mapa
                </p>
                <ul className="flex flex-wrap gap-2">
                  {visibleClosures.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => select(c.id)}
                        className="rounded-full bg-corte-bg px-3 py-1.5 text-xs font-bold text-corte hover:ring-2 hover:ring-corte/30"
                      >
                        {c.street}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

const inputCls =
  "h-11 w-full rounded-xl border border-line bg-white px-3 text-[0.95rem] text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 text-xs font-bold uppercase tracking-wide text-ink-soft">
      {label}
      {children}
    </label>
  );
}

function Legend() {
  return (
    <div className="pointer-events-none absolute left-3 top-3 z-10 hidden rounded-2xl bg-white/95 sm:block px-3.5 py-3 text-xs shadow-[var(--shadow-soft)] ring-1 ring-line backdrop-blur sm:text-[0.8rem]">
      <p className="mb-1.5 font-extrabold text-ink">Referencias</p>
      <ul className="grid gap-1">
        {STATUS_ORDER.map((s) => (
          <li key={s} className="flex items-center gap-2 font-semibold text-ink">
            <span className="size-3 rounded-full ring-2 ring-white" style={{ background: STATUS_META[s].color }} aria-hidden />
            {STATUS_META[s].label}
          </li>
        ))}
        <li className="flex items-center gap-2 font-semibold text-ink">
          <span className="h-1 w-4 rounded-full bg-[repeating-linear-gradient(90deg,#7c3aed_0_5px,transparent_5px_8px)]" aria-hidden />
          Corte de tránsito
        </li>
        <li className="flex items-center gap-2 font-semibold text-ink">
          <MapPin className="size-3.5 text-institucional" aria-hidden />
          Grupo de puntos
        </li>
      </ul>
    </div>
  );
}
