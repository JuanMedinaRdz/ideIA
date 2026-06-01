import { cn } from "@/lib/utils";

/**
 * Skeleton loader. Para personas con TDAH es importante que el loading se sienta
 * predecible: el skeleton imita la forma final del contenido, así el ojo se ancla.
 * La animación es sutil (opacity pulse) y respeta prefers-reduced-motion vía
 * `motion-safe:`. En reduced-motion queda como un bloque estático.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-md bg-muted/60 motion-safe:animate-pulse",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
