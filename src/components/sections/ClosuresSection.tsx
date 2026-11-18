import { CalendarClock, Clock, Construction, ExternalLink, Signpost, Timer, TrafficCone } from "lucide-react";
import { getPortalData } from "@/services/portal";
import type { TrafficClosure } from "@/domain/schemas";
import { siteConfig } from "@/config/site";
import { formatDateTime } from "@/lib/format";
import { ClosureBadge, Container, DataModeBadge, EmptyState, SectionHeading } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/Reveal";
import { ViewOnMapButton } from "./ViewOnMapButton";

function ClosureCard({ c }: { c: TrafficClosure }) {
  const live = c.status === "vigente";
  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] bg-white p-5 pl-6 shadow-[var(--shadow-soft)] ring-1 ring-line/70">
      <span aria-hidden className={`absolute inset-y-0 left-0 w-1.5 ${live ? "bg-corte" : "bg-amarillo"}`} />
      <div className="flex items-start gap-3">
        <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${live ? "bg-corte-bg text-corte" : "bg-programado-bg text-programado"}`}>
          <TrafficCone className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-lg font-extrabold leading-tight text-ink">{c.street}</h4>
            <ClosureBadge status={c.status} />
          </div>
          <p className="mt-0.5 text-[0.95rem] text-ink-soft">{c.section}</p>
        </div>
      </div>
      <dl className="mt-4 grid gap-2 text-[0.92rem] text-ink">
        <div className="flex gap-2">
          <dt className="sr-only">Fecha</dt>
          <CalendarClock className="mt-0.5 size-4 shrink-0 text-ink-soft" aria-hidden />
          <dd>
            {formatDateTime(c.startsAt)}
            {c.endsAt ? ` → ${formatDateTime(c.endsAt)}` : " · fin a confirmar"}
          </dd>
        </div>
        {c.schedule && (
          <div className="flex gap-2">
            <dt className="sr-only">Horario</dt>
            <Clock className="mt-0.5 size-4 shrink-0 text-ink-soft" aria-hidden />
            <dd>{c.schedule}</dd>
          </div>
        )}
        <div className="flex gap-2">
          <dt className="sr-only">Motivo</dt>
          <Construction className="mt-0.5 size-4 shrink-0 text-ink-soft" aria-hidden />
          <dd>{c.reason}</dd>
        </div>
        {c.estimatedDuration && (
          <div className="flex gap-2">
            <dt className="sr-only">Duración estimada</dt>
            <Timer className="mt-0.5 size-4 shrink-0 text-ink-soft" aria-hidden />
            <dd>Duración estimada: {c.estimatedDuration}</dd>
          </div>
        )}
        <div className="flex gap-2">
          <dt className="sr-only">Desvío</dt>
          <Signpost className="mt-0.5 size-4 shrink-0 text-ink-soft" aria-hidden />
          <dd className={c.officialDetour ? "" : "text-ink-soft"}>{c.officialDetour ?? "Sin desvío oficial informado"}</dd>
        </div>
      </dl>
      <div className="mt-auto pt-4">
        <ViewOnMapButton id={c.id} />
      </div>
    </article>
  );
}

export async function ClosuresSection() {
  const { closures, mode } = await getPortalData();
  const official = siteConfig.channels.trafficClosuresOfficialUrl;

  return (
    <section id="cortes" aria-labelledby="cortes-title" className="pt-20 sm:pt-28">
      <Container>
        <SectionHeading
          id="cortes-title"
          eyebrow="Cortes de tránsito"
          title="Calles afectadas por trabajos"
          description="Cortes vigentes y programados por obras viales. Los desvíos se publican sólo cuando fueron informados oficialmente."
          action={
            official ? (
              <a href={official} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-bold text-primary hover:underline">
                Fuente oficial de cortes <ExternalLink className="size-4" aria-hidden />
              </a>
            ) : (
              <DataModeBadge mode={mode} />
            )
          }
        />
        {!closures.ok ? (
          <EmptyState icon={<TrafficCone className="size-6" />} title="Información de cortes no disponible">
            CIMBA registra las reparaciones pero no los cortes de tránsito. Esta sección se completará cuando se conecte la fuente oficial de cortes de la Municipalidad.
          </EmptyState>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            {(["vigente", "programado"] as const).map((status) => {
              const list = closures.data.filter((c) => c.status === status);
              return (
                <div key={status}>
                  <h3 className="mb-4 flex items-center gap-2.5 text-lg font-extrabold text-ink">
                    <span className={`size-3 rounded-full ${status === "vigente" ? "bg-corte" : "bg-amarillo ring-2 ring-programado/40"}`} aria-hidden />
                    {status === "vigente" ? "Vigentes ahora" : "Programados"}
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-sm text-ink-soft ring-1 ring-line">{list.length}</span>
                  </h3>
                  {list.length === 0 ? (
                    <p className="rounded-[var(--radius-card)] border border-dashed border-line bg-white/70 p-6 text-ink-soft">
                      {status === "vigente" ? "No hay cortes vigentes publicados." : "No hay cortes programados publicados."}
                    </p>
                  ) : (
                    <ul className="grid gap-4">
                      {list.map((c, i) => (
                        <Reveal as="li" key={c.id} delay={i * 0.05}>
                          <ClosureCard c={c} />
                        </Reveal>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Container>
    </section>
  );
}
