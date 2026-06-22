import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  getTutorialById,
  getTutorials,
} from "@/features/tutorials/services/tutorials.service";
import { TutorialEditor } from "@/features/tutorials/components/tutorial-editor";
import { TutorialCard } from "@/features/tutorials/components/tutorial-card";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TutorialDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [tutorial, allTutorials] = await Promise.all([getTutorialById(id), getTutorials()]);

  if (!tutorial) notFound();

  // Otros tutoriales = todos menos el actual, máx 6.
  const others = allTutorials.filter((t) => t.id !== id).slice(0, 6);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <Link
        href="/tutorials"
        className="inline-flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        style={{ transitionDuration: "180ms", transitionTimingFunction: "var(--ease-out-strong)" }}
      >
        <ArrowLeft className="size-3" />
        Volver a tutoriales
      </Link>

      <TutorialEditor tutorial={tutorial} />

      {others.length > 0 && (
        <section className="mt-4 border-t border-border pt-6">
          <h2 className="mb-3 text-sm font-medium text-foreground">Más tutoriales</h2>
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
            {others.map((t) => (
              <TutorialCard key={t.id} tutorial={t} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
