"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadStepImageAction } from "../services/upload.actions";
import { ImageLightbox } from "@/components/shared/image-lightbox";
import { cn } from "@/lib/utils";

/**
 * Upload de imagen para un step. Si ya hay imagen → muestra con botón X.
 * Si no → área dashed con icono + click para abrir file picker.
 *
 * Estados explícitos: idle / uploading / preview. Toast en errores.
 */
export function ImageUpload({
  tutorialId,
  stepId,
  currentUrl,
  onChange,
}: {
  tutorialId: string;
  stepId: string;
  currentUrl?: string;
  onChange: (url: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [previewUrl, setPreviewUrl] = useState(currentUrl);

  function trigger() {
    inputRef.current?.click();
  }

  function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview optimista mientras sube. Si falla, lo quitamos.
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    const formData = new FormData();
    formData.set("tutorialId", tutorialId);
    formData.set("stepId", stepId);
    formData.set("file", file);

    startTransition(async () => {
      const result = await uploadStepImageAction(formData);
      URL.revokeObjectURL(localPreview);
      if (result.ok) {
        setPreviewUrl(result.data.url);
        onChange(result.data.url);
        toast.success("Imagen subida");
      } else {
        setPreviewUrl(currentUrl);
        toast.error("No se pudo subir", { description: result.error });
      }
      // Reset input para permitir re-seleccionar mismo file
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  function remove() {
    setPreviewUrl(undefined);
    onChange(null);
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={onSelect}
        className="hidden"
      />
      {previewUrl ? (
        <div className="group relative">
          {/* Si está subiendo (pending), mostramos preview optimista plano
              SIN el lightbox — no tiene sentido ampliar algo que aún no se
              persiste. Una vez sube, el lightbox queda habilitado. */}
          {pending ? (
            <div className="relative overflow-hidden rounded-lg border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Imagen del paso (subiendo)"
                className={cn("h-32 w-full object-cover opacity-40")}
                loading="lazy"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-background/40">
                <Loader2 className="size-5 animate-spin text-primary" />
              </div>
            </div>
          ) : (
            <ImageLightbox src={previewUrl} alt="Imagen del paso" />
          )}
          <Button
            type="button"
            size="icon"
            variant="secondary"
            onClick={remove}
            disabled={pending}
            aria-label="Quitar imagen"
            className="absolute right-1 top-1 z-10 h-7 w-7 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus:opacity-100"
            style={{ transitionTimingFunction: "var(--ease-out-strong)" }}
          >
            <X className="size-3.5" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={trigger}
          disabled={pending}
          className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/20 text-muted-foreground transition-colors duration-200 hover:border-primary/40 hover:bg-primary/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"
          style={{ transitionTimingFunction: "var(--ease-out-strong)" }}
        >
          {pending ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <>
              <ImagePlus className="size-5" />
              <span className="text-[11px]">Añadir imagen</span>
            </>
          )}
        </button>
      )}
    </>
  );
}
