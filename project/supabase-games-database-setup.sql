-- Games Database Setup Script
-- Run this in Supabase SQL editor to set up the games tracking system

-- Create the games table
CREATE TABLE public.games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  played_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  black_player_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  white_player_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  winner TEXT CHECK (winner IN ('black', 'white', 'draw')) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT different_players CHECK (black_player_id != white_player_id)
);

-- Enable Row Level Security
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_games_played_at ON public.games(played_at DESC);
CREATE INDEX idx_games_black_player ON public.games(black_player_id);
CREATE INDEX idx_games_white_player ON public.games(white_player_id);
CREATE INDEX idx_games_players_date ON public.games(black_player_id, white_player_id, played_at DESC);
CREATE INDEX idx_games_player_recent ON public.games(black_player_id, played_at DESC, created_at DESC);
CREATE INDEX idx_games_player_recent_white ON public.games(white_player_id, played_at DESC, created_at DESC);

-- Create RLS policies
-- Read: Anyone can view games
CREATE POLICY "Games are viewable by everyone" 
ON public.games FOR SELECT 
USING (true);

-- Insert: Only authenticated users can create games
CREATE POLICY "Authenticated users can create games" 
ON public.games FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Update: Only game participants can update
CREATE POLICY "Players can update their games" 
ON public.games FOR UPDATE 
USING (auth.uid() IN (black_player_id, white_player_id));

-- Delete: Only admins can delete games (games are permanent records)
CREATE POLICY "Only admins can delete games" 
ON public.games FOR DELETE 
USING (
  auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

-- Function to handle updated_at timestamp for games
CREATE OR REPLACE FUNCTION public.handle_games_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for updated_at on games table
CREATE TRIGGER handle_games_updated_at
  BEFORE UPDATE ON public.games
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_games_updated_at();

-- Helper function to get recent games for a player (for home page widget)
CREATE OR REPLACE FUNCTION public.get_recent_games(player_id UUID, game_limit INTEGER DEFAULT 5)
RETURNS TABLE (
  game_id UUID,
  played_at TIMESTAMPTZ,
  opponent_id UUID,
  opponent_name TEXT,
  player_color TEXT,
  result TEXT,
  notes TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id,
    g.played_at,
    CASE 
      WHEN g.black_player_id = player_id THEN g.white_player_id
      ELSE g.black_player_id
    END as opponent_id,
    CASE 
      WHEN g.black_player_id = player_id THEN wp.name
      ELSE bp.name
    END as opponent_name,
    CASE 
      WHEN g.black_player_id = player_id THEN 'black'
      ELSE 'white'
    END as player_color,
    CASE 
      WHEN (g.black_player_id = player_id AND g.winner = 'black') OR 
           (g.white_player_id = player_id AND g.winner = 'white') THEN 'win'
      WHEN g.winner = 'draw' THEN 'draw'
      ELSE 'loss'
    END as result,
    g.notes
  FROM games g
  JOIN profiles bp ON g.black_player_id = bp.id
  JOIN profiles wp ON g.white_player_id = wp.id
  WHERE g.black_player_id = player_id OR g.white_player_id = player_id
  ORDER BY g.played_at DESC, g.created_at DESC
  LIMIT game_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get last game date for a player (for standings table)
CREATE OR REPLACE FUNCTION public.get_last_game_date(player_id UUID)
RETURNS TIMESTAMPTZ AS $$
BEGIN
  RETURN (
    SELECT MAX(played_at)
    FROM games
    WHERE black_player_id = player_id OR white_player_id = player_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the setup
SELECT 'Games database setup completed successfully!' as status;

-- Show the schema
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default 
FROM information_schema.columns 
WHERE table_name = 'games' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show that the table is empty and ready for data
SELECT COUNT(*) as total_games FROM public.games; 