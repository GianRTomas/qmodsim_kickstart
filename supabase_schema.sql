-- ==============================================================================
-- FATAMA FIGHTING DRAGONS - SUPABASE DATABASE SCHEMA
-- ==============================================================================
-- Run this entire script in your Supabase Dashboard -> SQL Editor -> New Query.
-- It creates:
--   1. public.profiles table (linked to auth.users)
--   2. public.registrations table (stores free trial & class signups)
--   3. Row Level Security (RLS) policies
--   4. Automatic trigger: new signups in auth.users auto-create a profile row
-- ==============================================================================

-- 1. Create Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'instructor', 'admin')),
    phone TEXT,
    gender TEXT,
    dob DATE,
    address TEXT,
    proficiency TEXT DEFAULT 'White Belt (Beginner)',
    belt_rank TEXT DEFAULT 'White Belt',
    weight_kg NUMERIC(5,2),
    guardian_name TEXT,
    guardian_relation TEXT,
    emergency_name TEXT,
    emergency_phone TEXT,
    blood_type TEXT,
    medical_notes TEXT,
    training_goal TEXT,
    training_batch TEXT,
    avatar_url TEXT,
    remind_promotion BOOLEAN DEFAULT true,
    remind_payments BOOLEAN DEFAULT true,
    remind_announcements BOOLEAN DEFAULT true,
    two_factor_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if table was already created
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS proficiency TEXT DEFAULT 'White Belt (10th-Gup)';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS belt_rank TEXT DEFAULT 'White Belt';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(5,2);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS guardian_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS guardian_relation TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blood_type TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS medical_notes TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS training_goal TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS training_batch TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS remind_promotion BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS remind_payments BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS remind_announcements BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- 2. Create Registrations / Free Trials Table
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    registration_type TEXT DEFAULT 'self' CHECK (registration_type IN ('self', 'child')),
    student_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    student_phone TEXT,
    dob DATE,
    gender TEXT,
    address TEXT,
    parent_name TEXT,
    relationship TEXT,
    parent_phone TEXT,
    parent_email TEXT,
    proficiency TEXT,
    prev_club TEXT,
    program_focus TEXT,
    preferred_start_date TEXT,
    emergency_name TEXT,
    emergency_phone TEXT,
    medical_notes TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'attended', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- 3B. Security Helper: Check instructor role without circular RLS recursion
CREATE OR REPLACE FUNCTION public.is_instructor()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'instructor'
    );
$$;

-- 4. RLS Policies for Profiles
DROP POLICY IF EXISTS "Public profiles are viewable by owner" ON public.profiles;
DROP POLICY IF EXISTS "Instructors and admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users or system trigger" ON public.profiles;
DROP POLICY IF EXISTS "Profiles viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Profiles viewable by owner or instructor" ON public.profiles;

CREATE POLICY "Profiles viewable by owner or instructor"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_instructor());

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles updatable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Profiles updatable by owner or instructor" ON public.profiles;

CREATE POLICY "Profiles updatable by owner or instructor"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id OR public.is_instructor())
    WITH CHECK (public.is_instructor() OR (auth.uid() = id AND role = 'student'));

CREATE POLICY "Enable insert for authenticated users or system trigger"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 5. RLS Policies for Registrations
DROP POLICY IF EXISTS "Anyone can insert registrations" ON public.registrations;
DROP POLICY IF EXISTS "Users can view their own registrations" ON public.registrations;
DROP POLICY IF EXISTS "Instructors can view and update registrations" ON public.registrations;
DROP POLICY IF EXISTS "Registrations viewable by authenticated users" ON public.registrations;
DROP POLICY IF EXISTS "Registrations updatable by authenticated users" ON public.registrations;
DROP POLICY IF EXISTS "Registrations viewable by owner or instructor" ON public.registrations;
DROP POLICY IF EXISTS "Registrations updatable by instructors" ON public.registrations;

