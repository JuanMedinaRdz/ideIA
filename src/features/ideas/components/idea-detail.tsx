"use client";

import { useState, useTransition, useOptimistic } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Star,
  Sparkles,
  Trash2,
  Loader2,
  Check,
  X,
  MessageSquare,
  Mic,
  Image as ImageIcon,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { PriorityDot } from "./priority-dot";
import { AttachmentPreview } from "./attachment-preview";
import { EventBadge } from "@/features/calendar/components/event-badge";
import { timeAgo } from "@/lib/date";
import { cn } from "@/lib/utils";
import {
  deleteIdeaAndRedirectAction,
  toggleFavoriteAction,
  updateIdeaAction,
} from "../services/ideas.actions";
import { restructureIdeaAction } from "@/features/ai-insights/services/structurer.actions";
import type { Idea, IdeaPriority, IdeaSource } from "../types/idea";

const SOURCE_ICONS: Record<IdeaSource, React.ComponentType<{ className?: string }>> = {
  whatsapp: MessageSquare,
  voice: Mic,
  image: ImageIcon,
  web: Globe,
};

const PRIORITY_OPTIONS: { value: IdeaPriority; label: string }[] = [
  { value: "low", label: "Baja" },
  { value: "medium", label: "Media" },
  { value: "high", label: "Alta" },
  { value: "urgent", label: "Urgente" },
];

/**
 * Vista de detalle de una idea. Inline-editable: el usuario hace click en
 * título/resumen y edita directamente — sin modal extra, sin "modo edición".
 *
 * Decisiones TDAH:
 *  - Sin breadcrumbs ni tabs: una sola pantalla con todo.
 *  - Save automático al perder foco (no botón "Guardar" → menos decisión).
 *  - Toasts cortos al guardar (feedback inmediato sin bloquear).
 *  - Acciones destructivas (delete) requieren doble click — sin modal de
 *    confirmación que rompa el flow.
 *  - useOptimistic en favorito → click instantáneo, rollback solo si falla.
 */
