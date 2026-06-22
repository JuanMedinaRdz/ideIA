"use client";

import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Lightbox para imágenes de tutorial. Al click sobre el thumbnail abre el
 * dialog con la imagen a `max(90vw, 90vh)` — siempre dentro del viewport,
 * sin scroll.
 *
 * Decisiones:
 *  - Trigger es el thumbnail (img + zoom-in icon overlay en hover).
 *  - Dialog usa Radix Portal → escapa cualquier overflow del editor.
 *  - object-contain en el lightbox → respeta aspect ratio sin recortar.
 *  - Esc + click backdrop cierran (Radix por defecto).
 *  - Animaciones Emil: cubic-bezier strong, sub-300ms, GPU only.
 */
export function ImageLightbox({
  src,
  alt,
  className,
  thumbnailClassName = "h-32 w-full object-cover",
}: {
  src: string;
  alt: string;
  /** Aplicado al botón exterior (border, rounded, etc.) */
  className?: string;
  /** Aplicado al `<img>` del thumbnail. Default = tutoriales (h-32 object-cover). */
  thumbnailClassName?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          className={cn(
            "group relative block w-full overflow-hidden rounded-lg border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
          aria-label="Ampliar imagen"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            loading="lazy"
            className={cn(
              thumbnailClassName,
              "transition-transform duration-200 group-hover:scale-[1.02]",
            )}
            style={{ transitionTimingFunction: "var(--ease-out-strong)" }}
          />
          {/* Overlay con icono al hover — indica que es clickable */}
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/0 opacity-0 transition-opacity duration-200 group-hover:bg-background/40 group-hover:opacity-100"
            style={{ transitionTimingFunction: "var(--ease-out-strong)" }}
          >
            <div className="flex size-9 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm">
              <ZoomIn className="size-4 text-foreground" />
            </div>
          </div>
        </button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-background/85 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          onClick={() => setOpen(false)}
        >
          <VisuallyHidden.Root>
            <DialogPrimitive.Title>{alt || "Imagen ampliada"}</DialogPrimitive.Title>
          </VisuallyHidden.Root>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
            // El click en la imagen NO cierra (solo el wrapper alrededor sí).
            // Sin esto, click accidental en la imagen al moverla cerraría.
            onClick={(e) => e.stopPropagation()}
          />
          <DialogPrimitive.Close
            className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur-sm transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Cerrar"
            style={{ transitionDuration: "180ms", transitionTimingFunction: "var(--ease-out-strong)" }}
          >
            <X className="size-4" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
