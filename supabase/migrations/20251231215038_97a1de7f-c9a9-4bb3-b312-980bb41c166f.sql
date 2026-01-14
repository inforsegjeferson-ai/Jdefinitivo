-- Fix 1: Update handle_new_user() to NOT assign role automatically
-- Users will need admin approval before getting access
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    false -- Inactive by default, requires admin approval
  );
  -- No role assigned - admin must approve and assign role manually
  RETURN NEW;
END;
$$;

-- Fix 2: Restrict profiles table access
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

-- Helper function to check if user has ANY role assigned
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
  )
$$;

-- Users can only view their own profile, OR admins/installers can view all active team members
CREATE POLICY "Users can view own profile or team members with role"
ON public.profiles
FOR SELECT TO authenticated
USING (
  auth.uid() = id 
  OR public.has_role(auth.uid(), 'admin')
  OR (public.has_any_role(auth.uid()) AND is_active = true)
);

-- Fix 3: Restrict user_roles access - only users with a role can view roles
DROP POLICY IF EXISTS "Roles are viewable by authenticated users" ON public.user_roles;

CREATE POLICY "Users with roles can view all roles"
ON public.user_roles
FOR SELECT TO authenticated
USING (
  public.has_any_role(auth.uid())
);

-- Fix 4: Restrict vehicles access - only users with a role can view
DROP POLICY IF EXISTS "Vehicles are viewable by authenticated users" ON public.vehicles;

CREATE POLICY "Users with roles can view vehicles"
ON public.vehicles
FOR SELECT TO authenticated
USING (
  public.has_any_role(auth.uid())
);

-- Fix 5: Restrict locations access - only users with a role can view
DROP POLICY IF EXISTS "Locations are viewable by authenticated users" ON public.locations;

CREATE POLICY "Users with roles can view locations"
ON public.locations
FOR SELECT TO authenticated
USING (
  public.has_any_role(auth.uid())
);