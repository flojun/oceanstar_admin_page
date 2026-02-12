-- This script creates a new user in Supabase auth.users table
-- Run this in your Supabase SQL Editor

-- 1. Enable pgcrypto extension for password hashing
create extension if not exists "pgcrypto";

-- 2. Create the user
DO $$
DECLARE
  -- CHANGE THESE VALUES (아이디와 비밀번호를 설정하세요)
  new_username text := 'admin'; -- 여기에 아이디만 입력하세요 (예: admin)
  new_password text := 'oceanstar1234!'; 
  -----------------------
  
  -- 자동으로 이메일 형식으로 변환합니다 (@oceanstar.com 추가)
  new_email text := new_username || '@oceanstar.com';
  
  new_id uuid := gen_random_uuid();
  encrypted_pw text;
BEGIN
  
  -- Generate password hash
  encrypted_pw := crypt(new_password, gen_salt('bf'));

  -- Insert into auth.users
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
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_id,
    'authenticated',
    'authenticated',
    new_email,
    encrypted_pw,
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}', -- app_metadata
    '{}', -- user_metadata
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  -- Insert into auth.identities (Required for login to work properly)
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    new_id,
    new_id,
    format('{"sub":"%s","email":"%s"}', new_id::text, new_email)::jsonb,
    'email',
    new_id::text,
    now(),
    now(),
    now()
  );

  RAISE NOTICE 'User created: % (Password: %)', new_email, new_password;
END $$;