CREATE POLICY "Anyone can insert registrations"
    ON public.registrations FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Registrations viewable by owner or instructor"
    ON public.registrations FOR SELECT
    USING (
        auth.uid() = user_id
        OR lower(student_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        OR public.is_instructor()
    );

CREATE POLICY "Registrations updatable by instructors"
    ON public.registrations FOR UPDATE
    USING (public.is_instructor())
    WITH CHECK (public.is_instructor());

-- 6. Trigger: Auto-create profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        first_name,
        last_name,
        full_name,
        role,
        phone,
        gender,
        dob,
        address,
        proficiency,
        belt_rank,
        email_verified
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        COALESCE(NEW.raw_user_meta_data->>'gender', ''),
        CASE 
            WHEN NEW.raw_user_meta_data->>'dob' IS NOT NULL AND NEW.raw_user_meta_data->>'dob' <> '' 
            THEN (NEW.raw_user_meta_data->>'dob')::date 
            ELSE NULL 
        END,
        COALESCE(NEW.raw_user_meta_data->>'address', ''),
        COALESCE(NEW.raw_user_meta_data->>'proficiency', 'White Belt (Beginner)'),
        COALESCE(NEW.raw_user_meta_data->>'proficiency', 'White Belt'),
        (NEW.email_confirmed_at IS NOT NULL)
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        email_verified = (public.profiles.email_verified OR EXCLUDED.email_verified),
        updated_at = NOW();

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_user_email_verified()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
        UPDATE public.profiles
        SET email_verified = true,
            updated_at = NOW()
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_verified ON auth.users;
CREATE TRIGGER on_auth_user_email_verified
    AFTER UPDATE OF email_confirmed_at ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_email_verified();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Backfill profiles for users who registered before the trigger was created
INSERT INTO public.profiles (
    id, email, first_name, last_name, full_name, role, phone, gender, dob, address, proficiency, belt_rank,
    guardian_name, guardian_relation, emergency_name, emergency_phone, medical_notes, training_goal
)
SELECT DISTINCT ON (u.id)
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'first_name', split_part(r.student_name, ' ', 1), ''),
    COALESCE(u.raw_user_meta_data->>'last_name', substr(r.student_name, length(split_part(r.student_name, ' ', 1)) + 2), ''),
    COALESCE(u.raw_user_meta_data->>'full_name', r.student_name, u.email),
    COALESCE(u.raw_user_meta_data->>'role', 'student'),
    COALESCE(u.raw_user_meta_data->>'phone', r.student_phone, ''),
    COALESCE(u.raw_user_meta_data->>'gender', r.gender, ''),
    CASE 
        WHEN u.raw_user_meta_data->>'dob' IS NOT NULL AND u.raw_user_meta_data->>'dob' <> '' 
        THEN (u.raw_user_meta_data->>'dob')::date 
        ELSE r.dob 
    END,
    COALESCE(u.raw_user_meta_data->>'address', r.address, ''),
    COALESCE(u.raw_user_meta_data->>'proficiency', r.proficiency, 'White Belt (Beginner)'),
    COALESCE(u.raw_user_meta_data->>'proficiency', r.proficiency, 'White Belt'),
    COALESCE(r.parent_name, ''),
    COALESCE(r.relationship, ''),
    COALESCE(r.emergency_name, r.parent_name, ''),
    COALESCE(r.emergency_phone, r.parent_phone, ''),
    COALESCE(r.medical_notes, ''),
    COALESCE(r.program_focus, 'competition')
FROM auth.users u
LEFT JOIN public.registrations r ON (r.user_id = u.id OR r.student_email = u.email)
ORDER BY u.id, r.id DESC NULLS LAST
ON CONFLICT (id) DO UPDATE SET
    first_name = CASE WHEN public.profiles.first_name IS NULL OR public.profiles.first_name = '' THEN EXCLUDED.first_name ELSE public.profiles.first_name END,
    last_name = CASE WHEN public.profiles.last_name IS NULL OR public.profiles.last_name = '' THEN EXCLUDED.last_name ELSE public.profiles.last_name END,
    full_name = CASE WHEN public.profiles.full_name IS NULL OR public.profiles.full_name = '' OR public.profiles.full_name = public.profiles.email THEN EXCLUDED.full_name ELSE public.profiles.full_name END,
    phone = CASE WHEN public.profiles.phone IS NULL OR public.profiles.phone = '' THEN EXCLUDED.phone ELSE public.profiles.phone END,
    dob = CASE WHEN public.profiles.dob IS NULL THEN EXCLUDED.dob ELSE public.profiles.dob END,
    address = CASE WHEN public.profiles.address IS NULL OR public.profiles.address = '' THEN EXCLUDED.address ELSE public.profiles.address END,
    guardian_name = CASE WHEN public.profiles.guardian_name IS NULL OR public.profiles.guardian_name = '' THEN EXCLUDED.guardian_name ELSE public.profiles.guardian_name END,
    guardian_relation = CASE WHEN public.profiles.guardian_relation IS NULL OR public.profiles.guardian_relation = '' THEN EXCLUDED.guardian_relation ELSE public.profiles.guardian_relation END,
    emergency_phone = CASE WHEN public.profiles.emergency_phone IS NULL OR public.profiles.emergency_phone = '' THEN EXCLUDED.emergency_phone ELSE public.profiles.emergency_phone END,
    medical_notes = CASE WHEN public.profiles.medical_notes IS NULL OR public.profiles.medical_notes = '' THEN EXCLUDED.medical_notes ELSE public.profiles.medical_notes END;

