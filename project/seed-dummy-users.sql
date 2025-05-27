-- Seed dummy users for ladder testing
-- Works with existing handle_new_user() trigger

-- Complete cleanup of existing dummy data
DO $$
BEGIN
  -- Delete profiles first (due to foreign key constraint)
  DELETE FROM public.profiles 
  WHERE name IN (
    'Alex Chen', 'Jordan Kim', 'Sam Rodriguez', 'Casey Wong', 'Taylor Park',
    'Morgan Lee', 'Riley Zhang', 'Avery Liu', 'Quinn Tanaka', 'Sage Yamamoto',
    'River Nakamura', 'Phoenix Sato', 'Rowan Suzuki', 'Skylar Ito', 'Ember Watanabe'
  );

  -- Delete identities for dummy users
  DELETE FROM auth.identities 
  WHERE user_id IN (
    SELECT id FROM auth.users WHERE email LIKE 'dummy%@test.com'
  );

  -- Delete auth users
  DELETE FROM auth.users WHERE email LIKE 'dummy%@test.com';
  
  RAISE NOTICE 'Cleanup completed';
END $$;

-- Create dummy users with metadata - the trigger will create profiles automatically
WITH user_data AS (
  SELECT 
    ROW_NUMBER() OVER () as rn,
    CASE ROW_NUMBER() OVER ()
      WHEN 1 THEN 'Alex Chen'
      WHEN 2 THEN 'Jordan Kim'
      WHEN 3 THEN 'Sam Rodriguez'
      WHEN 4 THEN 'Casey Wong'
      WHEN 5 THEN 'Taylor Park'
      WHEN 6 THEN 'Morgan Lee'
      WHEN 7 THEN 'Riley Zhang'
      WHEN 8 THEN 'Avery Liu'
      WHEN 9 THEN 'Quinn Tanaka'
      WHEN 10 THEN 'Sage Yamamoto'
      WHEN 11 THEN 'River Nakamura'
      WHEN 12 THEN 'Phoenix Sato'
      WHEN 13 THEN 'Rowan Suzuki'
      WHEN 14 THEN 'Skylar Ito'
      WHEN 15 THEN 'Ember Watanabe'
    END as name,
    CASE ROW_NUMBER() OVER ()
      WHEN 1 THEN 287
      WHEN 2 THEN 301
      WHEN 3 THEN 256
      WHEN 4 THEN 273
      WHEN 5 THEN 310
      WHEN 6 THEN 248
      WHEN 7 THEN 294
      WHEN 8 THEN 267
      WHEN 9 THEN 305
      WHEN 10 THEN 251
      WHEN 11 THEN 279
      WHEN 12 THEN 262
      WHEN 13 THEN 298
      WHEN 14 THEN 285
      WHEN 15 THEN 308
    END as rating_points
  FROM generate_series(1, 15)
)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  uuid_generate_v4(),
  'authenticated',
  'authenticated',
  'dummy' || ud.rn || '@test.com',
  crypt('debug123456', gen_salt('bf')),
  current_timestamp,
  current_timestamp,
  current_timestamp,
  '{"provider":"email","providers":["email"]}',
  jsonb_build_object('name', ud.name, 'rating_points', ud.rating_points),
  current_timestamp,
  current_timestamp,
  '',
  '',
  '',
  ''
FROM user_data ud;

-- Create identities for the auth users
INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) (
  SELECT
    uuid_generate_v4(),
    id,
    id,
    format('{"sub":"%s","email":"%s"}', id::text, email)::jsonb,
    'email',
    current_timestamp,
    current_timestamp,
    current_timestamp
  FROM auth.users
  WHERE email LIKE 'dummy%@test.com'
);

-- Verify the data was created (profiles should be created automatically by trigger)
SELECT 
  p.name, 
  p.rating_points, 
  p.last_rank_reached,
  u.email
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.name IN (
  'Alex Chen', 'Jordan Kim', 'Sam Rodriguez', 'Casey Wong', 'Taylor Park',
  'Morgan Lee', 'Riley Zhang', 'Avery Liu', 'Quinn Tanaka', 'Sage Yamamoto',
  'River Nakamura', 'Phoenix Sato', 'Rowan Suzuki', 'Skylar Ito', 'Ember Watanabe'
)
ORDER BY p.rating_points DESC; 