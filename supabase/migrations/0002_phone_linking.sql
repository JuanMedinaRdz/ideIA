-- =============================================================================
-- ideIA — Phone linking + ingest event log
--
-- Diseño:
--   - user_phone_links: 1 número de WhatsApp ↔ 1 usuario. Único en ambas
--     direcciones (un user no enlaza dos veces el mismo número; un número
--     no pertenece a dos users).
--   - pairing_codes: códigos de 6 dígitos efímeros que el user pide en la
--     web, escribe en WhatsApp, y el bot/n8n los resuelve contra esta tabla
--     para enlazar el número. Expiran a los 10 min.
--   - ingest_events: log append-only de cada webhook entrante para debugging
--     y auditoría. No tiene RLS para SELECT — solo el service-role lee/escribe.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Tabla: user_phone_links
-- ---------------------------------------------------------------------------
create table public.user_phone_links (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  phone_e164    text not null,   -- '+34612345678' (con +, sin espacios)
  label         text,            -- 'Personal', 'Trabajo'…
  created_at    timestamptz not null default now()
);

create unique index user_phone_links_phone_uniq on public.user_phone_links (phone_e164);
create unique index user_phone_links_user_phone_uniq
  on public.user_phone_links (user_id, phone_e164);
create index user_phone_links_user_idx on public.user_phone_links (user_id);

alter table public.user_phone_links enable row level security;

create policy "phone_links_select_own"
  on public.user_phone_links for select
  using (auth.uid() = user_id);

create policy "phone_links_insert_own"
  on public.user_phone_links for insert
  with check (auth.uid() = user_id);

create policy "phone_links_delete_own"
  on public.user_phone_links for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Tabla: pairing_codes
-- Flujo:
--   1. Usuario en /settings pulsa "Vincular WhatsApp" → server action genera
--      un código de 6 dígitos y lo guarda con user_id + expires_at (10 min).
--   2. Usuario manda ese código por WhatsApp al bot.
--   3. n8n recibe el mensaje, llama al webhook con {phone, code}.
--   4. El webhook busca el código en esta tabla, valida vigencia, crea el
--      registro en user_phone_links y borra el código (one-shot).
-- ---------------------------------------------------------------------------
create table public.pairing_codes (
  code          text primary key,        -- 6 dígitos
  user_id       uuid not null references auth.users(id) on delete cascade,
  expires_at    timestamptz not null,
  created_at    timestamptz not null default now()
);

create index pairing_codes_user_idx on public.pairing_codes (user_id);
create index pairing_codes_expires_idx on public.pairing_codes (expires_at);

alter table public.pairing_codes enable row level security;

-- Solo el dueño puede ver SUS códigos activos (para mostrarlos en la UI).
create policy "pairing_codes_select_own"
  on public.pairing_codes for select
  using (auth.uid() = user_id);

-- INSERT/UPDATE/DELETE solo via service-role (sin policy = sin acceso anon).
-- El webhook usa service-role para borrar tras consumir.

-- ---------------------------------------------------------------------------
-- Tabla: ingest_events
-- Append-only. Cada webhook entrante (válido o inválido) deja huella aquí.
-- Útil para debugging ("¿llegó mi mensaje?") y auditoría.
-- ---------------------------------------------------------------------------
create type ingest_status as enum ('ok', 'unauthorized', 'unknown_phone', 'invalid_payload', 'error');

create table public.ingest_events (
  id            uuid primary key default gen_random_uuid(),
  status        ingest_status not null,
  phone_e164    text,
  user_id       uuid references auth.users(id) on delete set null,
  idea_id       uuid references public.ideas(id) on delete set null,
  payload       jsonb,
  error_message text,
  created_at    timestamptz not null default now()
);

create index ingest_events_created_idx on public.ingest_events (created_at desc);
create index ingest_events_user_idx on public.ingest_events (user_id);

alter table public.ingest_events enable row level security;

-- El usuario puede ver SUS eventos (útil para "actividad reciente").
create policy "ingest_events_select_own"
  on public.ingest_events for select
  using (auth.uid() = user_id);

-- INSERT solo via service-role.

-- ---------------------------------------------------------------------------
-- Función helper para limpiar pairing_codes caducados (opcional).
-- Si configuras pg_cron en Supabase, puedes agendar:
--   select cron.schedule('cleanup_pairing_codes', '*/15 * * * *',
--     'select public.cleanup_expired_pairing_codes()');
-- ---------------------------------------------------------------------------
create or replace function public.cleanup_expired_pairing_codes()
returns void
language sql
as $$
  delete from public.pairing_codes where expires_at < now();
$$;
