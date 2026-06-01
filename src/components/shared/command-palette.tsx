"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { Plus, Focus, Inbox } from "lucide-react";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { useUIStore } from "@/store/ui-store";
import { NAV_ITEMS } from "./nav-items";

/**
 * Command Palette — la navegación primaria de la app (⌘K).
 *
 * Por qué es central en una app TDAH-friendly:
 *  - Reduce la carga cognitiva de "explorar menús para encontrar X".
 *  - Funciona desde cualquier pantalla, sin perder el contexto actual.
 *  - El input acepta búsqueda fuzzy: el usuario escribe lo que recuerda.
 *
 * Atajo global: Cmd/Ctrl + K. Se enchufa con un keydown listener a nivel ventana.
 */
export function CommandPalette() {
  const open = useUIStore((s) => s.commandPaletteOpen);
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const toggleFocusMode = useUIStore((s) => s.toggleFocusMode);
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);

  function runCommand(fn: () => void) {
    setOpen(false);
    // Defer para que el cierre del dialog no compita con la nav.
    setTimeout(fn, 0);
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-1/2 top-[20%] z-50 w-[92vw] max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-popover shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <VisuallyHidden.Root>
            <DialogPrimitive.Title>Paleta de comandos</DialogPrimitive.Title>
          </VisuallyHidden.Root>
          <Command>
            <CommandInput placeholder="Escribe un comando o busca…" />
            <CommandList>
              <CommandEmpty>Sin resultados.</CommandEmpty>

              <CommandGroup heading="Acciones">
                <CommandItem
                  onSelect={() =>
                    runCommand(() => useUIStore.getState().setNewIdeaOpen(true))
                  }
                >
                  <Plus />
                  Nueva idea
                </CommandItem>
                <CommandItem onSelect={() => runCommand(toggleFocusMode)}>
                  <Focus />
                  Alternar Focus Mode
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push("/inbox"))}>
                  <Inbox />
                  Abrir Inbox
                </CommandItem>
              </CommandGroup>

              <CommandSeparator />

              <CommandGroup heading="Navegación">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <CommandItem
                      key={item.href}
                      onSelect={() => runCommand(() => router.push(item.href))}
                    >
                      <Icon />
                      {item.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
