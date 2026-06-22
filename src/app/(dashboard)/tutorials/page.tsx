import { BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getTutorials } from "@/features/tutorials/services/tutorials.service";
import { TutorialCard } from "@/features/tutorials/components/tutorial-card";
import { NewTutorialButton } from "@/features/tutorials/components/new-tutorial-button";

export default async function TutorialsPage() {
  const tutorials = await getTutorials();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tutoriales</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Guías paso a paso con imágenes. Útil para tu setup, procesos, recetas o cualquier
            cosa que repites.
          </p>
        </div>
        <NewTutorialButton />
      </header>

      {tutorials.length === 0 ? (
        <Card className="flex flex-col items-center justify-center px-6 py-12 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <BookOpen className="size-5" />
          </div>
          <p className="mt-3 text-sm font-medium text-foreground">Sin tutoriales aún</p>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">
            Crea tu primer tutorial — un paso a la vez, con la opción de adjuntar imágenes
            en cada uno.
          </p>
          <div className="mt-4">
            <NewTutorialButton />
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-2.5">
          {tutorials.map((t) => (
            <TutorialCard key={t.id} tutorial={t} />
          ))}
        </div>
      )}
    </div>
  );
}
