"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Loader2, Copy, Check, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { generatePairingCodeAction } from "../services/pairing.actions";

interface ActivePairing {
  code: string;
  expiresAt: string;
}

/**
 * UX de emparejamiento WhatsApp ↔ usuario.
 *
 * Decisiones TDAH:
 *  - Si NO hay código activo: una sola CTA grande, sin opciones secundarias.
 *  - Si hay código: el código en grande, instrucciones numeradas (1-2-3) y
 *    countdown visible para evitar la ansiedad de "¿sigue siendo válido?".
 *  - Botón "Copiar" da feedback inmediato con check verde 2s.
 */
export function PairingCard({ initial }: { initial: ActivePairing | null }) {
  const [active, setActive] = useState<ActivePairing | null>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  function generate() {
    setError(null);
    startTransition(async () => {
      const result = await generatePairingCodeAction();
      if (result.ok) {
        setActive(result.data);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function copy() {
    if (!active) return;
    navigator.clipboard.writeText(active.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="p-6">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <MessageSquare className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-foreground">Conectar WhatsApp</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Envía ideas desde tu chat — la IA las organiza aquí automáticamente.
          </p>
        </div>
      </div>

      {!active ? (
        <div className="mt-5">
          <Button onClick={generate} disabled={pending} className="w-full gap-2">
            {pending && <Loader2 className="size-4 animate-spin" />}
            {pending ? "Generando…" : "Generar código de emparejamiento"}
          </Button>
          {error && (
            <p role="alert" className="mt-2 text-xs text-destructive">
              {error}
            </p>
          )}
        </div>
      ) : (
        <ActivePairingView active={active} pending={pending} onRefresh={generate} onCopy={copy} copied={copied} />
      )}
    </Card>
  );
}

function ActivePairingView({
  active,
  pending,
  onRefresh,
  onCopy,
  copied,
}: {
  active: ActivePairing;
  pending: boolean;
  onRefresh: () => void;
  onCopy: () => void;
  copied: boolean;
}) {
  const remaining = useCountdown(active.expiresAt);
  const expired = remaining <= 0;

  return (
    <div className="mt-5 space-y-4">
      {/* Código grande */}
      <div className="rounded-xl border border-border bg-card/60 p-5 text-center">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Tu código
        </p>
        <p className="mt-1 font-mono text-4xl font-semibold tracking-[0.3em] tabular-nums">
          {expired ? "------" : active.code}
        </p>
        <div className="mt-3 flex items-center justify-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onCopy}
            disabled={expired}
            className="gap-1.5"
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-emerald-400" /> Copiado
              </>
            ) : (
              <>
                <Copy className="size-3.5" /> Copiar
              </>
            )}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onRefresh}
            disabled={pending}
            className="gap-1.5"
          >
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />}
            Renovar
          </Button>
        </div>
        <p className={`mt-3 text-xs ${expired ? "text-destructive" : "text-muted-foreground"}`}>
          {expired
            ? "Caducado. Genera uno nuevo."
            : `Caduca en ${formatRemaining(remaining)}`}
        </p>
      </div>

      {/* Pasos */}
      <ol className="space-y-2 text-xs text-muted-foreground">
        <Step n={1}>Abre WhatsApp y busca el bot de ideIA.</Step>
        <Step n={2}>
          Envía el código <span className="font-mono text-foreground">{active.code}</span>.
        </Step>
        <Step n={3}>Listo. Tus próximos mensajes aparecerán aquí.</Step>
      </ol>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-[10px] font-medium text-foreground">
        {n}
      </span>
      <span className="pt-0.5">{children}</span>
    </li>
  );
}

/** Recalcula cada segundo el tiempo restante hasta `expiresAt`. */
function useCountdown(expiresAt: string): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return Math.max(0, new Date(expiresAt).getTime() - now);
}

function formatRemaining(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
