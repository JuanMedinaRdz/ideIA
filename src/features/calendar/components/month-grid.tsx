"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { calendarGridDays } from "../lib/date-helpers";
import type { Idea } from "@/features/ideas/types/idea";

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];
const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const TZ = "America/Mexico_City";

/**
 * Grid mensual con navegación de meses y selección de día.
 *
 * Animaciones estilo Emil Kowalski:
 *  - Slide horizontal con AnimatePresence al cambiar mes (direction-aware).
 *  - Spring physics (stiffness 380, damping 30) — snappy pero no bouncy.
 *  - `layout` prop en el highlight del día seleccionado → transición fluida
 *    cuando saltas de un día a otro.
 *  - Todo se desactiva si prefers-reduced-motion.
 */
export function MonthGrid({
  events,
  selectedDate,
  onSelectDate,
  onMonthChange,
}: {
  events: Idea[];
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  onMonthChange?: (year: number, monthIndex0: number) => void;
}) {
  const reduce = useReducedMotion();
  const [direction, setDirection] = useState(0);

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const days = calendarGridDays(year, month);

  // Map yyyy-mm-dd → cantidad de eventos en ese día. Para mostrar puntos.
  const eventCountByDay = new Map<string, number>();
  events.forEach((e) => {
    if (!e.eventAt) return;
    const key = new Date(e.eventAt).toLocaleDateString("es-MX", {
      timeZone: TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    eventCountByDay.set(key, (eventCountByDay.get(key) ?? 0) + 1);
  });

  function dayKey(d: Date) {
    return d.toLocaleDateString("es-MX", {
      timeZone: TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  const todayKey = dayKey(new Date());
  const selectedKey = dayKey(selectedDate);

  function changeMonth(delta: -1 | 1) {
    setDirection(delta);
    const next = new Date(year, month + delta, 1);
    onSelectDate(next);
    onMonthChange?.(next.getFullYear(), next.getMonth());
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-foreground">
          <span className="capitalize">{MONTHS[month]}</span>{" "}
          <span className="text-muted-foreground">{year}</span>
        </h2>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => changeMonth(-1)}
            aria-label="Mes anterior"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDirection(0);
              onSelectDate(new Date());
            }}
          >
            Hoy
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => changeMonth(1)}
            aria-label="Mes siguiente"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-1 px-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center">
            {w}
          </div>
        ))}
      </div>

      {/* Grid con AnimatePresence direccional */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={`${year}-${month}`}
            custom={direction}
            variants={
              reduce
                ? { enter: {}, center: {}, exit: {} }
                : {
                    enter: (d: number) => ({ x: d * 24, opacity: 0 }),
                    center: { x: 0, opacity: 1 },
                    exit: (d: number) => ({ x: -d * 24, opacity: 0 }),
                  }
            }
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="grid grid-cols-7 gap-1"
          >
            {days.map((d) => {
              const inMonth = d.getMonth() === month;
              const key = dayKey(d);
              const isToday = key === todayKey;
              const isSelected = key === selectedKey;
              const count = eventCountByDay.get(key) ?? 0;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onSelectDate(d)}
                  className={cn(
                    "relative flex aspect-square flex-col items-center justify-center rounded-md border text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isSelected
                      ? "border-primary"
                      : "border-transparent hover:bg-accent/50",
                    !inMonth && "text-muted-foreground/40",
                    inMonth && !isSelected && "text-foreground",
                  )}
                  aria-label={`${d.getDate()}, ${count} evento${count === 1 ? "" : "s"}`}
                >
                  {isSelected && !reduce && (
                    <motion.span
                      layoutId="day-selected-bg"
                      className="absolute inset-0 rounded-md bg-primary/15"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  {isSelected && reduce && (
                    <span className="absolute inset-0 rounded-md bg-primary/15" />
                  )}
                  <span className={cn("relative", isToday && "font-semibold text-primary")}>
                    {d.getDate()}
                  </span>
                  {count > 0 && (
                    <span
                      aria-hidden
                      className={cn(
                        "relative mt-0.5 size-1 rounded-full",
                        isSelected ? "bg-primary" : "bg-primary/60",
                      )}
                    />
                  )}
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
