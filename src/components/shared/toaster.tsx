"use client";

import { Toaster as Sonner } from "sonner";

/**
 * Toaster global. Posición bottom-right (estándar Linear/Vercel) — no tapa
 * el contenido principal y queda fuera del path del cursor común.
 *
 * Decisión TDAH: 4s de duración por defecto (los toasts efímeros sub-3s son
 * estresantes para usuarios con TDAH que no llegan a leerlos). Cerrables con
 * click para los que quieran descartar antes.
 */
export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      duration={4000}
      closeButton
      richColors={false}
      toastOptions={{
        classNames: {
          toast:
            "group toast border border-border bg-popover text-popover-foreground shadow-lg",
          description: "text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-muted text-muted-foreground",
        },
      }}
    />
  );
}
