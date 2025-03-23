
import type { Database } from '@/integrations/supabase/types';

// Video types
export type Video = Database['public']['Tables']['videos']['Row'];
export type VideoInsert = Database['public']['Tables']['videos']['Insert'];
export type VideoUpdate = Database['public']['Tables']['videos']['Update'];

// Short types
export type Short = Database['public']['Tables']['shorts']['Row'];
export type ShortInsert = Database['public']['Tables']['shorts']['Insert'];
export type ShortUpdate = Database['public']['Tables']['shorts']['Update'];

// Custom types for the frontend
export interface VideoWithThumbnail extends Video {
  thumbnailUrl?: string;
}
