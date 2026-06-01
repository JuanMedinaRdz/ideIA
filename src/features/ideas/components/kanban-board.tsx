"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { KanbanColumn } from "./kanban-column";
import { KanbanCard } from "./kanban-card";
import { updateIdeaAction } from "../services/ideas.actions";
import type { Idea, IdeaStatus } from "@/features/ideas/types/idea";

const COLUMNS: { id: IdeaStatus; title: string; description: string; accent: "default" | "warm" | "success" }[] = [
  { id: "inbox", title: "Inbox", description: "Sin procesar", accent: "default" },
  { id: "in_progress", title: "En curso", description: "Trabajando ahora", accent: "warm" },
  { id: "done", title: "Hechas", description: "Completadas", accent: "success" },
];

/**
 * Board principal. Mantiene estado local de las ideas para hacer optimistic
 * updates al arrastrar — la UI se mueve al instante y, si el server falla,
 * revertimos al estado original con toast de error.
 *
 * Decisiones:
 *  - Solo 3 columnas (inbox, in_progress, done). 'archived' se ve en otro lugar
 *    (ahora no, pero es ampliable). 4 columnas distraen más que aportan.
 *  - PointerSensor con activationConstraint: distance 5px → permite clicks en
 *    los Links sin que se interpreten como drag. Patron estándar de Linear.
 *  - KeyboardSensor para accesibilidad: navegar con Tab + Space + arrows.
 *  - DragOverlay muestra una sombra de la card durante el drag — el original
 *    queda con opacity baja en su sitio (gestionado en KanbanCard).
 */
export function KanbanBoard({ initialIdeas }: { initialIdeas: Idea[] }) {
  const router = useRouter();
  const [ideas, setIdeas] = useState(initialIdeas);
  const [activeIdea, setActiveIdea] = useState<Idea | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Agrupamos por status. useMemo evita recalcular en cada render — importante
  // porque DndContext re-renderiza con frecuencia durante el drag.
  const byStatus = useMemo(() => {
    const map = new Map<IdeaStatus, Idea[]>();
    COLUMNS.forEach((c) => map.set(c.id, []));
    ideas.forEach((i) => {
      if (i.status !== "archived") {
        map.get(i.status)?.push(i);
      }
    });
    return map;
  }, [ideas]);

  function onDragStart(e: DragStartEvent) {
    const idea = ideas.find((i) => i.id === e.active.id);
    if (idea) setActiveIdea(idea);
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveIdea(null);
    const { active, over } = e;
    if (!over) return;

    const ideaId = String(active.id);
    const idea = ideas.find((i) => i.id === ideaId);
    if (!idea) return;

    // `over.id` puede ser:
    //  - el id de una columna (drop directamente en columna vacía)
    //  - el id de otra card (drop sobre una card existente — usamos su status)
    const overData = over.data.current as { idea?: Idea } | undefined;
    const targetStatus = (overData?.idea?.status ?? over.id) as IdeaStatus;

    if (!COLUMNS.some((c) => c.id === targetStatus)) return;
    if (idea.status === targetStatus) return;

    // Optimistic: actualizamos UI YA. Si el server falla, revertimos.
    const previousIdeas = ideas;
    setIdeas((prev) =>
      prev.map((i) => (i.id === ideaId ? { ...i, status: targetStatus } : i)),
    );

    startTransition(async () => {
      const result = await updateIdeaAction(ideaId, { status: targetStatus });
      if (!result.ok) {
        setIdeas(previousIdeas);
        toast.error("No se pudo mover", { description: result.error });
      } else {
        router.refresh();
      }
    });
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            description={col.description}
            accent={col.accent}
            ideas={byStatus.get(col.id) ?? []}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeIdea ? (
          <div className="rotate-2 cursor-grabbing">
            <KanbanCard idea={activeIdea} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
