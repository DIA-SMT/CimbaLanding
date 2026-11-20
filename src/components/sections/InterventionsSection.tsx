import { Route } from "lucide-react";
import { getPortalData } from "@/services/portal";
import { Container, EmptyState, SectionHeading } from "@/components/ui/primitives";
import { STATUS_ORDER } from "@/domain/labels";
import type { Intervention } from "@/domain/schemas";
import { PAGE } from "@/lib/paginacion";
import { InterventionsGrid, type Inicial } from "./InterventionsGrid";

/** Sólo la primera página de cada pestaña viaja con la portada; el resto, a pedido. */
function primerasPaginas(items: Intervention[]): Inicial {
  const inicial = { todas: { items: items.slice(0, PAGE), total: items.length } } as Inicial;
  for (const s of STATUS_ORDER) {
    const de = items.filter((i) => i.status === s);
    inicial[s] = { items: de.slice(0, PAGE), total: de.length };
  }
  return inicial;
}

export async function InterventionsSection() {
  const { interventions, mode } = await getPortalData();
  return (
    <section id="intervenciones" aria-labelledby="int-title" className="pt-20 sm:pt-28">
      <Container>
        <SectionHeading
          id="int-title"
          eyebrow="Intervenciones"
          title="Reparaciones en la ciudad"
          description="Cada ficha muestra la ubicación, el tipo de trabajo, su estado y la fecha confirmada. Cuando hay fotografías publicadas del antes y el después, podés compararlas deslizando."
        />
        {interventions.ok ? (
          <InterventionsGrid inicial={primerasPaginas(interventions.data)} mode={mode} />
        ) : (
          <EmptyState icon={<Route className="size-6" />} title="Todavía no hay intervenciones publicadas">
            La información se mostrará cuando esté disponible en la fuente oficial.
          </EmptyState>
        )}
      </Container>
    </section>
  );
}
