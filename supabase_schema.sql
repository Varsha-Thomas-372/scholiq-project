create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key,
  email text not null unique,
  role text not null check (role in ('STUDENT', 'FACULTY')),
  name text,
  created_at timestamptz not null default now()
);

create table if not exists public.syllabi (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  subject text not null,
  raw_text text not null,
  parsed_json jsonb not null,
  uploaded_at timestamptz not null default now()
);

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  syllabus_id uuid not null references public.syllabi(id) on delete cascade,
  unit text not null,
  name text not null,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'done', 'flagged')),
  time_spent numeric not null default 0,
  mcq_score numeric not null default 0
);

create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  exam_date date not null,
  daily_hours numeric not null,
  plan_json jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.mcq_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  score numeric not null,
  passed boolean not null,
  attempted_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.syllabi enable row level security;
alter table public.topics enable row level security;
alter table public.schedules enable row level security;
alter table public.mcq_attempts enable row level security;

create policy "users_select_self" on public.users for select using (auth.uid() = id);
create policy "users_update_self" on public.users for update using (auth.uid() = id);
create policy "users_insert_self" on public.users for insert with check (auth.uid() = id);

create policy "syllabi_select_owner" on public.syllabi for select using (auth.uid() = user_id);
create policy "syllabi_insert_owner" on public.syllabi for insert with check (auth.uid() = user_id);
create policy "syllabi_update_owner" on public.syllabi for update using (auth.uid() = user_id);

create policy "topics_select_owner" on public.topics for select
using (exists (select 1 from public.syllabi s where s.id = syllabus_id and s.user_id = auth.uid()));
create policy "topics_insert_owner" on public.topics for insert
with check (exists (select 1 from public.syllabi s where s.id = syllabus_id and s.user_id = auth.uid()));
create policy "topics_update_owner" on public.topics for update
using (exists (select 1 from public.syllabi s where s.id = syllabus_id and s.user_id = auth.uid()));

create policy "schedules_select_owner" on public.schedules for select using (auth.uid() = user_id);
create policy "schedules_insert_owner" on public.schedules for insert with check (auth.uid() = user_id);
create policy "schedules_update_owner" on public.schedules for update using (auth.uid() = user_id);

create policy "mcq_select_owner" on public.mcq_attempts for select using (auth.uid() = user_id);
create policy "mcq_insert_owner" on public.mcq_attempts for insert with check (auth.uid() = user_id);
