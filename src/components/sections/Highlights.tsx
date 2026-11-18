import { ArrowRight, Construction, Megaphone, Route } from "lucide-react";
import { getPortalData } from "@/services/portal";
import { Container } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/Reveal";
import { RecentCarousel } from "./RecentCarousel";
import { MigueQuickLink } from "./MigueQuickLink";

/** Ilustración esquemática (decorativa) del mapa. No representa datos. */
function MapIllustration() {
  return (
    <svg viewBox="0 0 360 220" className="h-full w-full" aria-hidden>
      <rect width="360" height="220" fill="#eef2f7" />
      <path d="M250 150h110v70H230z" fill="#d6efd9" />
      <g stroke="#fff" strokeLinecap="round">
        <path d="M-10 40 380 110M-10 120 380 40M60-10 140 230M200-10 170 230M300-10 250 230M-10 180 380 170" strokeWidth="10" />
        <path d="M-10 80 380 70M110-10 90 230M250-10 330 230M-10 150 380 200" strokeWidth="5" />
      </g>
      {[
        { x: 112, y: 52, c: "#16a05d" },
        { x: 210, y: 150, c: "#16a05d" },
        { x: 52, y: 122, c: "#d93a3f" },
        { x: 220, y: 58, c: "#f2b705" },
      ].map((p, i) => (
        <g key={i} transform={`translate(${p.x} ${p.y})`}>
          <path d="M0 22C-9 11-14 5-14-3a14 14 0 0 1 28 0c0 8-5 14-14 25z" fill={p.c} stroke="#fff" strokeWidth="2.5" />
          <circle cy="-3" r="5" fill="#fff" />
        </g>
      ))}
    </svg>
  );
}

const QUICK = [
  { href: "#intervenciones", title: "Reparaciones", text: "Conocé las calles mejoradas", icon: Route, bg: "bg-tono-azul", fg: "text-tono-azul-fg" },
  { href: "#cortes", title: "Cortes de tránsito", text: "Calles afectadas y desvíos informados", icon: Construction, bg: "bg-tono-amarillo", fg: "text-tono-amarillo-fg" },
  { href: "#reclamos", title: "Realizá tu reclamo", text: "Cómo informar un bache o problema vial", icon: Megaphone, bg: "bg-tono-violeta", fg: "text-tono-violeta-fg" },
] as const;

export async function Highlights() {
  const { interventions, mode } = await getPortalData();
  const recent = interventions.ok
    ? interventions.data
        .filter((i) => i.status === "finalizado")
        .sort((a, b) => Number(Boolean(b.photos.before && b.photos.after)) - Number(Boolean(a.photos.before && a.photos.after)) || (b.date ?? "").localeCompare(a.date ?? ""))
        .slice(0, 6)
    : null;

  return (
    <section aria-label="Accesos destacados" className="pt-10 sm:pt-12">
      <Container>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Reveal className="h-full min-w-0">
            <article className="group grid h-full gap-5 rounded-[1.6rem] bg-white p-4 shadow-[var(--shadow-soft)] ring-1 ring-line/70 sm:grid-cols-[1.05fr_1fr] sm:p-5">
              <div className="relative h-48 overflow-hidden rounded-2xl sm:h-full sm:min-h-52">
                <div className="absolute inset-0 transition duration-700 group-hover:scale-105">
                  <MapIllustration />
                </div>
              </div>
              <div className="flex flex-col justify-center py-1 sm:py-3">
                <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-[1.7rem]">Mapa interactivo</h2>
                <p className="mt-2 leading-relaxed text-ink-soft">
                  Explorá la ciudad y visualizá las reparaciones, los trabajos en curso y los cortes de tránsito.
                </p>
                <a
                  href="#mapa"
                  className="mt-5 inline-flex w-fit items-center gap-2 rounded-full border-2 border-primary px-5 py-2.5 font-bold text-primary transition hover:bg-primary hover:text-white"
                >
                  Abrir mapa <ArrowRight className="size-4" aria-hidden />
                </a>
              </div>
            </article>
          </Reveal>

          <Reveal delay={0.08} className="h-full min-w-0">
            <RecentCarousel items={recent} mode={mode} />
          </Reveal>
        </div>

        <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          {QUICK.slice(0, 2).map((q, i) => (
            <QuickCard key={q.href} {...q} delay={i * 0.05} />
          ))}
          <Reveal as="li" delay={0.1}>
            <MigueQuickLink />
          </Reveal>
          <QuickCard {...QUICK[2]} delay={0.15} />
        </ul>
      </Container>
    </section>
  );
}

function QuickCard({
  href,
  title,
  text,
  icon: Icon,
  bg,
  fg,
  delay,
}: (typeof QUICK)[number] & { delay: number }) {
  return (
    <Reveal as="li" delay={delay}>
      <a
        href={href}
        className={`group flex h-full items-center gap-4 rounded-[var(--radius-card)] ${bg} p-4 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] sm:p-5`}
      >
        <span className={`grid size-14 shrink-0 place-items-center rounded-full bg-white/80 ${fg}`}>
          <Icon className="size-7" aria-hidden />
        </span>
        <span>
          <span className="block text-lg font-extrabold text-ink">{title}</span>
          <span className="block text-[0.92rem] leading-snug text-ink-soft">{text}</span>
        </span>
      </a>
    </Reveal>
  );
}

