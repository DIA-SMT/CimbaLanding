"use client";

import { useId, useMemo, useRef, useState } from "react";
import { MapPin, Search, Route } from "lucide-react";
import { normalize } from "@/lib/format";
import type { Suggestion } from "@/lib/suggestions";

export type { Suggestion };


/**
 * Buscador de calles y barrios con patrón combobox accesible (ARIA 1.2).
 * Las sugerencias provienen exclusivamente de datos públicos ya publicados.
 */
export function PlaceSearch({
  suggestions,
  onSearch,
  placeholder = "Buscá una calle o un barrio",
  size = "lg",
  label = "Buscar calle o barrio",
}: {
  suggestions: Suggestion[];
  onSearch: (value: string, s?: Suggestion) => void;
  placeholder?: string;
  size?: "lg" | "md";
  label?: string;
}) {
  const id = useId();
  const listId = `${id}-list`;
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = normalize(value);
    if (q.length < 2) return [];
    return suggestions.filter((s) => normalize(s.label).includes(q)).slice(0, 7);
  }, [value, suggestions]);

  const submit = (s?: Suggestion) => {
    const v = s ? s.value : value.trim();
    if (s) setValue(s.label);
    setOpen(false);
    setActiveIdx(-1);
    onSearch(v, s);
  };

  const big = size === "lg";

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        submit(activeIdx >= 0 ? results[activeIdx] : undefined);
      }}
      className="relative w-full"
    >
      <label htmlFor={`${id}-input`} className="sr-only">
        {label}
      </label>
      <div
        className={`flex items-center gap-2 rounded-full bg-white pl-4 shadow-[0_14px_40px_-16px_rgb(4_20_60/0.55)] ring-1 ring-black/5 focus-within:ring-3 focus-within:ring-amarillo ${
          big ? "h-14 pr-1.5" : "h-12 pr-1"
        }`}
      >
        <Search className="size-5 shrink-0 text-ink-soft" aria-hidden />
        <input
          ref={inputRef}
          id={`${id}-input`}
          type="text"
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeIdx >= 0 ? `${id}-opt-${activeIdx}` : undefined}
          autoComplete="off"
          maxLength={80}
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
            setActiveIdx(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActiveIdx((i) => Math.min(i + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIdx((i) => Math.max(i - 1, -1));
            } else if (e.key === "Escape") {
              setOpen(false);
              setActiveIdx(-1);
            }
          }}
          className="min-w-0 flex-1 bg-transparent text-[1rem] text-ink placeholder:text-ink-soft/80 focus:outline-none"
          style={{ outline: "none" }}
        />
        <button
          type="submit"
          className={`shrink-0 rounded-full bg-primary font-bold text-white transition hover:bg-institucional ${
            big ? "h-11 px-5" : "h-10 px-4"
          }`}
        >
          Buscar
        </button>
      </div>

      {open && results.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Sugerencias"
          className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-line bg-white py-1.5 text-ink shadow-[var(--shadow-lift)]"
        >
          {results.map((s, i) => (
            <li
              key={`${s.kind}-${s.value}`}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === activeIdx}
              onMouseDown={(e) => {
                e.preventDefault();
                submit(s);
              }}
              onMouseEnter={() => setActiveIdx(i)}
              className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 ${i === activeIdx ? "bg-tono-azul" : ""}`}
            >
              {s.kind === "barrio" ? (
                <MapPin className="size-4 text-tono-violeta-fg" aria-hidden />
              ) : (
                <Route className="size-4 text-primary" aria-hidden />
              )}
              <span className="font-semibold">{s.label}</span>
              <span className="ml-auto text-xs font-medium text-ink-soft">{s.kind === "barrio" ? "Barrio" : "Calle"}</span>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
