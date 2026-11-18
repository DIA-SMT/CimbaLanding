import { Route } from "lucide-react";
import { getPortalData } from "@/services/portal";
import { Container, EmptyState, SectionHeading } from "@/components/ui/primitives";
import { InterventionsGrid } from "./InterventionsGrid";

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
          <InterventionsGrid items={interventions.data} mode={mode} />
        ) : (
          <EmptyState icon={<Route className="size-6" />} title="Todavía no hay intervenciones publicadas">
            La información se mostrará cuando esté disponible en la fuente oficial.
          </EmptyState>
        )}
      </Container>
    </section>
  );
}
