"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, FlaskConical, Loader2, LogIn, LogOut, ShieldCheck, TriangleAlert, UserRound } from "lucide-react";
import { TIPOS_RECLAMO } from "@/integrations/cidituc/catalogo";
import type { Punto } from "./LocationPicker";

const LocationPicker = dynamic(() => import("./LocationPicker"), {
  ssr: false,
  loading: () => <div className="skeleton h-64 w-full sm:h-72" />,
});

interface EstadoPortal {
  modo: "off" | "simulado" | "real";
  persona: { nombre: string } | null;
  ingreso: { portalUrl: string; ssoConfigurado: boolean; prueba: boolean };
  seguimiento: boolean;
}

interface Borrador {
  tipo: number | null;
  punto: Punto | null;
  direccion: string;
  referencia: string;
  detalle: string;
}

type Resultado =
  | { modo: "real"; idReclamo: number; barrio: string }
  | { modo: "simulado"; enviado: Record<string, unknown>; barrio: string };

const VACIO: Borrador = { tipo: null, punto: null, direccion: "", referencia: "", detalle: "" };
const CLAVE_BORRADOR = "cimba:borrador-reclamo";

function leerBorrador(): Borrador | null {
  try {
    const s = window.sessionStorage.getItem(CLAVE_BORRADOR);
    return s ? { ...VACIO, ...(JSON.parse(s) as Partial<Borrador>) } : null;
  } catch {
    return null;
  }
}
function guardarBorrador(b: Borrador | null) {
  try {
    if (b) window.sessionStorage.setItem(CLAVE_BORRADOR, JSON.stringify(b));
    else window.sessionStorage.removeItem(CLAVE_BORRADOR);
  } catch {
    /* sin almacenamiento: el borrador no sobrevive al ingreso, se vuelve a cargar */
  }
}

