"use client";

import { useState } from "react";
import { FileImage, FileAudio, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Preview embebido del attachment de una idea. Soporta imagen (img tag con
 * lazy loading) y audio (control nativo, accesible por defecto).
 *
 * Decisiones TDAH:
 *  - Imagen contenida en max-h con object-contain → nunca se sale del flujo,
 *    nunca empuja el resto del contenido.
 *  - Audio con `<audio controls>` nativo — el usuario controla play/pause/seek
 *    sin que tengamos que reinventar la rueda ni meter una librería.
 *  - Fallback genérico (icono + link "Abrir adjunto") si el tipo no es ninguno
 *    de los dos — defensa contra futuros tipos (PDF, video).
 */
export function AttachmentPreview({
  url,
  type,
  className,
}: {
  url: string;
  type?: string;
  className?: string;
}) {
  const [imageError, setImageError] = useState(false);
  const isImage = type?.startsWith("image/") ?? false;
  const isAudio = type?.startsWith("audio/") ?? false;

  if (isImage && !imageError) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn("group block overflow-hidden rounded-lg border border-border", className)}
        aria-label="Abrir imagen en pestaña nueva"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt="Adjunto de la idea"
          loading="lazy"
          onError={() => setImageError(true)}
          className="max-h-96 w-full object-contain bg-muted/30 transition group-hover:opacity-95"
        />
      </a>
    );
  }

  if (isAudio) {
    return (
      <Card className={cn("flex items-center gap-3 p-3", className)}>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <FileAudio className="size-4" />
        </div>
        <audio controls src={url} className="h-9 w-full" />
      </Card>
    );
  }

  // Fallback: tipo desconocido o imagen rota
  return (
    <Card className={cn("flex items-center gap-3 p-3", className)}>
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        {isImage ? <FileImage className="size-4" /> : <ExternalLink className="size-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-foreground">Archivo adjunto</p>
        <p className="text-[10px] text-muted-foreground">{type ?? "tipo desconocido"}</p>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-primary hover:underline"
      >
        Abrir
      </a>
    </Card>
  );
}

/** Indicador pequeño (icono solo) para usar en cards de listas. */
export function AttachmentBadge({ type }: { type?: string }) {
  if (!type) return null;
  if (type.startsWith("image/")) {
    return <FileImage className="size-3 text-muted-foreground" aria-label="Tiene imagen adjunta" />;
  }
  if (type.startsWith("audio/")) {
    return <FileAudio className="size-3 text-muted-foreground" aria-label="Tiene audio adjunto" />;
  }
  return null;
}

/**
 * Thumbnail compacto para listas/kanban. Solo renderiza si el attachment es
 * imagen — para audio, en cards no aporta valor visual (usa AttachmentBadge).
 *
 * Decisión TDAH: thumbnail pequeño (no >64px) — informa que hay imagen sin
 * dominar la card. Las imágenes grandes están reservadas a la vista detalle.
 */
export function AttachmentThumb({
  url,
  type,
  size = "md",
}: {
  url?: string;
  type?: string;
  size?: "sm" | "md";
}) {
  if (!url || !type?.startsWith("image/")) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      loading="lazy"
      className={cn(
        "shrink-0 rounded-md border border-border object-cover bg-muted/30",
        size === "sm" && "size-9",
        size === "md" && "size-12",
      )}
    />
  );
}

