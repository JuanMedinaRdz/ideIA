import { Inbox, Sparkles, CheckCircle2, Flame, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IdeaCard } from "@/features/ideas/components/idea-card";
import { NewIdeaDialog } from "@/features/ideas/components/new-idea-dialog";
import { getIdeas, getIdeaStats } from "@/features/ideas/services/ideas.service";
import { timeAgo } from "@/lib/date";

/**
 * Dashboard real. Server Component: corre en el server, lee Supabase con la
 * sesión del usuario via cookies, y entrega HTML ya renderizado.
 *
 * El `Promise.all` paraleliza las dos queries. En la práctica son una sola
 * query Postgres por debajo, pero el patrón importa cuando crecen las
 * fuentes de datos.
 */
export default async function DashboardPage() {
  const [ideas, stats] = await Promise.all([getIdeas(), getIdeaStats()]);
  const recent = ideas.slice(0, 4);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Hola</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {stats.inbox === 0 ? (
              <>Tu inbox está limpio. <span className="text-primary">✨</span></>
            ) : (
              <>
                Tienes <span className="text-primary">{stats.inbox}</span> ideas esperando.
              </>
            )}
          </h1>
        </div>
        <NewIdeaDialog
          trigger={
            <Button size="lg" className="gap-2 self-start sm:self-end">
              <Sparkles className="size-4" />
              Capturar idea
            </Button>
          }
        />
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Inbox" value={stats.inbox} icon={<Inbox />} />
        <MetricCard label="Urgentes" value={stats.urgent} icon={<Flame />} accent />
        <MetricCard label="Nuevas hoy" value={stats.newToday} icon={<Sparkles />} />
        <MetricCard label="Completadas" value={stats.done} icon={<CheckCircle2 />} />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-medium text-foreground">Ideas recientes</h2>
            <Link
              href="/inbox"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground transition hover:text-foreground"
            >
              Ver todas <ArrowUpRight className="size-3" />
            </Link>
          </div>
          {recent.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {recent.map((idea) => (
                <IdeaCard key={idea.id} idea={idea} />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </div>

        <aside className="flex flex-col gap-6">
          <div>
            <h2 className="mb-3 text-sm font-medium text-foreground">Actividad IA</h2>
            <Card className="divide-y divide-border">
              {ideas.length === 0 ? (
                <p className="p-4 text-xs text-muted-foreground">
                  Cuando captures tu primera idea, la verás aquí.
                </p>
              ) : (
                ideas.slice(0, 4).map((idea) => (
                  <div key={idea.id} className="flex gap-3 p-3">
                    <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Sparkles className="size-3" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-foreground line-clamp-1">
                        Estructuré <span className="font-medium">{idea.title}</span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {timeAgo(idea.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </Card>
          </div>

          <Card className="p-4">
            <h3 className="text-sm font-medium">Conecta WhatsApp</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              En Fase 4 conectamos n8n para que envíes ideas desde tu chat.
            </p>
          </Card>
        </aside>
      </section>
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Sparkles className="size-5" />
      </div>
      <p className="mt-3 text-sm font-medium text-foreground">Aún no has capturado ideas</p>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">
        Pulsa <span className="text-foreground">⌘K</span> y escribe "nueva idea", o usa el botón
        de arriba.
      </p>
      <div className="mt-4">
        <NewIdeaDialog />
      </div>
    </Card>
  );
}

function MetricCard({
  label,
  value,
  icon,
  accent = false,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span
          className={`flex size-6 items-center justify-center rounded-md ${
            accent ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
          } [&_svg]:size-3.5`}
        >
          {icon}
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
    </Card>
  );
}
