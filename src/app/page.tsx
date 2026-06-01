import Link from "next/link";
import { ArrowRight, MessageSquareText, Sparkles, Zap } from "lucide-react";

/**
 * Landing minimalista. Sirve dos propósitos:
 *  1. Mostrar de qué va la app.
 *  2. Verificar que el theme dark + tokens HSL renderizan correctamente.
 *
 * En Fase 2 reemplazaremos esto por la home pública real (hero + features +
 * CTA a /signup) y moveremos el dashboard a (dashboard)/dashboard.
 */
export default function Home() {
  return (
    <main className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]"
      />

      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
          <Sparkles className="size-3 text-primary" />
          Fase 1 — Setup completado
        </span>

        <h1 className="mt-6 text-5xl font-semibold tracking-tight sm:text-6xl">
          Captura ideas.
          <br />
          <span className="bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
            Deja que la IA las organice.
          </span>
        </h1>

        <p className="mt-6 max-w-lg text-balance text-base text-muted-foreground sm:text-lg">
          Envía un mensaje a WhatsApp — texto, voz o imagen — y aparece estructurado,
          categorizado y listo para accionar en tu workspace.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Ir al dashboard
            <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="#"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/50 px-5 py-2.5 text-sm font-medium text-foreground backdrop-blur-sm transition hover:bg-card"
          >
            Conectar WhatsApp
          </Link>
        </div>

        <div className="mt-16 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
          <FeatureCard
            icon={<MessageSquareText className="size-4" />}
            title="Captura sin fricción"
            description="Texto, voz e imagen desde el chat que ya usas."
          />
          <FeatureCard
            icon={<Sparkles className="size-4" />}
            title="Organización IA"
            description="Título, resumen, tags y prioridad automáticos."
          />
          <FeatureCard
            icon={<Zap className="size-4" />}
            title="Acción inmediata"
            description="Próximos pasos sugeridos por contexto."
          />
        </div>
      </div>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-4 text-left backdrop-blur-sm transition hover:bg-card/70">
      <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mt-3 text-sm font-medium text-foreground">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
