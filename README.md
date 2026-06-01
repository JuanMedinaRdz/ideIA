# ideIA

SaaS de productividad inteligente. Capturas ideas desde WhatsApp (texto, voz, imagen) y la IA las organiza automáticamente en una web app moderna.

**Stack**: Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · shadcn-style UI · Supabase · n8n · OpenAI · Playwright · Vercel.

---

## Quick start

```powershell
# 1. Instalar dependencias
pnpm install

# 2. Copiar template de env y rellenarlo (ver "Configurar Supabase" abajo)
copy .env.local.example .env.local

# 3. Levantar
pnpm dev
```

App en http://localhost:3000.

---

## Configurar Supabase (Fase 3)

### 1. Crear proyecto

1. Ve a https://supabase.com → **New project**.
2. Region: la más cercana (Europa: `eu-central-1`).
3. Apunta el password de la DB en un sitio seguro.

### 2. Obtener las keys

En **Project Settings → API**, copia:

| Env var                            | Dónde está                      |
| ---------------------------------- | ------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`         | Project URL                     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`    | `anon` `public`                 |
| `SUPABASE_SERVICE_ROLE_KEY`        | `service_role` (¡server-only!)  |

Pégalas en `.env.local`.

### 3. Correr la migración

**Opción A — UI (más simple):**
1. Supabase Dashboard → **SQL Editor → New query**.
2. Pega el contenido de [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
3. **Run**. Deberías ver "Success. No rows returned".

**Opción B — CLI:**
```powershell
pnpm dlx supabase login
pnpm dlx supabase link --project-ref <tu-project-ref>
pnpm dlx supabase db push
```

### 4. Site URL + email template para OTP

Usamos código OTP de 6 dígitos (no magic link), porque el magic link con PKCE
falla cuando el email se abre en un navegador distinto del que pidió el link.

**a) Site URL** (Authentication → URL Configuration → Site URL):
- `http://localhost:3000`

**b) Editar template "Magic Link"** (Authentication → Email Templates → Magic Link):
Reemplaza el contenido por algo así para que el email muestre el código de 6 dígitos:

```html
<h2>Tu código para ideIA</h2>
<p>Pega este código en la pantalla de login:</p>
<p style="font-size: 28px; font-family: monospace; letter-spacing: 6px; font-weight: 600;">{{ .Token }}</p>
<p style="color: #888; font-size: 12px;">Caduca en 1 hora. Si no fuiste tú, ignora este email.</p>
```

La clave es `{{ .Token }}` — sin eso no aparece el código.

### 5. (Opcional) Tipos generados

Cuando el schema se estabilice, genera tipos TS desde la DB:
```powershell
pnpm dlx supabase gen types typescript --project-id <ref> > src/types/database.ts
```

---

## Comandos

| Comando         | Qué hace                               |
| --------------- | -------------------------------------- |
| `pnpm dev`      | Dev server con HMR                     |
| `pnpm build`    | Build de producción                    |
| `pnpm start`    | Servir el build                        |
| `pnpm lint`     | ESLint                                 |

---

## Arquitectura

```
src/
├── app/
│   ├── (auth)/login            ← Magic link
│   ├── (dashboard)/            ← Rutas protegidas (sidebar + topbar)
│   │   ├── dashboard/
│   │   ├── inbox/
│   │   ├── kanban/
│   │   ├── search/
│   │   ├── insights/
│   │   └── settings/
│   ├── auth/callback/          ← Route handler para magic link
│   └── api/                    ← Webhooks (Fase 4)
├── features/                   ← Lógica por dominio
│   ├── auth/
│   └── ideas/
│       ├── components/
│       ├── services/
│       │   ├── ideas.service.ts   ← Queries Supabase (server-only)
│       │   └── ideas.actions.ts   ← Server Actions
│       └── types/
├── components/
│   ├── ui/                     ← Primitives shadcn-style
│   └── shared/                 ← Sidebar, Topbar, CommandPalette
├── lib/supabase/               ← Clients (client, server, middleware-proxy)
├── store/                      ← Zustand (UI state)
└── proxy.ts                    ← Refresca sesión en cada request

supabase/migrations/            ← SQL versionado
n8n/workflows/                  ← Exports JSON de n8n (Fase 4)
```

---

## Webhook de ingest (Fase 4)

Endpoint que recibe ideas estructuradas desde n8n. Autenticado con un secret
compartido en el header `x-webhook-secret`. Genera ese secret con algo como:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 } | ForEach-Object { [byte]$_ }))
```

…y pégalo en `.env.local` como `N8N_WEBHOOK_SECRET=...`.

### Migraciones 0002 + 0003

Antes de probar el webhook con IA, ejecuta **en orden** en el SQL Editor:
1. [`supabase/migrations/0002_phone_linking.sql`](supabase/migrations/0002_phone_linking.sql) — tablas phone_links, pairing_codes, ingest_events.
2. [`supabase/migrations/0003_ai_tracking.sql`](supabase/migrations/0003_ai_tracking.sql) — `raw_content` en `ideas` + tabla `ai_usage`.

### Probar con cURL

**1. Emparejar un número** (después de generar un código desde `/settings`):

```powershell
curl -X POST http://localhost:3000/api/webhooks/n8n `
  -H "x-webhook-secret: TU_SECRET" `
  -H "content-type: application/json" `
  -d '{ "phone_number": "+34600111222", "pairing_code": "123456" }'
