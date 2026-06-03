"use client";

import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { CalendarOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PriorityDot } from "@/features/ideas/components/priority-dot";
import { cn } from "@/lib/utils";
import type { Idea } from "@/features/ideas/types/idea";

const TZ = "America/Mexico_City";

/**
 * Agenda lateral: lista de eventos para el día seleccionado.
 *
 * Animación estilo Emil:
 *  - AnimatePresence con key del día → al cambiar día, fade+slide suave.
 *  - Stagger 0.03s entre items → la lista "se materializa" en lugar de
 *    aparecer de golpe.
 *  - prefers-reduced-motion la desactiva por completo (sin fallback "menos animado").
 */
export function AgendaSide({ selectedDate, events }: { selectedDate: Date; events: Idea[] }) {
  const reduce = useReducedMotion();

  const dayKey = selectedDate.toDateString();
  const eventsOfDay = events.filter((e) => {
    if (!e.eventAt) return false;
    return new Date(e.eventAt).toDateString() === dayKey;
  });

  const headerLabel = selectedDate.toLocaleDateString("es-MX", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-foreground first-letter:uppercase">
        {headerLabel}
      </h2>

      <AnimatePresence mode="wait">
        <motion.div
          key={dayKey}
          initial={reduce ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className="flex flex-col gap-2"
        >
          {eventsOfDay.length === 0 ? (
            <Card className="flex items-center gap-2 p-4 text-xs text-muted-foreground">
              <CalendarOff className="size-3.5" />
              Sin eventos este día.
            </Card>
          ) : (
            eventsOfDay.map((idea, i) => (
              <motion.div
                key={idea.id}
                initial={reduce ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduce ? 0 : 0.03 * i, duration: 0.18 }}
              >
                <AgendaItem idea={idea} />
              </motion.div>
            ))
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function AgendaItem({ idea }: { idea: Idea }) {
  const date = new Date(idea.eventAt!);
  const timeStr = date.toLocaleTimeString("es-MX", {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  });
  const isPast = date.getTime() < Date.now();

  return (
    <Link
      href={`/ideas/${idea.id}`}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-xl"
    >
      <Card
        className={cn(
          "flex gap-3 p-3 transition-colors hover:border-primary/30 hover:bg-card/70",
          idea.eventCompleted && "opacity-60",
        )}
      >
        <div className="flex w-12 shrink-0 flex-col items-center">
          <span
            className={cn(
              "font-mono text-sm tabular-nums",
              isPast && !idea.eventCompleted ? "text-destructive" : "text-foreground",
            )}
          >
            {timeStr}
          </span>
          {idea.eventDurationMinutes && (
            <span className="text-[10px] text-muted-foreground">
              {idea.eventDurationMinutes}m
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <PriorityDot priority={idea.priority} />
            <p
              className={cn(
                "text-sm font-medium leading-snug text-foreground line-clamp-2",
                idea.eventCompleted && "line-through",
              )}
            >
              {idea.title}
            </p>
          </div>
          {idea.summary && (
            <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1">
              {idea.summary}
            </p>
          )}
        </div>
      </Card>
    </Link>
  );
}