export function ClaimForm() {
  const [estado, setEstado] = useState<EstadoPortal | null>(null);
  const [b, setB] = useState<Borrador>(VACIO);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [errorIngreso, setErrorIngreso] = useState(false);

  const cargarEstado = useCallback(async () => {
    try {
      const r = await fetch("/api/reclamos", { cache: "no-store" });
      setEstado((await r.json()) as EstadoPortal);
    } catch {
      setEstado({ modo: "off", persona: null, ingreso: { portalUrl: "", ssoConfigurado: false, prueba: false }, seguimiento: false });
    }
  }, []);

  useEffect(() => {
    void cargarEstado();
    const borrador = leerBorrador();
    if (borrador) setB(borrador);
    setErrorIngreso(new URLSearchParams(window.location.search).get("cidi") === "error");
  }, [cargarEstado]);

  // El borrador se guarda mientras se completa: sobrevive al paso por Ciudad Digital.
  useEffect(() => {
    if (b !== VACIO) guardarBorrador(b);
  }, [b]);

  const set = <K extends keyof Borrador>(k: K, v: Borrador[K]) => setB((prev) => ({ ...prev, [k]: v }));

  const faltantes = useMemo(() => {
    const f: string[] = [];
    if (!b.tipo) f.push("el tipo de problema");
    if (!b.punto) f.push("la ubicación en el mapa");
    if (b.direccion.trim().length < 4) f.push("la dirección");
    if (b.detalle.trim().length < 10) f.push("una descripción (mínimo 10 caracteres)");
    return f;
  }, [b]);

  const enviar = async () => {
    if (!estado?.persona || faltantes.length || !b.punto) return;
    setEnviando(true);
    setError(null);
    try {
      const r = await fetch("/api/reclamos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: b.tipo,
          lat: b.punto.lat,
          lng: b.punto.lng,
          direccion: b.direccion,
          referencia: b.referencia || null,
          detalle: b.detalle,
        }),
      });
      const body = await r.json().catch(() => null);
      if (!r.ok || !body) throw new Error(body?.error ?? "No pudimos registrar el reclamo.");
      setResultado(body as Resultado);
      if (body.modo === "real") {
        guardarBorrador(null);
        setB(VACIO);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  const ingresarPrueba = async () => {
    await fetch("/api/auth/ciudad-digital/prueba", { method: "POST" });
    await cargarEstado();
  };
  const salir = async () => {
    await fetch("/api/auth/salir", { method: "POST" });
    await cargarEstado();
  };

  if (!estado) return <div className="skeleton h-[40rem] w-full !rounded-[1.6rem]" aria-label="Cargando formulario" />;

  const bloqueado = estado.modo === "off";

  return (
    <div className="rounded-[1.6rem] bg-white p-5 shadow-[var(--shadow-lift)] ring-1 ring-line/70 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-2xl font-extrabold text-ink">Hacé tu reclamo acá</h3>
          <p className="mt-1 text-ink-soft">Sin salir del portal. Se registra en Atención Ciudadana (CiDiTuc · 147).</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-tono-verde px-3 py-1.5 text-xs font-bold text-tono-verde-fg">
          <ShieldCheck className="size-4" aria-hidden /> Reclamo oficial CiDiTuc
        </span>
      </div>

      {estado.modo === "simulado" && (
        <p className="mt-4 flex items-start gap-2 rounded-2xl bg-tono-amarillo px-4 py-3 text-sm text-tono-amarillo-fg">
          <FlaskConical className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            <strong>Modo simulación.</strong> El reclamo se arma igual que en producción, pero no se envía a CiDiTuc: el alta desde el portal
            todavía no está habilitada por Atención Ciudadana.
          </span>
        </p>
      )}
      {bloqueado && (
        <p className="mt-4 flex items-start gap-2 rounded-2xl bg-canvas px-4 py-3 text-sm text-ink-soft">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          La recepción de reclamos desde este portal todavía no está habilitada. Mientras tanto podés reclamar llamando al 147.
        </p>
      )}

      <AnimatePresence mode="wait">
        {resultado ? (
          <motion.div key="ok" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
            {resultado.modo === "real" ? (
              <div className="rounded-2xl bg-tono-verde p-6 text-center">
                <CheckCircle2 className="mx-auto size-10 text-tono-verde-fg" aria-hidden />
                <p className="mt-2 text-xl font-extrabold text-ink">Reclamo N° {resultado.idReclamo} registrado</p>
                <p className="mt-1 text-ink-soft">
                  Quedó en Atención Ciudadana (CiDiTuc) a tu nombre, en {resultado.barrio}. Guardá el número para hacer el seguimiento. CIMBA lo
                  recibe automáticamente para organizar el trabajo.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl bg-tono-amarillo p-5">
                <p className="font-extrabold text-ink">Simulación completa: esto es lo que se enviaría a CiDiTuc</p>
                <dl className="mt-3 grid gap-1.5 text-sm">
                  {Object.entries(resultado.enviado).map(([k, v]) => (
                    <div key={k} className="grid grid-cols-[9rem_1fr] gap-2">
                      <dt className="font-mono text-xs text-ink-soft">{k}</dt>
                      <dd className="break-words text-ink">{String(v)}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 text-xs text-ink-soft">Barrio detectado: {resultado.barrio}. No se registró ningún reclamo.</p>
              </div>
            )}
            <button type="button" onClick={() => setResultado(null)} className="mt-4 font-bold text-primary hover:underline">
              Hacer otro reclamo
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={(e) => {
              e.preventDefault();
              void enviar();
            }}
            className="mt-6 space-y-7"
            aria-describedby="reclamo-ayuda"
          >
            <fieldset disabled={bloqueado}>
              <legend className="flex items-center gap-2 text-lg font-extrabold text-ink">
                <Paso n={1} /> ¿Qué problema es?
              </legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {TIPOS_RECLAMO.map((t) => (
                  <label
                    key={t.id}
                    className={`flex cursor-pointer gap-3 rounded-2xl border p-3.5 transition has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-primary ${
                      b.tipo === t.id ? "border-primary bg-tono-azul" : "border-line hover:border-primary/40"
                    }`}
                  >
                    <input type="radio" name="tipo" value={t.id} checked={b.tipo === t.id} onChange={() => set("tipo", t.id)} className="mt-1 size-4 accent-[#0066ff]" />
                    <span>
                      <span className="block font-bold text-ink">{t.nombre}</span>
                      <span className="block text-sm text-ink-soft">{t.ayuda}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset disabled={bloqueado}>
              <legend className="flex items-center gap-2 text-lg font-extrabold text-ink">
                <Paso n={2} /> ¿Dónde está?
              </legend>
              <div className="mt-3">
                <LocationPicker value={b.punto} onChange={(p) => set("punto", p)} />
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Campo label="Dirección (calle y altura)" htmlFor="rec-dir">
                  <input id="rec-dir" required maxLength={120} value={b.direccion} onChange={(e) => set("direccion", e.target.value)} placeholder="Ej.: Av. Mate de Luna 2100" className={inputCls} autoComplete="off" />
                </Campo>
                <Campo label="Referencia (opcional)" htmlFor="rec-ref">
                  <input id="rec-ref" maxLength={160} value={b.referencia} onChange={(e) => set("referencia", e.target.value)} placeholder="Ej.: frente a la plaza, esquina Laprida" className={inputCls} autoComplete="off" />
                </Campo>
              </div>
            </fieldset>

            <fieldset disabled={bloqueado}>
              <legend className="flex items-center gap-2 text-lg font-extrabold text-ink">
                <Paso n={3} /> Contanos qué pasa
              </legend>
              <textarea
                id="rec-detalle"
                required
                maxLength={500}
                rows={4}
                value={b.detalle}
                onChange={(e) => set("detalle", e.target.value)}
                placeholder="Ej.: Bache grande en la mano derecha, ocupa medio carril y junta agua cuando llueve."
                className={`${inputCls} mt-3 h-auto py-3`}
                aria-describedby="rec-detalle-ayuda"
              />
              <p id="rec-detalle-ayuda" className="mt-1 flex justify-between text-xs text-ink-soft">
                <span>No incluyas teléfono, DNI ni datos personales: ya los toma tu cuenta de Ciudad Digital.</span>
                <span>{b.detalle.length}/500</span>
              </p>
            </fieldset>

            <div>
              <p className="flex items-center gap-2 text-lg font-extrabold text-ink">
                <Paso n={4} /> Tu identidad
              </p>
              {estado.persona ? (
                <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl bg-tono-azul px-4 py-3">
                  <UserRound className="size-5 text-tono-azul-fg" aria-hidden />
                  <p className="text-ink">
                    Vas a reclamar como <strong>{estado.persona.nombre}</strong> · Ciudad Digital
                  </p>
                  <button type="button" onClick={salir} className="ml-auto inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline">
                    <LogOut className="size-4" aria-hidden /> Salir
                  </button>
                </div>
              ) : (
                <div className="mt-3 rounded-2xl border border-line p-4">
                  <p className="text-ink-soft">
                    El reclamo queda a tu nombre en CiDiTuc, como cuando reclamás al 147. Para eso ingresás una vez con tu cuenta de
                    Ciudad Digital y volvés acá con el reclamo tal como lo dejaste.
                  </p>
                  {errorIngreso && (
                    <p className="mt-2 text-sm font-semibold text-pendiente" role="alert">
                      No pudimos validar tu ingreso con Ciudad Digital. Probá de nuevo.
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {estado.ingreso.ssoConfigurado ? (
                      <a
                        href={estado.ingreso.portalUrl}
                        onClick={() => guardarBorrador(b)}
                        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 font-bold text-white hover:bg-institucional"
                      >
                        <LogIn className="size-4" aria-hidden /> Ingresar con Ciudad Digital
                      </a>
                    ) : (
                      <span className="inline-flex min-h-11 items-center gap-2 rounded-full bg-canvas px-5 text-sm font-semibold text-ink-soft">
                        <LogIn className="size-4" aria-hidden /> Ingreso con Ciudad Digital: pendiente de habilitación
                      </span>
                    )}
                    {estado.ingreso.prueba && (
                      <button type="button" onClick={ingresarPrueba} className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-dashed border-tono-amarillo-fg/40 px-5 text-sm font-bold text-tono-amarillo-fg">
                        <FlaskConical className="size-4" aria-hidden /> Usar persona de prueba (sólo desarrollo)
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {error && (
              <p className="flex items-start gap-2 rounded-2xl bg-pendiente-bg px-4 py-3 text-sm text-pendiente" role="alert">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                {error}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
              <button
                type="submit"
                disabled={bloqueado || enviando || !estado.persona || faltantes.length > 0}
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-amarillo px-7 font-bold text-ink shadow-[0_12px_26px_-12px_rgb(244_220_0/0.9)] transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {enviando && <Loader2 className="size-4 animate-spin" aria-hidden />}
                {estado.modo === "simulado" ? "Simular envío a CiDiTuc" : "Enviar reclamo"}
              </button>
              <p id="reclamo-ayuda" className="text-sm text-ink-soft" aria-live="polite">
                {faltantes.length ? `Falta: ${faltantes.join(", ")}.` : !estado.persona ? "Falta ingresar con Ciudad Digital." : "Todo listo."}
              </p>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

const inputCls =
  "h-11 w-full rounded-xl border border-line bg-white px-3 text-[0.95rem] text-ink placeholder:text-ink-soft/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-canvas";

function Paso({ n }: { n: number }) {
  return <span className="grid size-7 place-items-center rounded-full bg-institucional text-sm font-extrabold text-white">{n}</span>;
}

function Campo({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-bold text-ink">
        {label}
      </label>
      {children}
    </div>
  );
}
