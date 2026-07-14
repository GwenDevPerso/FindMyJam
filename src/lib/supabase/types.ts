export type SkillLevel =
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'expert'
  | 'all_levels';

export type FriendshipStatus = 'pending' | 'accepted' | 'rejected' | 'blocked';

export type Database = {
  public: {
    Tables: {
      jams: {
        Row: {
          id: string;
          creator_id: string;
          title: string;
          description: string | null;
          starts_at: string;
          location_name: string;
          latitude: number;
          longitude: number;
          skill_level: SkillLevel;
          max_participants: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          title: string;
          description?: string | null;
          starts_at: string;
          location_name: string;
          latitude: number;
          longitude: number;
          skill_level?: SkillLevel;
          max_participants?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          title?: string;
          description?: string | null;
          starts_at?: string;
          location_name?: string;
          latitude?: number;
          longitude?: number;
          skill_level?: SkillLevel;
          max_participants?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      jam_participants: {
        Row: {
          jam_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          jam_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {
          jam_id?: string;
          user_id?: string;
          joined_at?: string;
        };
      };
      jam_instruments: {
        Row: {
          jam_id: string;
          instrument_id: string;
          created_at: string;
        };
        Insert: {
          jam_id: string;
          instrument_id: string;
          created_at?: string;
        };
        Update: {
          jam_id?: string;
          instrument_id?: string;
          created_at?: string;
        };
      };
      jam_styles: {
        Row: {
          jam_id: string;
          music_style_id: string;
          created_at: string;
        };
        Insert: {
          jam_id: string;
          music_style_id: string;
          created_at?: string;
        };
        Update: {
          jam_id?: string;
          music_style_id?: string;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          bio: string | null;
          skill_level: SkillLevel | null;
          location_name: string | null;
          latitude: number | null;
          longitude: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          avatar_url?: string | null;
          bio?: string | null;
          skill_level?: SkillLevel | null;
          location_name?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          avatar_url?: string | null;
          bio?: string | null;
          skill_level?: SkillLevel | null;
          location_name?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      instruments: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_at?: string;
        };
      };
      music_styles: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_at?: string;
        };
      };
      user_instruments: {
        Row: {
          user_id: string;
          instrument_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          instrument_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          instrument_id?: string;
          created_at?: string;
        };
      };
      user_music_styles: {
        Row: {
          user_id: string;
          music_style_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          music_style_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          music_style_id?: string;
          created_at?: string;
        };
      };
      friendships: {
        Row: {
          id: string;
          requester_id: string;
          addressee_id: string;
          status: FriendshipStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          requester_id: string;
          addressee_id: string;
          status?: FriendshipStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          requester_id?: string;
          addressee_id?: string;
          status?: FriendshipStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Functions: {
      search_profiles: {
        Args: {
          p_query?: string | null;
          p_instrument_ids?: string[] | null;
          p_style_ids?: string[] | null;
          p_limit?: number;
          p_cursor_username?: string | null;
          p_cursor_id?: string | null;
        };
        Returns: SearchProfileRow[];
      };
      search_jams: {
        Args: {
          p_latitude: number;
          p_longitude: number;
          p_radius_meters: number;
          p_instrument_ids?: string[] | null;
          p_style_ids?: string[] | null;
          p_starts_after?: string;
          p_starts_before?: string | null;
          p_limit?: number;
          p_cursor_distance?: number | null;
          p_cursor_starts_at?: string | null;
          p_cursor_id?: string | null;
        };
        Returns: SearchJamRow[];
      };
      get_jam_participant_count: {
        Args: {
          p_jam_id: string;
        };
        Returns: number;
      };
    };
  };
};

export type JamRow = Database['public']['Tables']['jams']['Row'];
export type JamInsert = Database['public']['Tables']['jams']['Insert'];
export type JamUpdate = Database['public']['Tables']['jams']['Update'];

export type SearchJamRow = JamRow & {
  participant_count: number;
  distance_meters: number;
};

export type JamParticipantRow = Database['public']['Tables']['jam_participants']['Row'];

export type JamParticipantWithProfileRow = JamParticipantRow & {
  profiles: {
    username: string;
    avatar_url: string | null;
  };
};

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type InstrumentRow = Database['public']['Tables']['instruments']['Row'];
export type MusicStyleRow = Database['public']['Tables']['music_styles']['Row'];

export type JamParticipantJamRow = JamParticipantRow & {
  jams: JamRow | null;
};

export type FriendshipRow = Database['public']['Tables']['friendships']['Row'];
export type FriendshipInsert = Database['public']['Tables']['friendships']['Insert'];
export type FriendshipUpdate = Database['public']['Tables']['friendships']['Update'];

export type SearchProfileRow = ProfileRow;
