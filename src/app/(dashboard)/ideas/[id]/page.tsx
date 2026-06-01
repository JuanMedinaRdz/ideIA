import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getIdeaById } from "@/features/ideas/services/ideas.service";
import { IdeaDetail } from "@/features/ideas/components/idea-detail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function IdeaDetailPage({ params }: PageProps) {
  const { id } = await params;
  const idea = await getIdeaById(id);

  if (!idea) notFound();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <Link
        href="/inbox"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="size-3" />
        Volver al inbox
      </Link>
      <IdeaDetail idea={idea} />
    </div>
  );
}
