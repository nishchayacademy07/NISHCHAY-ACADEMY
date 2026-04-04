-- ============================================================
-- NISHCHAY ACADEMY - COMPLETE DATABASE SCHEMA (CMS READY)
-- ============================================================

-- CLEAN SLATE (Drops old versions if they exist to prevent errors)
DROP TABLE IF EXISTS public.site_settings CASCADE;
DROP TABLE IF EXISTS public.enrollments CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- STORAGE SETUP (BUCKET FIX)
-- ============================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', true) 
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public access to media bucket" ON storage.objects;
    CREATE POLICY "Public access to media bucket" ON storage.objects FOR SELECT USING (bucket_id = 'media');
    
    DROP POLICY IF EXISTS "Admins can upload to media bucket" ON storage.objects;
    CREATE POLICY "Admins can upload to media bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');
    
    DROP POLICY IF EXISTS "Admins can update media bucket" ON storage.objects;
    CREATE POLICY "Admins can update media bucket" ON storage.objects FOR UPDATE USING (bucket_id = 'media' AND auth.role() = 'authenticated');
    
    DROP POLICY IF EXISTS "Admins can delete media bucket" ON storage.objects;
    CREATE POLICY "Admins can delete media bucket" ON storage.objects FOR DELETE USING (bucket_id = 'media' AND auth.role() = 'authenticated');
END $$;

-- 2. COURSES TABLE
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  price NUMERIC DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ENROLLMENTS TABLE
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  progress INT DEFAULT 0,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

-- 4. SITE SETTINGS TABLE (Enhanced for CMS)
CREATE TABLE IF NOT EXISTS public.site_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  logo_url TEXT,
  primary_color TEXT DEFAULT '#0d6efd',
  whatsapp_number TEXT DEFAULT '919876543210',
  contact_email TEXT DEFAULT 'hello@nishchayacademy.com',
  -- CMS Fields
  hero_title TEXT DEFAULT 'Shape Your Future with Excellence',
  hero_subtitle TEXT DEFAULT 'Join Nishchay Academy for comprehensive coaching and academic success.',
  about_heading TEXT DEFAULT 'About Nishchay Academy',
  about_content TEXT DEFAULT 'We provide quality education to help students achieve their goals in competitive exams and academics.',
  footer_text TEXT DEFAULT 'Nishchay Academy - Empowering Students since 2024',
  -- Stats
  stat_students TEXT DEFAULT '47K+',
  stat_success TEXT DEFAULT '98.6%',
  stat_years TEXT DEFAULT '22 Yrs',
  stat_air1 TEXT DEFAULT '340+'
);

-- 5. ENQUIRIES TABLE
CREATE TABLE IF NOT EXISTS public.enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. GALLERY TABLE
CREATE TABLE IF NOT EXISTS public.gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. FACULTY TABLE
CREATE TABLE IF NOT EXISTS public.faculty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  experience TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. TOPPERS TABLE
CREATE TABLE IF NOT EXISTS public.toppers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  exam TEXT NOT NULL,
  score TEXT NOT NULL,
  year_info TEXT,
  rank TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. TESTIMONIALS TABLE
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  detail TEXT NOT NULL,
  text TEXT NOT NULL,
  avatar_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) - IDEMPOTENT FIX
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toppers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- USERS POLICIES (Fixed: no recursive self-reference)
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
    CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
    
    DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
    CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
    
    DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
    -- FIX: Use auth.jwt() instead of querying public.users to avoid infinite recursion
    CREATE POLICY "Admins can view all users" ON public.users FOR SELECT
      USING ((auth.jwt() ->> 'role') = 'admin' OR auth.uid() = id);
    
    DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
    CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
    
    DROP POLICY IF EXISTS "Admins can manage users" ON public.users;
    CREATE POLICY "Admins can manage users" ON public.users FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');
END $$;

