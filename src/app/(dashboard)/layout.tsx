import { redirect } from "next/navigation";
import { Sidebar } from "@/components/shared/sidebar";
import { Topbar } from "@/components/shared/topbar";
import { CommandPalette } from "@/components/shared/command-palette";
import { NewIdeaDialogGlobal } from "@/features/ideas/components/new-idea-dialog-global";
import { Toaster } from "@/components/shared/toaster";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Layout de rutas autenticadas.
 *
 * `getUser()` revalida el token contra Supabase (no confía en cookies).
 * Si no hay usuario, redirigimos a /login. Las páginas hijas asumen que
 * `user` existe — no necesitan repetir el check.
 *
 * `force-dynamic`: necesario porque dependemos de cookies — sin esto Next
 * intentaría prerenderizar la página estáticamente y fallaría.
 */
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar userEmail={user.email ?? undefined} />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
      <CommandPalette />
      <NewIdeaDialogGlobal />
      <Toaster />
    </div>
  );
}
