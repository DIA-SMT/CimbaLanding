"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import type { DataMode, Intervention } from "@/domain/schemas";
import { DATE_LABEL, kindLabel } from "@/domain/labels";
import { formatDate } from "@/lib/format";
import { goToMap } from "@/hooks/useExplorer";
import { BeforeAfter } from "@/components/ui/BeforeAfter";
import { DataModeBadge, StatusBadge } from "@/components/ui/primitives";

export function RecentCarousel({ items, mode }: { items: Intervention[] | null; mode: DataMode }) {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);
  const list = items ?? [];
  const item = list[idx];

  const go = (d: number) => {
    setDir(d);
    setIdx((i) => (i + d + list.length) % list.length);
  };

  return (
    <article
      aria-roledescription="carrusel"
      aria-labelledby="recientes-title"
      className="flex h-full flex-col rounded-[1.6rem] bg-white p-4 shadow-[var(--shadow-soft)] ring-1 ring-line/70 sm:p-5"
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="leaf" aria-hidden />
        <h2 id="recientes-title" className="min-w-0 text-xl font-extrabold leading-tight tracking-tight text-ink sm:text-[1.4rem]">
          Intervenciones recientes
        </h2>
        <DataModeBadge mode={mode} className="hidden md:inline-flex" />
        {list.length > 1 && (
          <div className="ml-auto flex gap-2">
            <button type="button" onClick={() => go(-1)} className="grid size-10 place-items-center rounded-full bg-white text-ink shadow-[var(--shadow-soft)] ring-1 ring-line hover:text-primary">
              <ChevronLeft className="size-5" aria-hidden />
              <span className="sr-only">Intervención anterior</span>
            </button>
            <button type="button" onClick={() => go(1)} className="grid size-10 place-items-center rounded-full bg-white text-ink shadow-[var(--shadow-soft)] ring-1 ring-line hover:text-primary">
              <ChevronRight className="size-5" aria-hidden />
              <span className="sr-only">Intervención siguiente</span>
            </button>
          </div>
        )}
      </div>

      {!items ? (
        <p className="grid flex-1 place-items-center rounded-2xl bg-canvas p-6 text-center text-ink-soft">
          La información de intervenciones todavía no está disponible.
        </p>
      ) : !item ? (
        <p className="grid flex-1 place-items-center rounded-2xl bg-canvas p-6 text-center text-ink-soft">
          Todavía no hay intervenciones finalizadas publicadas.
        </p>
      ) : (
        <div className="relative flex-1 overflow-hidden" aria-live="polite">
          <AnimatePresence mode="popLayout" initial={false} custom={dir}>
            <motion.div
              key={item.id}
              custom={dir}
              initial={{ opacity: 0, x: dir * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -40 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="grid gap-4 sm:grid-cols-[1.35fr_1fr]"
              aria-roledescription="diapositiva"
              aria-label={`${idx + 1} de ${list.length}`}
            >
              {item.photos.before && item.photos.after ? (
                <BeforeAfter before={item.photos.before} after={item.photos.after} className="aspect-[16/10] sm:aspect-auto sm:min-h-44" />
              ) : (
                <div className="grid aspect-[16/10] place-items-center rounded-2xl bg-canvas text-center text-sm text-ink-soft sm:aspect-auto sm:min-h-44">
                  <span className="flex flex-col items-center gap-2 px-4">
                    <ImageOff className="size-6" aria-hidden />
                    Fotografías no publicadas
                  </span>
                </div>
              )}
              <div className="flex flex-col justify-center">
                <StatusBadge status={item.status} className="w-fit" />
                <h3 className="mt-2 text-lg font-extrabold leading-snug text-ink">
                  {item.street} {item.reference}
                </h3>
                <p className="text-sm text-ink-soft">
                  {item.neighborhood} · {kindLabel(item)}
                </p>
                <p className="mt-2 flex items-center gap-2 text-[0.95rem] text-ink-soft">
                  <CalendarDays className="size-4" aria-hidden />
                  <span>
                    <span className="sr-only">{DATE_LABEL[item.status]} </span>
                    {formatDate(item.date)}
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => goToMap({ selectedId: item.id, query: "", neighborhoodId: null })}
                  className="mt-3 inline-flex w-fit items-center gap-1.5 font-bold text-primary hover:underline"
                >
                  Ver detalle <ArrowRight className="size-4" aria-hidden />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </article>
  );
}
