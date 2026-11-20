import "server-only";

import { request } from "node:https";
import { rootCertificates } from "node:tls";
import { INTERMEDIO_SECTIGO } from "./intermedio-sectigo";

/**
 * Cliente HTTPS para los backends municipales de *.smt.gob.ar (Atención
 * Ciudadana / CIDITUC y Ciudad Digital).
 *
 * `fetch` no alcanza: esos servidores no envían el certificado intermedio y
 * Node rechaza la conexión. Se suma el intermedio a las CA del sistema, sin
 * desactivar ninguna verificación (mismo criterio que CIMBA).
 */
const CA = [...rootCertificates, INTERMEDIO_SECTIGO];

export interface RespuestaSmt<T> {
  status: number;
  body: T | null;
}

export function requestSmt<T>(
  url: URL,
  opts: { method: "GET" | "POST"; body?: unknown; headers?: Record<string, string>; timeoutMs?: number },
): Promise<RespuestaSmt<T>> {
  if (url.protocol !== "https:") return Promise.reject(new Error("Sólo HTTPS"));
  const datos = opts.body === undefined ? null : JSON.stringify(opts.body);
  const timeoutMs = opts.timeoutMs ?? 15_000;
  return new Promise((resolve, reject) => {
    const req = request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: opts.method,
        ca: CA,
        headers: {
          accept: "application/json",
          ...(datos ? { "content-type": "application/json", "content-length": Buffer.byteLength(datos) } : {}),
          ...opts.headers,
        },
        timeout: timeoutMs,
      },
      (res) => {
        const trozos: Buffer[] = [];
        let total = 0;
        res.on("data", (t: Buffer) => {
          total += t.length;
          if (total > 2_000_000) req.destroy(new Error("Respuesta demasiado grande"));
          else trozos.push(t);
        });
        res.on("end", () => {
          const texto = Buffer.concat(trozos).toString("utf8");
          let body: T | null = null;
          try {
            body = texto ? (JSON.parse(texto) as T) : null;
          } catch {
            body = null;
          }
          resolve({ status: res.statusCode ?? 0, body });
        });
      },
    );
    req.on("timeout", () => req.destroy(new Error(`Tiempo de espera agotado (${timeoutMs} ms)`)));
    req.on("error", reject);
    if (datos) req.write(datos);
    req.end();
  });
}

const TIPOS_IMAGEN = /^image\/(jpeg|png|webp|gif|avif)$/;

/**
 * Descarga una imagen de un servidor municipal con la misma cadena de
 * certificados. Sólo devuelve imágenes (por tipo declarado) de hasta `maxBytes`.
 */
export function descargarImagenSmt(
  url: URL,
  { timeoutMs = 10_000, maxBytes = 8_000_000 }: { timeoutMs?: number; maxBytes?: number } = {},
): Promise<{ status: number; tipo: string | null; cuerpo: Buffer | null }> {
  if (url.protocol !== "https:") return Promise.reject(new Error("Sólo HTTPS"));
  return new Promise((resolve, reject) => {
    const req = request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: "GET",
        ca: CA,
        headers: { accept: "image/*" },
        timeout: timeoutMs,
      },
      (res) => {
        const status = res.statusCode ?? 0;
        const tipo = (res.headers["content-type"] ?? "").split(";")[0]!.trim().toLowerCase();
        if (status !== 200 || !TIPOS_IMAGEN.test(tipo)) {
          res.resume();
          resolve({ status: status === 200 ? 415 : status, tipo: null, cuerpo: null });
          return;
        }
        const trozos: Buffer[] = [];
        let total = 0;
        res.on("data", (t: Buffer) => {
          total += t.length;
          if (total > maxBytes) req.destroy(new Error("Imagen demasiado grande"));
          else trozos.push(t);
        });
        res.on("end", () => resolve({ status, tipo, cuerpo: Buffer.concat(trozos) }));
      },
    );
    req.on("timeout", () => req.destroy(new Error(`Tiempo de espera agotado (${timeoutMs} ms)`)));
    req.on("error", reject);
    req.end();
  });
}
