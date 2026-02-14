
-- ============================================
-- 1. ENUM TYPES
-- ============================================
CREATE TYPE public.app_role AS ENUM ('super_admin', 'company_admin', 'employee', 'client');
CREATE TYPE public.company_status AS ENUM ('active', 'suspended', 'trial');
CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');
CREATE TYPE public.product_sale_status AS ENUM ('pending', 'completed', 'cancelled');

-- ============================================
-- 2. PROFILES TABLE (linked to auth.users)
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 3. USER ROLES TABLE
-- ============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  company_id UUID, -- filled later with FK
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Get user's company_id
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Super admins can manage all roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- ============================================
-- 4. COMPANIES TABLE
-- ============================================
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  status company_status NOT NULL DEFAULT 'active',
  cancel_limit_hours INTEGER NOT NULL DEFAULT 12,
  max_advance_days INTEGER NOT NULL DEFAULT 30,
  max_active_appointments INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Add FK to user_roles
ALTER TABLE public.user_roles ADD CONSTRAINT fk_user_roles_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

CREATE POLICY "Company visible to its members" ON public.companies FOR SELECT USING (
  public.has_role(auth.uid(), 'super_admin') OR
  id = public.get_user_company_id(auth.uid())
);
CREATE POLICY "Super admins manage companies" ON public.companies FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Company admins update own company" ON public.companies FOR UPDATE USING (
  public.has_role(auth.uid(), 'company_admin') AND id = public.get_user_company_id(auth.uid())
);

-- ============================================
-- 5. SERVICES TABLE
-- ============================================
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Services visible to company members" ON public.services FOR SELECT USING (
  company_id = public.get_user_company_id(auth.uid())
);
CREATE POLICY "Company admins manage services" ON public.services FOR ALL USING (
  public.has_role(auth.uid(), 'company_admin') AND company_id = public.get_user_company_id(auth.uid())
);

-- ============================================
-- 6. PROFESSIONALS TABLE (employees who provide services)
-- ============================================
CREATE TABLE public.professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  specialties TEXT[],
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals visible to company members" ON public.professionals FOR SELECT USING (
  company_id = public.get_user_company_id(auth.uid())
);
CREATE POLICY "Company admins manage professionals" ON public.professionals FOR ALL USING (
  public.has_role(auth.uid(), 'company_admin') AND company_id = public.get_user_company_id(auth.uid())
);

-- ============================================
-- 7. WORKING HOURS TABLE
-- ============================================
CREATE TABLE public.working_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (company_id, professional_id, day_of_week)
);
ALTER TABLE public.working_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Working hours visible to company" ON public.working_hours FOR SELECT USING (
  company_id = public.get_user_company_id(auth.uid())
);
CREATE POLICY "Admins manage working hours" ON public.working_hours FOR ALL USING (
  public.has_role(auth.uid(), 'company_admin') AND company_id = public.get_user_company_id(auth.uid())
);

-- ============================================
-- 8. CLIENTS TABLE
-- ============================================
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  birthday DATE,
  address TEXT,
  notes TEXT,
  preferences JSONB DEFAULT '{}',
  favorite_professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients visible to company staff" ON public.clients FOR SELECT USING (
  company_id = public.get_user_company_id(auth.uid())
);
CREATE POLICY "Clients can view own record" ON public.clients FOR SELECT USING (
  user_id = auth.uid()
);
CREATE POLICY "Clients can update own record" ON public.clients FOR UPDATE USING (
  user_id = auth.uid()
);
CREATE POLICY "Staff manage clients" ON public.clients FOR ALL USING (
  (public.has_role(auth.uid(), 'company_admin') OR public.has_role(auth.uid(), 'employee'))
  AND company_id = public.get_user_company_id(auth.uid())
);

-- ============================================
-- 9. APPOINTMENTS TABLE
-- ============================================
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status appointment_status NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  booked_by_client BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Appointments visible to company staff" ON public.appointments FOR SELECT USING (
  company_id = public.get_user_company_id(auth.uid())
);
CREATE POLICY "Clients see own appointments" ON public.appointments FOR SELECT USING (
  client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
);
CREATE POLICY "Clients create appointments" ON public.appointments FOR INSERT WITH CHECK (
  client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
  AND booked_by_client = true
);
CREATE POLICY "Staff manage appointments" ON public.appointments FOR ALL USING (
  (public.has_role(auth.uid(), 'company_admin') OR public.has_role(auth.uid(), 'employee'))
  AND company_id = public.get_user_company_id(auth.uid())
);

-- Index for conflict checking
CREATE INDEX idx_appointments_schedule ON public.appointments (company_id, professional_id, date, start_time, end_time)
  WHERE status NOT IN ('cancelled');

-- ============================================
-- 10. PRODUCTS TABLE
-- ============================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  duration_days INTEGER NOT NULL DEFAULT 30,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products visible to company" ON public.products FOR SELECT USING (
  company_id = public.get_user_company_id(auth.uid())
);
CREATE POLICY "Admins manage products" ON public.products FOR ALL USING (
  public.has_role(auth.uid(), 'company_admin') AND company_id = public.get_user_company_id(auth.uid())
);

-- ============================================
-- 11. PRODUCT SALES TABLE
-- ============================================
CREATE TABLE public.product_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  estimated_end_date DATE,
  status product_sale_status NOT NULL DEFAULT 'completed',
  booked_by_client BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.product_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sales visible to company staff" ON public.product_sales FOR SELECT USING (
  company_id = public.get_user_company_id(auth.uid())
);
CREATE POLICY "Clients see own purchases" ON public.product_sales FOR SELECT USING (
  client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
);
CREATE POLICY "Staff manage sales" ON public.product_sales FOR ALL USING (
  (public.has_role(auth.uid(), 'company_admin') OR public.has_role(auth.uid(), 'employee'))
  AND company_id = public.get_user_company_id(auth.uid())
);

-- ============================================
-- 12. AUTO-CREATE PROFILE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 13. UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_professionals_updated_at BEFORE UPDATE ON public.professionals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
