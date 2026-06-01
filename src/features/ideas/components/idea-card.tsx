import Link from "next/link";
import { Star, MessageSquare, Mic, Image as ImageIcon, Globe } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PriorityDot } from "./priority-dot";
import { AttachmentBadge } from "./attachment-preview";
import { timeAgo } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { Idea, IdeaSource } from "@/features/ideas/types/idea";

const SOURCE_ICONS: Record<IdeaSource, React.ComponentType<{ className?: string }>> = {
  whatsapp: MessageSquare,
  voice: Mic,
  image: ImageIcon,
  web: Globe,
};

/**
 * Idea card minimalista. Decisiones TDAH:
 *  - Título grande y limpio (lo primero que el ojo encuentra).
 *  - Summary truncado a 2 líneas (line-clamp-2) → no satura.
 *  - Tags y meta abajo, atenuados → contexto sin protagonismo.
 *  - Toda la card es clickable (área grande) y tiene hover sutil.
 */
export function IdeaCard({ idea }: { idea: Idea }) {
  const SourceIcon = SOURCE_ICONS[idea.source];

  return (
    <Link
      href={`/ideas/${idea.id}`}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-xl"
    >
    <Card
      className={cn(
        "group cursor-pointer p-4 transition-all hover:border-primary/30 hover:bg-card/70",
        idea.priority === "urgent" && "border-destructive/30",
      )}
    >
      <div className="flex items-start gap-3">
        <PriorityDot priority={idea.priority} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-medium leading-snug text-foreground line-clamp-1">
              {idea.title}
            </h3>
            {idea.isFavorite && (
              <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" aria-label="Favorita" />
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{idea.summary}</p>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <SourceIcon className="size-3" />
              {idea.category}
            </span>
            <span aria-hidden>·</span>
            <span>{timeAgo(idea.createdAt)}</span>
            {idea.attachmentType && (
              <>
                <span aria-hidden>·</span>
                <AttachmentBadge type={idea.attachmentType} />
              </>
            )}
            {idea.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded border border-border/60 bg-muted/40 px-1.5 py-0.5 text-[10px]"
              >
                {tag}
              </span>
            ))}
            {idea.tags.length > 2 && (
              <span className="text-[10px]">+{idea.tags.length - 2}</span>
            )}
          </div>
        </div>
      </div>
    </Card>
    </Link>
  );
}
