-- Enum para tipos de perfil de usuário
CREATE TYPE public.app_role AS ENUM ('admin', 'installer', 'auxiliary');

-- Enum para tipos de local
CREATE TYPE public.location_type AS ENUM ('main', 'branch', 'warehouse');

-- Enum para status da ordem de serviço
CREATE TYPE public.service_order_status AS ENUM ('pending', 'inProgress', 'completed', 'cancelled');

-- Enum para status do veículo
CREATE TYPE public.vehicle_status AS ENUM ('available', 'inUse', 'maintenance');

-- Tabela de perfis de usuário
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de roles de usuário (separada por segurança)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Tabela de locais
CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type location_type NOT NULL DEFAULT 'branch',
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  tolerance_radius INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de veículos
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate TEXT NOT NULL UNIQUE,
  model TEXT NOT NULL,
  year INTEGER,
  status vehicle_status DEFAULT 'available',
  fuel_level INTEGER DEFAULT 100,
  last_maintenance DATE,
  next_maintenance DATE,
  assigned_to UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de ordens de serviço
CREATE TABLE public.service_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  client_name TEXT NOT NULL,
  client_address TEXT NOT NULL,
  service_type TEXT NOT NULL,
  status service_order_status DEFAULT 'pending',
  scheduled_time TIME,
  scheduled_date DATE DEFAULT CURRENT_DATE,
  team_lead_id UUID REFERENCES public.profiles(id),
  auxiliary_id UUID REFERENCES public.profiles(id),
  vehicle_id UUID REFERENCES public.vehicles(id),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de registros de ponto
CREATE TABLE public.time_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  record_type TEXT NOT NULL CHECK (record_type IN ('entry', 'lunchOut', 'lunchReturn', 'exit')),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location_name TEXT,
  is_validated BOOLEAN DEFAULT false,
  distance_from_main INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_records ENABLE ROW LEVEL SECURITY;

-- Função para verificar role do usuário
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
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

-- Função para criar perfil automaticamente ao registrar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  -- Atribuir role padrão de auxiliary
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'auxiliary');
  RETURN NEW;
END;
$$;

-- Trigger para criar perfil ao registrar
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON public.locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_service_orders_updated_at BEFORE UPDATE ON public.service_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- POLÍTICAS RLS

-- Profiles: usuários podem ver todos os perfis, mas só editar o próprio
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- User Roles: apenas admins podem gerenciar roles, todos autenticados podem ver
CREATE POLICY "Roles are viewable by authenticated users" ON public.user_roles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Locations: todos autenticados podem ver, apenas admins podem gerenciar
CREATE POLICY "Locations are viewable by authenticated users" ON public.locations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage locations" ON public.locations
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Vehicles: todos autenticados podem ver, apenas admins podem gerenciar
CREATE POLICY "Vehicles are viewable by authenticated users" ON public.vehicles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage vehicles" ON public.vehicles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Service Orders: todos autenticados podem ver, admins e instaladores podem criar/editar
CREATE POLICY "Service orders are viewable by authenticated users" ON public.service_orders
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and installers can insert service orders" ON public.service_orders
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'installer')
  );

CREATE POLICY "Admins and installers can update service orders" ON public.service_orders
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'installer')
  );

CREATE POLICY "Admins can delete service orders" ON public.service_orders
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Time Records: usuários podem ver/criar seus próprios registros, admins podem ver todos
CREATE POLICY "Users can view their own time records" ON public.time_records
  FOR SELECT TO authenticated USING (
    auth.uid() = user_id OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can insert their own time records" ON public.time_records
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all time records" ON public.time_records
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));