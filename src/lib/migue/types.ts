import { z } from "zod";
import type { DataMode } from "@/domain/schemas";

export const migueRequestSchema = z.object({
  message: z.string().trim().min(1).max(400),
});

export interface MigueCard {
  kind: "intervention" | "closure";
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
  "¿Qué cortes de tránsito hay hoy?",
  "¿Qué se hizo en Villa 9 de Julio?",
  "¿Qué se arregló en Av. Mate de Luna?",
  "¿Cómo hago un reclamo?",
];
