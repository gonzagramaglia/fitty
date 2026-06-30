-- Supabase Schema for Fitty
-- Run this entire script in the Supabase SQL Editor

-- 1. Create Cats Table
CREATE TABLE IF NOT EXISTS cats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    breed TEXT,
    age_years NUMERIC,
    base_weight_kg NUMERIC,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Cats
ALTER TABLE cats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own cats" ON cats;
CREATE POLICY "Users can manage their own cats" ON cats FOR ALL USING (auth.uid() = user_id);

-- 2. Create Health Checks Table
CREATE TABLE IF NOT EXISTS health_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cat_id UUID REFERENCES cats(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    top_photo_url TEXT,
    side_photo_url TEXT,
    voice_note_url TEXT,
    text_note TEXT,
    bcs_score NUMERIC,
    classification TEXT,
    ai_reasoning TEXT,
    recommendations JSONB,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Health Checks
ALTER TABLE health_checks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own health checks" ON health_checks;
CREATE POLICY "Users can manage their own health checks" ON health_checks FOR ALL USING (auth.uid() = user_id);

-- 3. Auto-update updated_at Trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_cats_updated_at ON cats;
CREATE TRIGGER set_cats_updated_at
BEFORE UPDATE ON cats
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_health_checks_updated_at ON health_checks;
CREATE TRIGGER set_health_checks_updated_at
BEFORE UPDATE ON health_checks
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 4. Storage Buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('cat_avatars', 'cat_avatars', true),
  ('cat_photos', 'cat_photos', true),
  ('voice_notes', 'voice_notes', true),
  ('user_avatars', 'user_avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Storage RLS Policies (Public Read, Authenticated Write)
-- cat_avatars
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'cat_avatars');
DROP POLICY IF EXISTS "Users can upload their own avatars." ON storage.objects;
CREATE POLICY "Users can upload their own avatars." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'cat_avatars' AND auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users can update their own avatars." ON storage.objects;
CREATE POLICY "Users can update their own avatars." ON storage.objects FOR UPDATE USING (bucket_id = 'cat_avatars' AND auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users can delete their own avatars." ON storage.objects;
CREATE POLICY "Users can delete their own avatars." ON storage.objects FOR DELETE USING (bucket_id = 'cat_avatars' AND auth.role() = 'authenticated');

-- cat_photos
DROP POLICY IF EXISTS "Photos are publicly accessible." ON storage.objects;
CREATE POLICY "Photos are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'cat_photos');
DROP POLICY IF EXISTS "Users can upload photos." ON storage.objects;
CREATE POLICY "Users can upload photos." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'cat_photos' AND auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users can update photos." ON storage.objects;
CREATE POLICY "Users can update photos." ON storage.objects FOR UPDATE USING (bucket_id = 'cat_photos' AND auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users can delete photos." ON storage.objects;
CREATE POLICY "Users can delete photos." ON storage.objects FOR DELETE USING (bucket_id = 'cat_photos' AND auth.role() = 'authenticated');

-- voice_notes
DROP POLICY IF EXISTS "Voice notes are publicly accessible." ON storage.objects;
CREATE POLICY "Voice notes are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'voice_notes');
DROP POLICY IF EXISTS "Users can upload voice notes." ON storage.objects;
CREATE POLICY "Users can upload voice notes." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'voice_notes' AND auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users can update voice notes." ON storage.objects;
CREATE POLICY "Users can update voice notes." ON storage.objects FOR UPDATE USING (bucket_id = 'voice_notes' AND auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users can delete voice notes." ON storage.objects;
CREATE POLICY "Users can delete voice notes." ON storage.objects FOR DELETE USING (bucket_id = 'voice_notes' AND auth.role() = 'authenticated');

-- user_avatars
DROP POLICY IF EXISTS "User avatars are publicly accessible." ON storage.objects;
CREATE POLICY "User avatars are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'user_avatars');
DROP POLICY IF EXISTS "Users can upload their own user avatars." ON storage.objects;
CREATE POLICY "Users can upload their own user avatars." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'user_avatars' AND auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users can update their own user avatars." ON storage.objects;
CREATE POLICY "Users can update their own user avatars." ON storage.objects FOR UPDATE USING (bucket_id = 'user_avatars' AND auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users can delete their own user avatars." ON storage.objects;
CREATE POLICY "Users can delete their own user avatars." ON storage.objects FOR DELETE USING (bucket_id = 'user_avatars' AND auth.role() = 'authenticated');

