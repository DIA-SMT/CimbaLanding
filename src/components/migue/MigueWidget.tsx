"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Construction, Loader2, MapPin, SendHorizonal, TriangleAlert, X } from "lucide-react";
import { siteConfig } from "@/config/site";
import { goToMap } from "@/hooks/useExplorer";
import { MIGUE_STARTERS, type MigueCard, type MigueReply } from "@/lib/migue/types";
import { MigueAvatar } from "./MigueAvatar";
import { MIGUE_OPEN_EVENT } from "./events";

type Msg =
  | { id: number; role: "user"; text: string }
  | { id: number; role: "migue"; data: Pick<MigueReply, "reply" | "cards" | "links" | "suggestions"> }
  | { id: number; role: "error"; text: string };

let seq = 0;

const WELCOME: Msg = {
  id: seq++,
  role: "migue",
  data: {
    reply:
      "¡Hola! Soy Migue, el asistente de la Municipalidad. Puedo ayudarte a buscar reparaciones por calle o barrio, consultar cortes de tránsito y orientarte para hacer un reclamo.",
    cards: [],
    links: [],
    suggestions: MIGUE_STARTERS,
  },
};

/** Navega dentro de la página interpretando enlaces internos del asistente (#mapa?q=…). */
function followLink(href: string, close: () => void) {
  if (href.startsWith("#mapa?")) {
    const p = new URLSearchParams(href.slice(6));
    close();
    goToMap({ query: p.get("q") ?? "", neighborhoodId: p.get("barrio"), selectedId: null });
    return true;
  }
  if (href.startsWith("#")) {
    close();
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    return true;
  }
  return false;
}

