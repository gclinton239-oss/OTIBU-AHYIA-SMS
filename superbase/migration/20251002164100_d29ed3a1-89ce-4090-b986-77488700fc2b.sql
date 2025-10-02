-- Create user_roles table for secure role management
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role FROM public.profiles
ON CONFLICT (user_id, role) DO NOTHING;

-- Update RLS policies to use the secure function

-- Drop old policies
DROP POLICY IF EXISTS "Admins and teachers can manage attendance" ON public.attendance;
DROP POLICY IF EXISTS "Admins and teachers can manage classes" ON public.classes;
DROP POLICY IF EXISTS "Admins and teachers can manage grades" ON public.grades;
DROP POLICY IF EXISTS "Admins and teachers can manage students" ON public.students;
DROP POLICY IF EXISTS "Admins can manage subjects" ON public.subjects;

-- Create new secure policies for attendance
CREATE POLICY "Admins and teachers can manage attendance"
ON public.attendance
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'teacher')
);

-- Create new secure policies for classes
CREATE POLICY "Admins and teachers can manage classes"
ON public.classes
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'teacher')
);

-- Create new secure policies for grades
CREATE POLICY "Admins and teachers can manage grades"
ON public.grades
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'teacher')
);

-- Create new secure policies for students
CREATE POLICY "Admins and teachers can manage students"
ON public.students
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'teacher')
);

-- Create new secure policies for subjects
CREATE POLICY "Admins can manage subjects"
ON public.subjects
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create policy for user_roles table (only admins can manage roles)
CREATE POLICY "Admins can manage user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Create table for storing face embeddings
CREATE TABLE IF NOT EXISTS public.student_face_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    embedding FLOAT8[] NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.student_face_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and teachers can manage face embeddings"
ON public.student_face_embeddings
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'teacher')
);

-- Add trigger for updated_at
CREATE TRIGGER update_student_face_embeddings_updated_at
BEFORE UPDATE ON public.student_face_embeddings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();