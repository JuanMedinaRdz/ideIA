import { Skeleton } from "@/components/ui/skeleton";
import { IdeaListSkeleton } from "@/features/ideas/components/idea-card-skeleton";

export default function InboxLoading() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <header className="flex items-end justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-8 w-28 rounded-md" />
      </header>
      <IdeaListSkeleton count={5} />
    </div>
  );
}
