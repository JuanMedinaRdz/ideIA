// Tipos mínimos del schema. Manualmente mantenidos hasta que pasemos a
// generación automática con `pnpm dlx supabase gen types typescript`.
//
// Forma requerida por postgrest-js (GenericSchema / GenericTable):
//   Schema = { Tables, Views, Functions }
//   Table  = { Row, Insert, Update, Relationships }
// Si falta cualquiera de esos campos, los tipos caen a `any` silenciosamente
// y .from() devuelve `never` — eso fue el bug que vimos al integrar Fase 4.

import type {
  IdeaPriority,
  IdeaSource,
  IdeaStatus,
} from "@/features/ideas/types/idea";

export type IngestStatus =
  | "ok"
  | "unauthorized"
  | "unknown_phone"
  | "invalid_payload"
  | "error";

export type AiOperation = "structure_idea" | "suggest_followups" | "summarize";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      ideas: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          summary: string;
          description: string | null;
          category: string;
          tags: string[];
          priority: IdeaPriority;
          status: IdeaStatus;
          source: IdeaSource;
          is_favorite: boolean;
          ai_suggestions: string[];
          raw_content: string | null;
          attachment_url: string | null;
          attachment_type: string | null;
          event_at: string | null;
          event_duration_minutes: number | null;
          event_completed: boolean;
          google_calendar_event_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          title: string;
          summary?: string;
          description?: string | null;
          category?: string;
          tags?: string[];
          priority?: IdeaPriority;
          status?: IdeaStatus;
          source?: IdeaSource;
          is_favorite?: boolean;
          ai_suggestions?: string[];
          raw_content?: string | null;
          attachment_url?: string | null;
          attachment_type?: string | null;
          event_at?: string | null;
          event_duration_minutes?: number | null;
          event_completed?: boolean;
          google_calendar_event_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["ideas"]["Insert"]>;
        Relationships: [];
      };
      user_phone_links: {
        Row: {
          id: string;
          user_id: string;
          phone_e164: string;
          label: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          phone_e164: string;
          label?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["user_phone_links"]["Insert"]>;
        Relationships: [];
      };
      pairing_codes: {
        Row: {
          code: string;
          user_id: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          code: string;
          user_id: string;
          expires_at: string;
        };
        Update: Partial<Database["public"]["Tables"]["pairing_codes"]["Insert"]>;
        Relationships: [];
      };
      ingest_events: {
        Row: {
          id: string;
          status: IngestStatus;
          phone_e164: string | null;
          user_id: string | null;
          idea_id: string | null;
          payload: unknown;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          status: IngestStatus;
          phone_e164?: string | null;
          user_id?: string | null;
          idea_id?: string | null;
          payload?: unknown;
          error_message?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["ingest_events"]["Insert"]>;
        Relationships: [];
      };
      ai_usage: {
        Row: {
          id: string;
          user_id: string | null;
          idea_id: string | null;
          operation: AiOperation;
          model: string;
          prompt_tokens: number;
          completion_tokens: number;
          total_tokens: number;
          cost_usd_micro: number;
          latency_ms: number | null;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          user_id?: string | null;
          idea_id?: string | null;
          operation: AiOperation;
          model: string;
          prompt_tokens?: number;
          completion_tokens?: number;
          total_tokens?: number;
          cost_usd_micro?: number;
          latency_ms?: number | null;
          error_message?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["ai_usage"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
