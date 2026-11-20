"use client";

import { CalendarDays, Clock, Construction, HardHat, ImageOff, MapPin, Signpost, Timer, Wrench, X } from "lucide-react";
import type { Intervention, TrafficClosure } from "@/domain/schemas";
import { DATE_LABEL, STATUS_META, kindLabel } from "@/domain/labels";
import { formatDate, formatDateTime, formatNumber } from "@/lib/format";
import { BeforeAfter } from "@/components/ui/BeforeAfter";
import { Foto } from "@/components/ui/Foto";
import { ClosureBadge, StatusBadge } from "@/components/ui/primitives";

function Row({ icon: Icon, label, children }: { icon: typeof MapPin; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-[18px] shrink-0 text-primary" aria-hidden />
      <div>
        <dt className="text-xs font-bold uppercase tracking-wide text-ink-soft">{label}</dt>
        <dd className="text-[0.95rem] text-ink">{children}</dd>
      </div>
    </div>
  );
}

export function InterventionDetail({ item, onClose }: { item: Intervention; onClose: () => void }) {
  const { before, after } = item.photos;
  const single = before ?? after;
  return (
    <article aria-labelledby={`det-${item.id}`} className="space-y-4">
      <header className="flex items-start gap-3">
        <div className="min-w-0">
          <StatusBadge status={item.status} />
          <h3 id={`det-${item.id}`} className="mt-2 text-xl font-extrabold leading-snug text-ink">
            {item.street} {item.reference}
          </h3>
          <p className="text-ink-soft">{item.neighborhood}</p>
        </div>
        <CloseBtn onClose={onClose} />
      </header>

      {before && after ? (
        <BeforeAfter before={before} after={after} className="aspect-[16/10]" />
      ) : single ? (
        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl">
          <Foto key={single.url} foto={single} sizes="380px" loading="eager" />
        </div>
      ) : (
        <p className="flex items-center gap-2 rounded-2xl bg-canvas px-4 py-3 text-sm text-ink-soft">
          <ImageOff className="size-4" aria-hidden /> Sin fotografías publicadas para esta intervención.
        </p>
      )}

      <p className="rounded-2xl bg-canvas px-4 py-3 text-sm leading-relaxed text-ink-soft">{STATUS_META[item.status].help}</p>

      <dl className="grid gap-3">
        <Row icon={Wrench} label={item.type ? "Trabajo" : "Problema"}>
          {kindLabel(item)}
        </Row>
        {item.date && (
          <Row icon={CalendarDays} label={DATE_LABEL[item.status]}>
            {formatDate(item.date)}
          </Row>
        )}
        {item.company && (
          <Row icon={HardHat} label="Realizado por">
            {item.company}
            {item.areaM2 ? ` · ${formatNumber(Math.round(item.areaM2))} m²` : ""}
          </Row>
        )}
        <Row icon={MapPin} label="Ubicación">
          {item.street} {item.reference}, {item.neighborhood}
        </Row>
      </dl>
      {item.summary && <p className="text-[0.95rem] leading-relaxed text-ink-soft">{item.summary}</p>}
      <p className="border-t border-line pt-3 text-xs text-ink-soft">
        Fuente: CIMBA · registro {item.id} · actualizado el {formatDate(item.updatedAt)}
      </p>
    </article>
  );
}

export function ClosureDetail({ item, onClose }: { item: TrafficClosure; onClose: () => void }) {
  return (
    <article aria-labelledby={`det-${item.id}`} className="space-y-4">
      <header className="flex items-start gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-corte-bg px-2.5 py-1 text-xs font-bold text-corte">
              <Construction className="size-3.5" aria-hidden /> Corte de tránsito
            </span>
            <ClosureBadge status={item.status} />
          </p>
          <h3 id={`det-${item.id}`} className="mt-2 text-xl font-extrabold leading-snug text-ink">
            {item.street}
          </h3>
          <p className="text-ink-soft">{item.section}</p>
        </div>
        <CloseBtn onClose={onClose} />
      </header>
      <dl className="grid gap-3">
        <Row icon={CalendarDays} label="Fecha">
          Desde {formatDateTime(item.startsAt)}
          {item.endsAt ? ` hasta ${formatDateTime(item.endsAt)}` : " · finalización a confirmar"}
        </Row>
        {item.schedule && (
          <Row icon={Clock} label="Horario">
            {item.schedule}
          </Row>
        )}
        <Row icon={Wrench} label="Motivo">
          {item.reason}
        </Row>
        {item.estimatedDuration && (
          <Row icon={Timer} label="Duración estimada">
            {item.estimatedDuration}
          </Row>
        )}
        <Row icon={Signpost} label="Desvío">
          {item.officialDetour ?? "Sin desvío oficial informado."}
        </Row>
      </dl>
    </article>
  );
}

function CloseBtn({ onClose }: { onClose: () => void }) {
  return (
    <button type="button" onClick={onClose} className="ml-auto grid size-10 shrink-0 place-items-center rounded-full bg-canvas text-ink hover:bg-line">
      <X className="size-5" aria-hidden />
      <span className="sr-only">Cerrar detalle</span>
    </button>
  );
}
