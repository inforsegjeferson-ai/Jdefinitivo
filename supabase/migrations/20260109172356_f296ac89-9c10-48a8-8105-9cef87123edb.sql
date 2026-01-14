-- Add mileage columns to service_orders table for tracking vehicle kilometers
ALTER TABLE public.service_orders 
ADD COLUMN IF NOT EXISTS start_mileage integer,
ADD COLUMN IF NOT EXISTS end_mileage integer;

-- Add comment for documentation
COMMENT ON COLUMN public.service_orders.start_mileage IS 'Vehicle mileage when the service order was started';
COMMENT ON COLUMN public.service_orders.end_mileage IS 'Vehicle mileage when the service order was completed';