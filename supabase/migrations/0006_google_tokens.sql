-- =============================================================================
-- ideIA — Google OAuth tokens
--
-- Almacena los tokens OAuth de cada usuario que conecte su Google Calendar.
-- Diseño:
--   - 1 fila por usuario (PK = user_id). Si se reconecta, hacemos UPSERT.
--   - access_token: corta vida (1h). Se refresca con refresh_token cuando
--     expira. refresh_token no expira (salvo revocación manual o 6 meses
--     sin uso).
--   - expires_at: para saber CUÁNDO renovar antes de llamar a la API.
--   - scope: registra qué permisos concedió el usuario. Útil si añadimos
--     scopes nuevos y queremos pedir re-consent.
--
-- RLS:
--   - SELECT: el user solo ve su propia fila.
--   - INSERT/UPDATE/DELETE: solo via service-role desde el callback OAuth.
--     Sin policy de mutación de usuario → un user no puede inyectar tokens
--     ajenos aunque consiga session de otro.
-- =============================================================================

create table public.google_calendar_tokens (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  access_token    text        not null,
  refresh_token   text        not null,
  expires_at      timestamptz not null,
  scope           text        not null,
  token_type      text        not null default 'Bearer',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.google_calendar_tokens enable row level security;

-- El usuario puede SABER si está conectado (lectura de su fila).
-- NO le damos acceso al valor en el cliente — el service le presenta solo
-- "connected: true" en vez del token. Pero por RLS estricta podemos dejar
-- SELECT propio y nunca exponer el token al cliente igualmente.
create policy "google_tokens_select_own"
  on public.google_calendar_tokens for select
  using (auth.uid() = user_id);

-- Mantener updated_at automático.
create trigger google_tokens_touch_updated_at
  before update on public.google_calendar_tokens
  for each row execute function public.touch_updated_at();
