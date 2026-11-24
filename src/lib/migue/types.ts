import { z } from "zod";
import type { DataMode } from "@/domain/schemas";

/** Turnos anteriores de la conversación (los manda el navegador: sólo texto, acotado). */
export const migueTurnoSchema = z.object({
  rol: z.enum(["vecino", "migue"]),
  texto: z.string().trim().min(1).max(1500),
});
export type MigueTurno = z.infer<typeof migueTurnoSchema>;

export const migueRequestSchema = z.object({
  message: z.string().trim().min(1).max(400),
  historial: z.array(migueTurnoSchema).max(10).optional(),
});

export interface MigueCard {
  kind: "intervention";
  id: string;
  title: string;
  subtitle: string;
  badge: string;
}

export interface MigueReply {
  reply: string;
  cards: MigueCard[];
  links: { label: string; href: string }[];
  suggestions: string[];
  mode: DataMode;
}

export const MIGUE_STARTERS = [
  "¿Cómo vienen las reparaciones este año?",
  "¿Qué se hizo en Villa 9 de Julio?",
  "¿Qué se arregló en Av. Mate de Luna?",
  "¿Cómo hago un reclamo?",
];
