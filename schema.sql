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
  footer_text TEXT DEFAULT 'Nishchay Academy - Empowering Students since 2024'
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) - IDEMPOTENT FIX
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

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
