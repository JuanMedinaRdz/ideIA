"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, Sparkles, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SidebarNav } from "./sidebar-nav";
import { NAV_ITEMS, NAV_SECONDARY } from "./nav-items";
import { useUIStore } from "@/store/ui-store";

/** Trigger del sidebar en mobile. Vive en el topbar. */
export function SidebarMobile() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menú">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" title="Navegación">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-2 pb-2"
          onClick={() => setOpen(false)}
        >
          <div className="flex size-7 items-center justify-center rounded-md bg-primary/15 text-primary">
            <Sparkles className="size-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight">ideIA</span>
        </Link>

        <Button
          size="sm"
          className="justify-start gap-2"
          onClick={() => {
            useUIStore.getState().setNewIdeaOpen(true);
            setOpen(false);
          }}
        >
          <Plus className="size-4" />
          Nueva idea
        </Button>

        <SidebarNav items={NAV_ITEMS} onNavigate={() => setOpen(false)} />
        <Separator />
        <SidebarNav items={NAV_SECONDARY} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
