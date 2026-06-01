import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { IdeaListSkeleton } from "@/features/ideas/components/idea-card-skeleton";

/**
 * loading.tsx en Next.js App Router: Next automáticamente renderiza esto
 * mientras el Server Component padre está fetching data. Reemplaza el
 * "loading" abstracto por una silueta predecible.
 */
export default function DashboardLoading() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-72" />
        </div>
        <Skeleton className="h-10 w-36 rounded-md" />
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="size-6 rounded-md" />
            </div>
            <Skeleton className="mt-2 h-8 w-10" />
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Skeleton className="mb-3 h-4 w-32" />
          <IdeaListSkeleton count={4} />
        </div>
        <aside className="space-y-4">
          <Skeleton className="h-4 w-24" />
          <Card className="space-y-3 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="size-6 rounded-md" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-2 w-16" />
                </div>
              </div>
            ))}
          </Card>
        </aside>
      </section>
    </div>
  );
}
