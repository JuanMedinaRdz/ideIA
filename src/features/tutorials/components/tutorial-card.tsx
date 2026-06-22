import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { timeAgo } from "@/lib/date";
import type { Tutorial } from "../types/tutorial";

/**
 * Card de tutorial en la lista /tutorials. Coherente con IdeaCard.
 *
 * Hover: border-color (sutil) + ARROW translate 2px en X. Press: scale(0.98).
 * Sub-200ms. Cubic-bezier ease-out-strong via CSS var.
 */
export function TutorialCard({ tutorial }: { tutorial: Tutorial }) {
  return (
    <Link
      href={`/tutorials/${tutorial.id}`}
      className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card
        className="group flex items-start gap-3 p-4 transition-colors hover:border-primary/30 active:scale-[0.99]"
        style={{
          transitionDuration: "180ms",
          transitionTimingFunction: "var(--ease-out-strong)",
        }}
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <BookOpen className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium text-foreground line-clamp-1">{tutorial.title}</h3>
          {tutorial.description && (
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
              {tutorial.description}
            </p>
          )}
          <p className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">
            actualizado {timeAgo(tutorial.updatedAt)}
          </p>
        </div>
        <ArrowRight
          className="size-3.5 shrink-0 self-center text-muted-foreground/60 transition-transform group-hover:translate-x-0.5"
          style={{
            transitionDuration: "180ms",
            transitionTimingFunction: "var(--ease-out-strong)",
          }}
        />
      </Card>
    </Link>
  );
}
