-- Feedback table (replaces ephemeral file storage on serverless)
create table if not exists feedback (
  id text primary key,
  message text not null,
  url text,
  user_agent text,
  viewport_width int,
  viewport_height int,
  screenshot_path text,
  created_at timestamp with time zone default now()
);
