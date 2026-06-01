import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LoginForm } from "@/features/auth/components/login-form";

/**
 * Login con Magic Link. Una sola página para login + signup — Supabase crea
 * el usuario en el primer intento. Menos fricción, menos código.
 *
 * Decisión TDAH: un solo input, un solo botón. Ninguna decisión secundaria
 * compite con la acción primaria (proveer email).
 */
export default async function LoginPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Entra a ideIA</h1>
        <p className="text-sm text-muted-foreground">
          Te enviamos un código de 6 dígitos — sin contraseñas que recordar.
        </p>
      </div>
      <LoginForm />
      <p className="text-center text-xs text-muted-foreground">
        Si es tu primera vez, también crea tu cuenta automáticamente.
      </p>
    </div>
  );
}
