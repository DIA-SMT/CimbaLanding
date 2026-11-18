"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, { type GeoJSONSource, type MapLayerMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapOff } from "./MapOff";
import { siteConfig } from "@/config/site";
import { STATUS_META } from "@/domain/labels";
import type { Intervention, TrafficClosure } from "@/domain/schemas";
import { prefersReducedMotion } from "@/hooks/useExplorer";

export interface MapFocus {
  lat: number;
  lng: number;
  zoom?: number;
  key: number;
}

interface Props {
  interventions: Intervention[];
  closures: TrafficClosure[];
  showClosures: boolean;
  selectedId: string | null;
  focus: MapFocus | null;
  userLocation: { lat: number; lng: number } | null;
  onSelect: (id: string | null) => void;
}

const statusColor: maplibregl.ExpressionSpecification = [
  "match",
  ["get", "status"],
  "finalizado",
  STATUS_META.finalizado.color,
  "en_ejecucion",
  STATUS_META.en_ejecucion.color,
  "programado",
  STATUS_META.programado.color,
  STATUS_META.pendiente.color,
];

function toPoints(items: Intervention[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: items.map((i) => ({
      type: "Feature",
      id: i.id,
      properties: { id: i.id, status: i.status },
      geometry: { type: "Point", coordinates: [i.location.lng, i.location.lat] },
    })),
  };
}