-- COURSES POLICIES
DO $$ BEGIN
    DROP POLICY IF EXISTS "Anyone can view courses" ON public.courses;
    CREATE POLICY "Anyone can view courses" ON public.courses FOR SELECT TO public USING (true);
    
    DROP POLICY IF EXISTS "Admins can manage courses" ON public.courses;
    -- FIX: Use direct role column lookup (no recursion since it's a different table)
    CREATE POLICY "Admins can manage courses" ON public.courses FOR ALL
      USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
END $$;

-- ENROLLMENTS POLICIES
DO $$ BEGIN
    DROP POLICY IF EXISTS "Students can view their own enrollments" ON public.enrollments;
    CREATE POLICY "Students can view their own enrollments" ON public.enrollments FOR SELECT USING (auth.uid() = student_id);
    
    DROP POLICY IF EXISTS "Students can enroll themselves" ON public.enrollments;
    CREATE POLICY "Students can enroll themselves" ON public.enrollments FOR INSERT WITH CHECK (auth.uid() = student_id);
    
    DROP POLICY IF EXISTS "Admins can view all enrollments" ON public.enrollments;
    CREATE POLICY "Admins can view all enrollments" ON public.enrollments FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
END $$;

-- ENQUIRIES POLICIES
DO $$ BEGIN
    DROP POLICY IF EXISTS "Anyone can insert enquiries" ON public.enquiries;
    CREATE POLICY "Anyone can insert enquiries" ON public.enquiries FOR INSERT WITH CHECK (true);
    
    DROP POLICY IF EXISTS "Admins can view all enquiries" ON public.enquiries;
    CREATE POLICY "Admins can view all enquiries" ON public.enquiries FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
END $$;

-- MEDIA/CONTENT POLICIES (Gallery, Faculty, Toppers, Testimonials)
DO $$ BEGIN
    -- Gallery
    DROP POLICY IF EXISTS "Anyone can view gallery" ON public.gallery;
    CREATE POLICY "Anyone can view gallery" ON public.gallery FOR SELECT TO public USING (true);
    DROP POLICY IF EXISTS "Admins can manage gallery" ON public.gallery;
    CREATE POLICY "Admins can manage gallery" ON public.gallery FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

    -- Faculty
    DROP POLICY IF EXISTS "Anyone can view faculty" ON public.faculty;
    CREATE POLICY "Anyone can view faculty" ON public.faculty FOR SELECT TO public USING (true);
    DROP POLICY IF EXISTS "Admins can manage faculty" ON public.faculty;
    CREATE POLICY "Admins can manage faculty" ON public.faculty FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

    -- Toppers
    DROP POLICY IF EXISTS "Anyone can view toppers" ON public.toppers;
    CREATE POLICY "Anyone can view toppers" ON public.toppers FOR SELECT TO public USING (true);
    DROP POLICY IF EXISTS "Admins can manage toppers" ON public.toppers;
    CREATE POLICY "Admins can manage toppers" ON public.toppers FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

    -- Testimonials
    DROP POLICY IF EXISTS "Anyone can view testimonials" ON public.testimonials;
    CREATE POLICY "Anyone can view testimonials" ON public.testimonials FOR SELECT TO public USING (true);
    DROP POLICY IF EXISTS "Admins can manage testimonials" ON public.testimonials;
    CREATE POLICY "Admins can manage testimonials" ON public.testimonials FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
END $$;

-- SITE SETTINGS POLICIES
DO $$ BEGIN
    DROP POLICY IF EXISTS "Anyone can view settings" ON public.site_settings;
    CREATE POLICY "Anyone can view settings" ON public.site_settings FOR SELECT TO public USING (true);
    
    DROP POLICY IF EXISTS "Admins can update settings" ON public.site_settings;
    CREATE POLICY "Admins can update settings" ON public.site_settings FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
END $$;

-- ============================================================
-- INITIAL SEED DATA
-- ============================================================

-- Create default settings row
INSERT INTO public.site_settings (id, logo_url, primary_color, whatsapp_number, contact_email) 
VALUES (1, '', '#0d6efd', '919876543210', 'hello@nishchayacademy.com')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- RPC FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total integer;
BEGIN
  SELECT count(*) INTO total FROM public.users;
  RETURN total;
END;
$$;

-- ============================================================
-- 🔑 HOW TO BECOME AN ADMIN
-- ============================================================
-- UPDATE public.users SET role = 'admin' WHERE email = 'your-email@example.com';
