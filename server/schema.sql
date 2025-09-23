-- Enable pgvector
create extension if not exists vector;

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
  embedding vector(384) -- MiniLM-L6-v2 dimension
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
  embedding vector(384)
);

create index if not exists help_wanted_embedding_idx
  on help_wanted using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Team members
create table if not exists initiative_team_members (
  initiative_id text not null references initiatives(id) on delete cascade,
  user_id text not null,
  committed_hours int not null default 0,
  primary key (initiative_id, user_id)
);
