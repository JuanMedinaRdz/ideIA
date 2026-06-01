import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { IdeaCard } from "@/features/ideas/components/idea-card";
import { NewIdeaDialog } from "@/features/ideas/components/new-idea-dialog";
import { StaggerList } from "@/components/shared/stagger-list";
import { getIdeas } from "@/features/ideas/services/ideas.service";

export default async function InboxPage() {
  const all = await getIdeas();
  const ideas = all.filter((i) => i.status !== "archived");

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inbox</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Una sola pila — sin sub-bandejas para reducir decisión.
          </p>
        </div>
        <NewIdeaDialog />
      </header>

      {ideas.length === 0 ? (
        <Card className="flex flex-col items-center justify-center px-6 py-12 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="size-5" />
          </div>
          <p className="mt-3 text-sm font-medium text-foreground">Tu inbox está vacío</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Captura tu primera idea para empezar.
          </p>
        </Card>
      ) : (
        <StaggerList className="flex flex-col gap-2.5">
          {ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </StaggerList>
      )}
    </div>
  );
}
