import { cn } from "@/lib/utils";
import type { IdeaPriority } from "@/features/ideas/types/idea";

const PRIORITY_STYLES: Record<IdeaPriority, { color: string; label: string }> = {
  low: { color: "bg-muted-foreground/50", label: "Baja" },
  medium: { color: "bg-blue-400", label: "Media" },
  high: { color: "bg-amber-400", label: "Alta" },
  urgent: { color: "bg-destructive", label: "Urgente" },
};

/**
 * Pequeño dot de prioridad. Decisión TDAH: en lugar de badges grandes
 * coloridos (Linear), usamos un punto de 8px + texto pequeño. El color
 * informa rápido sin gritar.
 */
export function PriorityDot({ priority, showLabel = false }: { priority: IdeaPriority; showLabel?: boolean }) {
  const { color, label } = PRIORITY_STYLES[priority];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("size-1.5 rounded-full", color)} aria-hidden />
      {showLabel && <span className="text-xs text-muted-foreground">{label}</span>}
      {!showLabel && <span className="sr-only">Prioridad {label}</span>}
    </span>
  );
}
