import { SearchHeader } from "@/features/search/components/search-header";
import { IdeaCard } from "@/features/ideas/components/idea-card";
import { Card } from "@/components/ui/card";
import { SearchIcon } from "lucide-react";
import { searchIdeas, type SearchFilters } from "@/features/search/services/search.service";
import type { IdeaPriority, IdeaStatus } from "@/features/ideas/types/idea";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    priority?: string;
    fav?: string;
  }>;
}

/**
 * Búsqueda como Server Component con searchParams. Ventajas:
 *   - URL compartible: `?q=onboarding&priority=urgent` se puede pegar/bookmark.
 *   - SSR del primer resultado: no flash de "cargando…" → "vacío".
 *   - Forms HTML nativos funcionan sin JS (progressive enhancement).
 *
 * El form vive en SearchHeader (Client Component) para gestionar el input,
 * pero al enviar navega vía URL — el server vuelve a renderizar con los
 * nuevos filtros.
 */
export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters: SearchFilters = {
    query: params.q ?? "",
    status: (params.status as IdeaStatus | "all" | undefined) ?? "all",
    priority: (params.priority as IdeaPriority | "all" | undefined) ?? "all",
    favoritesOnly: params.fav === "1",
  };

  // Solo buscamos si hay algún filtro activo. Evita listar TODO al entrar.
  const hasAnyFilter =
    !!filters.query?.trim() ||
    (filters.status && filters.status !== "all") ||
    (filters.priority && filters.priority !== "all") ||
    filters.favoritesOnly;

  const results = hasAnyFilter ? await searchIdeas(filters) : [];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Buscar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Filtra por palabra, estado, prioridad o favoritas.
        </p>
      </header>

      <SearchHeader initial={filters} />

      {!hasAnyFilter ? (
        <Card className="flex flex-col items-center justify-center px-6 py-12 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <SearchIcon className="size-5" />
          </div>
          <p className="mt-3 text-sm font-medium text-foreground">Empieza a buscar</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Escribe una palabra o aplica un filtro.
          </p>
        </Card>
      ) : results.length === 0 ? (
        <Card className="flex flex-col items-center justify-center px-6 py-12 text-center">
          <p className="text-sm font-medium text-foreground">Sin resultados</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Prueba con otra palabra o relaja los filtros.
          </p>
        </Card>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {results.length} {results.length === 1 ? "resultado" : "resultados"}
          </p>
          <div className="flex flex-col gap-2.5">
            {results.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
