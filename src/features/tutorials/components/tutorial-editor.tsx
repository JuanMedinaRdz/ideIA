"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { Plus, Trash2, Check, Loader2 } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { StepCard } from "./step-card";
import {
  createStepAction,
  deleteTutorialAndRedirectAction,
  reorderStepsAction,
  updateTutorialAction,
} from "../services/tutorials.actions";
import type { TutorialWithSteps, TutorialStep } from "../types/tutorial";

/**
 * Editor completo del tutorial. Drag horizontal de steps con @dnd-kit.
 *
 * Decisiones de animación (Emil standards):
 *  - Reorder: spring del propio dnd-kit (interruptible, retarget mid-motion).
 *  - Add step: stagger 40ms con AnimatePresence al añadir. y: 8 → 0 + opacity.
 *  - Cubic-bezier (0.23, 1, 0.32, 1) — ease-out-strong, no built-in.
 *  - 180ms duration en entries — sub-300ms.
 *  - prefers-reduced-motion: opacity sí, movement no (Emil rule).
 *  - Optimistic update con rollback si falla server.
 */
export function TutorialEditor({ tutorial }: { tutorial: TutorialWithSteps }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [steps, setSteps] = useState<TutorialStep[]>(tutorial.steps);
  const [title, setTitle] = useState(tutorial.title);
  const [description, setDescription] = useState(tutorial.description ?? "");
  const [pending, startTransition] = useTransition();
  const [deleteArmed, setDeleteArmed] = useState(false);

  // Sync local `steps` con la prop cuando cambia (al router.refresh tras
  // create/delete/upload, el server vuelve a fetchear y manda nuevo array).
  // Sin esto, useState ignoraría la nueva prop y la UI quedaría stale.
  useEffect(() => {
    setSteps(tutorial.steps);
  }, [tutorial.steps]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function saveTitle() {
    if (title === tutorial.title) return;
    startTransition(async () => {
      const result = await updateTutorialAction(tutorial.id, { title });
      if (!result.ok) {
        toast.error("No se pudo guardar", { description: result.error });
        setTitle(tutorial.title);
      }
    });
  }

  function saveDescription() {
    if (description === (tutorial.description ?? "")) return;
    startTransition(async () => {
      const result = await updateTutorialAction(tutorial.id, {
        description: description || null,
      });
      if (!result.ok) {
        toast.error("No se pudo guardar", { description: result.error });
        setDescription(tutorial.description ?? "");
      }
    });
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = steps.findIndex((s) => s.id === active.id);
    const newIndex = steps.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(steps, oldIndex, newIndex);
    const previous = steps;
    setSteps(next);

    startTransition(async () => {
      const result = await reorderStepsAction(
        tutorial.id,
        next.map((s) => s.id),
      );
      if (!result.ok) {
        setSteps(previous);
        toast.error("No se pudo reordenar", { description: result.error });
      }
    });
  }

  function addStep() {
    startTransition(async () => {
      const result = await createStepAction(tutorial.id);
      if (result.ok) {
        router.refresh();
      } else {
        toast.error("No se pudo añadir", { description: result.error });
      }
    });
  }

  function onDeleteTutorial() {
    if (!deleteArmed) {
      setDeleteArmed(true);
      setTimeout(() => setDeleteArmed(false), 3000);
      return;
    }
    startTransition(async () => {
      try {
        await deleteTutorialAndRedirectAction(tutorial.id);
      } catch {
        // redirect throws
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header editable */}
      <header className="flex flex-col gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveTitle}
          maxLength={200}
          placeholder="Título del tutorial"
          className="border-0 bg-transparent px-0 text-2xl font-semibold tracking-tight shadow-none focus-visible:ring-0 md:text-3xl"
        />
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={saveDescription}
          maxLength={800}
          rows={2}
          placeholder="Descripción breve (opcional)"
          className="resize-none border-0 bg-transparent px-0 text-sm text-muted-foreground shadow-none focus-visible:ring-0"
        />
      </header>

      {/* Steps draggable horizontalmente */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <div
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3"
          style={{ scrollbarGutter: "stable" }}
        >
          <SortableContext items={steps.map((s) => s.id)} strategy={horizontalListSortingStrategy}>
            <AnimatePresence initial={false}>
              {steps.map((step, i) => (
                <motion.div
                  key={step.id}
                  layout={!reduce}
                  // Emil rule: usar full transform string, NO shorthand `y`/`scale`
                  // (los shorthand corren en main thread y dropean frames bajo carga).
                  initial={reduce ? false : { opacity: 0, transform: "translateY(8px)" }}
                  animate={{ opacity: 1, transform: "translateY(0px)" }}
                  exit={reduce ? undefined : { opacity: 0, transform: "scale(0.95)" }}
                  transition={{
                    duration: 0.18,
                    delay: reduce ? 0 : Math.min(0.04 * i, 0.2),
                    ease: [0.23, 1, 0.32, 1],
                  }}
                >
                  <StepCard step={step} index={i} tutorialId={tutorial.id} />
                </motion.div>
              ))}
            </AnimatePresence>
          </SortableContext>

          {/* Botón añadir step — separado de SortableContext, no es draggable */}
          <AddStepInline onAdd={addStep} pending={pending} />
        </div>
      </DndContext>

      {steps.length === 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Sin pasos aún. Pulsa <span className="text-foreground">+</span> para añadir el primero.
        </p>
      )}

      {/* Footer: delete tutorial */}
      <footer className="flex justify-end border-t border-border pt-4">
        <Button
          type="button"
          variant={deleteArmed ? "destructive" : "ghost"}
          size="sm"
          onClick={onDeleteTutorial}
          disabled={pending}
          className="gap-2"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : deleteArmed ? <Check className="size-4" /> : <Trash2 className="size-4" />}
          {deleteArmed ? "Confirmar borrar tutorial" : "Borrar tutorial"}
        </Button>
      </footer>
    </div>
  );
}

function AddStepInline({ onAdd, pending }: { onAdd: () => void; pending: boolean }) {
  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={pending}
      aria-label="Añadir paso"
      className="flex h-[420px] w-20 shrink-0 snap-start flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border bg-transparent text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      style={{
        transitionDuration: "180ms",
        transitionTimingFunction: "var(--ease-out-strong)",
      }}
    >
      {pending ? <Loader2 className="size-5 animate-spin" /> : <Plus className="size-5" />}
      <span className="text-[10px] uppercase tracking-wider">Añadir</span>
    </button>
  );
}