UPDATE public.profiles p
SET email_verified = (u.email_confirmed_at IS NOT NULL)
FROM auth.users u
WHERE p.id = u.id;

-- 7B. Pre-verification staging table (prevents unverified spam accounts in auth.users)
CREATE TABLE IF NOT EXISTS public.pending_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_plain TEXT NOT NULL,
    code TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    attempts INTEGER NOT NULL DEFAULT 0,
    last_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.pending_registrations ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 8. ANNOUNCEMENTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL DEFAULT 'Instructor',
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general', -- 'grading', 'tournament', 'clinic', 'schedule', 'general'
    priority TEXT NOT NULL DEFAULT 'standard', -- 'standard', 'important', 'urgent'
    audience TEXT NOT NULL DEFAULT 'All Trainees & Batches',
    event_date DATE,
    venue TEXT,
    pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Announcements Policies
DROP POLICY IF EXISTS "Announcements readable by everyone" ON public.announcements;
CREATE POLICY "Announcements readable by everyone"
    ON public.announcements FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Announcements insertable by authenticated users" ON public.announcements;
DROP POLICY IF EXISTS "Announcements insertable by instructors" ON public.announcements;
CREATE POLICY "Announcements insertable by instructors"
    ON public.announcements FOR INSERT
    WITH CHECK (public.is_instructor());

DROP POLICY IF EXISTS "Announcements updatable by authenticated users" ON public.announcements;
DROP POLICY IF EXISTS "Announcements updatable by instructors" ON public.announcements;
CREATE POLICY "Announcements updatable by instructors"
    ON public.announcements FOR UPDATE
    USING (public.is_instructor())
    WITH CHECK (public.is_instructor());

DROP POLICY IF EXISTS "Announcements deletable by authenticated users" ON public.announcements;
DROP POLICY IF EXISTS "Announcements deletable by instructors" ON public.announcements;
CREATE POLICY "Announcements deletable by instructors"
    ON public.announcements FOR DELETE
    USING (public.is_instructor());

-- ==============================================================================
-- 9. PAYMENTS & DUES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    student_email TEXT,
    item TEXT NOT NULL, -- e.g. "Monthly Tuition (Oct 2026)", "Belt Promotion Exam Fee"
    amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    channel TEXT DEFAULT 'GCash / Maya', -- 'GCash / Maya', 'Studio Cash', 'Bank Transfer'
    ref_number TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'waived')),
    proof_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Payments Policies
DROP POLICY IF EXISTS "Payments readable by authenticated users" ON public.payments;
DROP POLICY IF EXISTS "Payments readable by owner or instructor" ON public.payments;
CREATE POLICY "Payments readable by owner or instructor"
    ON public.payments FOR SELECT
    USING (
        auth.uid() = student_id
        OR (student_id IS NULL AND lower(student_email) = lower(coalesce(auth.jwt() ->> 'email', '')))
        OR public.is_instructor()
    );

DROP POLICY IF EXISTS "Payments insertable by authenticated users" ON public.payments;
DROP POLICY IF EXISTS "Payments insertable by owner or instructor" ON public.payments;
CREATE POLICY "Payments insertable by owner or instructor"
    ON public.payments FOR INSERT
    WITH CHECK (
        public.is_instructor()
        OR (auth.uid() = student_id AND status = 'pending')
    );

DROP POLICY IF EXISTS "Payments updatable by authenticated users" ON public.payments;
DROP POLICY IF EXISTS "Payments updatable by instructors" ON public.payments;
DROP POLICY IF EXISTS "Payments updatable by owner (pending) or instructor" ON public.payments;
CREATE POLICY "Payments updatable by owner (pending) or instructor"
    ON public.payments FOR UPDATE
    USING (
        public.is_instructor()
        OR (auth.uid() = student_id AND status IN ('pending', 'rejected'))
    )
    WITH CHECK (
        public.is_instructor()
        OR (auth.uid() = student_id AND status = 'pending')
    );

