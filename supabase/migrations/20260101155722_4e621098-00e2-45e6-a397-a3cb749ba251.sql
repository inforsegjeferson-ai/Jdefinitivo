-- Atomic user approval to avoid inconsistent active/roleless state
-- Only admins can execute this operation
CREATE OR REPLACE FUNCTION public.approve_user_with_role(
  _user_id uuid,
  _role public.app_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ensure only admins can approve users
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  -- Activate user
  UPDATE public.profiles
  SET is_active = true,
      updated_at = now()
  WHERE id = _user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'user not found';
  END IF;

  -- Assign role (idempotent)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Lock down execution permissions
REVOKE ALL ON FUNCTION public.approve_user_with_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_user_with_role(uuid, public.app_role) TO authenticated;