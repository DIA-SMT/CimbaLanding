import type { Metadata } from "next";
import { SimplePage } from "@/components/layout/SimplePage";

export const metadata: Metadata = { title: "Política de privacidad" };

export default function PrivacyPage() {
  // Sólo se menciona el servicio de IA si Migue está conectado a un modelo.
  const conIA = Boolean(process.env.OPENROUTER_API_KEY);
  return (
    <SimplePage title="Política de privacidad">
      <p>
        <strong className="text-ink">Borrador pendiente de revisión por el área legal de la Municipalidad.</strong> El texto
        definitivo deberá ser validado antes de la publicación del portal.
      </p>
      <h2>Qué información publica este portal</h2>
      <p>
        CIMBA Ciudadano muestra únicamente información vial autorizada para su difusión pública: ubicación de intervenciones,
        tipo de trabajo, estado y fechas confirmadas. No publica datos personales de vecinos, agentes ni
        información administrativa interna.
      </p>
      <h2>Qué datos se tratan al navegar</h2>
      <ul>
        <li>No se requiere registro ni inicio de sesión.</li>
        <li>
          Si elegís “Recordar mi barrio”, la preferencia se guarda sólo en tu navegador (almacenamiento local) y podés borrarla
          desmarcando la opción.
        </li>
        <li>
          La ubicación del dispositivo se solicita únicamente cuando presionás “Cerca mío” o “Detectar con mi ubicación”. Se usa en
          tu navegador para centrar el mapa o sugerir un barrio, y no se envía ni se almacena en servidores del portal.
        </li>
        <li>
          Las consultas a Migue se procesan para generar una respuesta y el portal no guarda su contenido.
          {conIA &&
            " Para entender el lenguaje natural, el texto de la conversación se envía a un servicio externo de inteligencia artificial (OpenRouter, con un modelo de Anthropic), el mismo que usa el Migue de la Municipalidad."}{" "}
          Migue sólo responde con información pública del portal. Te pedimos no incluir datos personales en tus mensajes.
        </li>
      </ul>
      <h2>Servicios de terceros</h2>
      <p>El mapa base se obtiene de OpenFreeMap (datos de OpenStreetMap). Tu navegador se conecta a ese servicio para descargar el mapa.</p>
      {conIA && (
        <p>
          Las respuestas de Migue se generan con OpenRouter (modelo Claude, de Anthropic). El servidor del portal le envía el texto de
          la conversación y los datos públicos que consulta; no le envía tu ubicación ni datos de tu navegador.
        </p>
      )}
    </SimplePage>
  );
}
