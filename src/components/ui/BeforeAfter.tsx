"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { ChevronsLeftRight } from "lucide-react";
import type { Photo } from "@/domain/schemas";

/**
 * Comparador antes/después accesible: el control es un <input type="range">
 * nativo (teclado, lectores de pantalla y táctil), con la imagen recortada
 * mediante clip-path para no provocar reflow.
 */
export function BeforeAfter({ before, after, className = "" }: { before: Photo; after: Photo; className?: string }) {
  const id = useId();
  const [pos, setPos] = useState(50);
  const illustrative = before.illustrative || after.illustrative;

  return (
    <div className={`group relative isolate overflow-hidden rounded-2xl bg-ink/10 select-none ${className}`}>
      <Image src={after.url} alt={after.alt} fill sizes="(min-width: 1024px) 420px, 90vw" className="object-cover" loading="lazy" unoptimized={after.url.endsWith(".svg")} />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <Image src={before.url} alt={before.alt} fill sizes="(min-width: 1024px) 420px, 90vw" className="object-cover" loading="lazy" unoptimized={before.url.endsWith(".svg")} />
      </div>

      <div aria-hidden className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.1)]" style={{ left: `${pos}%` }}>
        <span className="absolute left-1/2 top-1/2 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-ink shadow-lg transition group-focus-within:ring-3 group-focus-within:ring-primary">
          <ChevronsLeftRight className="size-5" />
        </span>
      </div>

      <span aria-hidden className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-ink/75 px-2.5 py-1 text-[0.7rem] font-bold text-white">Antes</span>
      <span aria-hidden className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-ink/75 px-2.5 py-1 text-[0.7rem] font-bold text-white">Después</span>
      {illustrative && (
        <span className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 whitespace-nowrap rounded-full bg-amarillo px-2.5 py-1 text-[0.68rem] font-extrabold text-ink">
          Ilustración de ejemplo
        </span>
      )}

      <label htmlFor={id} className="sr-only">
        Comparar antes y después
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-valuetext={`${pos}% de la imagen anterior visible`}
        className="absolute inset-0 z-10 h-full w-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}
