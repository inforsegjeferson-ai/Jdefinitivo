-- Create sales and inventory_movements tables
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  number text,
  customer text,
  customer_phone text,
  items jsonb not null,
  subtotal numeric,
  discount numeric,
  total numeric,
  payment_method text,
  installments integer,
  status text,
  notes text,
  user_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_sales_user_id on public.sales(user_id);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid,
  sale_id uuid,
  quantity_change integer not null,
  reason text,
  user_id uuid,
  created_at timestamptz default now()
);

create index if not exists idx_inventory_movements_product_id on public.inventory_movements(product_id);
create index if not exists idx_inventory_movements_sale_id on public.inventory_movements(sale_id);

-- Trigger to update updated_at
create or replace function public.trg_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists set_updated_at_on_sales on public.sales;
create trigger set_updated_at_on_sales
  before update on public.sales
  for each row execute procedure public.trg_set_updated_at();

-- RLS: enable row level security and basic policies
alter table public.sales enable row level security;
-- allow authenticated users to select their own sales
create policy "select_own_sales" on public.sales
  for select using (user_id = auth.uid());
-- allow authenticated users to insert sales where user_id = auth.uid()
create policy "insert_own_sales" on public.sales
  for insert with check (user_id = auth.uid());

alter table public.inventory_movements enable row level security;
create policy "select_inventory_for_user" on public.inventory_movements
  for select using (auth.uid() IS NOT NULL);
create policy "insert_inventory_by_user" on public.inventory_movements
  for insert with check (user_id = auth.uid());
