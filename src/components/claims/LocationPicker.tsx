"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Crosshair, Loader2, MapPinned } from "lucide-react";
import { siteConfig } from "@/config/site";

export interface Punto {
  lat: number;
  lng: number;
}

/**
 * Selector de ubicación: tocar el mapa, usar la ubicación del dispositivo o
 * marcar el centro del mapa (alternativa accesible con teclado). La ubicación
 * sólo se usa para el reclamo.
 */
export default function LocationPicker({ value, onChange }: { value: Punto | null; onChange: (p: Punto) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [geo, setGeo] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    if (!ref.current) return;
    const map = new maplibregl.Map({
      container: ref.current,
      style: siteConfig.map.styleUrl,
      center: [value?.lng ?? siteConfig.map.center.lng, value?.lat ?? siteConfig.map.center.lat],
      zoom: value ? 16 : 13,
      maxBounds: siteConfig.map.maxBounds,
      attributionControl: { compact: true },
      cooperativeGestures: true,
      dragRotate: false,
      locale: {
        "CooperativeGesturesHandler.WindowsHelpText": "Usá Ctrl + scroll para hacer zoom",
        "CooperativeGesturesHandler.MacHelpText": "Usá ⌘ + scroll para hacer zoom",
        "CooperativeGesturesHandler.MobileHelpText": "Usá dos dedos para mover el mapa",
        "NavigationControl.ZoomIn": "Acercar",
        "NavigationControl.ZoomOut": "Alejar",
      },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.getCanvas().setAttribute("aria-label", "Mapa para marcar la ubicación del problema");
    map.on("click", (e) => onChangeRef.current({ lat: e.lngLat.lat, lng: e.lngLat.lng }));
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!value) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }
    if (!markerRef.current) {
      markerRef.current = new maplibregl.Marker({ color: "#0066ff", draggable: true })
        .setLngLat([value.lng, value.lat])
        .addTo(map);
      markerRef.current.on("dragend", () => {
        const p = markerRef.current!.getLngLat();
        onChangeRef.current({ lat: p.lat, lng: p.lng });
      });
    } else {
      markerRef.current.setLngLat([value.lng, value.lat]);
    }
  }, [value]);

  const locate = () => {
    if (!("geolocation" in navigator)) return setGeo("error");
    setGeo("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setGeo("idle");
        onChange(p);
        mapRef.current?.flyTo({ center: [p.lng, p.lat], zoom: 17, essential: true });
      },
      () => setGeo("error"),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  };

  const markCenter = () => {
    const c = mapRef.current?.getCenter();
    if (c) onChange({ lat: c.lat, lng: c.lng });
  };

  return (
    <div>
      <div className="relative h-64 overflow-hidden rounded-2xl ring-1 ring-line sm:h-72">
        <div className="absolute inset-0">
          <div ref={ref} className="h-full w-full" />
        </div>
        {!value && (
          <p className="pointer-events-none absolute inset-x-3 bottom-3 rounded-xl bg-white/95 px-3 py-2 text-center text-sm font-semibold text-ink shadow">
            Tocá el mapa donde está el problema
          </p>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" onClick={locate} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-tono-azul px-4 text-sm font-bold text-tono-azul-fg hover:bg-primary hover:text-white">
          {geo === "loading" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Crosshair className="size-4" aria-hidden />}
          Usar mi ubicación
        </button>
        <button type="button" onClick={markCenter} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line px-4 text-sm font-bold text-ink hover:border-primary/40">
          <MapPinned className="size-4" aria-hidden />
          Marcar el centro del mapa
        </button>
      </div>
      <p className="mt-1.5 text-xs text-ink-soft" role="status">
        {geo === "error"
          ? "No pudimos acceder a tu ubicación. Marcala tocando el mapa."
          : value
            ? `Ubicación marcada (${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}). Podés arrastrar el pin para ajustarla.`
            : "Tu ubicación sólo se usa para este reclamo."}
      </p>
    </div>
  );
}
