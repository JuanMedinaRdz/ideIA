import { Skeleton } from "@/components/ui/skeleton";

export default function TutorialsLoading() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <header className="flex items-end justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-8 w-32 rounded-md" />
      </header>
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
