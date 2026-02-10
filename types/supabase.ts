/**
 * Supabase database types (mirrors server/schema.sql).
 * Regenerate with: npx supabase gen types typescript --project-id <ref> > types/supabase.ts
 * when the project is linked and credentials are available.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          username: string;
          password_hash: string;
          name: string;
          role: string;
          is_admin: boolean;
          location: string;
          skills: string[];
          weekly_capacity_hrs: number;
          avatar_url: string | null;
          needs_password_change: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          username: string;
          password_hash: string;
          name: string;
          role: string;
          is_admin?: boolean;
          location: string;
          skills?: string[];
          weekly_capacity_hrs?: number;
          avatar_url?: string | null;
          needs_password_change?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      initiatives: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          description: string | null;
          status: string;
          start_date: string | null;
          end_date: string | null;
          skills_needed: string[] | null;
          locations: string[] | null;
          tags: string[] | null;
          cover_image_url: string | null;
          embedding: unknown | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          owner_id: string;
          title: string;
          description?: string | null;
          status?: string;
          start_date?: string | null;
          end_date?: string | null;
          skills_needed?: string[] | null;
          locations?: string[] | null;
          tags?: string[] | null;
          cover_image_url?: string | null;
          embedding?: unknown | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['initiatives']['Insert']>;
      };
      help_wanted: {
        Row: {
          id: string;
          initiative_id: string;
          skill: string;
          hours_per_week: number | null;
          status: string;
          embedding: unknown | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          initiative_id: string;
          skill: string;
          hours_per_week?: number | null;
          status?: string;
          embedding?: unknown | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['help_wanted']['Insert']>;
      };
      initiative_team_members: {
        Row: {
          initiative_id: string;
          user_id: string;
          committed_hours: number;
        };
        Insert: Database['public']['Tables']['initiative_team_members']['Row'];
        Update: Partial<Database['public']['Tables']['initiative_team_members']['Row']>;
      };
      join_requests: {
        Row: {
          id: string;
          initiative_id: string;
          user_id: string;
          message: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          initiative_id: string;
          user_id: string;
          message?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['join_requests']['Insert']>;
      };
      tasks: {
        Row: {
          id: string;
          initiative_id: string;
          title: string;
          description: string | null;
          status: string;
          assigned_to: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          initiative_id: string;
          title: string;
          description?: string | null;
          status?: string;
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['tasks']['Insert']>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          is_read: boolean;
          initiative_id: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          is_read?: boolean;
          initiative_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
      };
      feedback: {
        Row: {
          id: string;
          message: string;
          url: string | null;
          user_agent: string | null;
          viewport_width: number | null;
          viewport_height: number | null;
          screenshot_path: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          message: string;
          url?: string | null;
          user_agent?: string | null;
          viewport_width?: number | null;
          viewport_height?: number | null;
          screenshot_path?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['feedback']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