export function IdeaDetail({ idea }: { idea: Idea }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [restructuring, startRestructure] = useTransition();
  const [deleting, startDelete] = useTransition();

  const [title, setTitle] = useState(idea.title);
  const [summary, setSummary] = useState(idea.summary);
  const [description, setDescription] = useState(idea.description ?? "");
  const [priority, setPriority] = useState<IdeaPriority>(idea.priority);
  // datetime-local quiere "YYYY-MM-DDTHH:MM" en HORA LOCAL (no UTC). Conversión:
  const [eventAtLocal, setEventAtLocal] = useState(() => isoToLocalInput(idea.eventAt));

  // useOptimistic: actualiza la UI inmediatamente, espera al server después.
  // Si falla, React revierte automáticamente al valor original.
  const [optimisticFavorite, setOptimisticFavorite] = useOptimistic(idea.isFavorite);

  // Doble-click anti-accidente para borrar — sin modal.
  const [deleteArmed, setDeleteArmed] = useState(false);

  const SourceIcon = SOURCE_ICONS[idea.source];

  function saveField(field: "title" | "summary" | "description" | "priority", value: string | IdeaPriority) {
    startTransition(async () => {
      const result = await updateIdeaAction(idea.id, { [field]: value });
      if (!result.ok) {
        toast.error("No se pudo guardar", { description: result.error });
        // Rollback al valor original
        if (field === "title") setTitle(idea.title);
        if (field === "summary") setSummary(idea.summary);
        if (field === "description") setDescription(idea.description ?? "");
        if (field === "priority") setPriority(idea.priority);
      } else {
        toast.success("Guardado");
        router.refresh();
      }
    });
  }

  function toggleFavorite() {
    const next = !optimisticFavorite;
    startTransition(async () => {
      setOptimisticFavorite(next);
      const result = await toggleFavoriteAction(idea.id, next);
      if (!result.ok) {
        toast.error("No se pudo cambiar", { description: result.error });
      }
      router.refresh();
    });
  }

  function onRestructure() {
    startRestructure(async () => {
      const result = await restructureIdeaAction(idea.id);
      if (result.ok) {
        toast.success("Re-estructurado con IA", {
          description: "Los campos se actualizaron.",
        });
        router.refresh();
      } else {
        toast.error("No se pudo re-estructurar", { description: result.error });
      }
    });
  }

  function onDelete() {
    if (!deleteArmed) {
      setDeleteArmed(true);
      setTimeout(() => setDeleteArmed(false), 3000); // si no confirma en 3s, desarma
      return;
    }
    startDelete(async () => {
      try {
        await deleteIdeaAndRedirectAction(idea.id);
        // redirect lanza error en cliente — no llega aquí
      } catch {
        // redirect counts as "thrown"
        toast.success("Idea borrada");
      }
    });
  }

  return (
    <article className="space-y-5">
      {/* Header — meta + acciones */}
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <PriorityDot priority={priority} showLabel />
          <span>·</span>
          <SourceIcon className="size-3" />
          <span>{idea.category}</span>
          <span>·</span>
          <span>{timeAgo(idea.createdAt)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFavorite}
            disabled={pending}
            aria-label={optimisticFavorite ? "Quitar de favoritos" : "Marcar como favorita"}
            aria-pressed={optimisticFavorite}
          >
            <Star
              className={cn(
                "size-4 transition",
                optimisticFavorite && "fill-amber-400 text-amber-400",
              )}
            />
          </Button>
        </div>
      </header>

      {/* Título editable inline */}
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => title !== idea.title && saveField("title", title)}
        maxLength={200}
        className="border-0 bg-transparent px-0 text-2xl font-semibold shadow-none focus-visible:ring-0 md:text-3xl"
        placeholder="Sin título"
        disabled={pending}
      />

      {/* Resumen editable inline */}
      <Textarea
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        onBlur={() => summary !== idea.summary && saveField("summary", summary)}
        maxLength={800}
        rows={2}
        className="resize-none border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0"
        placeholder="Resumen…"
        disabled={pending}
      />

      {/* Adjunto (imagen/audio) */}
      {idea.attachmentUrl && (
        <AttachmentPreview url={idea.attachmentUrl} type={idea.attachmentType} />
      )}

      {/* Tags */}
      {idea.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {idea.tags.map((tag) => (
            <span
              key={tag}
              className="rounded border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Evento — datetime input. Si hay event_at muestra badge + control para editar/quitar. */}
      <div>
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground">Evento</p>
          {idea.eventAt && (
            <EventBadge eventAt={idea.eventAt} completed={idea.eventCompleted} size="sm" />
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="datetime-local"
            value={eventAtLocal}
            onChange={(e) => setEventAtLocal(e.target.value)}
            onBlur={() => {
              const iso = localInputToIso(eventAtLocal);
              if (iso !== (idea.eventAt ?? null)) {
                startTransition(async () => {
                  const result = await updateIdeaAction(idea.id, { eventAt: iso });
                  if (!result.ok) {
                    toast.error("No se pudo guardar la fecha", { description: result.error });
                    setEventAtLocal(isoToLocalInput(idea.eventAt));
                  } else {
                    toast.success(iso ? "Evento agendado" : "Evento eliminado");
                    router.refresh();
                  }
                });
              }
            }}
            disabled={pending}
            className="flex h-9 flex-1 rounded-md border border-input bg-card/40 px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background [color-scheme:dark]"
          />
          {idea.eventAt && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEventAtLocal("");
                startTransition(async () => {
                  await updateIdeaAction(idea.id, { eventAt: null });
                  toast.success("Evento eliminado");
                  router.refresh();
                });
              }}
              disabled={pending}
            >
              Quitar
            </Button>
          )}
        </div>
      </div>

      {/* Prioridad — selector */}
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">Prioridad</p>
        <div className="grid grid-cols-4 gap-1.5">
          {PRIORITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setPriority(opt.value);
                saveField("priority", opt.value);
              }}
              disabled={pending}
              className={cn(
                "rounded-md border px-2 py-1.5 text-xs capitalize transition",
                priority === opt.value
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card/40 text-muted-foreground hover:bg-card",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Descripción larga editable */}
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">
          Descripción <span className="text-muted-foreground/60">(opcional)</span>
        </p>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => description !== (idea.description ?? "") && saveField("description", description)}
          maxLength={4000}
          rows={5}
          placeholder="Notas largas, contexto, referencias…"
          disabled={pending}
        />
      </div>

      {/* Sugerencias IA */}
      {idea.aiSuggestions.length > 0 && (
        <Card className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="size-3.5 text-primary" />
            <p className="text-xs font-medium text-foreground">Sugerencias IA</p>
          </div>
          <ul className="space-y-1.5">
            {idea.aiSuggestions.map((s, i) => (
              <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                <span className="mt-1 size-1 shrink-0 rounded-full bg-primary/50" />
                {s}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Contenido original (solo si vino de WhatsApp/voz) */}
      {idea.aiSuggestions && idea.aiSuggestions.length > 0 && (
        <RawContentCollapsible ideaId={idea.id} />
      )}

      {/* Acciones */}
      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onRestructure}
          disabled={restructuring || pending}
          className="gap-2"
        >
          {restructuring ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          {restructuring ? "Pensando…" : "Re-estructurar con IA"}
        </Button>

        <Button
          variant={deleteArmed ? "destructive" : "ghost"}
          size="sm"
          onClick={onDelete}
          disabled={deleting}
          className="gap-2"
        >
          {deleting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : deleteArmed ? (
            <Check className="size-4" />
          ) : (
            <Trash2 className="size-4" />
          )}
          {deleting ? "Borrando…" : deleteArmed ? "Confirmar" : "Borrar"}
        </Button>
      </footer>

      {/* Indicador de guardado activo */}
      {pending && !restructuring && !deleting && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 rounded-md border border-border bg-popover px-3 py-1.5 text-xs text-muted-foreground shadow-lg">
          <Loader2 className="size-3 animate-spin" />
          Guardando…
        </div>
      )}
    </article>
  );
}

function RawContentCollapsible({ ideaId }: { ideaId: string }) {
  // Placeholder: si en el futuro queremos mostrar raw_content original,
  // hacemos un fetch lazy aquí. Por ahora no lo renderizamos para no
  // saturar — pero dejamos el hook listo.
  void ideaId;
  return null;
}

/**
 * `<input type="datetime-local">` quiere "YYYY-MM-DDTHH:MM" en hora LOCAL.
 * Pero la DB guarda ISO con TZ. Conversión bidireccional aquí.
 */
function isoToLocalInput(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localInputToIso(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}
