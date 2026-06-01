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

| Comando                  | Qué hace                                                    |
| ------------------------ | ----------------------------------------------------------- |
| `pnpm dev`               | Dev server con HMR (webpack, no Turbopack)                  |
| `pnpm build`             | Build de producción                                          |
| `pnpm start`             | Servir el build                                              |
| `pnpm lint`              | ESLint                                                       |
| `pnpm test:e2e`          | Playwright E2E contra prod (https://ide-ia-chi.vercel.app)  |
| `pnpm test:e2e:ui`       | Playwright en modo UI (modo interactivo)                     |
| `pnpm test:e2e:headed`   | Tests visibles en navegador real                             |
| `pnpm test:e2e:report`   | Abrir el último reporte HTML                                 |
| `pnpm test:e2e:local`    | Tests contra `http://localhost:3000` (necesitas `pnpm dev`) |

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

### Migraciones 0002 + 0003 + 0004

Antes de probar el webhook con IA, ejecuta **en orden** en el SQL Editor:
1. [`supabase/migrations/0002_phone_linking.sql`](supabase/migrations/0002_phone_linking.sql) — tablas phone_links, pairing_codes, ingest_events.
2. [`supabase/migrations/0003_ai_tracking.sql`](supabase/migrations/0003_ai_tracking.sql) — `raw_content` en `ideas` + tabla `ai_usage`.
3. [`supabase/migrations/0004_attachments.sql`](supabase/migrations/0004_attachments.sql) — `attachment_url` + `attachment_type` en `ideas`.

### Bucket de Supabase Storage para attachments

Para que las imágenes y audios de WhatsApp queden adjuntos a la nota:

1. Supabase Dashboard → **Storage → New bucket**.
2. **Name**: `idea-attachments`
3. **Public bucket**: ✅ ON (las URLs son aleatorias, no adivinables).
4. Create.

En n8n necesitas una **credencial extra "Header Auth"** para subir:
- **Credential Name**: `Supabase Service Role`
- **Header Name**: `Authorization`
- **Header Value**: `Bearer TU_SUPABASE_SERVICE_ROLE_KEY`

Asignala a los nodos `Upload audio → Supabase Storage` y `Upload image → Supabase Storage`.

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

### Configurar n8n + Meta WhatsApp (Fase 9)

El workflow [`n8n/workflows/whatsapp-ingest.json`](n8n/workflows/whatsapp-ingest.json) recibe mensajes
WhatsApp (texto / audio / imagen) y los manda a `/api/webhooks/n8n` con `raw_content`
que ideIA estructura con OpenAI.

#### 1. Importar el workflow

En n8n: **Workflows → Add → Import from File** → elige el JSON. Verás ~15 nodos.

#### 2. Crear las 3 credenciales necesarias

a) **WhatsApp API** (de Meta): **Credentials → Add → WhatsApp**. Mete tu Phone Number ID
   y el Access Token. Si tu token es temporal (24h), genera uno permanente en
   Meta → Business Settings → System Users.

b) **OpenAI API**: **Credentials → Add → OpenAI**. Pega tu `sk-proj-...`. Esta
   credencial la usan los nodos "Whisper" y "Vision" del workflow.

c) **HTTP Header Auth** para el webhook a ideIA:
   - **Credentials → Add → Header Auth**.
   - **Name**: `ideIA Webhook Secret`.
   - **Header Name**: `x-webhook-secret`.
   - **Header Value**: el mismo valor que `N8N_WEBHOOK_SECRET` en Vercel.
   - Save. Después en el nodo `POST a ideIA webhook` selecciónala como credencial.

#### 3. Sustituir 3 placeholders en el workflow

- En todos los nodos `HTTP Request` que apuntan a Meta: asocia la credencial WhatsApp.
- En "Whisper (audio → texto)" y "Vision (image → descripción)": asocia la credencial OpenAI.
- En "¿Token Meta correcto?": reemplaza `WEBHOOK_VERIFY_TOKEN_AQUI` por un string aleatorio
  (ej: usa `openssl rand -hex 16`). Apúntalo, lo pegas en Meta en el paso 5.
