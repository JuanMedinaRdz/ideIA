"use client";

import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Star, GripVertical } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PriorityDot } from "./priority-dot";
import { AttachmentThumb } from "./attachment-preview";
import { EventBadge } from "@/features/calendar/components/event-badge";
import { cn } from "@/lib/utils";
import type { Idea } from "@/features/ideas/types/idea";

/**
 * Card draggable de Kanban. Versión compacta del IdeaCard.
 *
 * Decisiones TDAH:
 *  - Más densa que IdeaCard porque en Kanban necesitamos ver muchas a la vez.
 *  - Handle de drag explícito a la izquierda (icono GripVertical) — más
 *    descubrible que arrastrar desde cualquier punto.
 *  - Click en la card (no en el handle) navega al detalle.
 *  - Durante el drag, opacity baja para que el destino sea visible.
 */
export function KanbanCard({ idea }: { idea: Idea }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: idea.id, data: { idea } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex gap-1.5 p-2.5 transition-colors hover:border-primary/30 hover:bg-card/70",
        idea.priority === "urgent" && "border-destructive/30",
      )}
    >
      {/* Handle de drag */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="touch-none rounded p-0.5 text-muted-foreground/40 transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Arrastrar para mover"
      >
        <GripVertical className="size-3.5" />
      </button>

      {/* Contenido clickeable hacia detalle */}
      <Link
        href={`/ideas/${idea.id}`}
        className="flex min-w-0 flex-1 gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-start justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <PriorityDot priority={idea.priority} />
              <p className="text-sm font-medium leading-snug text-foreground line-clamp-2">
                {idea.title}
              </p>
            </div>
            {idea.isFavorite && (
              <Star className="size-3 shrink-0 fill-amber-400 text-amber-400" />
            )}
          </div>

          {idea.eventAt && (
            <EventBadge eventAt={idea.eventAt} completed={idea.eventCompleted} size="sm" />
          )}

          {idea.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              {idea.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded border border-border/60 bg-muted/40 px-1 py-0 text-[9px] text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
              {idea.tags.length > 3 && (
                <span className="text-[9px] text-muted-foreground">
                  +{idea.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Thumbnail compacto si hay imagen adjunta */}
        <AttachmentThumb url={idea.attachmentUrl} type={idea.attachmentType} size="sm" />
      </Link>
    </Card>
  );
}
