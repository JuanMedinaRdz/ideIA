// Helpers puros de fecha — SIN dependencias server. Usables tanto desde
// Server Components como Client Components.

/** Primer instante del mes y primer instante del mes siguiente (UTC local). */
export function monthBounds(year: number, monthIndex0: number): { from: Date; to: Date } {
  const from = new Date(year, monthIndex0, 1, 0, 0, 0, 0);
  const to = new Date(year, monthIndex0 + 1, 1, 0, 0, 0, 0);
  return { from, to };
}

/**
 * Devuelve los 42 días que componen un grid mensual estándar (6 semanas).
 * Empieza por lunes — patrón europeo/MX, más natural que el domingo de EEUU.
 * Incluye padding del mes anterior y siguiente para que el grid siempre tenga
 * el mismo tamaño (sin saltos al cambiar entre meses con distinto número de
 * semanas).
 */
export function calendarGridDays(year: number, monthIndex0: number): Date[] {
  const firstOfMonth = new Date(year, monthIndex0, 1);
  // getDay(): 0 = domingo. Queremos semana empezando en lunes → ajustar.
  const weekdayMon = (firstOfMonth.getDay() + 6) % 7; // 0=Lun ... 6=Dom
  const start = new Date(year, monthIndex0, 1 - weekdayMon);

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    days.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }
  return days;
}