- En "POST a ideIA webhook": cambia `https://TU-APP.vercel.app` por tu URL Vercel real.

#### 4. (Saltado) — Ya no hace falta env vars en n8n

Antes recomendábamos `N8N_WEBHOOK_SECRET` como env var del sistema. Ahora
usamos la credencial "Header Auth" del paso 2c — más seguro (cifrado at rest),
y funciona aunque no tengas acceso al panel de Hostinger.

#### 5. Configurar Meta webhook

a) Activa el workflow en n8n (toggle arriba a la derecha → Active).

b) Click en el nodo "Meta Webhook (POST messages)" → copia la **Production URL**
   (algo como `https://n8n.tudominio.com/webhook/ideia-whatsapp`).

c) En Meta for Developers → tu app → WhatsApp → Configuration → Webhook:
   - **Callback URL**: la URL que copiaste.
   - **Verify Token**: el string que pusiste en el paso 3.
   - Click **Verify and save** → debe pasar (Meta hace GET y n8n responde el challenge).
   - **Webhook fields**: marca `messages`.

#### 6. Test final

Desde tu WhatsApp personal (debe estar añadido como recipient en Meta sandbox),
manda al número de Meta:

1. **Mensaje de texto**: "Refactor del onboarding antes del viernes"
2. **Mensaje de voz**: explica una idea en voz alta
3. **Imagen**: una captura de pantalla o foto

En ~5-10 segundos, las 3 deben aparecer estructuradas en
`https://ide-ia-chi.vercel.app/dashboard`.

#### Debugging

- **n8n executions** (sidebar izquierdo) muestra cada ejecución verde/roja con detalle de cada nodo.
- Supabase Table Editor → `ingest_events` muestra qué llegó a tu backend.
- Supabase Table Editor → `ai_usage` muestra el costo de cada llamada IA.

---

## Testing E2E con Playwright (Fase 7)

Tests críticos que validan que la app sigue funcionando end-to-end después de cada deploy.

### Estructura

```
src/tests/
├── pages/              ← Page Object Model
│   ├── base.page.ts    ← clase abstracta común
│   ├── landing.page.ts
│   └── login.page.ts
└── e2e/                ← specs
    ├── landing.spec.ts     ← landing pública + SEO
    ├── auth-gate.spec.ts   ← 7 rutas privadas → /login
    ├── login-form.spec.ts  ← validación cliente del form
    └── webhook.spec.ts     ← 401 sin secret, 401 con secret malo, 405 GET
```

### Correr

```powershell
# Contra Vercel (default)
pnpm test:e2e

# Modo UI interactivo (recomendado para desarrollo)
pnpm test:e2e:ui

# Contra localhost (requiere pnpm dev en otra terminal)
pnpm test:e2e:local

# Ver el último reporte HTML
pnpm test:e2e:report
```

### Patrón Page Object Model

Selectores y acciones viven en `pages/`, los `spec.ts` solo hacen aserciones. Cuando cambia la UI, tocas un solo archivo (el Page) y los tests siguen funcionando.

```typescript
// landing.page.ts (POM)
get heading() { return this.page.getByRole("heading", { name: /Captura ideas/i }); }

// landing.spec.ts (test)
await expect(landing.heading).toBeVisible();
```

### Qué cubrimos hoy (17 tests, ~10s contra prod)

- Landing renderiza, SEO OK, CTAs navegan.
- 7 rutas privadas redirigen a /login sin sesión (auth gate funcional).
- Form de login: render, botón disabled sin email, loading state.
- Webhook: 401 sin/con-secret-malo, 405 con GET.

### Lo que NO cubrimos (intencional)

- Login completo end-to-end (requiere interceptar Resend SMTP).
- Crear/editar ideas autenticado (requiere seed de usuario con session token).
- Esos tests vienen con setup de fixtures + test user en una siguiente iteración.

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
- ✅ **Fase 9** — WhatsApp + n8n + Whisper + Vision + attachments en Supabase Storage.
- ✅ **Fase 7** — Playwright E2E con Page Object Model.

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
