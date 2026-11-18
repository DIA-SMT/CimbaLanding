/**
 * Configuración pública del portal.
 *
 * Todo lo que figura acá es información NO sensible. Los secretos de integración
 * viven exclusivamente en variables de entorno de servidor (ver .env.example).
 *
 * Los valores marcados con `null` son recursos oficiales todavía no confirmados:
 * la interfaz muestra un estado "pendiente" en lugar de inventar un dato.
 */

/** Origen de los recursos visuales oficiales que hoy se sirven desde el portal de Turismo SMT. */
const TURISMO_ASSETS = "https://pag-turismo-ia.vercel.app";

export const siteConfig = {
  name: "CIMBA Ciudadano",
  shortName: "CIMBA",
  tagline: "Información pública sobre el estado de las calles",
  institution: "Municipalidad de San Miguel de Tucumán",
  description:
    "Conocé las reparaciones, los trabajos en curso y los cortes de tránsito en San Miguel de Tucumán.",

  assets: {
    /** Logotipo oficial (versión positiva, para fondos claros). */
    logoPositive: `${TURISMO_ASSETS}/img/logo-smt-pos.png`,
    /** Logotipo oficial (versión negativa, para fondos oscuros). */
    logoNegative: `${TURISMO_ASSETS}/img/logo-smt-neg.png`,
    logoAlt: "Ciudad San Miguel de Tucumán",
    /** Fotografía panorámica real de la ciudad: Catedral de San Miguel de Tucumán. */
    heroPhoto: `${TURISMO_ASSETS}/fotos/panoramas/catedral-iluminada.webp`,
    heroPhotoAlt:
      "Vista panorámica nocturna de la Catedral de San Miguel de Tucumán frente a la Plaza Independencia",
  },

  /**
   * Migue: imagen OFICIAL tomada del repositorio de CIMBA
   * (apps/web/public/marca/migue/migue-casco-v3.png, la versión con casco que
   * usa la pantalla de acceso de CIMBA). No se genera ni se modifica el
   * personaje. Se usa sólo en el chat (avatar); el hero no lleva a Migue.
   * Con `null` vuelve el marcador neutro.
   */
  migue: {
    avatarUrl: "/brand/migue-casco.png" as string | null,
    displayName: "Migue",
    role: "Asistente municipal",
  },

  /** Canales oficiales. `null` = pendiente de confirmación por el área responsable. */
  channels: {
    municipalSite: "https://smt.gob.ar/",
    trafficClosuresOfficialUrl: null as string | null,
    /** Sistema CIMBA y su tablero público de avance (sólo responde con AVANCE_PUBLICO=1). */
    cimbaSite: "https://cimba.smt.gob.ar",
    cimbaAvancePublico: "https://cimba.smt.gob.ar/publico",
    social: [
      { label: "Facebook", href: "https://www.facebook.com/MuniSMTucuman" },
      { label: "Instagram", href: "https://instagram.com/munismtucuman" },
      { label: "X (Twitter)", href: "https://twitter.com/MuniSMT" },
      { label: "YouTube", href: "https://www.youtube.com/user/MuniSMTucuman" },
    ],
  },

  /**
   * Reclamos: el formulario OFICIAL de CiDiTuc (derivador) dentro del portal.
   *
   *  - modo "iframe": se muestra el formulario de CiDiTuc embebido (pruebas en curso).
   *  - modo "formulario": formulario propio del portal (src/components/claims/ClaimForm.tsx).
   *
   * Hoy, si el vecino no tiene sesión, CiDiTuc lo manda al login y después a la
   * portada del derivador (no al formulario). Cuando DITEC agregue `next=reclamo`
   * en el login de CiDiTuc, completar `loginNext` y el iframe abrirá
   * login → formulario de reclamo directo.
   */
  reclamos: {
    modo: "iframe" as "iframe" | "formulario",
    formularioUrl: "https://cidituc.smt.gob.ar/#/consulta-publica/agregar-reclamo",
    loginUrl: "https://ciudaddigital.smt.gob.ar/#/login",
    /**
     * Destino después del login. En producción CiDiTuc todavía no lo reconoce
     * (cae en la portada del derivador); en la prueba local sí.
     */
    loginNext: "reclamo" as string | null,
  },

  /** Centro de referencia del mapa: Plaza Independencia. */
  map: {
    center: { lat: -26.8303, lng: -65.2038 },
    zoom: 13.2,
    /** Estilo vectorial abierto, sin clave (OpenFreeMap / OpenStreetMap). */
    styleUrl: "https://tiles.openfreemap.org/styles/positron",
    maxBounds: [
      [-65.36, -26.93],
      [-65.08, -26.72],
    ] as [[number, number], [number, number]],
  },
} as const;

export const navItems = [
  { id: "inicio", label: "Inicio" },
  { id: "mapa", label: "Mapa" },
  { id: "intervenciones", label: "Intervenciones" },
  { id: "cortes", label: "Cortes" },
  { id: "como-funciona", label: "Cómo funciona" },
  { id: "migue", label: "Consultas con Migue" },
] as const;

export type NavId = (typeof navItems)[number]["id"];
