-- Tighten vehicle RLS policies to apply only to authenticated users.
-- This does not change intended access logic (the USING clauses already block anon via auth.uid() = NULL),
-- but it satisfies scanners that flag policies not explicitly scoped to authenticated.

ALTER POLICY "Admins can manage vehicles" ON public.vehicles
TO authenticated;

ALTER POLICY "Users with roles can view vehicles" ON public.vehicles
TO authenticated;
