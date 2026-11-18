import { MapPinOff } from "lucide-react";

export function MapOff() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-canvas p-6 text-center">
      <div>
        <MapPinOff className="mx-auto size-8 text-ink-soft" aria-hidden />
        <p className="mt-2 font-bold text-ink">No se pudo cargar el mapa</p>
        <p className="mt-1 max-w-sm text-sm text-ink-soft">
          Tu navegador o la conexión no permiten mostrarlo. Podés consultar el listado de intervenciones que figura al costado.
        </p>
      </div>
    </div>
  );
}
