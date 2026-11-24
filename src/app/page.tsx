import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { DemoBanner } from "@/components/layout/DemoBanner";
import { Hero } from "@/components/sections/Hero";
import { HeroSearch } from "@/components/sections/HeroSearch";
import { HeroSearchLoader } from "@/components/sections/HeroSearchLoader";
import { Indicators, IndicatorsSkeleton } from "@/components/sections/Indicators";
import { Highlights } from "@/components/sections/Highlights";
import { MapSection, MapSectionSkeleton } from "@/components/sections/MapSection";
import { InterventionsSection } from "@/components/sections/InterventionsSection";
import { MyNeighborhoodSection } from "@/components/sections/MyNeighborhoodSection";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { MigueSection } from "@/components/sections/MigueSection";
import { ClaimsSection } from "@/components/sections/ClaimsSection";
import { MigueWidget } from "@/components/migue/MigueWidget";
import { MotionProvider } from "@/components/ui/Reveal";

/** Revalidación incremental: la página se regenera como máximo cada 5 minutos. */
export const revalidate = 300;

function SectionSkeleton({ h = 420 }: { h?: number }) {
  return (
    <div className="mx-auto max-w-[88rem] px-4 pt-20 sm:px-6 lg:px-10" aria-busy="true">
      <div className="skeleton mb-8 h-10 w-72" />
      <div className="skeleton w-full !rounded-[1.6rem]" style={{ height: h }} />
    </div>
  );
}

export default function Home() {
  return (
    <MotionProvider>
      <DemoBanner />
      <Header />
      <main id="contenido" tabIndex={-1} className="focus:outline-none">
        <Hero
          search={
            <Suspense fallback={<HeroSearch suggestions={[]} />}>
              <HeroSearchLoader />
            </Suspense>
          }
        />
        <Suspense fallback={<IndicatorsSkeleton />}>
          <Indicators />
        </Suspense>
        <Suspense fallback={<SectionSkeleton h={300} />}>
          <Highlights />
        </Suspense>
        <Suspense fallback={<MapSectionSkeleton />}>
          <MapSection />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <InterventionsSection />
        </Suspense>
        <Suspense fallback={<SectionSkeleton h={360} />}>
          <MyNeighborhoodSection />
        </Suspense>
        <HowItWorks />
        <MigueSection />
        <ClaimsSection />
      </main>
      <Footer />
      <MigueWidget />
    </MotionProvider>
  );
}