DROP POLICY IF EXISTS "Payments deletable by authenticated users" ON public.payments;
DROP POLICY IF EXISTS "Payments deletable by instructors" ON public.payments;
CREATE POLICY "Payments deletable by instructors"
    ON public.payments FOR DELETE
    USING (public.is_instructor());

-- ==============================================================================
-- 10. ACHIEVEMENTS & HONORS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    title TEXT NOT NULL, -- Custom typed title (e.g. "Outstanding Sparring Spirit", "540 Kick Master")
    description TEXT, -- Custom typed citation / reason
    emoji TEXT NOT NULL DEFAULT '🥋', -- Custom typed or picked emoji
    category TEXT DEFAULT 'custom',
    awarded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    awarded_by_name TEXT DEFAULT 'Master Bruce Stephen Norros Faciol',
    awarded_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clean up any orphaned rows from previously deleted auth users
DELETE FROM public.payments
WHERE student_id IS NULL
   OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = student_id);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Achievements Policies
DROP POLICY IF EXISTS "Achievements readable by everyone" ON public.achievements;
DROP POLICY IF EXISTS "Achievements readable by owner or instructor" ON public.achievements;
CREATE POLICY "Achievements readable by owner or instructor"
    ON public.achievements FOR SELECT
    USING (auth.uid() = student_id OR public.is_instructor());

DROP POLICY IF EXISTS "Achievements insertable by authenticated users" ON public.achievements;
DROP POLICY IF EXISTS "Achievements insertable by instructors" ON public.achievements;
CREATE POLICY "Achievements insertable by instructors"
    ON public.achievements FOR INSERT
    WITH CHECK (public.is_instructor());

DROP POLICY IF EXISTS "Achievements updatable by authenticated users" ON public.achievements;
DROP POLICY IF EXISTS "Achievements updatable by instructors" ON public.achievements;
CREATE POLICY "Achievements updatable by instructors"
    ON public.achievements FOR UPDATE
    USING (public.is_instructor())
    WITH CHECK (public.is_instructor());

DROP POLICY IF EXISTS "Achievements deletable by authenticated users" ON public.achievements;
DROP POLICY IF EXISTS "Achievements deletable by instructors" ON public.achievements;
CREATE POLICY "Achievements deletable by instructors"
    ON public.achievements FOR DELETE
    USING (public.is_instructor());

-- ==============================================================================
-- 10B. LEARNING MATERIALS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.learning_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL DEFAULT 'Instructor',
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Forms & Poomsae',
    belt_level TEXT NOT NULL DEFAULT 'All Belts',
    material_type TEXT NOT NULL DEFAULT 'Guide',
    resource_url TEXT,
    media_url TEXT,
    media_type TEXT, -- 'image' or 'video'
    media_name TEXT,
    pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.learning_materials ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE public.learning_materials ADD COLUMN IF NOT EXISTS media_type TEXT;
ALTER TABLE public.learning_materials ADD COLUMN IF NOT EXISTS media_name TEXT;

-- Enable RLS
ALTER TABLE public.learning_materials ENABLE ROW LEVEL SECURITY;

-- Learning Materials Policies
DROP POLICY IF EXISTS "Learning materials readable by everyone" ON public.learning_materials;
CREATE POLICY "Learning materials readable by everyone"
    ON public.learning_materials FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Learning materials insertable by authenticated users" ON public.learning_materials;
DROP POLICY IF EXISTS "Learning materials insertable by instructors" ON public.learning_materials;
CREATE POLICY "Learning materials insertable by instructors"
    ON public.learning_materials FOR INSERT
    WITH CHECK (public.is_instructor());

DROP POLICY IF EXISTS "Learning materials updatable by authenticated users" ON public.learning_materials;
DROP POLICY IF EXISTS "Learning materials updatable by instructors" ON public.learning_materials;
CREATE POLICY "Learning materials updatable by instructors"
    ON public.learning_materials FOR UPDATE
    USING (public.is_instructor())
    WITH CHECK (public.is_instructor());

DROP POLICY IF EXISTS "Learning materials deletable by authenticated users" ON public.learning_materials;
DROP POLICY IF EXISTS "Learning materials deletable by instructors" ON public.learning_materials;
CREATE POLICY "Learning materials deletable by instructors"
    ON public.learning_materials FOR DELETE
    USING (public.is_instructor());

