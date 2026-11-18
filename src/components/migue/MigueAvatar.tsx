import Image from "next/image";
import { MessageCircleMore } from "lucide-react";
import { siteConfig } from "@/config/site";

/**
 * Espacio reservado para el avatar OFICIAL de Migue.
 * Mientras `siteConfig.migue.avatarUrl` sea null se muestra un marcador
 * neutro (ícono de conversación): NO es una versión del personaje.
 */
export function MigueAvatar({ size = 44, ring = true }: { size?: number; ring?: boolean }) {
  const url = siteConfig.migue.avatarUrl;
  return (
    <span
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-institucional text-white ${
        ring ? "ring-3 ring-white" : ""
      }`}
      style={{ width: size, height: size }}
      data-placeholder={url ? undefined : "migue-avatar"}
    >
      {url ? (
        <Image src={url} alt="" width={size * 2} height={size * 2} className="size-full object-cover object-top" />
      ) : (
        <MessageCircleMore aria-hidden style={{ width: size * 0.5, height: size * 0.5 }} />
      )}
    </span>
  );
}
