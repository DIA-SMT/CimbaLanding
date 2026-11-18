"use client";

export const MIGUE_OPEN_EVENT = "migue:open";

/** Abre el asistente desde cualquier parte de la página, opcionalmente con una pregunta. */
export function openMigue(prompt?: string) {
  window.dispatchEvent(new CustomEvent<{ prompt?: string }>(MIGUE_OPEN_EVENT, { detail: { prompt } }));
}
