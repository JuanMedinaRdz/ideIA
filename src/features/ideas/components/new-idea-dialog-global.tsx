"use client";

import { useUIStore } from "@/store/ui-store";
import { NewIdeaDialog } from "./new-idea-dialog";

/**
 * Instancia global del dialog, controlada por la store. Se monta una sola vez
 * en el layout — así cualquier componente (sidebar, palette, atajos de teclado)
 * puede abrirlo con `setNewIdeaOpen(true)` sin necesidad de un trigger local.
 */
export function NewIdeaDialogGlobal() {
  const open = useUIStore((s) => s.newIdeaOpen);
  const setOpen = useUIStore((s) => s.setNewIdeaOpen);
  return <NewIdeaDialog open={open} onOpenChange={setOpen} />;
}
