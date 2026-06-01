import { getIdeas } from "@/features/ideas/services/ideas.service";
import { KanbanBoard } from "@/features/ideas/components/kanban-board";

export default async function KanbanPage() {
  const ideas = await getIdeas();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Kanban</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Arrastra las ideas entre columnas para cambiar su estado.
        </p>
      </header>
      <KanbanBoard initialIdeas={ideas} />
    </div>
  );
}