-- Storage bucket for Learning Materials (images & files)
INSERT INTO storage.buckets (id, name, public)
VALUES ('learning-materials', 'learning-materials', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Learning materials media public read" ON storage.objects;
CREATE POLICY "Learning materials media public read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'learning-materials');

DROP POLICY IF EXISTS "Learning materials media authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "Learning materials media instructor upload" ON storage.objects;
CREATE POLICY "Learning materials media instructor upload"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'learning-materials' AND public.is_instructor());

DROP POLICY IF EXISTS "Learning materials media authenticated delete" ON storage.objects;
DROP POLICY IF EXISTS "Learning materials media instructor delete" ON storage.objects;
CREATE POLICY "Learning materials media instructor delete"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'learning-materials' AND public.is_instructor());

-- ==============================================================================
-- 10C. USER DEVICES & 2FA EMAIL CODES (Security & Login Activity Alerts)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    device_label TEXT,
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, device_id)
);

ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own devices" ON public.user_devices;
CREATE POLICY "Users can view own devices"
    ON public.user_devices FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can register own devices" ON public.user_devices;
CREATE POLICY "Users can register own devices"
    ON public.user_devices FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own devices" ON public.user_devices;
CREATE POLICY "Users can update own devices"
    ON public.user_devices FOR UPDATE
    USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.login_2fa_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT false,
    failed_attempts INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.login_2fa_codes ADD COLUMN IF NOT EXISTS failed_attempts INT NOT NULL DEFAULT 0;
ALTER TABLE public.login_2fa_codes ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 11. PREMADE INSTRUCTOR ACCOUNTS (Master Bruce, Coach Beanna, Grandmaster Norbe)
-- ==============================================================================
-- OPTION A (RECOMMENDED):
-- If you created the users in the Supabase Dashboard -> Authentication -> Users,
-- run this script to set their role to 'instructor' and populate their profile:

UPDATE public.profiles
SET 
    role = 'instructor',
    full_name = 'Bruce Stephen Norros Faciol',
    first_name = 'Bruce Stephen',
    last_name = 'Norros Faciol',
    belt_rank = 'Black Belt (5th Dan)',
    proficiency = 'Black Belt (5th Dan)'
WHERE LOWER(email) IN ('faciolnorros@gmail.com', 'bruce@fatama.com');

-- Also update user metadata in auth.users so Supabase auth tokens carry role='instructor'
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    '"instructor"'
)
WHERE LOWER(email) IN ('faciolnorros@gmail.com', 'bruce@fatama.com');

UPDATE public.profiles
SET 
    role = 'instructor',
    full_name = 'Coach Beanna Pauline Faciol',
    first_name = 'Beanna Pauline',
    last_name = 'Faciol',
    belt_rank = 'Black Belt (3rd Dan)',
    proficiency = 'Black Belt (3rd Dan)'
WHERE LOWER(email) = 'beanna@fatama.com';

UPDATE public.profiles
SET 
    role = 'instructor',
    full_name = 'Grandmaster Norbe Faciol',
    first_name = 'Norbe',
    last_name = 'Faciol',
    belt_rank = 'Black Belt (8th Dan)',
    proficiency = 'Black Belt (8th Dan)'
WHERE LOWER(email) = 'norbe@fatama.com';

-- ------------------------------------------------------------------------------
-- QUICK FIX FOR "Database error querying schema":
-- In Supabase, tokens must be '' (not NULL), but phone MUST be NULL because
-- auth.users has a unique constraint on phone (users_phone_key) that rejects
-- duplicate empty strings.
-- ------------------------------------------------------------------------------
UPDATE auth.users
SET 
    phone = NULL,
    phone_change = NULL,
    phone_change_token = '',
    confirmation_token = COALESCE(confirmation_token, ''),
    recovery_token = COALESCE(recovery_token, ''),
    email_change_token_new = COALESCE(email_change_token_new, ''),
    email_change = COALESCE(email_change, ''),
    email_change_token_current = COALESCE(email_change_token_current, ''),
    reauthentication_token = COALESCE(reauthentication_token, '')
WHERE LOWER(email) IN ('bruce@fatama.com', 'beanna@fatama.com', 'norbe@fatama.com');

