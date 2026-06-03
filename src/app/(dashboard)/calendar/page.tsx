import { getEventsInRange, monthBounds, calendarGridDays } from "@/features/calendar/services/calendar.service";
import { CalendarView } from "@/features/calendar/components/calendar-view";

interface PageProps {
  searchParams: Promise<{ y?: string; m?: string }>;
}

/**
 * Calendario: muestra eventos del mes pedido (?y=2026&m=5 → junio 2026, 0-indexed).
 * Defaults: mes actual. Fetch incluye padding del grid (mes anterior y siguiente)
 * para que los días "fuera del mes" en el grid también muestren su badge si tienen evento.
 */
export default async function CalendarPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const now = new Date();
  const year = params.y ? Number(params.y) : now.getFullYear();
  const month = params.m !== undefined ? Number(params.m) : now.getMonth();

  // Rango del fetch = todas las celdas del grid (42 días, ~6 semanas), no solo
  // el mes natural. Así los puntos de evento aparecen en días "vecinos" también.
  const gridDays = calendarGridDays(year, month);
  const from = gridDays[0];
  const to = new Date(gridDays[gridDays.length - 1]);
  to.setDate(to.getDate() + 1); // semi-abierto a la derecha

  const events = await getEventsInRange(from, to);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Calendario</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Eventos detectados automáticamente por la IA o agendados a mano.
        </p>
      </header>
      <CalendarView events={events} initialYear={year} initialMonth={month} />
    </div>
  );
}
