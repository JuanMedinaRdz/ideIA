// Zustand store para estado de UI puramente cliente (sidebar abierto, focus mode,
// command palette, etc.). NO ponemos aquí datos del servidor: eso es trabajo
// de TanStack Query — mezclar ambos lleva a estado duplicado y bugs sutiles.
import { create } from "zustand";

type UIState = {
  sidebarOpen: boolean;
  focusMode: boolean;
  commandPaletteOpen: boolean;
  newIdeaOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleFocusMode: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setNewIdeaOpen: (open: boolean) => void;
};

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  focusMode: false,
  commandPaletteOpen: false,
  newIdeaOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode })),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setNewIdeaOpen: (open) => set({ newIdeaOpen: open }),
}));
