import { CircleCheckBig, MapPin, TriangleAlert, Wrench } from "lucide-react";
import { getPortalData } from "@/services/portal";
import { formatDate } from "@/lib/format";
import { Container, DataModeBadge } from "@/components/ui/primitives";
import { CountUp } from "@/components/ui/CountUp";

const CARDS = [
  { key: "completed", label: "Reparaciones finalizadas", icon: CircleCheckBig, bg: "bg-tono-verde", fg: "text-tono-verde-fg", ring: "ring-tono-verde-fg/10" },
  { key: "inProgress", label: "Intervenciones en curso", icon: Wrench, bg: "bg-tono-azul", fg: "text-tono-azul-fg", ring: "ring-tono-azul-fg/10" },
  { key: "neighborhoodsWithInterventions", label: "Barrios con intervenciones registradas", icon: MapPin, bg: "bg-tono-violeta", fg: "text-tono-violeta-fg", ring: "ring-tono-violeta-fg/10" },
] as const;

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section aria-labelledby="indicadores-title" className="relative z-10 -mt-10 sm:-mt-14">
      <Container>
        <h2 id="indicadores-title" className="sr-only">
          Indicadores ciudadanos
        </h2>
        {children}
      </Container>
    </section>
  );
}

export async function Indicators() {
  const { summary, mode } = await getPortalData();

  if (!summary.ok) {
    return (
      <Shell>
        <div className="flex items-center gap-3 rounded-[var(--radius-card)] border border-line bg-white p-5 text-ink-soft shadow-[var(--shadow-soft)]">
          <TriangleAlert className="size-5 text-tono-amarillo-fg" aria-hidden />
          Los indicadores todavía no están disponibles. Se mostrarán cuando la información pública esté publicada.
        </div>
      </Shell>
    );
  }

  const s = summary.data;
  return (
    <Shell>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {CARDS.map(({ key, label, icon: Icon, bg, fg, ring }, idx) => (
          <li
            key={key}
            className={`${idx === CARDS.length - 1 ? "col-span-2 sm:col-span-1" : ""} flex flex-col items-start gap-3 rounded-[var(--radius-card)] ${bg} p-4 sm:flex-row sm:items-center sm:gap-4 shadow-[var(--shadow-soft)] ring-1 ${ring} transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] sm:p-5`}
          >
            <span className={`grid size-11 shrink-0 place-items-center rounded-full bg-white/80 ${fg} shadow-sm sm:size-14`}>
              <Icon className="size-6 sm:size-7" strokeWidth={2.2} aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-[1.75rem] font-extrabold leading-none tracking-tight text-ink sm:text-[2.2rem]">
                {s[key] === null ? <span aria-label="Sin dato">—</span> : <CountUp value={s[key]} />}
              </span>
              <span className="mt-1 block text-[0.88rem] font-medium leading-snug text-ink sm:text-[0.95rem]">{label}</span>
              {key === "completed" && s.completedSince && (
                <span className="mt-0.5 block text-xs text-ink-soft">Desde el {formatDate(`${s.completedSince}T12:00:00-03:00`)}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-ink-soft">
        <span>Datos actualizados al {formatDate(s.updatedAt)}</span>
        <DataModeBadge mode={mode} />
      </p>
    </Shell>
  );
}

export function IndicatorsSkeleton() {
  return (
    <Shell>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4" aria-busy="true" aria-label="Cargando indicadores">
        {CARDS.map((c) => (
          <div key={c.key} className="flex items-center gap-4 rounded-[var(--radius-card)] bg-white p-5 shadow-[var(--shadow-soft)]">
            <div className="skeleton size-14 !rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-8 w-24" />
              <div className="skeleton h-4 w-40" />
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
}
