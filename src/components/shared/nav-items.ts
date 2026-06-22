import {
  LayoutDashboard,
  Inbox,
  KanbanSquare,
  Calendar,
  BookOpen,
  Search,
  Sparkles,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Atajo de teclado opcional (se renderiza en el Kbd al lado). */
  shortcut?: string;
}

/**
 * Una sola fuente de verdad para la navegación. Se usa en Sidebar y en
 * Command Palette — así nunca se desincronizan.
 */
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, shortcut: "G D" },
  { label: "Inbox", href: "/inbox", icon: Inbox, shortcut: "G I" },
  { label: "Kanban", href: "/kanban", icon: KanbanSquare, shortcut: "G K" },
  { label: "Calendario", href: "/calendar", icon: Calendar, shortcut: "G C" },
  { label: "Tutoriales", href: "/tutorials", icon: BookOpen, shortcut: "G T" },
  { label: "Buscar", href: "/search", icon: Search, shortcut: "/" },
  { label: "Insights IA", href: "/insights", icon: Sparkles },
];

export const NAV_SECONDARY: NavItem[] = [
  { label: "Ajustes", href: "/settings", icon: Settings },
];
