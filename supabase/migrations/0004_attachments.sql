-- =============================================================================
-- ideIA — Attachments para ideas (imagen y audio)
--
-- Objetivo: que cuando llegue una imagen/audio por WhatsApp, además de la
-- descripción/transcripción AI, conservemos el archivo original adjunto a la
-- nota. Igual que Notion/WhatsApp.
--
-- Storage: usamos Supabase Storage con bucket "idea-attachments" público para
-- lectura (URLs aleatorias, imposibles de adivinar). La subida la hace n8n
-- con la service_role key. No hay UI de upload manual — todo viene por el
-- webhook, así que no necesitamos políticas RLS de INSERT para usuarios.
-- =============================================================================

alter table public.ideas
  add column if not exists attachment_url   text,
  add column if not exists attachment_type  text;

-- attachment_type es texto libre por simplicidad — valores típicos:
-- 'image/jpeg', 'image/png', 'audio/ogg', 'audio/mpeg'. Si en el futuro
-- queremos restringir, convertimos a enum.

-- NOTA: el bucket "idea-attachments" hay que crearlo manualmente desde la
-- UI de Supabase (Storage → New bucket → name: idea-attachments → public).
-- O via SQL si tu proyecto lo permite (consulta docs). Lo dejo en el README.
