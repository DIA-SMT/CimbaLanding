import { Camera, ClipboardCheck, Database, MapPin, Phone } from "lucide-react";
import { Container, SectionHeading } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/Reveal";
import { ClaimForm } from "@/components/claims/ClaimForm";
import { CiditucFrame } from "@/components/claims/CiditucFrame";
import { siteConfig } from "@/config/site";
import { ClaimTracking } from "@/components/claims/ClaimTracking";

const EMBEBIDO = siteConfig.reclamos.modo === "iframe";

/** Copia LOCAL de CiDiTuc para pruebas (p. ej. http://localhost:5173). Sólo fuera de producción. */
function ciditucLoginBase(): string | null {
  const v = process.env.CIDITUC_LOGIN_BASE;
  if (!v || process.env.NODE_ENV === "production") return null;
  try {
    return new URL(v).origin;
  } catch {
    return null;
  }
}

const TIPS = [
  { icon: MapPin, text: "Marcá el lugar exacto en el mapa y anotá calle y altura." },
  { icon: ClipboardCheck, text: "Describí qué pasa: tamaño, si ocupa el carril, si junta agua." },
  {
    icon: Camera,
    text: EMBEBIDO
      ? "Sumá fotos: el formulario de CiDiTuc acepta hasta 3."
      : "Si podés, sacale una foto: el envío de fotos se suma cuando CiDiTuc habilite el alta desde el portal.",
  },
];

/**
 * Reclamos: se cargan DENTRO del portal, pero el reclamo es SIEMPRE de
 * CIDITUC (Atención Ciudadana · 147). No hay un sistema paralelo: CIMBA lo
 * recibe desde CIDITUC igual que cualquier reclamo del 147.
 */
export function ClaimsSection() {
  return (
    <section id="reclamos" aria-labelledby="reclamos-title" className="pt-20 sm:pt-28">
      <Container>
        <SectionHeading
          id="reclamos-title"
          eyebrow="Reclamos ciudadanos"
          title="¿Viste un problema en la calle?"
          description="Hacé tu reclamo desde acá, sin salir del portal. Queda registrado en Atención Ciudadana (CiDiTuc · 147) a tu nombre, con número para hacerle seguimiento."
        />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)]">
          <Reveal className="min-w-0 space-y-5">
            <div className="on-dark relative overflow-hidden rounded-[1.6rem] bg-[linear-gradient(150deg,#0b377f,#0066ff)] p-6 text-white shadow-[var(--shadow-lift)]">
              <div aria-hidden className="absolute -bottom-16 -right-16 size-56 rounded-full bg-amarillo/20 blur-2xl" />
              <h3 className="text-xl font-extrabold">Un solo reclamo, en el sistema oficial</h3>
              <ol className="mt-4 space-y-3 text-[0.95rem]">
                <li className="flex gap-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white/15 text-sm font-bold">1</span>
                  <span className="text-white/90">
                    {EMBEBIDO ? "Abrís el formulario oficial de CiDiTuc acá, en el portal." : "Lo completás acá, en el portal."}
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white/15 text-sm font-bold">2</span>
                  <span className="text-white/90">
                    Se registra en <strong className="text-white">CiDiTuc</strong> con tu cuenta de Ciudad Digital: es el mismo reclamo que hacés al 147.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white/15 text-sm font-bold">3</span>
                  <span className="text-white/90">CIMBA lo recibe automáticamente desde CiDiTuc y la Dirección de Bacheo lo organiza.</span>
                </li>
              </ol>
              <p className="mt-5 flex items-center gap-2 text-sm text-white/75">
                <Database className="size-4 shrink-0" aria-hidden /> Este portal no guarda reclamos ni datos personales.
              </p>
            </div>

            <div className="rounded-[1.6rem] bg-white p-5 shadow-[var(--shadow-soft)] ring-1 ring-line/70">
              <p className="font-bold text-ink">Para que se resuelva más rápido</p>
              <ul className="mt-3 space-y-2.5">
                {TIPS.map((t) => (
                  <li key={t.text} className="flex gap-3 text-[0.95rem] text-ink-soft">
                    <t.icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                    {t.text}
                  </li>
                ))}
              </ul>
              {!EMBEBIDO && (
                <div className="mt-5">
                  <ClaimTracking />
                </div>
              )}
              {EMBEBIDO && (
                <p className="mt-4 rounded-2xl bg-tono-azul px-4 py-3 text-sm text-ink">
                  <strong>Seguimiento:</strong> con tu número de reclamo, desde el mismo formulario de CiDiTuc.
                </p>
              )}
              <p className="mt-4 flex items-center gap-2 text-sm text-ink-soft">
                <Phone className="size-4 shrink-0" aria-hidden /> También podés reclamar llamando al <strong className="text-ink">147</strong>.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.06} className="min-w-0">
            {EMBEBIDO ? <CiditucFrame loginBase={ciditucLoginBase()} /> : <ClaimForm />}
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
