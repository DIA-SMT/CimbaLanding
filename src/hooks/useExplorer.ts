"use client";

import { useSyncExternalStore } from "react";

/**
 * Estado compartido mínimo entre secciones (buscador del hero, mapa, Mi barrio,
 * Migue). Evita sumar una librería de estado para tres campos.
 */
export interface ExplorerState {
  query: string;
  neighborhoodId: string | null;
  selectedId: string | null;
  /** Se incrementa en cada pedido explícito para que el mapa reaccione aunque el valor no cambie. */
  nonce: number;
}

let state: ExplorerState = { query: "", neighborhoodId: null, selectedId: null, nonce: 0 };
const listeners = new Set<() => void>();

const SERVER_STATE: ExplorerState = state;

export const explorer = {
  get: () => state,
  set(patch: Partial<ExplorerState>) {
    state = { ...state, ...patch, nonce: state.nonce + 1 };
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useExplorer(): ExplorerState {
  return useSyncExternalStore(explorer.subscribe, explorer.get, () => SERVER_STATE);
}

/** Lleva al mapa con un filtro y/o una ficha seleccionada. */
export function goToMap(patch: Partial<Omit<ExplorerState, "nonce">>) {
  explorer.set(patch);
  document.getElementById("mapa")?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
}

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
