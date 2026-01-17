export interface User {
  id: string;
  spotify_id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Track {
  id: string;
  spotify_uri: string;
  band_name: string;
  year: number;
  album_name: string | null;
  track_name: string | null;
  preview_url: string | null;
}

export interface Question {
  track: Track;
  bandOptions: string[];
  yearOptions: number[];
}

export interface GameSession {
  id: string;
  user_id: string;
  score: number;
  correct_answers: number;
  total_questions: number;
  time_taken_seconds: number;
  completed_at: string;
}

export interface QuizState {
  currentQuestion: number;
  questions: Question[];
  selectedBand: string | null;
  selectedYear: number | null;
  score: number;
  correctAnswers: number;
  timeRemaining: number;
  isPlaying: boolean;
  isComplete: boolean;
  totalTimeTaken: number;
}

export interface LeaderboardEntry {
  id: string;
  display_name: string;
  avatar_url: string | null;
  spotify_id: string;
  score: number;
  correct_answers: number;
  completed_at: string;
}
