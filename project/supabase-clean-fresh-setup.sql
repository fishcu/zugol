-- Complete reset and setup for Zugol rank stability system
-- This handles cleanup of existing objects and creates everything fresh

-- Clean up existing objects (in proper dependency order)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

-- Create the profiles table with all required columns
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  rating_points INTEGER NOT NULL DEFAULT 137,
  last_rank_reached TEXT NOT NULL DEFAULT '15k',
  games_at_last_rank_change INTEGER NOT NULL DEFAULT 0,
  total_games_played INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- Function to handle updated_at timestamp
CREATE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for updated_at
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to create profile on user signup
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_rating_points INTEGER;
  user_rank TEXT;
BEGIN
  -- Get rating points from user metadata, default to 137 (15k) if not provided
  user_rating_points := COALESCE((NEW.raw_user_meta_data->>'rating_points')::INTEGER, 137);
  
  -- Calculate rank from rating points
  user_rank := CASE 
    WHEN user_rating_points <= 12 THEN '25k'
    WHEN user_rating_points <= 25 THEN '24k'
    WHEN user_rating_points <= 38 THEN '23k'
    WHEN user_rating_points <= 51 THEN '22k'
    WHEN user_rating_points <= 64 THEN '21k'
    WHEN user_rating_points <= 77 THEN '20k'
    WHEN user_rating_points <= 90 THEN '19k'
    WHEN user_rating_points <= 103 THEN '18k'
    WHEN user_rating_points <= 116 THEN '17k'
    WHEN user_rating_points <= 129 THEN '16k'
    WHEN user_rating_points <= 142 THEN '15k'
    WHEN user_rating_points <= 155 THEN '14k'
    WHEN user_rating_points <= 168 THEN '13k'
    WHEN user_rating_points <= 181 THEN '12k'
    WHEN user_rating_points <= 194 THEN '11k'
    WHEN user_rating_points <= 207 THEN '10k'
    WHEN user_rating_points <= 220 THEN '9k'
    WHEN user_rating_points <= 233 THEN '8k'
    WHEN user_rating_points <= 246 THEN '7k'
    WHEN user_rating_points <= 259 THEN '6k'
    WHEN user_rating_points <= 272 THEN '5k'
    WHEN user_rating_points <= 285 THEN '4k'
    WHEN user_rating_points <= 298 THEN '3k'
    WHEN user_rating_points <= 311 THEN '2k'
    WHEN user_rating_points <= 324 THEN '1k'
    WHEN user_rating_points <= 337 THEN '1d'
    WHEN user_rating_points <= 350 THEN '2d'
    WHEN user_rating_points <= 363 THEN '3d'
    WHEN user_rating_points <= 376 THEN '4d'
    WHEN user_rating_points <= 389 THEN '5d'
    WHEN user_rating_points <= 402 THEN '6d'
    WHEN user_rating_points <= 415 THEN '7d'
    WHEN user_rating_points <= 428 THEN '8d'
    ELSE '9d'
  END;

  INSERT INTO public.profiles (
    id, 
    name, 
    rating_points, 
    last_rank_reached, 
    games_at_last_rank_change, 
    total_games_played
  )
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'name', 'Anonymous Player'),
    user_rating_points,
    user_rank,
    0,
    0
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Verify the setup
SELECT 'Zugol database setup completed!' as status;

-- Show the schema
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position; 