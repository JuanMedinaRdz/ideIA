import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center py-20 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <BookOpen className="size-6" />
      </div>
      <h1 className="mt-4 text-xl font-semibold">Tutorial no encontrado</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Puede que lo hayas borrado o que nunca haya existido.
      </p>
      <Button asChild className="mt-6">
        <Link href="/tutorials">Ver mis tutoriales</Link>
      </Button>
    </div>
  );
}
