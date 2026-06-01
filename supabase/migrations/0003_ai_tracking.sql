-- =============================================================================
-- ideIA — Tracking de uso de IA y mensaje original
--
-- Objetivos:
--   1. Guardar el TEXTO ORIGINAL que el usuario mandó (raw_content) — útil
--      para auditar la estructuración de la IA y, en el futuro, re-procesar
--      con un modelo mejor sin perder el input.
--   2. Tabla `ai_usage` para trackear tokens consumidos por idea/operación.
--      Permite ver el costo real, detectar abusos y debugging de prompts.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- ideas: añadir campo raw_content (opcional, llega solo de WhatsApp)
-- ---------------------------------------------------------------------------
alter table public.ideas
  add column if not exists raw_content text;

-- ---------------------------------------------------------------------------
-- Tabla: ai_usage — append-only de cada llamada a OpenAI
-- ---------------------------------------------------------------------------
create type ai_operation as enum ('structure_idea', 'suggest_followups', 'summarize');

create table public.ai_usage (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete set null,
  idea_id         uuid references public.ideas(id) on delete set null,
  operation       ai_operation not null,
  model           text not null,                -- 'gpt-4o-mini', etc.
  prompt_tokens   integer not null default 0,
  completion_tokens integer not null default 0,
  total_tokens    integer not null default 0,
  -- Costo estimado en USD a 1e-6 (microcents). 1000 = $0.001.
  -- Lo dejamos calculado en código por flexibilidad: precios cambian.
  cost_usd_micro  bigint not null default 0,
  latency_ms      integer,
  error_message   text,
  created_at      timestamptz not null default now()
);

create index ai_usage_user_idx        on public.ai_usage (user_id, created_at desc);
create index ai_usage_idea_idx        on public.ai_usage (idea_id);
create index ai_usage_created_idx     on public.ai_usage (created_at desc);

alter table public.ai_usage enable row level security;

-- El user solo ve SU consumo. INSERT solo via service-role.
create policy "ai_usage_select_own"
  on public.ai_usage for select
  using (auth.uid() = user_id);
