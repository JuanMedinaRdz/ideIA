import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

/**
 * Skeleton que IMITA la forma exacta del IdeaCard. Esto es crítico para
 * usuarios con TDAH: el ojo se ancla en la silueta y la transición a
 * contenido real no produce salto visual (CLS).
 */
export function IdeaCardSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="mt-1.5 size-1.5 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-14" />
          </div>
        </div>
      </div>
    </Card>
  );
}

export function IdeaListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2.5">
      {Array.from({ length: count }).map((_, i) => (
        <IdeaCardSkeleton key={i} />
      ))}
    </div>
  );
}
