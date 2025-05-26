-- Migration script to update existing Zugol database schema
-- Run this in your Supabase SQL editor

-- First, drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Add new columns if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS rating_points INTEGER;

-- Copy data from old columns to new columns (if old columns exist)
DO $$
BEGIN
    -- Check if old columns exist and copy data
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'profiles' AND column_name = 'full_name') THEN
        UPDATE public.profiles SET name = full_name WHERE name IS NULL;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'profiles' AND column_name = 'initial_rank') THEN
        -- Convert initial_rank to rating_points using our formula
        UPDATE public.profiles 
        SET rating_points = CASE 
            WHEN initial_rank ~ '^[0-9]+k$' THEN 
                (25 - CAST(SUBSTRING(initial_rank FROM '^([0-9]+)k$') AS INTEGER)) * 13
            WHEN initial_rank ~ '^[0-9]+d$' THEN 
                (24 + CAST(SUBSTRING(initial_rank FROM '^([0-9]+)d$') AS INTEGER)) * 13
            ELSE 130  -- Default to 15k
        END
        WHERE rating_points IS NULL;
    END IF;
END $$;

-- Set default values and make columns NOT NULL
UPDATE public.profiles SET name = 'Unknown' WHERE name IS NULL;
UPDATE public.profiles SET rating_points = 130 WHERE rating_points IS NULL;

ALTER TABLE public.profiles 
ALTER COLUMN name SET NOT NULL,
ALTER COLUMN rating_points SET NOT NULL,
ALTER COLUMN rating_points SET DEFAULT 130;

-- Drop old columns if they exist
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS full_name,
DROP COLUMN IF EXISTS initial_rank;

-- Recreate the updated trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, rating_points)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE((NEW.raw_user_meta_data->>'rating_points')::INTEGER, 130)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Verify the migration
SELECT 'Migration completed. Current schema:' as status;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position; 