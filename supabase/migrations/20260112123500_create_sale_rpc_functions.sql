-- Function to create a sale atomically: inserts sale, updates product stock, and records inventory movements
create or replace function public.create_sale_transaction(sale_json jsonb)
returns uuid as $$
declare
  sale_id uuid;
  item jsonb;
  prod_id uuid;
  qty integer;
  current_stock integer;
  new_stock integer;
begin
  -- Insert sale record; user_id is set from auth.uid()
  insert into public.sales(number, customer, customer_phone, items, subtotal, discount, total, payment_method, installments, status, notes, user_id)
  values (
    sale_json->> 'number',
    sale_json->> 'customer',
    sale_json->> 'customerPhone',
    sale_json-> 'items',
    (sale_json->> 'subtotal')::numeric,
    (sale_json->> 'discount')::numeric,
    (sale_json->> 'total')::numeric,
    sale_json->> 'paymentMethod',
    (sale_json->> 'installments')::integer,
    sale_json->> 'status',
    sale_json->> 'notes',
    auth.uid()::uuid
  ) returning id into sale_id;

  -- Loop through items and decrement product stock, inserting inventory movements
  for item in select * from jsonb_array_elements(sale_json->'items') loop
    prod_id := (item->'product'->>'id')::uuid;
    qty := (item->>'quantity')::integer;

    select stock_quantity into current_stock from public.products where id = prod_id for update;
    if current_stock is null then
      raise exception 'Product not found %', prod_id;
    end if;
    new_stock := current_stock - qty;
    if new_stock < 0 then
      raise exception 'Insufficient stock for product %', prod_id;
    end if;

    update public.products set stock_quantity = new_stock, updated_at = now() where id = prod_id;

    insert into public.inventory_movements(product_id, sale_id, quantity_change, reason, user_id)
    values (prod_id, sale_id, -qty, 'sale', auth.uid()::uuid);
  end loop;

  return sale_id;
end;
$$ language plpgsql security definer;

-- Function to cancel a sale and restore stock
create or replace function public.cancel_sale_transaction(sale_id uuid)
returns void as $$
declare
  rec record;
  item jsonb;
  prod_id uuid;
  qty integer;
  current_stock integer;
  new_stock integer;
begin
  for rec in select * from public.sales where id = sale_id limit 1 loop
    if rec.status = 'cancelled' then
      return;
    end if;

    for item in select * from jsonb_array_elements(rec.items) loop
      prod_id := (item->'product'->>'id')::uuid;
      qty := (item->>'quantity')::integer;
      select stock_quantity into current_stock from public.products where id = prod_id for update;
      if current_stock is null then
        continue;
      end if;
      new_stock := current_stock + qty;
      update public.products set stock_quantity = new_stock, updated_at = now() where id = prod_id;
      insert into public.inventory_movements(product_id, sale_id, quantity_change, reason, user_id)
      values (prod_id, sale_id, qty, 'sale_cancel', auth.uid()::uuid);
    end loop;

    update public.sales set status = 'cancelled', updated_at = now() where id = sale_id;
  end loop;
end;
$$ language plpgsql security definer;
