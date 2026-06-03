"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MonthGrid } from "./month-grid";
import { AgendaSide } from "./agenda-side";
import type { Idea } from "@/features/ideas/types/idea";

/**
 * Vista combinada de calendario. Hace re-fetch al cambiar de mes (via
 * router.refresh con search params).
 *
 * Layout responsive:
 *  - Desktop: 2 cols (calendario izq, agenda der)
 *  - Mobile: stack vertical (calendario arriba, agenda abajo)
 */
export function CalendarView({
  events,
  initialYear,
  initialMonth,
}: {
  events: Idea[];
  initialYear: number;
  initialMonth: number;
}) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    if (today.getFullYear() === initialYear && today.getMonth() === initialMonth) {
      return today;
    }
    return new Date(initialYear, initialMonth, 1);
  });

  // Al cambiar de mes, navegamos a la URL con search params para que el
  // Server Component re-fetche los eventos del nuevo rango.
  useEffect(() => {
    const y = selectedDate.getFullYear();
    const m = selectedDate.getMonth();
    if (y !== initialYear || m !== initialMonth) {
      router.replace(`/calendar?y=${y}&m=${m}`);
    }
  }, [selectedDate, initialYear, initialMonth, router]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <MonthGrid
        events={events}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />
      <AgendaSide selectedDate={selectedDate} events={events} />
    </div>
  );
}
