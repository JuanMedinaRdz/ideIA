import { cn } from "@/lib/utils";

/**
 * Tecla visual para hints (⌘K, Esc, etc.). Útil para reforzar atajos en la UI
 * y reducir la dependencia de la memoria — clave para flujos TDAH-friendly.
 */
export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 items-center justify-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
