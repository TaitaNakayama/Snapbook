export type Database = {
  public: {
    Tables: {
      scrapbooks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          name_a: string;
          name_b: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          name_a: string;
          name_b: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          name_a?: string;
          name_b?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      memories: {
        Row: {
          id: string;
          scrapbook_id: string;
          date: string | null;
          note: string;
          song_title: string | null;
          song_artist: string | null;
          song_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          scrapbook_id: string;
          date?: string | null;
          note: string;
          song_title?: string | null;
          song_artist?: string | null;
          song_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          scrapbook_id?: string;
          date?: string | null;
          note?: string;
          song_title?: string | null;
          song_artist?: string | null;
          song_url?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "memories_scrapbook_id_fkey";
            columns: ["scrapbook_id"];
            isOneToOne: false;
            referencedRelation: "scrapbooks";
            referencedColumns: ["id"];
          },
        ];
      };
      memory_photos: {
        Row: {
          id: string;
          memory_id: string;
          storage_path: string;
          caption: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          memory_id: string;
          storage_path: string;
          caption?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          memory_id?: string;
          storage_path?: string;
          caption?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "memory_photos_memory_id_fkey";
            columns: ["memory_id"];
            isOneToOne: false;
            referencedRelation: "memories";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

// Convenience types
export type Scrapbook = Database["public"]["Tables"]["scrapbooks"]["Row"];
export type Memory = Database["public"]["Tables"]["memories"]["Row"];
export type MemoryPhoto = Database["public"]["Tables"]["memory_photos"]["Row"];

export type MemoryWithPhotos = Memory & {
  memory_photos: MemoryPhoto[];
};
