"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageOff } from "lucide-react";
import type { Photo } from "@/domain/schemas";

/**
 * Foto de una intervención que ocupa su contenedor (relative). Si el origen no
 * responde, muestra un aviso en lugar de un recuadro vacío o un ícono roto.
 */
export function Foto({ foto, sizes, loading = "lazy" }: { foto: Photo; sizes: string; loading?: "lazy" | "eager" }) {
  const [rota, setRota] = useState(false);

  if (rota) {
    return (
      <div role="img" aria-label={`${foto.alt} (fotografía no disponible)`} className="absolute inset-0 grid place-items-center bg-canvas px-3 text-center text-xs font-semibold text-ink-soft">
        <span className="flex flex-col items-center gap-1.5">
          <ImageOff className="size-5" aria-hidden />
          Foto no disponible
        </span>
      </div>
    );
  }

  return (
    <Image
      src={foto.url}
      alt={foto.alt}
      fill
      sizes={sizes}
      loading={loading}
      unoptimized={foto.url.endsWith(".svg")}
      onError={() => setRota(true)}
      className="object-cover"
    />
  );
}
