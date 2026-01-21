-- pipeband.fun Database Schema
-- Run this in your Supabase SQL editor

-- Users table (synced from Spotify)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spotify_id TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions/Tracks table
CREATE TABLE IF NOT EXISTS tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spotify_uri TEXT NOT NULL,
  band_name TEXT NOT NULL,
  year INTEGER NOT NULL,
  album_name TEXT,
  track_name TEXT,
  preview_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game sessions
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER DEFAULT 10,
  time_taken_seconds INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_score ON game_sessions(score DESC);
CREATE INDEX IF NOT EXISTS idx_users_spotify_id ON users(spotify_id);

-- Leaderboard view (best score per user)
CREATE OR REPLACE VIEW leaderboard AS
SELECT DISTINCT ON (u.id)
  u.id,
  u.display_name,
  u.avatar_url,
  u.spotify_id,
  gs.score,
  gs.correct_answers,
  gs.completed_at
FROM users u
JOIN game_sessions gs ON u.id = gs.user_id
ORDER BY u.id, gs.score DESC;

-- Top scores view (for leaderboard page - cumulative all-time points)
CREATE OR REPLACE VIEW top_scores AS
SELECT 
  u.id,
  u.display_name,
  u.avatar_url,
  u.spotify_id,
  SUM(gs.score) as best_score,
  SUM(gs.correct_answers) as best_correct
FROM users u
JOIN game_sessions gs ON u.id = gs.user_id
GROUP BY u.id, u.display_name, u.avatar_url, u.spotify_id;

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- Policies
-- Users can read all users (for leaderboard)
CREATE POLICY "Users are viewable by everyone" ON users
  FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = spotify_id);

-- Tracks are readable by everyone
CREATE POLICY "Tracks are viewable by everyone" ON tracks
  FOR SELECT USING (true);

-- Game sessions are readable by everyone (for leaderboard)
CREATE POLICY "Game sessions are viewable by everyone" ON game_sessions
  FOR SELECT USING (true);

-- Users can insert their own game sessions
CREATE POLICY "Users can insert own game sessions" ON game_sessions
  FOR INSERT WITH CHECK (true);

-- Sample tracks data (you'll want to add real pipe band tracks)
INSERT INTO tracks (spotify_uri, band_name, year, album_name, track_name) VALUES
  ('spotify:track:example1', 'Simon Fraser University', 1998, 'World Championships 1998', 'MSR Medley'),
  ('spotify:track:example2', 'Field Marshal Montgomery', 2005, 'World Championships 2005', 'Medley'),
  ('spotify:track:example3', 'Shotts & Dykehead', 1992, 'World Championships 1992', 'MSR'),
  ('spotify:track:example4', 'Boghall & Bathgate', 2001, 'World Championships 2001', 'Medley'),
  ('spotify:track:example5', 'Dysart & Dundonald', 1995, 'World Championships 1995', 'MSR Medley'),
  ('spotify:track:example6', 'Scottish Power', 2010, 'World Championships 2010', 'Medley'),
  ('spotify:track:example7', 'St Laurence O''Toole', 2008, 'World Championships 2008', 'MSR'),
  ('spotify:track:example8', 'Inveraray & District', 2015, 'World Championships 2015', 'Medley'),
  ('spotify:track:example9', 'Spirit of Scotland', 2003, 'World Championships 2003', 'MSR'),
  ('spotify:track:example10', 'Strathclyde Police', 1987, 'World Championships 1987', 'Medley')
ON CONFLICT DO NOTHING;
