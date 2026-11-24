import { MapPinOff } from "lucide-react";
import { getPortalData } from "@/services/portal";
import { Container, EmptyState, SectionHeading } from "@/components/ui/primitives";
import { MapExplorer } from "@/components/map/MapExplorer";

export async function MapSection() {
  const { interventions, neighborhoods, mode } = await getPortalData();
  return (
    <section id="mapa" aria-labelledby="mapa-title" className="scroll-mt-20 pt-20 sm:pt-24">
      <Container>
        <SectionHeading
          id="mapa-title"
          eyebrow="Mapa interactivo"
          title="Explorá las intervenciones en la ciudad"
          description="Buscá tu calle o barrio, filtrá por estado, tipo o fecha y tocá un punto para ver su ficha."
        />
        {interventions.ok ? (
          <MapExplorer
            neighborhoods={neighborhoods.ok ? neighborhoods.data : []}
            mode={mode}
          />
        ) : (
          <EmptyState icon={<MapPinOff className="size-6" />} title="El mapa todavía no tiene información publicada">
            Cuando la Municipalidad publique las intervenciones georreferenciadas, vas a poder explorarlas acá.
          </EmptyState>
        )}
      </Container>
    </section>
  );
}

export function MapSectionSkeleton() {
  return (
    <section id="mapa" className="pt-20 sm:pt-24" aria-busy="true">
      <Container>
        <div className="skeleton mb-8 h-12 w-80" />
        <div className="skeleton h-[560px] w-full !rounded-[1.75rem]" />
      </Container>
    </section>
  );
}
