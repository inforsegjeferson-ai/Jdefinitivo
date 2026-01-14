-- Função para registrar produtos usados em uma OS e dar baixa no estoque
create or replace function public.use_service_order_products(
  service_order_id uuid,
  products jsonb
) returns void as $$
declare
  item jsonb;
  prod_id uuid;
  qty integer;
  prod_name text;
  unit text;
  current_stock integer;
  new_stock integer;
begin
  for item in select * from jsonb_array_elements(products) loop
    prod_id := (item->>'product_id')::uuid;
    prod_name := item->>'product_name';
    qty := (item->>'quantity')::integer;
    unit := item->>'unit';

    select stock_quantity into current_stock from public.products where id = prod_id for update;
    if current_stock is null then
      raise exception 'Produto não encontrado %', prod_id;
    end if;
    new_stock := current_stock - qty;
    if new_stock < 0 then
      raise exception 'Estoque insuficiente para o produto %', prod_id;
    end if;

    update public.products set stock_quantity = new_stock, updated_at = now() where id = prod_id;

    insert into public.service_order_products(service_order_id, product_id, product_name, quantity, unit, created_by)
    values (service_order_id, prod_id, prod_name, qty, unit, auth.uid()::uuid);

    insert into public.inventory_movements(product_id, service_order_id, quantity_change, reason, user_id)
    values (prod_id, service_order_id, -qty, 'service_order', auth.uid()::uuid);
  end loop;
end;
$$ language plpgsql security definer;
