"use client";

import { ArrowRight, Lock, MapPinned, Megaphone, MessageSquareText, Route, TrafficCone } from "lucide-react";
import { MigueAvatar } from "@/components/migue/MigueAvatar";
import { openMigue } from "@/components/migue/events";
import { MIGUE_STARTERS } from "@/lib/migue/types";
import { Container } from "@/components/ui/primitives";

const CAPS = [
  { icon: Route, text: "Consultar reparaciones por calle" },
  { icon: MapPinned, text: "Ver lo que pasa en tu barrio" },
  { icon: TrafficCone, text: "Conocer cortes de tránsito" },
  { icon: Megaphone, text: "Orientarte para hacer un reclamo" },
];

export function MigueSection() {
  return (
    <section id="migue" aria-labelledby="migue-sec-title" className="pt-20 sm:pt-28">
      <Container>
        <div className="grid items-center gap-8 overflow-hidden rounded-[2rem] bg-white p-6 shadow-[var(--shadow-soft)] ring-1 ring-line/70 sm:p-10 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="flex items-center gap-2.5 text-sm font-bold uppercase tracking-[0.14em] text-primary">
              <span className="leaf !h-3 !w-5" aria-hidden />
              Consultas con Migue
            </p>
            <h2 id="migue-sec-title" className="mt-2 text-[1.9rem] font-extrabold leading-tight tracking-[-0.02em] text-ink sm:text-[2.4rem]">
              Preguntale a Migue
            </h2>
            <p className="mt-3 text-[1.05rem] leading-relaxed text-ink-soft">
              El asistente de la Municipalidad responde con la información pública publicada en este portal. Si no hay un registro disponible, te lo dice.
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {CAPS.map((c) => (
                <li key={c.text} className="flex items-center gap-3 rounded-2xl bg-canvas px-4 py-3 font-semibold text-ink">
                  <c.icon className="size-5 shrink-0 text-primary" aria-hidden />
                  {c.text}
                </li>
              ))}
            </ul>
            <p className="mt-5 flex items-center gap-2 text-sm text-ink-soft">
              <Lock className="size-4" aria-hidden /> Migue no accede a sistemas internos ni solicita datos personales.
            </p>
          </div>

          <div className="relative rounded-[1.6rem] bg-[linear-gradient(160deg,#0b377f,#0876ec)] p-5 sm:p-7">
            <div className="flex items-center gap-3 text-white">
              <MigueAvatar size={52} />
              <div>
                <p className="text-lg font-extrabold">Migue</p>
                <p className="text-sm text-white/75">Asistente municipal</p>
              </div>
            </div>
            <div className="mt-5 rounded-2xl rounded-tl-md bg-white p-4 text-ink shadow-lg">
              <p className="flex items-start gap-2">
                <MessageSquareText className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                ¡Hola! ¿Sobre qué calle o barrio querés consultar?
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {MIGUE_STARTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => openMigue(s)}
                  className="rounded-full bg-white/12 px-3.5 py-2 text-sm font-semibold text-white ring-1 ring-white/30 transition hover:bg-white hover:text-institucional"
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => openMigue()}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-amarillo px-6 py-3 font-bold text-ink transition hover:-translate-y-0.5"
            >
              Abrir chat con Migue <ArrowRight className="size-4" aria-hidden />
            </button>
          </div>
        </div>
      </Container>
    </section>
  );
}
