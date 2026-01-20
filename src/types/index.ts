// Database types
export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bgg_username?: string;
  bgg_api_token?: string;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  profile?: Profile;
}

export interface Game {
  id: string;
  bgg_id: number;
  name: string;
  year_published: number | null;
  image_url: string | null;
  thumbnail_url: string | null;
  min_players: number | null;
  max_players: number | null;
  playing_time: number | null;
  bgg_rating: number | null;
  cached_at: string;
}

export interface Session {
  id: string;
  group_id: string;
  game_id: string;
  played_at: string;
  duration_minutes: number | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  game?: Game;
  session_players?: SessionPlayer[];
  guest_players?: GuestPlayer[];
}

export interface SessionPlayer {
  id: string;
  session_id: string;
  user_id: string;
  score: number | null;
  position: number | null;
  is_winner: boolean;
  notes: string | null;
  profile?: Profile;
}

// BGG API types
export interface BGGSearchResult {
  id: number;
  name: string;
  yearPublished: number | null;
}

export interface BGGGameDetails {
  id: number;
  name: string;
  yearPublished: number | null;
  image: string | null;
  thumbnail: string | null;
  minPlayers: number | null;
  maxPlayers: number | null;
  playingTime: number | null;
  averageRating: number | null;
  description: string | null;
}

export interface BGGCollectionItem {
  id: number;
  name: string;
  yearPublished: number | null;
  image: string | null;
  thumbnail: string | null;
  numPlays: number;
  owned: boolean;
  minPlayers: number | null;
  maxPlayers: number | null;
  playingTime: number | null;
  rating: number | null;
}

// Stats types
export interface PlayerStats {
  userId: string;
  profile: Profile;
  totalPlays: number;
  totalWins: number;
  winRate: number;
  gamesPlayed: number;
  hIndex: number;
  favoriteGame: Game | null;
  recentStreak: number;
}

export interface GameStats {
  gameId: string;
  game: Game;
  totalPlays: number;
  totalPlayers: number;
  averageScore: number | null;
  highScore: number | null;
  lowScore: number | null;
  averageDuration: number | null;
  mostWins: Profile | null;
}

export interface GroupStats {
  totalSessions: number;
  totalGamesPlayed: number;
  totalPlayTime: number;
  mostPlayedGame: Game | null;
  topPlayer: Profile | null;
  groupHIndex: number;
}

// Query result types (for Supabase joins)
export interface SessionPlayerWithProfile {
  id: string;
  user_id: string;
  score: number | null;
  is_winner: boolean;
  profile: {
    display_name: string | null;
    username: string;
  } | null;
}

export interface SessionWithDetails {
  id: string;
  played_at: string;
  duration_minutes: number | null;
  game_id: string;
  game: {
    id: string;
    name: string;
  } | null;
  session_players: SessionPlayerWithProfile[];
}

export interface PreviousSessionQuery {
  session_players: {
    user_id: string;
  }[];
}

export interface LeaderboardRow {
  is_winner: boolean;
  user_id: string;
  profiles: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  sessions: {
    played_at: string;
  } | null;
}

export interface SessionExpansionQuery {
  expansion_id: string;
}

// BGG XML API types
export interface BGGXMLItem {
  '@_objectid': string;
  name?: { '#text'?: string } | string;
  yearpublished?: string;
  image?: string;
  thumbnail?: string;
  numplays?: string;
  status?: {
    '@_own'?: string;
  };
  stats?: {
    '@_minplayers'?: string;
    '@_maxplayers'?: string;
    '@_playingtime'?: string;
    rating?: {
      average?: {
        '@_value'?: string;
      };
    };
  };
}

// Guest players (for future use)
export interface GuestPlayer {
  id: string;
  session_id: string;
  name: string;
  score: number | null;
  is_winner: boolean;
  created_at: string;
}

// UI types
export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
