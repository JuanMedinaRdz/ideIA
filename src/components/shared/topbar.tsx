"use client";

import { Search, Focus, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { SidebarMobile } from "./sidebar-mobile";
import { useUIStore } from "@/store/ui-store";
import { signOut } from "@/features/auth/actions";

function initialsFromEmail(email?: string) {
  if (!email) return "??";
  const name = email.split("@")[0];
  const parts = name.split(/[._-]/).filter(Boolean);
  return (parts[0]?.[0] ?? "?").toUpperCase() + (parts[1]?.[0]?.toUpperCase() ?? "");
}

export function Topbar({ userEmail }: { userEmail?: string }) {
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const toggleFocusMode = useUIStore((s) => s.toggleFocusMode);
  const focusMode = useUIStore((s) => s.focusMode);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/70 px-4 backdrop-blur-md">
      <SidebarMobile />

      <button
        type="button"
        onClick={() => setCommandPaletteOpen(true)}
        className="group flex h-9 flex-1 items-center gap-2 rounded-md border border-border bg-card/40 px-3 text-sm text-muted-foreground transition hover:bg-card md:max-w-sm"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Buscar o ejecutar acción…</span>
        <Kbd>⌘K</Kbd>
      </button>

      <div className="ml-auto flex items-center gap-1">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={focusMode ? "default" : "ghost"}
                size="icon"
                onClick={toggleFocusMode}
                aria-label="Alternar Focus Mode"
                aria-pressed={focusMode}
              >
                <Focus className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Focus Mode</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Cuenta">
              <Avatar>
                <AvatarFallback>{initialsFromEmail(userEmail)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">Sesión</span>
                <span className="truncate text-sm text-foreground">{userEmail ?? "—"}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/settings">Ajustes</a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* La Server Action se invoca vía form action — Next la serializa
                automáticamente y no requiere un onClick + fetch manual. */}
            <form action={signOut}>
              <DropdownMenuItem asChild>
                <button type="submit" className="w-full text-left">
                  <LogOut />
                  Cerrar sesión
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
