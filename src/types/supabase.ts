export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          active_streaming_source: string | null
          autoplay: boolean | null
          created_at: string | null
          theme: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active_streaming_source?: string | null
          autoplay?: boolean | null
          created_at?: string | null
          theme?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active_streaming_source?: string | null
          autoplay?: boolean | null
          created_at?: string | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_ratings: {
        Row: {
          created_at: string
          id: string
          media_id: string
          media_type: string
          rating: number
          review: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          media_id: string
          media_type: string
          rating: number
          review?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          media_id?: string
          media_type?: string
          rating?: number
          review?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      watch_history: {
        Row: {
          id: string
          media_id: string
          media_type: string
          progress: number | null
          user_id: string
          watched_at: string
        }
        Insert: {
          id?: string
          media_id: string
          media_type: string
          progress?: number | null
          user_id: string
          watched_at?: string
        }
        Update: {
          id?: string
          media_id?: string
          media_type?: string
          progress?: number | null
          user_id?: string
          watched_at?: string
        }
        Relationships: []
      }
      watchlist: {
        Row: {
          added_at: string
          id: string
          media_id: string
          media_type: string
          user_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          media_id: string
          media_type: string
          user_id: string
        }
        Update: {
          added_at?: string
          id?: string
          media_id?: string
          media_type?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  T extends keyof Database['public']['Tables']
> = Database['public']['Tables'][T]['Row']

export type TablesInsert<
  T extends keyof Database['public']['Tables']
> = Database['public']['Tables'][T]['Insert']

export type TablesUpdate<
  T extends keyof Database['public']['Tables']
> = Database['public']['Tables'][T]['Update'] 