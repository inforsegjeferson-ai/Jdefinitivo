-- Create audit log table for service orders
CREATE TABLE public.service_order_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id UUID NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_status service_order_status,
  new_status service_order_status,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_order_audit ENABLE ROW LEVEL SECURITY;

-- Policies: admins can see all, users can see their own actions or related OS
CREATE POLICY "Users can view audit logs for their orders"
ON public.service_order_audit
FOR SELECT
USING (
  user_id = auth.uid() OR
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM public.service_orders so
    WHERE so.id = service_order_id
    AND (so.team_lead_id = auth.uid() OR so.auxiliary_id = auth.uid())
  )
);

-- Only system can insert (via authenticated users with proper role)
CREATE POLICY "Authenticated users can insert audit logs"
ON public.service_order_audit
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_audit_service_order ON public.service_order_audit(service_order_id);
CREATE INDEX idx_audit_created_at ON public.service_order_audit(created_at DESC);