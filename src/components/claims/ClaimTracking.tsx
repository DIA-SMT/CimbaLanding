"use client";

import { useState } from "react";
import { Loader2, SearchCheck } from "lucide-react";

interface EstadoReclamo {
  id: number;
  tipo: string | null;
  fecha: string | null;
  direccion: string | null;
  estado: string | null;
}

/** Seguimiento de un reclamo propio en CiDiTuc (requiere Ciudad Digital). */
export function ClaimTracking() {
  const [numero, setNumero] = useState("");
  const [cargando, setCargando] = useState(false);
  const [dato, setDato] = useState<EstadoReclamo | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const consultar = async () => {
    if (!/^\d{1,9}$/.test(numero)) return setMensaje("Ingresá el número de reclamo (sólo números).");
    setCargando(true);
    setMensaje(null);
    setDato(null);
    try {
      const r = await fetch(`/api/reclamos/${numero}`, { cache: "no-store" });
      const body = await r.json().catch(() => null);
      if (!r.ok) throw new Error(body?.error ?? "No pudimos consultar el reclamo.");
      setDato(body.data as EstadoReclamo);
    } catch (e) {
      setMensaje((e as Error).message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="rounded-2xl bg-tono-azul p-4">
      <p className="flex items-center gap-2 font-bold text-ink">
        <SearchCheck className="size-5 text-tono-azul-fg" aria-hidden /> Seguí tu reclamo
      </p>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void consultar();
        }}
      >
        <label htmlFor="seg-num" className="sr-only">
          Número de reclamo
        </label>
        <input
          id="seg-num"
          inputMode="numeric"
          maxLength={9}
          value={numero}
          onChange={(e) => setNumero(e.target.value.replace(/\D/g, ""))}
          placeholder="N° de reclamo"
          className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-white px-3 text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button type="submit" disabled={cargando} className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 font-bold text-white hover:bg-institucional disabled:opacity-50">
          {cargando && <Loader2 className="size-4 animate-spin" aria-hidden />} Consultar
        </button>
      </form>
      <div aria-live="polite">
        {mensaje && <p className="mt-2 text-sm text-ink-soft">{mensaje}</p>}
        {dato && (
          <dl className="mt-3 grid gap-1 rounded-xl bg-white p-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-soft">Reclamo</dt>
              <dd className="font-bold text-ink">N° {dato.id}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-soft">Estado</dt>
              <dd className="font-bold text-ink">{dato.estado ?? "Sin estado informado"}</dd>
            </div>
            {dato.tipo && (
              <div className="flex justify-between gap-3">
                <dt className="text-ink-soft">Tipo</dt>
                <dd className="text-right text-ink">{dato.tipo}</dd>
              </div>
            )}
            {dato.direccion && (
              <div className="flex justify-between gap-3">
                <dt className="text-ink-soft">Lugar</dt>
                <dd className="text-right text-ink">{dato.direccion}</dd>
              </div>
            )}
            {dato.fecha && (
              <div className="flex justify-between gap-3">
                <dt className="text-ink-soft">Iniciado</dt>
                <dd className="text-ink">{dato.fecha}</dd>
              </div>
            )}
          </dl>
        )}
      </div>
      <p className="mt-2 text-xs text-ink-soft">Sólo podés ver tus propios reclamos, con tu cuenta de Ciudad Digital.</p>
    </div>
  );
}