function toLines(items: TrafficClosure[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: items.flatMap((c) => {
      const i = Math.floor((c.path.length - 1) / 2);
      const [a, b] = [c.path[i], c.path[i + 1]];
      const center: [number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      return [
        { type: "Feature", properties: { id: c.id, status: c.status }, geometry: { type: "LineString", coordinates: c.path } },
        { type: "Feature", properties: { id: c.id, status: c.status, kind: "pin" }, geometry: { type: "Point", coordinates: center } },
      ];
    }),
  };
}

/**
 * Mapa MapLibre con capa de intervenciones agrupadas (clusters nativos) y una
 * capa diferenciada de cortes de tránsito.
 */
export default function InterventionsMap({ interventions, closures, showClosures, selectedId, focus, userLocation, onSelect }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const userMarker = useRef<maplibregl.Marker | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // Inicialización (una sola vez)
  useEffect(() => {
    if (!ref.current) return;
    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: ref.current,
        style: siteConfig.map.styleUrl,
        center: [siteConfig.map.center.lng, siteConfig.map.center.lat],
        zoom: siteConfig.map.zoom,
        maxBounds: siteConfig.map.maxBounds,
        attributionControl: { compact: true },
        cooperativeGestures: true,
        dragRotate: false,
        pitchWithRotate: false,
        locale: {
          "CooperativeGesturesHandler.WindowsHelpText": "Usá Ctrl + scroll para hacer zoom en el mapa",
          "CooperativeGesturesHandler.MacHelpText": "Usá ⌘ + scroll para hacer zoom en el mapa",
          "CooperativeGesturesHandler.MobileHelpText": "Usá dos dedos para mover el mapa",
          "NavigationControl.ZoomIn": "Acercar",
          "NavigationControl.ZoomOut": "Alejar",
          "NavigationControl.ResetBearing": "Restablecer orientación",
        },
      });
    } catch {
      setFailed(true);
      return;
    }
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.getCanvas().setAttribute("aria-label", "Mapa de intervenciones y cortes de tránsito de San Miguel de Tucumán");
    map.on("error", (e) => {
      if (!map.isStyleLoaded() && (e.error as { status?: number })?.status) setFailed(true);
    });

    map.on("load", () => {
      map.addSource("interventions", {
        type: "geojson",
        data: toPoints([]),
        cluster: true,
        clusterRadius: 46,
        clusterMaxZoom: 15,
        promoteId: "id",
      });
      map.addSource("closures", { type: "geojson", data: toLines([]) });

      // Cortes (debajo de los marcadores)
      map.addLayer({
        id: "closures-casing",
        type: "line",
        source: "closures",
        filter: ["==", ["geometry-type"], "LineString"],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#ffffff", "line-width": ["interpolate", ["linear"], ["zoom"], 12, 6, 17, 14] },
      });
      map.addLayer({
        id: "closures-line",
        type: "line",
        source: "closures",
        filter: ["==", ["geometry-type"], "LineString"],
        layout: { "line-cap": "butt", "line-join": "round" },
        paint: {
          "line-color": ["match", ["get", "status"], "vigente", "#7c3aed", "#a78bfa"],
          "line-width": ["interpolate", ["linear"], ["zoom"], 12, 3.5, 17, 9],
          "line-dasharray": [1.6, 1],
        },
      });
      map.addLayer({
        id: "closures-pin",
        type: "circle",
        source: "closures",
        filter: ["==", ["get", "kind"], "pin"],
        paint: {
          "circle-radius": 9,
          "circle-color": ["match", ["get", "status"], "vigente", "#7c3aed", "#a78bfa"],
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 3,
        },
      });

      // Clusters
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "interventions",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#0b377f",
          "circle-opacity": 0.92,
          "circle-radius": ["step", ["get", "point_count"], 17, 10, 22, 30, 28],
          "circle-stroke-color": "#36b3ff",
          "circle-stroke-width": 4,
          "circle-stroke-opacity": 0.55,
        },
      });
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "interventions",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-font": ["Noto Sans Bold"],
          "text-size": 13,
          "text-allow-overlap": true,
        },
        paint: { "text-color": "#ffffff" },
      });

      // Puntos individuales
      map.addLayer({
        id: "points-halo",
        type: "circle",
        source: "interventions",
        filter: ["all", ["!", ["has", "point_count"]], ["boolean", ["feature-state", "selected"], false]],
        paint: { "circle-radius": 18, "circle-color": statusColor, "circle-opacity": 0.25 },
      });
      map.addLayer({
        id: "points",
        type: "circle",
        source: "interventions",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": statusColor,
          "circle-radius": ["case", ["boolean", ["feature-state", "selected"], false], 10, 7.5],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2.5,
          "circle-radius-transition": { duration: 250 },
        },
      });

      map.on("click", "clusters", async (e: MapLayerMouseEvent) => {
        const f = e.features?.[0];
        if (!f) return;
        const src = map.getSource("interventions") as GeoJSONSource;
        const zoom = await src.getClusterExpansionZoom(f.properties.cluster_id as number);
        map.easeTo({ center: (f.geometry as GeoJSON.Point).coordinates as [number, number], zoom, duration: prefersReducedMotion() ? 0 : 500 });
      });
      const pick = (e: MapLayerMouseEvent) => {
        const id = e.features?.[0]?.properties?.id as string | undefined;
        if (id) onSelectRef.current(id);
      };
      map.on("click", "points", pick);
      map.on("click", "closures-pin", pick);
      map.on("click", "closures-line", pick);
      for (const layer of ["clusters", "points", "closures-pin", "closures-line"]) {
        map.on("mouseenter", layer, () => (map.getCanvas().style.cursor = "pointer"));
        map.on("mouseleave", layer, () => (map.getCanvas().style.cursor = ""));
      }
      setReady(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Datos de intervenciones
  useEffect(() => {
    if (!ready) return;
    (mapRef.current?.getSource("interventions") as GeoJSONSource | undefined)?.setData(toPoints(interventions));
  }, [ready, interventions]);

  // Cortes
  useEffect(() => {
    if (!ready) return;
    (mapRef.current?.getSource("closures") as GeoJSONSource | undefined)?.setData(toLines(showClosures ? closures : []));
  }, [ready, closures, showClosures]);

  // Selección
  const prevSel = useRef<string | null>(null);
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    if (prevSel.current) map.setFeatureState({ source: "interventions", id: prevSel.current }, { selected: false });
    if (selectedId) map.setFeatureState({ source: "interventions", id: selectedId }, { selected: true });
    prevSel.current = selectedId;
  }, [ready, selectedId]);

  // Enfoque
  useEffect(() => {
    if (!ready || !focus) return;
    const map = mapRef.current!;
    // En móvil la ficha (bottom sheet) cubre la mitad inferior: se desplaza el centro hacia arriba.
    const bottom = window.innerWidth < 1024 ? map.getContainer().clientHeight * 0.45 : 0;
    const target = {
      center: [focus.lng, focus.lat] as [number, number],
      zoom: focus.zoom ?? Math.max(map.getZoom(), 16),
      padding: { top: 0, left: 0, right: 0, bottom },
    };
    if (prefersReducedMotion()) map.jumpTo(target);
    else map.flyTo({ ...target, speed: 1.4, curve: 1.3, essential: true });
  }, [ready, focus]);

  // Ubicación del vecino (sólo en el navegador; no se envía a ningún servidor)
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    userMarker.current?.remove();
    userMarker.current = null;
    if (userLocation) {
      const el = document.createElement("span");
      el.className = "block size-5 rounded-full border-[3px] border-white bg-primary shadow-[0_0_0_8px_rgb(8_118_236/0.25)]";
      el.setAttribute("aria-label", "Tu ubicación");
      userMarker.current = new maplibregl.Marker({ element: el }).setLngLat([userLocation.lng, userLocation.lat]).addTo(map);
    }
  }, [ready, userLocation]);

  if (failed) return <MapOff />;

  return (
    <>
      {/* MapLibre fuerza position:relative en el contenedor: se envuelve para ocupar todo el espacio. */}
      <div className="absolute inset-0">
        <div ref={ref} className="h-full w-full" />
      </div>
      {!ready && <div className="skeleton absolute inset-0 !rounded-none" aria-label="Cargando mapa" />}
    </>
  );
}
