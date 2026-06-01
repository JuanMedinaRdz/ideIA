/**
 * Formato relativo en español, sin librerías externas (Intl.RelativeTimeFormat
 * va integrado en V8). Usar este helper en cualquier sitio donde mostremos
 * "hace X minutos" — así si después cambiamos la lógica (e.g. "ayer a las 14:30"),
 * lo cambiamos en un solo lugar.
 */
const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffSec = Math.round(diffMs / 1000);

  if (diffSec < 60) return rtf.format(-diffSec, "second");
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return rtf.format(-diffMin, "minute");
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return rtf.format(-diffHr, "hour");
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 30) return rtf.format(-diffDay, "day");
  const diffMonth = Math.round(diffDay / 30);
  return rtf.format(-diffMonth, "month");
}
