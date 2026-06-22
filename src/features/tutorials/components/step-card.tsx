"use client";

import { useState, useTransition } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { GripVertical, Trash2, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ImageUpload } from "./image-upload";
import { cn } from "@/lib/utils";
import { updateStepAction, deleteStepAction } from "../services/tutorials.actions";
import type { TutorialStep } from "../types/tutorial";

/**
 * Card de un step del tutorial. Drag handle a la izquierda (GripVertical) —
 * el resto del card es editable inline (título + descripción + imagen).
 *
 * Animaciones (Emil standards):
 *  - Drag usa CSS.Transform del propio dnd-kit (transform GPU, sin layout shift)
 *  - Hover: border-color transition 200ms ease-out-strong
 *  - Press del handle: cursor change + sortable maneja la animación del drag
 *  - Save inline: blur dispara save, toast feedback
 */
export function StepCard({
  step,
  index,
  tutorialId,
}: {
  step: TutorialStep;
  index: number;
  tutorialId: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: step.id });

  const [title, setTitle] = useState(step.title ?? "");
  const [description, setDescription] = useState(step.description);
  const [imageUrl, setImageUrl] = useState(step.imageUrl);
  const [pending, startTransition] = useTransition();
  const [deleteArmed, setDeleteArmed] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  function saveField(field: "title" | "description" | "imageUrl", value: string | null) {
    startTransition(async () => {
      const result = await updateStepAction(step.id, tutorialId, { [field]: value });
      if (!result.ok) toast.error("No se pudo guardar", { description: result.error });
    });
  }

  function onDelete() {
    if (!deleteArmed) {
      setDeleteArmed(true);
      setTimeout(() => setDeleteArmed(false), 3000);
      return;
    }
    startTransition(async () => {
      const result = await deleteStepAction(step.id, tutorialId);
      if (!result.ok) toast.error("No se pudo borrar", { description: result.error });
    });
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex w-72 shrink-0 snap-start flex-col gap-3 p-4 transition-colors",
        "hover:border-primary/30",
      )}
    >
      {/* Header con drag handle + número + delete */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="touch-none rounded p-0.5 text-muted-foreground/60 transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
            style={{ cursor: "grab", transitionTimingFunction: "var(--ease-out-strong)" }}
            aria-label="Arrastrar para reordenar"
          >
            <GripVertical className="size-3.5" />
          </button>
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
            Paso {index + 1}
          </span>
        </div>
        <Button
          type="button"
          variant={deleteArmed ? "destructive" : "ghost"}
          size="icon"
          onClick={onDelete}
          disabled={pending}
          aria-label={deleteArmed ? "Confirmar borrado" : "Borrar paso"}
          className="h-6 w-6 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus:opacity-100 data-[armed=true]:opacity-100"
          data-armed={deleteArmed || undefined}
          style={{ transitionTimingFunction: "var(--ease-out-strong)" }}
        >
          {deleteArmed ? <Check className="size-3" /> : <Trash2 className="size-3" />}
        </Button>
      </div>

      {/* Imagen */}
      <ImageUpload
        tutorialId={tutorialId}
        stepId={step.id}
        currentUrl={imageUrl}
        onChange={(url) => {
          setImageUrl(url ?? undefined);
          saveField("imageUrl", url);
        }}
      />

      {/* Título del step (opcional) */}
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => title !== (step.title ?? "") && saveField("title", title || null)}
        maxLength={120}
        placeholder="Título del paso (opcional)"
        disabled={pending}
        className="border-0 bg-transparent px-0 text-sm font-medium shadow-none focus-visible:ring-0"
      />

      {/* Descripción */}
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={() => description !== step.description && saveField("description", description)}
        maxLength={1000}
        rows={4}
        placeholder="Describe el paso..."
        disabled={pending}
        className="resize-none border-0 bg-transparent px-0 text-xs text-muted-foreground shadow-none focus-visible:ring-0"
      />
    </Card>
  );
}
