import { FlaskConical } from "lucide-react";
import { getDataSource } from "@/services";

/** Aviso global cuando el portal muestra datos de demostración. */
export function DemoBanner() {
  if (getDataSource().mode !== "demo") return null;
  return (
    <div role="note" className="bg-amarillo text-ink">
      <p className="mx-auto flex max-w-[88rem] items-center justify-center gap-2 px-4 py-2 text-center text-[0.85rem] font-semibold sm:px-6">
        <FlaskConical className="size-4 shrink-0" aria-hidden />
        <span className="sm:hidden">Demostración: datos ficticios, no oficiales.</span>
        <span className="hidden sm:inline">Versión de demostración: las cifras, intervenciones y cortes son ficticios y no representan información municipal vigente.</span>
      </p>
    </div>
  );
}
