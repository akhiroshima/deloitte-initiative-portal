-- Production Database Setup Script
-- Run this in your Supabase SQL Editor for: ifrakipwdjrphyhkfupv.supabase.co

-- Enable pgvector
create extension if not exists vector;

-- Users table
create table if not exists users (
  id text primary key default gen_random_uuid()::text,
  email text unique not null,
  username text unique not null,
  password_hash text not null,
  name text not null,
  role text not null check (role in ('Designer', 'Developer', 'Lead', 'Manager', 'Admin')),
  is_admin boolean not null default false,
  location text not null,
  skills text[] not null default '{}',
  weekly_capacity_hrs integer not null default 40,
  avatar_url text,
  needs_password_change boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create admin user (ahirosh@deloitte.com)
insert into users (id, email, username, password_hash, name, role, is_admin, location, skills, weekly_capacity_hrs, avatar_url, needs_password_change) 
values (
  'admin-ahirosh',
  'ahirosh@deloitte.com',
  'ahirosh',
  'admin_password_hash_placeholder', -- This will be updated with actual hash
  'Ahirosh Admin',
  'Admin',
  true,
  'Global',
  ARRAY['Leadership', 'Management', 'Strategy', 'Technology'],
  40,
  'https://ui-avatars.com/api/?name=Ahirosh+Admin&background=random',
  false -- Admin user doesn't need password change
) on conflict (email) do nothing;

-- Initiatives table with vector index
create table if not exists initiatives (
  id text primary key,
  owner_id text not null,
  title text not null,
  description text,
  status text not null default 'Searching Talent',
  start_date date,
  end_date date,
  skills_needed text[],
  locations text[],
  tags text[],
  cover_image_url text,
  embedding vector(384), -- MiniLM-L6-v2 dimension
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists initiatives_embedding_idx
  on initiatives using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Help wanted roles with vector index
create table if not exists help_wanted (
  id text primary key,
  initiative_id text not null references initiatives(id) on delete cascade,
  skill text not null,
  hours_per_week int,
  status text not null default 'Open',
  embedding vector(384),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists help_wanted_embedding_idx
  on help_wanted using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Team members
create table if not exists initiative_team_members (
  initiative_id text not null references initiatives(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  committed_hours int not null default 0,
  primary key (initiative_id, user_id)
);

-- Join requests
create table if not exists join_requests (
  id text primary key,
  initiative_id text not null references initiatives(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  message text,
  status text not null default 'Pending' check (status in ('Pending', 'Approved', 'Rejected')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Tasks
create table if not exists tasks (
  id text primary key,
  initiative_id text not null references initiatives(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'To Do' check (status in ('To Do', 'In Progress', 'Done')),
  assigned_to text references users(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Notifications
create table if not exists notifications (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamp with time zone default now()
);

-- Add foreign key constraint for initiatives owner_id (if not exists)
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints 
    where constraint_name = 'initiatives_owner_id_fkey' 
    and table_name = 'initiatives'
  ) then
    alter table initiatives add constraint initiatives_owner_id_fkey 
      foreign key (owner_id) references users(id) on delete cascade;
  end if;
end $$;
