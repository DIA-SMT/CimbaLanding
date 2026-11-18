import type { ReactNode } from "react";
import { FlaskConical, Info } from "lucide-react";
import { CLOSURE_STATUS_META, STATUS_META } from "@/domain/labels";
import type { ClosureStatus, DataMode, InterventionStatus } from "@/domain/schemas";

export function StatusBadge({ status, className = "" }: { status: InterventionStatus; className?: string }) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${m.bg} ${m.text} ${className}`}>
      <span className={`size-1.5 rounded-full ${m.dot}`} aria-hidden />
      {m.label}
    </span>
  );
}

export function ClosureBadge({ status }: { status: ClosureStatus }) {
  const m = CLOSURE_STATUS_META[status];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${m.bg} ${m.text}`}>{m.label}</span>;
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  action,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        {eyebrow && (
          <p className="mb-2 flex items-center gap-2.5 text-sm font-bold uppercase tracking-[0.14em] text-primary">
            <span className="leaf !h-3 !w-5" aria-hidden />
            {eyebrow}
          </p>
        )}
        <h2 id={id} className="text-[1.9rem] font-extrabold leading-tight tracking-[-0.02em] text-balance text-ink sm:text-[2.4rem]">
          {!eyebrow && <span className="leaf mr-3 align-middle" aria-hidden />}
          {title}
        </h2>
        {description && <p className="mt-3 text-[1.05rem] leading-relaxed text-ink-soft">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/** Rótulo obligatorio cuando los datos no son información municipal vigente. */
export function DataModeBadge({ mode, className = "" }: { mode: DataMode; className?: string }) {
  if (mode === "live") return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${
        mode === "demo" ? "border-tono-amarillo-fg/30 bg-tono-amarillo text-tono-amarillo-fg" : "border-line bg-white text-ink-soft"
      } ${className}`}
    >
      {mode === "demo" ? <FlaskConical className="size-3.5" aria-hidden /> : <Info className="size-3.5" aria-hidden />}
      {mode === "demo" ? "Datos de demostración" : "Información no disponible"}
    </span>
  );
}

export function EmptyState({ icon, title, children }: { icon?: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-[var(--radius-card)] border border-dashed border-line bg-white/70 px-6 py-12 text-center">
      {icon && <div className="mb-3 grid size-12 place-items-center rounded-2xl bg-canvas text-ink-soft">{icon}</div>}
      <p className="text-lg font-bold text-ink">{title}</p>
      {children && <div className="mt-1.5 max-w-md text-ink-soft">{children}</div>}
    </div>
  );
}

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-[88rem] px-4 sm:px-6 lg:px-10 ${className}`}>{children}</div>;
}
