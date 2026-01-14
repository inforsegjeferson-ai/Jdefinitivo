-- Tabela para registrar produtos usados em ordens de serviço
create table if not exists service_order_products (
  id uuid primary key default gen_random_uuid(),
  service_order_id uuid references service_orders(id) on delete cascade not null,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit text,
  created_at timestamp with time zone default now(),
  created_by uuid references users(id) on delete set null
);

-- Índice para busca rápida por ordem de serviço
create index if not exists idx_service_order_products_order_id on service_order_products(service_order_id);

-- RLS básica (ajuste conforme necessário)
alter table service_order_products enable row level security;
