-- =============================================================================
-- ideIA — Tutoriales (steps con imágenes, drag & drop para reordenar)
--
-- Diseño:
--   - tutorials: 1 fila por tutorial. user_id RLS, igual que ideas.
--   - tutorial_steps: 1 fila por paso. tutorial_id FK + position int para orden.
--     RLS por join al tutorial padre (no replicamos user_id).
--   - Imágenes: reusan el bucket Storage `idea-attachments` (público) con
--     path prefix `tutorials/{tutorial_id}/...`. Cero setup extra.
-- =============================================================================

create table public.tutorials (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  title           text not null,
  description     text,
  category        text,
  cover_image_url text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index tutorials_user_updated_idx on public.tutorials (user_id, updated_at desc);

alter table public.tutorials enable row level security;

create policy "tutorials_select_own"
  on public.tutorials for select using (auth.uid() = user_id);
create policy "tutorials_insert_own"
  on public.tutorials for insert with check (auth.uid() = user_id);
create policy "tutorials_update_own"
  on public.tutorials for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tutorials_delete_own"
  on public.tutorials for delete using (auth.uid() = user_id);

create trigger tutorials_touch_updated_at
  before update on public.tutorials
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- tutorial_steps
-- ---------------------------------------------------------------------------
create table public.tutorial_steps (
  id            uuid primary key default gen_random_uuid(),
  tutorial_id   uuid not null references public.tutorials(id) on delete cascade,
  position      integer not null default 0,
  title         text,
  description   text not null default '',
  image_url     text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index tutorial_steps_tutorial_position_idx
  on public.tutorial_steps (tutorial_id, position);

alter table public.tutorial_steps enable row level security;

-- RLS por join al padre: el step pertenece al tutorial que pertenece al user.
-- Patrón estándar para tablas hijo sin user_id propio. La query es eficiente
-- gracias al índice PK de tutorials.
create policy "tutorial_steps_select_own"
  on public.tutorial_steps for select
  using (
    exists (
      select 1 from public.tutorials t
      where t.id = tutorial_steps.tutorial_id and t.user_id = auth.uid()
    )
  );

create policy "tutorial_steps_insert_own"
  on public.tutorial_steps for insert
  with check (
    exists (
      select 1 from public.tutorials t
      where t.id = tutorial_steps.tutorial_id and t.user_id = auth.uid()
    )
  );

create policy "tutorial_steps_update_own"
  on public.tutorial_steps for update
  using (
    exists (
      select 1 from public.tutorials t
      where t.id = tutorial_steps.tutorial_id and t.user_id = auth.uid()
    )
  );

create policy "tutorial_steps_delete_own"
  on public.tutorial_steps for delete
  using (
    exists (
      select 1 from public.tutorials t
      where t.id = tutorial_steps.tutorial_id and t.user_id = auth.uid()
    )
  );

create trigger tutorial_steps_touch_updated_at
  before update on public.tutorial_steps
  for each row execute function public.touch_updated_at();
