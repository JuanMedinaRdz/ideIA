-- =============================================================================
-- ideIA — Esquema inicial
--
-- Diseño:
--   - profiles: extiende auth.users con datos públicos (display_name, avatar).
--   - ideas: tabla central. Toda fila lleva user_id para Row Level Security (RLS).
--   - RLS: cada usuario solo ve/modifica SUS filas. Sin RLS, cualquier token
--     con la anon key podría leer toda la tabla. Es la línea de defensa #1.
--   - trigger handle_new_user: auto-crea profile cuando se registra alguien
--     (evita orfandad y código de "crear perfil al primer login").
--   - updated_at: trigger que toca el timestamp en cada UPDATE.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensiones útiles
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Tipos enumerados
-- (En vez de check constraints; más limpio y aparece en los tipos generados.)
-- ---------------------------------------------------------------------------
create type idea_priority as enum ('low', 'medium', 'high', 'urgent');
create type idea_status   as enum ('inbox', 'in_progress', 'done', 'archived');
create type idea_source   as enum ('whatsapp', 'web', 'voice', 'image');

-- ---------------------------------------------------------------------------
-- Tabla: profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  avatar_url    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_self"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_self"
  on public.profiles for update
  using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- Tabla: ideas
-- ---------------------------------------------------------------------------
create table public.ideas (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,

  title           text not null,
  summary         text not null default '',
  description     text,

  category        text not null default 'General',
  tags            text[] not null default '{}',

  priority        idea_priority not null default 'medium',
  status          idea_status   not null default 'inbox',
  source          idea_source   not null default 'web',

  is_favorite     boolean not null default false,
  ai_suggestions  text[] not null default '{}',

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Índices para queries comunes (ordenar por fecha, filtrar por status/prioridad,
-- buscar por user_id). RLS filtra por user_id en TODA query, así que es el más
-- importante.
create index ideas_user_id_idx          on public.ideas (user_id);
create index ideas_user_created_idx     on public.ideas (user_id, created_at desc);
create index ideas_user_status_idx      on public.ideas (user_id, status);
create index ideas_user_priority_idx    on public.ideas (user_id, priority);
-- Búsqueda de texto en title + summary. GIN trigram para fuzzy search.
create extension if not exists pg_trgm;
create index ideas_title_trgm_idx       on public.ideas using gin (title gin_trgm_ops);
create index ideas_summary_trgm_idx     on public.ideas using gin (summary gin_trgm_ops);

alter table public.ideas enable row level security;

-- Políticas RLS — patrón "user owns row". Cualquier query a /ideas se filtra
-- automáticamente por auth.uid() = user_id, sin que el código TS tenga que
-- recordarlo. Es la mejor línea de defensa contra leaks accidentales.
create policy "ideas_select_own"
  on public.ideas for select
  using (auth.uid() = user_id);

create policy "ideas_insert_own"
  on public.ideas for insert
  with check (auth.uid() = user_id);

create policy "ideas_update_own"
  on public.ideas for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "ideas_delete_own"
  on public.ideas for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Trigger: mantener updated_at
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

create trigger ideas_touch_updated_at
  before update on public.ideas
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Trigger: auto-crear perfil al registrar usuario
--
-- security definer hace que se ejecute con permisos del owner (postgres) en
-- vez del usuario que dispara el INSERT — necesario porque el usuario nuevo
-- aún no existe en la sesión cuando se dispara este trigger.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
