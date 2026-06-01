"use client";

import Link from "next/link";
import { Sparkles, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarNav } from "./sidebar-nav";
import { NAV_ITEMS, NAV_SECONDARY } from "./nav-items";
import { useUIStore } from "@/store/ui-store";

/**
 * Sidebar de escritorio. En mobile no se renderiza — usamos un Sheet desde
 * el topbar para ahorrar pantalla.
 *
 * Decisión TDAH:
 * - Sin badges ni contadores rojos (genera ansiedad pasiva).
 * - Una sola acción primaria: "Nueva idea" (botón con primary).
 * - Resto de navegación: links neutros, atajos visibles en hover.
 */
export function Sidebar() {
  const focusMode = useUIStore((s) => s.focusMode);

  // En focus mode el sidebar desaparece — el usuario quiere cero distracciones.
  if (focusMode) return null;

  return (
    <aside className="hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-card/30 px-3 py-4 md:flex">
      <Link href="/dashboard" className="flex items-center gap-2 px-2 pb-4">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary/15 text-primary">
          <Sparkles className="size-4" />
        </div>
        <span className="text-sm font-semibold tracking-tight">ideIA</span>
      </Link>

      <Button
        size="sm"
        className="mb-4 justify-start gap-2"
        onClick={() => useUIStore.getState().setNewIdeaOpen(true)}
      >
        <Plus className="size-4" />
        Nueva idea
      </Button>

      <SidebarNav items={NAV_ITEMS} />

      <Separator className="my-4" />

      <SidebarNav items={NAV_SECONDARY} />

      <div className="mt-auto rounded-lg border border-border bg-card/40 p-3">
        <p className="text-xs font-medium text-foreground">Conecta WhatsApp</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Envía ideas desde tu chat y aparecen aquí automáticamente.
        </p>
        <Button variant="outline" size="sm" className="mt-2 w-full">
          Conectar
        </Button>
      </div>
    </aside>
  );
}
