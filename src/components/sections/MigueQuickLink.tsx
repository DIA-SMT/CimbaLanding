"use client";

import { MessageCircleMore } from "lucide-react";
import { openMigue } from "@/components/migue/events";

export function MigueQuickLink() {
  return (
    <button
      type="button"
      onClick={() => openMigue()}
      className="group flex h-full w-full items-center gap-4 rounded-[var(--radius-card)] bg-tono-verde p-4 text-left shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] sm:p-5"
    >
      <span className="grid size-14 shrink-0 place-items-center rounded-full bg-white/80 text-tono-verde-fg">
        <MessageCircleMore className="size-7" aria-hidden />
      </span>
      <span>
        <span className="block text-lg font-extrabold text-ink">Consultá con Migue</span>
        <span className="block text-[0.92rem] leading-snug text-ink-soft">Información al instante</span>
      </span>
    </button>
  );
}
