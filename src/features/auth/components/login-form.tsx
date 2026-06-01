"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail, Loader2, ArrowLeft, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestEmailOtp, verifyEmailOtp } from "../actions";

/**
 * Login en dos pasos con código OTP:
 *   1. Email   → "Enviar código"
 *   2. Código  → "Entrar"
 *
 * Estados explícitos (TDAH-friendly):
 *   - email step: input + botón. Si error, mensaje debajo.
 *   - code step: input grande para 6 dígitos (autocomplete=one-time-code → iOS
 *     autollena desde el SMS/Mail), botón "Volver" arriba para corregir email.
 *
 * No usamos `inputMode="numeric"` solo porque queremos permitir copy/paste
 * desde el correo (algunos teclados móviles ocultan opciones útiles).
 */
export function LoginForm() {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onRequest(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await requestEmailOtp(email);
      if (result.ok) {
        setStep("code");
        setCode("");
      } else {
        setError(result.error);
      }
    });
  }

  function onVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await verifyEmailOtp(email, code);
      if (result.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  if (step === "code") {
    return (
      <form onSubmit={onVerify} className="space-y-4">
        <button
          type="button"
          onClick={() => {
            setStep("email");
            setError(null);
          }}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-3" /> Cambiar email
        </button>

        <div className="rounded-lg border border-border bg-card/40 p-3 text-xs">
          <p className="text-muted-foreground">Te enviamos un código a</p>
          <p className="mt-0.5 truncate text-foreground">{email}</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="code" className="sr-only">
            Código de verificación
          </label>
          <Input
            id="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            autoFocus
            maxLength={10}
            placeholder="••••••"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            disabled={pending}
            className="text-center font-mono text-2xl tracking-[0.4em]"
            aria-invalid={error ? true : undefined}
          />
          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full gap-2"
          disabled={pending || code.length < 6}
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
          {pending ? "Verificando…" : "Entrar"}
        </Button>

        <p className="text-center text-[11px] text-muted-foreground">
          ¿No te llegó? Revisa spam o vuelve a pedirlo en 1 min.
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={onRequest} className="space-y-3">
      <div>
        <label htmlFor="email" className="sr-only">
          Email
        </label>
        <Input
          id="email"
          type="email"
          required
          autoComplete="email"
          autoFocus
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={pending}
          aria-invalid={error ? true : undefined}
        />
        {error && (
          <p role="alert" className="mt-1.5 text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
      <Button type="submit" className="w-full gap-2" disabled={pending || !email}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
        {pending ? "Enviando…" : "Enviar código"}
      </Button>
    </form>
  );
}
