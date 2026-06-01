"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Kbd } from "@/components/ui/kbd";
import type { NavItem } from "./nav-items";

/**
 * Lista de navegación reutilizada por SidebarDesktop y SidebarMobile (Sheet).
 *
 * Decisión TDAH: el item activo no usa fondo brillante (distrae), sino una
 * barra lateral fina + texto en foreground completo. El resto va atenuado
 * para que el ojo siempre encuentre primero dónde está.
 */
export function SidebarNav({
  items,
  onNavigate,
}: {
  items: NavItem[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group relative flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
              isActive
                ? "bg-accent/60 text-foreground"
                : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
            )}
          >
            {isActive && (
              <span
                aria-hidden
                className="absolute -left-2 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-primary"
              />
            )}
            <Icon className="size-4 shrink-0" />
            <span className="flex-1 truncate">{item.label}</span>
            {item.shortcut && (
              <span className="opacity-0 transition-opacity group-hover:opacity-100">
                <Kbd>{item.shortcut}</Kbd>
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
