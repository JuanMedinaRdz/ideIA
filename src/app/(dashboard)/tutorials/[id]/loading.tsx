import { Skeleton } from "@/components/ui/skeleton";

export default function TutorialDetailLoading() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <Skeleton className="h-4 w-32" />
      <div className="space-y-3">
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-4 w-full" />
      </div>
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[420px] w-72 shrink-0 rounded-xl" />
        ))}
        <Skeleton className="h-[420px] w-20 shrink-0 rounded-xl" />
      </div>
    </div>
  );
}
