"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, CalendarDays, ImageOff, MapPin } from "lucide-react";
import type { DataMode, Intervention, InterventionStatus } from "@/domain/schemas";
import { DATE_LABEL, STATUS_META, STATUS_ORDER, kindLabel } from "@/domain/labels";
import { formatDate } from "@/lib/format";
import { goToMap } from "@/hooks/useExplorer";
import { BeforeAfter } from "@/components/ui/BeforeAfter";
import { DataModeBadge, StatusBadge } from "@/components/ui/primitives";

const PAGE = 6;

export function InterventionsGrid({ items, mode }: { items: Intervention[]; mode: DataMode }) {
  const [tab, setTab] = useState<InterventionStatus | "todas">("todas");
  const [count, setCount] = useState(PAGE);

  const list = useMemo(() => (tab === "todas" ? items : items.filter((i) => i.status === tab)), [items, tab]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div role="tablist" aria-label="Filtrar intervenciones por estado" className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto rounded-full bg-white p-1 shadow-[var(--shadow-soft)] ring-1 ring-line">
          {(["todas", ...STATUS_ORDER] as const).map((s) => {
            const on = tab === s;
            return (
              <button
                key={s}
                role="tab"
                aria-selected={on}
                type="button"
                onClick={() => {
                  setTab(s);
                  setCount(PAGE);
                }}
                className={`relative min-h-10 shrink-0 rounded-full px-4 text-sm font-bold transition-colors ${on ? "text-white" : "text-ink hover:text-primary"}`}
              >
                {on && <motion.span layoutId="int-tab" className="absolute inset-0 rounded-full bg-primary" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                <span className="relative">{s === "todas" ? "Todas" : STATUS_META[s].label}</span>
              </button>
            );
          })}
        </div>
        <DataModeBadge mode={mode} />
      </div>

      {list.length === 0 ? (
        <p className="rounded-[var(--radius-card)] border border-dashed border-line bg-white/70 p-8 text-center text-ink-soft">
          No hay intervenciones publicadas con este estado.
        </p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {list.slice(0, count).map((it, idx) => (
              <motion.li
                key={it.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0, transition: { delay: Math.min(idx, 5) * 0.04 } }}
                exit={{ opacity: 0, scale: 0.97 }}
              >
                <Card item={it} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      {count < list.length && (
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => setCount((c) => c + PAGE)}
            className="rounded-full border-2 border-primary px-6 py-3 font-bold text-primary transition hover:bg-primary hover:text-white"
          >
            Ver más intervenciones
          </button>
        </div>
      )}
    </div>
  );
}

function Card({ item }: { item: Intervention }) {
  const { before, after } = item.photos;
  const single = after ?? before;
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-soft)] ring-1 ring-line/70 transition hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
      <div className="p-3 pb-0">
        {before && after ? (
          <BeforeAfter before={before} after={after} className="aspect-[16/10]" />
        ) : single ? (
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl">
            <Image src={single.url} alt={single.alt} fill loading="lazy" sizes="(min-width:1280px) 400px, (min-width:640px) 45vw, 92vw" className="object-cover" unoptimized={single.url.endsWith(".svg")} />
          </div>
        ) : (
          <div className={`relative flex h-24 items-end overflow-hidden rounded-2xl p-3 ${STATUS_META[item.status].bg}`}>
            <svg aria-hidden className="absolute inset-0 h-full w-full opacity-60" viewBox="0 0 300 96" preserveAspectRatio="none">
              <path d="M-10 70 310 20M-10 20 310 90M90-10 70 110M210-10 240 110" stroke="#fff" strokeWidth="7" fill="none" />
            </svg>
            <span className="relative flex items-center gap-1.5 rounded-full bg-white/85 px-2.5 py-1 text-xs font-semibold text-ink-soft">
              <ImageOff className="size-3.5" aria-hidden />
              Sin fotografías publicadas
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2">
          <StatusBadge status={item.status} />
          <span className="text-xs font-semibold text-ink-soft">{kindLabel(item)}</span>
        </div>
        <h3 className="mt-3 text-lg font-extrabold leading-snug text-ink">
          {item.street} {item.reference}
        </h3>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
          <MapPin className="size-4" aria-hidden /> {item.neighborhood}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
          <CalendarDays className="size-4" aria-hidden />
          {item.date ? `${DATE_LABEL[item.status]} ${formatDate(item.date)}` : "Sin fecha confirmada"}
        </p>
        <button
          type="button"
          onClick={() => goToMap({ selectedId: item.id, query: "", neighborhoodId: null })}
          className="mt-auto inline-flex w-fit items-center gap-1.5 pt-4 font-bold text-primary"
        >
          Ver en el mapa <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
        </button>
      </div>
    </article>
  );
}
