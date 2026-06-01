"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { useUIStore } from "@/store/ui-store";
import { KanbanCard } from "./kanban-card";
import { cn } from "@/lib/utils";
import type { Idea, IdeaStatus } from "@/features/ideas/types/idea";

interface KanbanColumnProps {
  id: IdeaStatus;
  title: string;
  description?: string;
  ideas: Idea[];
  accent?: "default" | "warm" | "success";
}

/**
 * Una columna del board. Acepta drop de cards desde otras columnas.
 *
 * Decisiones TDAH:
 *  - Contador de cards en el header — el usuario sabe la carga sin contar.
 *  - Indicador visual sutil al hover de drag (border-primary).
 *  - Empty state: línea fina "Suelta aquí" cuando se está arrastrando.
 *  - Scroll independiente por columna (no scroll horizontal global).
 */
export function KanbanColumn({
  id,
  title,
  description,
  ideas,
  accent = "default",
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const openNewIdea = useUIStore((s) => s.setNewIdeaOpen);

  const accentBg = {
    default: "bg-muted/30",
    warm: "bg-amber-500/5",
    success: "bg-emerald-500/5",
  }[accent];

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full min-h-[400px] w-full flex-col rounded-xl border border-border p-3 transition-colors",
        accentBg,
        isOver && "border-primary bg-primary/5",
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium text-foreground">{title}</h2>
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              {ideas.length}
            </span>
          </div>
          {description && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">{description}</p>
          )}
        </div>
        {id === "inbox" && (
          <button
            type="button"
            onClick={() => openNewIdea(true)}
            aria-label="Nueva idea"
            className="rounded-md p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <Plus className="size-4" />
          </button>
        )}
      </div>

      {/* Cards */}
      <SortableContext items={ideas.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
          {ideas.length === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-border/60 text-[11px] text-muted-foreground/60">
              {isOver ? "Suelta aquí" : "Vacío"}
            </div>
          ) : (
            ideas.map((idea) => <KanbanCard key={idea.id} idea={idea} />)
          )}
        </div>
      </SortableContext>
    </div>
  );
}
