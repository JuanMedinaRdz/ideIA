import { Skeleton } from "@/components/ui/skeleton";

export default function KanbanLoading() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5">
      <header className="space-y-2">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-64" />
      </header>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, col) => (
          <div
            key={col}
            className="flex h-full min-h-[400px] flex-col gap-3 rounded-xl border border-border bg-muted/30 p-3"
          >
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-6 rounded" />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              {Array.from({ length: 3 }).map((_, card) => (
                <div
                  key={card}
                  className="flex gap-1.5 rounded-xl border border-border bg-card/40 p-2.5"
                >
                  <Skeleton className="size-3.5" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-2 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
