"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

/**
 * Provider único para TanStack Query.
 *
 * Lo creamos con `useState` para que el QueryClient se instancie UNA vez por
 * sesión de cliente. Si lo creáramos a nivel de módulo, todos los usuarios
 * compartirían caché en el server (memory leak + filtración de datos).
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
