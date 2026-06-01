"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Loader2, Sparkles, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createIdeaAction } from "@/features/ideas/services/ideas.actions";
import { structureIdeaAction } from "@/features/ai-insights/services/structurer.actions";
import type { IdeaPriority } from "@/features/ideas/types/idea";

/**
 * Dialog "Nueva idea" con dos modos:
 *  - **Rápido (default, recomendado para TDAH)**: pegas texto crudo → "Estructurar con IA"
 *    → OpenAI rellena título/resumen/tags/prioridad. Una sola decisión.
 *  - **Manual**: 3 campos clásicos. Para cuando quieras control fino.
 *
 * Diseño TDAH:
 *  - Modo IA por defecto: una caja grande de texto + botón mágico. Cero campos.
 *  - Después de estructurar: preview compacta (no editable inline). El usuario
 *    puede pulsar "Editar manualmente" si quiere retocar.
 *  - Loading explícito con texto ("Pensando…") en vez de spinner solo.
 */
export function NewIdeaDialog({
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = (next: boolean) => {
    if (isControlled) onOpenChange?.(next);
    else setUncontrolledOpen(next);
  };

  const [mode, setMode] = useState<"ai" | "manual">("ai");
  const [rawText, setRawText] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [category, setCategory] = useState("General");
  const [priority, setPriority] = useState<IdeaPriority>("medium");
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [structured, setStructured] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function reset() {
    setMode("ai");
    setRawText("");
    setTitle("");
    setSummary("");
    setTags([]);
    setCategory("General");
    setPriority("medium");
    setAiSuggestions([]);
    setStructured(false);
    setError(null);
  }

  function onStructure() {
    setError(null);
    startTransition(async () => {
      const result = await structureIdeaAction(rawText);
      if (result.ok) {
        setTitle(result.data.title);
        setSummary(result.data.summary);
        setCategory(result.data.category);
        setTags(result.data.tags);
        setPriority(result.data.priority);
        setAiSuggestions(result.data.ai_suggestions);
        setStructured(true);
      } else {
        setError(result.error);
      }
    });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createIdeaAction({
        title: title.trim(),
        summary: summary.trim(),
        priority,
        category,
        tags,
        aiSuggestions,
        source: structured ? "web" : "web",
      });
      if (result.ok) {
        reset();
        setOpen(false);
        toast.success("Idea guardada");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      {!isControlled && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button size="sm" className="gap-2">
              <Plus className="size-4" />
              Nueva idea
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Captura una idea</DialogTitle>
          <DialogDescription>
            {mode === "ai" && !structured && "Escribe lo que tengas en mente. La IA la organiza."}
            {mode === "ai" && structured && "Esto entendió la IA. Guarda si te encaja."}
            {mode === "manual" && "Modo manual: tú controlas todo."}
          </DialogDescription>
        </DialogHeader>

        {/* Modo IA — paso 1: input crudo */}
        {mode === "ai" && !structured && (
          <div className="space-y-3">
            <Textarea
              rows={5}
              maxLength={4000}
              autoFocus
              placeholder="Refactor del onboarding — los users se caen en el paso 3. Probar versión sin verificar email…"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              disabled={pending}
            />
            {error && (
              <p role="alert" className="text-xs text-destructive">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setMode("manual")}
                disabled={pending}
                className="gap-2"
              >
                <Pencil className="size-4" />
                Modo manual
              </Button>
              <Button
                type="button"
                onClick={onStructure}
                disabled={pending || rawText.trim().length < 3}
                className="gap-2"
              >
                {pending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Pensando…
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Estructurar con IA
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Modo IA — paso 2: preview estructurada */}
        {mode === "ai" && structured && (
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="rounded-lg border border-border bg-card/40 p-4">
              <p className="text-sm font-medium text-foreground">{title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{summary}</p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
                  {priority}
                </span>
                <span className="text-[11px] text-muted-foreground">·</span>
                <span className="text-[11px] text-muted-foreground">{category}</span>
                {tags.map((t) => (
                  <span
                    key={t}
                    className="rounded border border-border/60 bg-muted/40 px-1.5 py-0.5 text-[10px]"
                  >
                    {t}
                  </span>
                ))}
              </div>
              {aiSuggestions.length > 0 && (
                <ul className="mt-3 space-y-1 border-t border-border pt-3">
                  {aiSuggestions.map((s, i) => (
                    <li key={i} className="flex gap-1.5 text-[11px] text-muted-foreground">
                      <Sparkles className="mt-0.5 size-3 shrink-0 text-primary/60" />
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {error && (
              <p role="alert" className="text-xs text-destructive">
                {error}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setStructured(false);
                  setMode("manual");
                }}
                disabled={pending}
              >
                Editar manualmente
              </Button>
              <Button type="submit" disabled={pending} className="gap-2">
                {pending && <Loader2 className="size-4 animate-spin" />}
                {pending ? "Guardando…" : "Guardar idea"}
              </Button>
            </DialogFooter>
          </form>
        )}

        {/* Modo manual */}
        {mode === "manual" && (
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="title" className="text-xs font-medium text-muted-foreground">
                Título
              </label>
              <Input
                id="title"
                required
                autoFocus
                maxLength={200}
                placeholder="Refactor del onboarding…"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={pending}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="summary" className="text-xs font-medium text-muted-foreground">
                Resumen <span className="text-muted-foreground/60">(opcional)</span>
              </label>
              <Textarea
                id="summary"
                rows={3}
                maxLength={800}
                placeholder="Detalles, contexto, lo que se te ocurra…"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                disabled={pending}
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Prioridad</span>
              <div className="grid grid-cols-4 gap-1.5">
                {(["low", "medium", "high", "urgent"] as IdeaPriority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    disabled={pending}
                    className={`rounded-md border px-2 py-1.5 text-xs capitalize transition ${
                      priority === p
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-card/40 text-muted-foreground hover:bg-card"
                    }`}
                  >
                    {p === "low" && "Baja"}
                    {p === "medium" && "Media"}
                    {p === "high" && "Alta"}
                    {p === "urgent" && "Urgente"}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p role="alert" className="text-xs text-destructive">
                {error}
              </p>
            )}

            <DialogFooter className="mt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setMode("ai");
                  setStructured(false);
                }}
                disabled={pending}
                className="gap-2"
              >
                <Sparkles className="size-4" />
                Modo IA
              </Button>
              <Button type="submit" disabled={pending || !title.trim()} className="gap-2">
                {pending && <Loader2 className="size-4 animate-spin" />}
                {pending ? "Guardando…" : "Guardar idea"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
