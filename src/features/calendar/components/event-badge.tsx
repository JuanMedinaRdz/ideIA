import { Calendar, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Badge compacto que muestra el evento de una idea. Inteligente con el formato:
 * "Hoy 14:30", "Mañana 8:00", "vie 8 jun", etc.
 *
 * Decisión TDAH: usar etiquetas semánticas ("Hoy", "Mañana") en lugar de
 * fechas absolutas cuando el evento es cercano. Reduce carga cognitiva de
 * "qué día es hoy y cuántos faltan".
 */
export function EventBadge({
  eventAt,
  completed = false,
  size = "md",
  className,
}: {
  eventAt: string;
  completed?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const date = new Date(eventAt);
  const now = new Date();

  const isPast = date.getTime() < now.getTime();
  const label = formatRelative(date, now);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-medium",
        size === "sm" && "text-[10px]",
        size === "md" && "text-[11px]",
        completed
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          : isPast
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-primary/30 bg-primary/10 text-primary",
        className,
      )}
    >
      {completed ? <CheckCircle2 className="size-3" /> : <Calendar className="size-3" />}
      {label}
    </span>
  );
}

/**
 * Formato relativo en español, sin librerías externas.
 * - mismo día: "Hoy 14:30"
 * - mañana: "Mañana 9:00"
 * - esta semana: "vie 14:30"
 * - misma año: "8 jun 14:30"
 * - otro año: "8 jun 2027"
 */
function formatRelative(date: Date, now: Date): string {
  const tz = "America/Mexico_City";
  const sameDay =
    date.toLocaleDateString("es-MX", { timeZone: tz }) ===
    now.toLocaleDateString("es-MX", { timeZone: tz });

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow =
    date.toLocaleDateString("es-MX", { timeZone: tz }) ===
    tomorrow.toLocaleDateString("es-MX", { timeZone: tz });

  const timeStr = date.toLocaleTimeString("es-MX", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  });

  if (sameDay) return `Hoy ${timeStr}`;
  if (isTomorrow) return `Mañana ${timeStr}`;

  const diffDays = Math.round((date.getTime() - now.getTime()) / 86_400_000);
  if (diffDays > 1 && diffDays < 7) {
    const weekday = date.toLocaleDateString("es-MX", { timeZone: tz, weekday: "short" });
    return `${weekday} ${timeStr}`;
  }

  if (date.getFullYear() === now.getFullYear()) {
    const dm = date.toLocaleDateString("es-MX", {
      timeZone: tz,
      day: "numeric",
      month: "short",
    });
    return `${dm} ${timeStr}`;
  }

  return date.toLocaleDateString("es-MX", {
    timeZone: tz,
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