-- ------------------------------------------------------------------------------
-- OPTION B (ALL-IN-ONE SQL CREATION WITH ALL REQUIRED GOTRUE COLUMNS):
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    pwd_hash TEXT := crypt('Instructor2026!', gen_salt('bf'));
    bruce_id UUID := gen_random_uuid();
    beanna_id UUID := gen_random_uuid();
    norbe_id UUID := gen_random_uuid();
BEGIN
    -- 1. Master Bruce Stephen Norros Faciol
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'bruce@fatama.com') THEN
        INSERT INTO auth.users (
            id, instance_id, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, role, aud,
            confirmation_token, recovery_token, email_change_token_new, email_change,
            email_change_token_current, phone_change_token, reauthentication_token,
            phone, created_at, updated_at
        ) VALUES (
            bruce_id, '00000000-0000-0000-0000-000000000000', 'bruce@fatama.com', pwd_hash, NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"full_name":"Bruce Stephen Norros Faciol","role":"instructor"}'::jsonb,
            'authenticated', 'authenticated',
            '', '', '', '', '', '', '',
            NULL, NOW(), NOW()
        );
        INSERT INTO public.profiles (
            id, email, full_name, first_name, last_name, role, belt_rank, proficiency
        ) VALUES (
            bruce_id, 'bruce@fatama.com', 'Bruce Stephen Norros Faciol', 'Bruce Stephen', 'Norros Faciol', 'instructor', 'Black Belt (5th Dan)', 'Black Belt (5th Dan)'
        ) ON CONFLICT (id) DO UPDATE SET role = 'instructor';
    ELSE
        UPDATE public.profiles SET role = 'instructor' WHERE LOWER(email) = 'bruce@fatama.com';
    END IF;

    -- 2. Beanna Pauline Faciol
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'beanna@fatama.com') THEN
        INSERT INTO auth.users (
            id, instance_id, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, role, aud,
            confirmation_token, recovery_token, email_change_token_new, email_change,
            email_change_token_current, phone_change_token, reauthentication_token,
            phone, created_at, updated_at
        ) VALUES (
            beanna_id, '00000000-0000-0000-0000-000000000000', 'beanna@fatama.com', pwd_hash, NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"full_name":"Beanna Pauline Faciol","role":"instructor"}'::jsonb,
            'authenticated', 'authenticated',
            '', '', '', '', '', '', '',
            NULL, NOW(), NOW()
        );
        INSERT INTO public.profiles (
            id, email, full_name, first_name, last_name, role, belt_rank, proficiency
        ) VALUES (
            beanna_id, 'beanna@fatama.com', 'Beanna Pauline Faciol', 'Beanna Pauline', 'Faciol', 'instructor', 'Black Belt (3rd Dan)', 'Black Belt (3rd Dan)'
        ) ON CONFLICT (id) DO UPDATE SET role = 'instructor', full_name = EXCLUDED.full_name;
    ELSE
        UPDATE public.profiles SET role = 'instructor', full_name = 'Beanna Pauline Faciol' WHERE LOWER(email) = 'beanna@fatama.com';
    END IF;

    -- 3. Norbe Faciol
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'norbe@fatama.com') THEN
        INSERT INTO auth.users (
            id, instance_id, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, role, aud,
            confirmation_token, recovery_token, email_change_token_new, email_change,
            email_change_token_current, phone_change_token, reauthentication_token,
            phone, created_at, updated_at
        ) VALUES (
            norbe_id, '00000000-0000-0000-0000-000000000000', 'norbe@fatama.com', pwd_hash, NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"full_name":"Norbe Faciol","role":"instructor"}'::jsonb,
            'authenticated', 'authenticated',
            '', '', '', '', '', '', '',
            NULL, NOW(), NOW()
        );
        INSERT INTO public.profiles (
            id, email, full_name, first_name, last_name, role, belt_rank, proficiency
        ) VALUES (
            norbe_id, 'norbe@fatama.com', 'Norbe Faciol', 'Norbe', 'Faciol', 'instructor', 'Black Belt (8th Dan)', 'Black Belt (8th Dan)'
        ) ON CONFLICT (id) DO UPDATE SET role = 'instructor', full_name = EXCLUDED.full_name;
    ELSE
        UPDATE public.profiles SET role = 'instructor', full_name = 'Norbe Faciol' WHERE LOWER(email) = 'norbe@fatama.com';
    END IF;
END $$;

