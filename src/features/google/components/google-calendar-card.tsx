"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Calendar, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { disconnectGoogleAction } from "../actions";

/**
 * Card de Google Calendar en /settings. Muestra estado conectado/desconectado
 * y reacciona al ?google=connected|denied|csrf|invalid|no_refresh|error que
 * el callback puede inyectar.
 */
export function GoogleCalendarCard({ connected }: { connected: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  // Toast on mount cuando llegamos del callback OAuth
  const googleParam = searchParams.get("google");
  if (typeof window !== "undefined" && googleParam) {
    handleCallbackFlash(googleParam);
    // Limpia el param para no re-disparar el toast al refresh
    const url = new URL(window.location.href);
    url.searchParams.delete("google");
    window.history.replaceState({}, "", url.pathname + url.search);
  }

  function onDisconnect() {
    startTransition(async () => {
      const result = await disconnectGoogleAction();
      if (result.ok) {
        toast.success("Google Calendar desconectado");
        router.refresh();
      } else {
        toast.error("No se pudo desconectar", { description: result.error });
      }
    });
  }

  return (
    <Card className="p-6">
      <div className="flex items-start gap-3">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
            connected
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-primary/10 text-primary"
          }`}
        >
          <Calendar className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-foreground">
            Google Calendar
            {connected && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs text-emerald-400">
                <CheckCircle2 className="size-3" />
                Conectado
              </span>
            )}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {connected
              ? "Tus eventos con fecha se crean/actualizan automáticamente en tu calendario primario."
              : "Conecta tu cuenta para que las ideas con fecha aparezcan también en Google Calendar."}
          </p>
        </div>
      </div>

      <div className="mt-5">
        {connected ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onDisconnect}
            disabled={pending}
            className="gap-2"
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <XCircle className="size-4" />
            )}
            {pending ? "Desconectando…" : "Desconectar Google Calendar"}
          </Button>
        ) : (
          // <a> en vez de <Link> porque /api/google/connect es un Route Handler
          // que hace redirect inmediato — no es una página Next.
          <Button asChild className="w-full gap-2">
            <a href="/api/google/connect">
              <Calendar className="size-4" />
              Conectar Google Calendar
            </a>
          </Button>
        )}
      </div>
    </Card>
  );
}

function handleCallbackFlash(param: string) {
  // El ?google=X viene del callback. Mostramos toast acorde.
  const messages: Record<string, { type: "success" | "error" | "info"; msg: string; desc?: string }> = {
    connected: { type: "success", msg: "¡Google Calendar conectado!", desc: "Tus eventos se sincronizarán de ahora en adelante." },
    denied: { type: "info", msg: "Conexión cancelada", desc: "No autorizaste el acceso." },
    invalid: { type: "error", msg: "Respuesta inválida de Google" },
    csrf: { type: "error", msg: "Error de seguridad", desc: "Intenta conectar de nuevo desde esta misma pestaña." },
    no_refresh: { type: "error", msg: "Google no devolvió refresh token", desc: "Revoca acceso en myaccount.google.com y reintenta." },
    error: { type: "error", msg: "Algo falló", desc: "Revisa logs en Vercel y reintenta." },
  };
  const m = messages[param];
  if (!m) return;
  // Diferimos para que ocurra después de la primera render
  queueMicrotask(() => {
    if (m.type === "success") toast.success(m.msg, { description: m.desc });
    else if (m.type === "error") toast.error(m.msg, { description: m.desc });
    else toast(m.msg, { description: m.desc });
  });
}
