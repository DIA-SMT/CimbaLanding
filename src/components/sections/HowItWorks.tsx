import { CalendarCheck, ClipboardList, HardHat, Inbox, Info, ShieldCheck } from "lucide-react";
import { Container, SectionHeading } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/Reveal";

const STEPS = [
  {
    icon: Inbox,
    title: "Llega un pedido",
    text: "Desde Atención Ciudadana, el Concejo, redes, otras secretarías o los relevamientos propios. Varios pedidos sobre el mismo bache se unen en un solo problema.",
    tone: "bg-tono-azul text-tono-azul-fg",
  },
  {
    icon: ClipboardList,
    title: "Se registra y prioriza",
    text: "El problema se ubica en el mapa y recibe un puntaje: cuánta gente lo pide, hace cuánto está, qué tan grave es y si está en una avenida.",
    tone: "bg-tono-violeta text-tono-violeta-fg",
  },
  {
    icon: CalendarCheck,
    title: "Se programa",
    text: "Se emite una orden de trabajo a una cuadrilla municipal o a una empresa contratista.",
    tone: "bg-tono-amarillo text-tono-amarillo-fg",
  },
  {
    icon: HardHat,
    title: "Se repara",
    text: "La cuadrilla hace el trabajo y lo registra con foto del antes y del después, ubicación GPS y medidas.",
    tone: "bg-tono-azul text-tono-azul-fg",
  },
  {
    icon: ShieldCheck,
    title: "Se valida y se publica",
    text: "La Dirección de Bacheo valida lo cargado y supervisión controla la calidad. Lo validado aparece en este portal como reparado.",
    tone: "bg-tono-verde text-tono-verde-fg",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" aria-labelledby="como-title" className="pt-20 sm:pt-28">
      <Container>
        <SectionHeading
          id="como-title"
          eyebrow="Cómo funciona"
          title="De un bache a una calle reparada"
          description="Así recorre CIMBA cada problema de la calle, desde el reclamo hasta la reparación verificada."
        />

        <ol className="relative grid gap-4 md:grid-cols-5 md:gap-5">
          <span aria-hidden className="absolute left-[1.9rem] top-8 bottom-8 w-1 rounded-full bg-[linear-gradient(180deg,#36b3ff,#0876ec,#ffdf00)] md:inset-x-[10%] md:bottom-auto md:left-[10%] md:top-[2.15rem] md:h-1 md:w-auto md:bg-[linear-gradient(90deg,#36b3ff,#0876ec,#ffdf00)]" />
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.title} delay={i * 0.08} className="relative">
              <div className="flex gap-4 md:flex-col md:items-center md:text-center">
                <span className={`relative z-10 grid size-[4.3rem] shrink-0 place-items-center rounded-full ring-[6px] ring-canvas ${s.tone}`}>
                  <s.icon className="size-7" aria-hidden />
                  <span className="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full bg-institucional text-xs font-extrabold text-white">{i + 1}</span>
                </span>
                <div className="rounded-2xl bg-white p-4 shadow-[var(--shadow-soft)] ring-1 ring-line/70 md:mt-4 md:w-full">
                  <h3 className="font-extrabold leading-snug text-ink">{s.title}</h3>
                  <p className="mt-1 text-[0.92rem] leading-relaxed text-ink-soft">{s.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </ol>

        <p className="mt-6 flex items-start gap-2 text-sm text-ink-soft">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          Basado en el circuito de gestión de CIMBA, el sistema de la Dirección de Bacheo. Los estados que ves en el mapa son los mismos de ese sistema.
        </p>
      </Container>
    </section>
  );
}
