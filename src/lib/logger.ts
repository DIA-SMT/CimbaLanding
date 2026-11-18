/**
 * Logger mínimo que nunca registra datos de entrada del usuario ni secretos.
 * Sólo mensajes fijos y metadatos no sensibles.
 */
const SENSITIVE = /(token|authorization|password|secret|api[_-]?key|cookie)=?[^\s&]*/gi;

function clean(msg: string) {
  return msg.replace(SENSITIVE, "$1=[redactado]").slice(0, 500);
}

export const logger = {
  info: (msg: string) => console.info(`[cimba-ciudadano] ${clean(msg)}`),
  warn: (msg: string) => console.warn(`[cimba-ciudadano] ${clean(msg)}`),
  error: (msg: string, err?: unknown) =>
    console.error(
      `[cimba-ciudadano] ${clean(msg)}`,
      err instanceof Error ? clean(`${err.name}: ${err.message}`) : "",
    ),
};