-- ==============================================================================
-- 13. ATTENDANCE LOGS TABLE (Synced with ₱200 Session Fees)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    student_email TEXT,
    belt_rank TEXT,
    session_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent')),
    fee_amount NUMERIC(10,2) NOT NULL DEFAULT 200.00,
    remarks TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, session_date)
);

ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Attendance readable by authenticated users" ON public.attendance_logs;
DROP POLICY IF EXISTS "Attendance readable by owner or instructor" ON public.attendance_logs;
CREATE POLICY "Attendance readable by owner or instructor"
    ON public.attendance_logs FOR SELECT
    USING (auth.uid() = student_id OR public.is_instructor());

DROP POLICY IF EXISTS "Attendance insertable by authenticated users" ON public.attendance_logs;
DROP POLICY IF EXISTS "Attendance insertable by instructors" ON public.attendance_logs;
CREATE POLICY "Attendance insertable by instructors"
    ON public.attendance_logs FOR INSERT
    WITH CHECK (public.is_instructor());

DROP POLICY IF EXISTS "Attendance updatable by authenticated users" ON public.attendance_logs;
DROP POLICY IF EXISTS "Attendance updatable by instructors" ON public.attendance_logs;
CREATE POLICY "Attendance updatable by instructors"
    ON public.attendance_logs FOR UPDATE
    USING (public.is_instructor())
    WITH CHECK (public.is_instructor());

DROP POLICY IF EXISTS "Attendance deletable by authenticated users" ON public.attendance_logs;
DROP POLICY IF EXISTS "Attendance deletable by instructors" ON public.attendance_logs;
CREATE POLICY "Attendance deletable by instructors"
    ON public.attendance_logs FOR DELETE
    USING (public.is_instructor());

-- ==============================================================================
-- 14. ENFORCE ON DELETE CASCADE & CLEANUP FOR DELETED AUTH USERS
-- ==============================================================================
-- Note: CREATE TABLE IF NOT EXISTS does not alter foreign keys on pre-existing
-- tables. This block cleans up orphaned rows and guarantees ON DELETE CASCADE
-- on payments, achievements, attendance_logs, and registrations.
DELETE FROM public.payments
WHERE student_id IS NULL
   OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = student_id);

DELETE FROM public.achievements
WHERE student_id IS NULL
   OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = student_id);

DELETE FROM public.attendance_logs
WHERE student_id IS NULL
   OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = student_id);

DELETE FROM public.registrations
WHERE user_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = user_id);

DO $$
DECLARE
    tbl RECORD;
    fk RECORD;
BEGIN
    FOR tbl IN
        SELECT * FROM (VALUES
            ('public.payments', 'student_id', 'payments_student_id_fkey'),
            ('public.achievements', 'student_id', 'achievements_student_id_fkey'),
            ('public.attendance_logs', 'student_id', 'attendance_logs_student_id_fkey'),
            ('public.registrations', 'user_id', 'registrations_user_id_fkey')
        ) AS t(table_name, col_name, constraint_name)
    LOOP
        FOR fk IN
            SELECT c.conname
            FROM pg_constraint c
            JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
            WHERE c.conrelid = tbl.table_name::regclass
              AND c.contype = 'f'
              AND a.attname = tbl.col_name
        LOOP
            EXECUTE format('ALTER TABLE %s DROP CONSTRAINT IF EXISTS %I', tbl.table_name, fk.conname);
        END LOOP;

        EXECUTE format(
            'ALTER TABLE %s ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES auth.users(id) ON DELETE CASCADE',
            tbl.table_name, tbl.constraint_name, tbl.col_name
        );
    END LOOP;
END $$;

-- Trigger safeguard: remove any email-matched or NULL-FK records when an auth user is deleted
CREATE OR REPLACE FUNCTION public.handle_auth_user_deleted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.payments
    WHERE student_id = OLD.id
       OR (student_id IS NULL AND OLD.email IS NOT NULL AND lower(student_email) = lower(OLD.email));

    DELETE FROM public.attendance_logs
    WHERE student_id = OLD.id
       OR (student_id IS NULL AND OLD.email IS NOT NULL AND lower(student_email) = lower(OLD.email));

    DELETE FROM public.achievements
    WHERE student_id = OLD.id;

    DELETE FROM public.registrations
    WHERE user_id = OLD.id
       OR (user_id IS NULL AND OLD.email IS NOT NULL AND lower(student_email) = lower(OLD.email));

    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
    AFTER DELETE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_deleted();

