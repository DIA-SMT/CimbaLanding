import { getPortalData } from "@/services/portal";
import { Container } from "@/components/ui/primitives";
import { MyNeighborhood } from "./MyNeighborhood";

export async function MyNeighborhoodSection() {
  const { neighborhoods, closures, mode } = await getPortalData();
  if (!neighborhoods.ok) return null;
  return (
    <section id="mi-barrio" aria-labelledby="barrio-title" className="pt-20 sm:pt-28">
      <Container>
        <MyNeighborhood
          neighborhoods={neighborhoods.data}
          closures={closures.ok ? closures.data : []}
          mode={mode}
        />
      </Container>
    </section>
  );
}
