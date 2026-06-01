"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search as SearchIcon, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SearchFilters } from "../services/search.service";
import type { IdeaPriority, IdeaStatus } from "@/features/ideas/types/idea";

const STATUSES: { value: IdeaStatus | "all"; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "inbox", label: "Inbox" },
  { value: "in_progress", label: "En curso" },
  { value: "done", label: "Hechas" },
  { value: "archived", label: "Archivadas" },
];

const PRIORITIES: { value: IdeaPriority | "all"; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "low", label: "Baja" },
  { value: "medium", label: "Media" },
  { value: "high", label: "Alta" },
  { value: "urgent", label: "Urgente" },
];

/**
 * Header de búsqueda. Empuja los cambios a la URL — la página se re-renderiza
 * server-side con los nuevos filtros. Sin estado duplicado, sin client-side
 * filtering, sin desync.
 *
 * useTransition envuelve router.push para que el indicador de loading no
 * bloquee la UI mientras Next va al server.
 */
export function SearchHeader({ initial }: { initial: SearchFilters }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(initial.query ?? "");

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || value === "" || value === "all" || value === "0") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    startTransition(() => {
      router.push(`/search?${params.toString()}`);
    });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateParam("q", query.trim());
  }

  function clearAll() {
    setQuery("");
    startTransition(() => {
      router.push("/search");
    });
  }

  const hasFilters =
    !!query ||
    (initial.status && initial.status !== "all") ||
    (initial.priority && initial.priority !== "all") ||
    initial.favoritesOnly;

  return (
    <div className="space-y-3">
      <form onSubmit={onSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en título, resumen, descripción…"
            className="pl-9"
            autoFocus
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : "Buscar"}
        </Button>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <FilterGroup
          label="Estado"
          options={STATUSES}
          value={initial.status ?? "all"}
          onChange={(v) => updateParam("status", v)}
        />
        <FilterGroup
          label="Prioridad"
          options={PRIORITIES}
          value={initial.priority ?? "all"}
          onChange={(v) => updateParam("priority", v)}
        />
        <button
          type="button"
          onClick={() => updateParam("fav", initial.favoritesOnly ? null : "1")}
          className={cn(
            "rounded-md border px-2.5 py-1 text-xs transition",
            initial.favoritesOnly
              ? "border-amber-400/50 bg-amber-400/10 text-amber-300"
              : "border-border bg-card/40 text-muted-foreground hover:bg-card",
          )}
        >
          ⭐ Favoritas
        </button>

        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground transition hover:text-foreground"
          >
            <X className="size-3" />
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
}

function FilterGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  // Select nativo: minimalista, accesible por defecto, sin librería extra.
  return (
    <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      {label}:
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="rounded-md border border-border bg-card/40 px-2 py-1 text-xs text-foreground transition hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
