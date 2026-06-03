-- =============================================================================
-- ideIA — Eventos/calendario en ideas
--
-- Objetivo: que cuando el usuario diga "mañana tengo entrevista a las 8pm",
-- la IA extraiga la fecha/hora y la idea se vuelva un evento agendado.
--
-- Diseño:
--   - 1 idea = máx 1 evento. Si más adelante necesitamos múltiples
--     ocurrencias (recurrentes), creamos tabla `events` separada. Empezamos
--     simple — 90% de las notas son acciones puntuales.
--   - event_at en timestamptz: SIEMPRE almacenamos en UTC, la TZ del usuario
--     se aplica al renderizar. Esto evita pesadillas con cambios de DST.
--   - google_calendar_event_id se prepara YA para Fase 10B, aunque no lo
--     usemos hoy. Migrarlo después es costoso.
--   - Índice parcial: solo indexa filas con event_at NOT NULL. Las queries
--     de "próximos eventos" o "este mes" son rapidísimas.
-- =============================================================================

alter table public.ideas
  add column if not exists event_at                 timestamptz,
  add column if not exists event_duration_minutes   integer default 60,
  add column if not exists event_completed          boolean not null default false,
  add column if not exists google_calendar_event_id text;

create index if not exists ideas_user_event_at_idx
  on public.ideas (user_id, event_at)
  where event_at is not null;