export function MigueWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    launcherRef.current?.focus();
  }, []);

  const send = useCallback(
    async (text: string) => {
      const message = text.trim().slice(0, 400);
      if (!message || busy) return;
      setMessages((m) => [...m, { id: seq++, role: "user", text: message }]);
      setInput("");
      setBusy(true);
      try {
        const res = await fetch("/api/migue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        });
        const body = await res.json().catch(() => null);
        if (!res.ok || !body) throw new Error(body?.error?.message ?? "No pude responder en este momento.");
        setMessages((m) => [...m, { id: seq++, role: "migue", data: body as MigueReply }]);
      } catch (e) {
        setMessages((m) => [...m, { id: seq++, role: "error", text: (e as Error).message }]);
      } finally {
        setBusy(false);
      }
    },
    [busy],
  );

  useEffect(() => {
    const onOpen = (e: Event) => {
      setOpen(true);
      const prompt = (e as CustomEvent<{ prompt?: string }>).detail?.prompt;
      if (prompt) void send(prompt);
    };
    window.addEventListener(MIGUE_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(MIGUE_OPEN_EVENT, onOpen);
  }, [send]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const openCard = (c: MigueCard) => {
    close();
    goToMap({ selectedId: c.id, query: "", neighborhoodId: null });
  };

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            ref={launcherRef}
            key="launcher"
            type="button"
            onClick={() => setOpen(true)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-4 right-4 z-40 flex items-center gap-2.5 rounded-full bg-white py-1.5 pl-1.5 pr-5 font-bold text-ink shadow-[0_18px_40px_-14px_rgb(16_43_87/0.5)] ring-1 ring-line transition hover:-translate-y-0.5 sm:bottom-6 sm:right-6"
            aria-haspopup="dialog"
            data-migue-launcher
          >
            <MigueAvatar size={44} ring={false} />
            <span>¿Te ayudo?</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            role="dialog"
            aria-labelledby="migue-title"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[60] flex flex-col overflow-hidden bg-white sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[min(640px,calc(100dvh-7rem))] sm:w-[400px] sm:rounded-[1.6rem] sm:shadow-[0_30px_80px_-24px_rgb(16_43_87/0.55)] sm:ring-1 sm:ring-line"
          >
            <header className="on-dark relative flex items-center gap-3 bg-gradient-to-br from-institucional via-[#0a4aa6] to-primary px-4 pb-5 pt-4 text-white">
              <MigueAvatar size={46} />
              <div className="min-w-0">
                <h2 id="migue-title" className="text-lg font-extrabold leading-tight">
                  {siteConfig.migue.displayName}
                </h2>
                <p className="text-sm text-white/80">{siteConfig.migue.role} · Versión preliminar</p>
              </div>
              <button
                type="button"
                onClick={close}
                className="ml-auto grid size-10 place-items-center rounded-full bg-white/10 hover:bg-white/20"
              >
                <X className="size-5" aria-hidden />
                <span className="sr-only">Cerrar asistente</span>
              </button>
              <svg aria-hidden className="absolute inset-x-0 -bottom-px h-3 w-full" viewBox="0 0 400 12" preserveAspectRatio="none">
                <path d="M0 6c120 6 280 6 400-4v10H0z" fill="#ffdf00" />
                <path d="M0 9c120 4 280 4 400-4v7H0z" fill="#fff" />
              </svg>
            </header>

            <div ref={logRef} role="log" aria-live="polite" aria-busy={busy} className="flex-1 space-y-3 overflow-y-auto bg-canvas px-4 py-4">
              {messages.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} className="flex justify-end">
                    <p className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-[0.95rem] text-white">{m.text}</p>
                  </div>
                ) : m.role === "error" ? (
                  <p key={m.id} className="flex items-start gap-2 rounded-2xl bg-corte-bg px-4 py-3 text-sm text-corte">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                    {m.text}
                  </p>
                ) : (
                  <div key={m.id} className="flex gap-2">
                    <MigueAvatar size={30} ring={false} />
                    <div className="min-w-0 max-w-[88%] space-y-2">
                      <p className="whitespace-pre-line rounded-2xl rounded-tl-md bg-white px-4 py-3 text-[0.95rem] leading-relaxed text-ink shadow-sm">
                        {m.data.reply}
                      </p>
                      {m.data.cards.map((c) => (
                        <button
                          key={`${m.id}-${c.id}`}
                          type="button"
                          onClick={() => openCard(c)}
                          className="flex w-full items-start gap-3 rounded-2xl border border-line bg-white p-3 text-left transition hover:border-primary/40 hover:shadow-[var(--shadow-soft)]"
                        >
                          <span
                            className={`grid size-9 shrink-0 place-items-center rounded-xl ${
                              c.kind === "closure" ? "bg-corte-bg text-corte" : "bg-tono-azul text-primary"
                            }`}
                          >
                            {c.kind === "closure" ? <Construction className="size-4" aria-hidden /> : <MapPin className="size-4" aria-hidden />}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-[0.92rem] font-bold text-ink">{c.title}</span>
                            <span className="block text-xs leading-snug text-ink-soft">{c.subtitle}</span>
                            <span className="mt-1 inline-block rounded-full bg-canvas px-2 py-0.5 text-[0.7rem] font-bold text-ink">{c.badge}</span>
                          </span>
                        </button>
                      ))}
                      {m.data.links.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {m.data.links.map((l) => (
                            <a
                              key={l.href}
                              href={l.href}
                              onClick={(e) => {
                                if (followLink(l.href, close)) e.preventDefault();
                              }}
                              {...(l.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                              className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-primary ring-1 ring-line hover:ring-primary/40"
                            >
                              {l.label}
                              <ArrowUpRight className="size-3.5" aria-hidden />
                            </a>
                          ))}
                        </div>
                      )}
                      {m.data.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {m.data.suggestions.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => send(s)}
                              disabled={busy}
                              className="rounded-full border border-primary/25 bg-white px-3 py-1.5 text-sm font-semibold text-primary transition hover:bg-tono-azul disabled:opacity-50"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ),
              )}
              {busy && (
                <p className="flex items-center gap-2 pl-10 text-sm text-ink-soft">
                  <Loader2 className="size-4 animate-spin" aria-hidden /> Migue está buscando…
                </p>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
              className="border-t border-line bg-white p-3"
            >
              <div className="flex items-end gap-2 rounded-2xl bg-canvas p-1.5 pl-4 ring-1 ring-line focus-within:ring-2 focus-within:ring-primary">
                <label htmlFor="migue-input" className="sr-only">
                  Escribí tu consulta
                </label>
                <textarea
                  id="migue-input"
                  ref={inputRef}
                  rows={1}
                  maxLength={400}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void send(input);
                    }
                  }}
                  placeholder="Escribí tu consulta…"
                  className="max-h-28 min-h-10 flex-1 resize-none bg-transparent py-2 text-[0.95rem] text-ink placeholder:text-ink-soft/80 focus:outline-none"
                  style={{ outline: "none" }}
                />
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-white transition hover:bg-institucional disabled:opacity-40"
                >
                  <SendHorizonal className="size-[18px]" aria-hidden />
                  <span className="sr-only">Enviar</span>
                </button>
              </div>
              <p className="mt-2 px-1 text-[0.72rem] leading-snug text-ink-soft">
                Migue responde sólo con información pública publicada. No compartas datos personales.
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
