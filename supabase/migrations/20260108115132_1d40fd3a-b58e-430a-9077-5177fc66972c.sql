-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  zip_code TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Admins can manage clients
CREATE POLICY "Admins can manage clients"
ON public.clients
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users with roles can view clients
CREATE POLICY "Users with roles can view clients"
ON public.clients
FOR SELECT
USING (has_any_role(auth.uid()));

-- Add client_id to service_orders
ALTER TABLE public.service_orders
ADD COLUMN client_id UUID REFERENCES public.clients(id);

-- Add checklist_template_id to service_orders for required checklist on completion
ALTER TABLE public.service_orders
ADD COLUMN checklist_template_id TEXT;

-- Add completed_checklist to store the filled checklist data
ALTER TABLE public.service_orders
ADD COLUMN completed_checklist JSONB;

-- Create trigger for updated_at
CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();