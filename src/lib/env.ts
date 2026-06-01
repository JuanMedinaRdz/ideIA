function required(name: string, value: string | undefined): string {
  if (!value || value.length === 0) {
    throw new Error(
      `Missing required env var: ${name}. Copy .env.local.example to .env.local and fill it in.`,
    );
  }
  return value;
}

export const env = {
  supabase: {
    url: required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  },
} as const;

export const serverEnv = {
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  openAiApiKey: process.env.OPENAI_API_KEY,
  n8nWebhookSecret: process.env.N8N_WEBHOOK_SECRET,
} as const;
