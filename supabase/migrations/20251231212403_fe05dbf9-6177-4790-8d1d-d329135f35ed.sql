-- Fix PUBLIC_DATA_EXPOSURE: Restrict service orders access to relevant users only

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service orders are viewable by authenticated users" ON public.service_orders;

-- Create a role-based policy that only shows relevant orders
CREATE POLICY "Users can view relevant service orders" 
ON public.service_orders
FOR SELECT 
TO authenticated 
USING (
  created_by = auth.uid() OR 
  team_lead_id = auth.uid() OR 
  auxiliary_id = auth.uid() OR 
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'installer')
);