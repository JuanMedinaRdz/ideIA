import Link from "next/link";
import { Sparkles } from "lucide-react";

/**
 * Layout para rutas de auth. Centrado, sin sidebar, sin distracciones.
 * Si el usuario ya tiene sesión, lo redirigimos al dashboard en cada page
 * individual (no aquí, para que un usuario con sesión expirada vea la
 * página correctamente).
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]"
      />

      <Link
        href="/"
        className="mb-10 inline-flex items-center gap-2 text-sm font-semibold tracking-tight"
      >
        <div className="flex size-7 items-center justify-center rounded-md bg-primary/15 text-primary">
          <Sparkles className="size-4" />
        </div>
        ideIA
      </Link>

      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
