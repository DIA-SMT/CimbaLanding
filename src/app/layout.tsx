import type { Metadata, Viewport } from "next";
import "@fontsource-variable/plus-jakarta-sans";
import { siteConfig } from "@/config/site";
import "./globals.css";


export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} | Municipalidad de San Miguel de Tucumán`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    locale: "es_AR",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0b377f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR">
      <body className="min-h-dvh antialiased">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-amarillo focus:px-5 focus:py-3 focus:font-bold focus:text-ink"
        >
          Saltar al contenido
        </a>
        {children}
      </body>
    </html>
  );
}
