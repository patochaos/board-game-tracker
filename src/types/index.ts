// Database types
export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
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
