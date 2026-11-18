import type { Metadata } from "next";
import { SimplePage } from "@/components/layout/SimplePage";

export const metadata: Metadata = { title: "Accesibilidad" };

export default function AccessibilityPage() {
  return (
    <SimplePage title="Accesibilidad">
      <p>
        CIMBA Ciudadano se diseña tomando como referencia las Pautas de Accesibilidad para el Contenido Web (WCAG) 2.2, nivel AA.
      </p>
      <h2>Qué incluye</h2>
      <ul>
        <li>Navegación completa con teclado, enlace para saltar al contenido y foco visible.</li>
        <li>Contraste de color adecuado en textos y controles.</li>
        <li>Textos alternativos en imágenes y etiquetas en formularios.</li>
        <li>Listado de intervenciones como alternativa accesible al mapa.</li>
        <li>Comparador de fotografías operable con teclado y lectores de pantalla.</li>
        <li>Respeto de la preferencia del sistema para reducir animaciones.</li>
      </ul>
      <h2>¿Encontraste una barrera?</h2>
      <p>
        El canal de contacto para reportar problemas de accesibilidad se informará cuando sea confirmado por la Municipalidad.
      </p>
    </SimplePage>
  );
}
