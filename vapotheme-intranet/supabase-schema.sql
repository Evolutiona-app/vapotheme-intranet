-- Colle ce SQL dans Supabase > SQL Editor > New query

create table shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  created_at timestamptz default now()
);

create table profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete cascade unique,
  full_name text not null,
  role text not null check (role in ('admin','manager','employe')),
  color text default '#6964FC',
  shop_id uuid references shops(id),
  created_at timestamptz default now()
);

create table schedule_templates (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references shops(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  day_of_week text not null check (day_of_week in ('Lun','Mar','Mer','Jeu','Ven','Sam','Dim')),
  shift text not null default 'Repos',
  updated_at timestamptz default now(),
  unique(shop_id, profile_id, day_of_week)
);

create table custom_shifts (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references shops(id) on delete cascade,
  label text not null,
  created_at timestamptz default now(),
  unique(shop_id, label)
);

create table renforts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  from_shop_id uuid references shops(id),
  to_shop_id uuid references shops(id),
  date date not null,
  shift text not null,
  note text,
  created_at timestamptz default now()
);

create table leave_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  shop_id uuid references shops(id),
  start_date date not null,
  end_date date not null,
  type text not null check (type in ('CP','RTT','Maladie','Sans solde')),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  message text,
  created_at timestamptz default now()
);

create table notes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references profiles(id) on delete cascade,
  title text not null,
  content text not null,
  visibility text not null default 'all' check (visibility in ('all','shop')),
  shop_id uuid references shops(id),
  created_at timestamptz default now()
);

-- RLS
alter table profiles enable row level security;
alter table shops enable row level security;
alter table schedule_templates enable row level security;
alter table custom_shifts enable row level security;
alter table renforts enable row level security;
alter table leave_requests enable row level security;
alter table notes enable row level security;

create policy "auth read profiles" on profiles for select using (auth.role() = 'authenticated');
create policy "auth read shops" on shops for select using (auth.role() = 'authenticated');
create policy "auth read templates" on schedule_templates for select using (auth.role() = 'authenticated');
create policy "auth read custom_shifts" on custom_shifts for select using (auth.role() = 'authenticated');
create policy "auth read renforts" on renforts for select using (auth.role() = 'authenticated');
create policy "auth read leaves" on leave_requests for select using (auth.role() = 'authenticated');
create policy "auth read notes" on notes for select using (auth.role() = 'authenticated');

create policy "auth write templates" on schedule_templates for all using (auth.role() = 'authenticated');
create policy "auth write custom_shifts" on custom_shifts for all using (auth.role() = 'authenticated');
create policy "auth write renforts" on renforts for all using (auth.role() = 'authenticated');
create policy "auth write leaves" on leave_requests for all using (auth.role() = 'authenticated');
create policy "auth write notes" on notes for all using (auth.role() = 'authenticated');

-- Insérer quelques boutiques de test
insert into shops (name, city) values
  ('Paris 11', 'Paris'),
  ('Lyon', 'Lyon'),
  ('Nantes', 'Nantes');
