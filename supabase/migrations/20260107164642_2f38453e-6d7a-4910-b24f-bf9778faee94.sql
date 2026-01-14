-- Create table for service order evidence/proof
CREATE TABLE public.service_order_evidence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_order_id UUID NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('photo', 'signature')),
  data_url TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  captured_by UUID NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_order_evidence ENABLE ROW LEVEL SECURITY;

-- Policies - using user_roles table directly instead of has_role function
CREATE POLICY "Users can view evidence for orders they have access to"
ON public.service_order_evidence
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.service_orders so
    WHERE so.id = service_order_id
    AND (so.team_lead_id = auth.uid() OR so.auxiliary_id = auth.uid() OR so.created_by = auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

CREATE POLICY "Team members can insert evidence"
ON public.service_order_evidence
FOR INSERT
WITH CHECK (
  captured_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.service_orders so
    WHERE so.id = service_order_id
    AND (so.team_lead_id = auth.uid() OR so.auxiliary_id = auth.uid())
  )
);

-- Index for performance
CREATE INDEX idx_evidence_service_order ON public.service_order_evidence(service_order_id);
CREATE INDEX idx_evidence_type ON public.service_order_evidence(type);