```

**2a. Crear una idea ya estructurada** (después de emparejar el número):

```powershell
curl -X POST http://localhost:3000/api/webhooks/n8n `
  -H "x-webhook-secret: TU_SECRET" `
  -H "content-type: application/json" `
  -d '{
    "phone_number": "+34600111222",
    "title": "Probar webhook de ingest",
    "summary": "Sin OpenAI, payload directo.",
    "source": "whatsapp",
    "priority": "high",
    "tags": ["test", "fase-4"]
  }'
```

**2b. Mandar texto crudo y que la IA lo estructure** (Fase 5):

```powershell
curl -X POST http://localhost:3000/api/webhooks/n8n `
  -H "x-webhook-secret: TU_SECRET" `
  -H "content-type: application/json" `
  -d '{
    "phone_number": "+34600111222",
    "raw_content": "tengo que comprar el dominio antes del viernes, el actual expira el 5 de junio y necesito tenerlo listo para el lanzamiento de la beta",
    "source": "whatsapp"
  }'
```

OpenAI estructura el mensaje → título, resumen, prioridad (probablemente `urgent`), tags (`dominio`, `lanzamiento`...) y sugerencias de acción. Respuesta: `201 {"ok":true,"idea_id":"..."}`. Recarga `/dashboard`.

> **Cost-tracking**: cada llamada IA queda registrada en `ai_usage` (tabla en Supabase) con tokens consumidos, latencia y costo en USD (microcents). Puedes hacer `SELECT * FROM ai_usage ORDER BY created_at DESC LIMIT 10;` para auditar.

### Importar el workflow en n8n

1. Ten una instancia n8n corriendo (Docker, n8n Cloud, self-hosted).
2. **Settings → Import from File** → elige [`n8n/workflows/whatsapp-ingest.json`](n8n/workflows/whatsapp-ingest.json).
3. En el nodo "POST to ideIA webhook" cambia la URL por la tuya y configura `N8N_WEBHOOK_SECRET` como env var en n8n.
4. Conecta el trigger a tu canal WhatsApp Business (en Fase 5 añadiremos OpenAI entre medias).

---

## Atajos de teclado

| Atajo  | Acción                |
| ------ | --------------------- |
| `⌘K`   | Abrir Command Palette |
| `Esc`  | Cerrar dialogs        |

---

## Fases

- ✅ **Fase 1** — Setup, arquitectura, tokens de diseño.
- ✅ **Fase 2** — UI shell (sidebar, topbar, ⌘K, focus mode, dashboard).
- ✅ **Fase 3** — Supabase + Auth (OTP código) + CRUD real.
- ✅ **Fase 4** — n8n + WhatsApp + webhook seguro + emparejamiento de número.
- ✅ **Fase 5** — OpenAI: estructuración automática + tracking de uso.
- ✅ **Fase 6** — Detalle de idea editable, re-estructuración IA, búsqueda con filtros, skeletons, toasts, optimistic favorito, animaciones stagger.
- ⏳ **Fase 8** — Deploy a Vercel.
- ⏳ **Fase 9** — WhatsApp + n8n + Whisper + Vision.
- ⏳ **Fase 7** — Playwright E2E (al final, una vez todo lo demás está en prod).

---

## Deploy a Vercel (Fase 8)

### 1. Subir el proyecto a GitHub

a) Ve a https://github.com/new
- Repository name: `ideia` (o el que quieras)
- **Private** (recomendado mientras estés desarrollando)
- NO marques "Add README", "Add .gitignore" ni "Choose a license" — ya los tenemos.
- **Create repository**.

b) GitHub te muestra una pantalla con comandos. Usa la sección "…or push an existing repository from the command line":

```powershell
git add .
git commit -m "feat: ideIA completo (fases 1-6) — UI, auth OTP, CRUD, IA, polish UX"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/ideia.git
git push -u origin main
```

### 2. Importar en Vercel

a) Ve a https://vercel.com/new
- Login con GitHub (mismo usuario donde subiste el repo).
- Selecciona el repo `ideia` → "Import".

b) **Framework Preset**: Next.js (autodetectado).

c) **Environment Variables** — añade las siguientes (de tu `.env.local`):

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | tu URL Supabase (sin `/rest/v1/`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | la `anon public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | la `service_role` key |
| `OPENAI_API_KEY` | tu `sk-proj-...` de OpenAI |
| `N8N_WEBHOOK_SECRET` | el secret que generaste en Fase 4 |
| `NEXT_PUBLIC_APP_URL` | **déjala vacía por ahora**, la rellenas después con la URL Vercel |

d) **Deploy**. Tarda ~2-3 min.

### 3. Después del deploy

Vercel te da una URL tipo `https://ideia-xxx.vercel.app`. Cópiala — la necesitas para:

a) **Actualizar `NEXT_PUBLIC_APP_URL` en Vercel**:
- Project Settings → Environment Variables → editar → poner tu URL Vercel (sin `/` final).
- Redeploy (Deployments → último → … → Redeploy).

b) **Actualizar Supabase**:
- Authentication → URL Configuration:
  - **Site URL**: cambia a `https://ideia-xxx.vercel.app`
  - **Redirect URLs**: añade `https://ideia-xxx.vercel.app/auth/callback` (no borres el de localhost — los dos pueden coexistir).
- Save changes.

### 4. Verificar

Abre `https://ideia-xxx.vercel.app` → login con email → recibes código → entras al dashboard → todo debe funcionar igual que en local.
- ⏳ **Fase 7** — Playwright E2E + Page Object Model.
- ⏳ **Fase 8** — Deploy Vercel + observabilidad.
