-- Create table to store PDF templates per user
create table if not exists pdf_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null default 'sale',
  template jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists idx_pdf_templates_user_key on pdf_templates(user_id, key);

-- updated_at trigger
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_updated_at on pdf_templates;
create trigger trg_set_updated_at
before update on pdf_templates
for each row execute function set_updated_at();

-- Enable RLS
alter table pdf_templates enable row level security;

-- Policies: allow users to manage their own templates
create policy "user_manage_own_templates" on pdf_templates
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
